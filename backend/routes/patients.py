from flask import Blueprint, request, jsonify
from database import db
from models import Patient, Appointment, MedicalRecord, Bed, VitalSign, format_code
from routes.auth import login_required, role_required

patients_bp = Blueprint("patients", __name__, url_prefix="/api/patients")


@patients_bp.route("", methods=["GET"])
def get_patients():
    """List patients with flexible search query on name, phone, email, or PAT-xxxx code."""
    q = request.args.get("q", "").strip()
    query = Patient.query
    if q:
        query = query.filter(
            (Patient.name.ilike(f"%{q}%"))
            | (Patient.code.ilike(f"%{q}%"))
            | (Patient.phone.ilike(f"%{q}%"))
            | (Patient.email.ilike(f"%{q}%"))
        )
    patients = query.order_by(Patient.id.desc()).all()
    return jsonify([p.to_dict() for p in patients])


@patients_bp.route("/<int:pid>", methods=["GET"])
def get_patient(pid):
    """Retrieve complete patient profile including medical records, vitals, and admitted bed."""
    patient = Patient.query.get_or_404(pid)
    data = patient.to_dict()

    # Include recent medical records
    records = (
        MedicalRecord.query.filter_by(patient_id=pid)
        .options(db.joinedload(MedicalRecord.doctor))
        .order_by(MedicalRecord.date.desc())
        .all()
    )
    data["medical_records"] = [r.to_dict() for r in records]

    # Include recent vitals
    vitals = (
        VitalSign.query.filter_by(patient_id=pid)
        .order_by(VitalSign.recorded_at.desc())
        .limit(10)
        .all()
    )
    data["vital_signs"] = [v.to_dict() for v in vitals]

    # Include current bed if admitted
    bed = Bed.query.filter_by(patient_id=pid).first()
    data["current_bed"] = bed.to_dict() if bed else None

    return jsonify(data), 200


@patients_bp.route("", methods=["POST"])
def create_patient():
    """Register a new patient with unique business ID PAT-xxxx."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    age = data.get("age")
    gender = data.get("gender", "Male").strip()

    if not name or age is None or not gender:
        return jsonify({"error": "Name, age, and gender are required"}), 400

    try:
        age = int(age)
    except (ValueError, TypeError):
        return jsonify({"error": "Age must be a valid integer"}), 400

    next_id = (db.session.query(db.func.max(Patient.id)).scalar() or 0) + 1
    code = format_code("PAT", next_id)

    patient = Patient(
        code=code,
        name=name,
        age=age,
        gender=gender,
        blood_group=data.get("blood_group"),
        phone=data.get("phone"),
        email=data.get("email"),
        address=data.get("address"),
    )
    db.session.add(patient)
    db.session.commit()
    return jsonify(patient.to_dict()), 201


@patients_bp.route("/<int:pid>", methods=["PUT"])
def update_patient(pid):
    """Update existing patient details."""
    patient = Patient.query.get_or_404(pid)
    data = request.get_json() or {}

    patient.name = data.get("name", patient.name).strip()
    if "age" in data and data["age"] is not None:
        try:
            patient.age = int(data["age"])
        except (ValueError, TypeError):
            return jsonify({"error": "Age must be a valid integer"}), 400

    patient.gender = data.get("gender", patient.gender)
    patient.blood_group = data.get("blood_group", patient.blood_group)
    patient.phone = data.get("phone", patient.phone)
    patient.email = data.get("email", patient.email)
    patient.address = data.get("address", patient.address)

    db.session.commit()
    return jsonify(patient.to_dict()), 200


@patients_bp.route("/<int:pid>", methods=["DELETE"])
@login_required
@role_required("admin")
def delete_patient(pid):
    """Delete patient and cascade clean related records (Admin only)."""
    patient = Patient.query.get_or_404(pid)
    # Clear any occupied beds
    Bed.query.filter_by(patient_id=pid).update({"patient_id": None, "status": "Available"})
    # Delete associated appointments and records
    Appointment.query.filter_by(patient_id=pid).delete()
    MedicalRecord.query.filter_by(patient_id=pid).delete()
    VitalSign.query.filter_by(patient_id=pid).delete()
    db.session.delete(patient)
    db.session.commit()
    return jsonify({"message": f"Patient {patient.name} deleted successfully"}), 200
