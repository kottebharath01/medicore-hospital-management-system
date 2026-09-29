from flask import Blueprint, request, jsonify, g
from database import db
from models import Patient, Appointment, MedicalRecord, Bed, VitalSign, format_code
from routes.auth import login_required, role_required

patients_bp = Blueprint("patients", __name__, url_prefix="/api/patients")


def get_next_patient_code():
    """Generate next sequential PAT-xxxx code."""
    existing = [p.code for p in Patient.query.filter(Patient.code.like("PAT-%")).all() if p.code]
    max_num = 0
    for c in existing:
        try:
            num = int(c.split("-")[-1])
            if num > max_num:
                max_num = num
        except (ValueError, IndexError):
            pass
    return format_code("PAT", max_num + 1)


@patients_bp.route("", methods=["GET"])
@login_required
def get_patients():
    """
    List patients with privacy-enforced filtering.
    - Patient role: Exclusively restricted to their own record.
    - Doctor, Nurse, Receptionist, Admin: Can view directory/search.
    """
    user = g.current_user
    q = request.args.get("q", "").strip()
    query = Patient.query

    if user and user.role == "patient":
        if user.patient_id:
            query = query.filter_by(id=user.patient_id)
        else:
            return jsonify([]), 200

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
@login_required
def get_patient(pid):
    """Retrieve complete patient profile with role-based privacy check."""
    user = g.current_user
    if user and user.role == "patient" and user.patient_id != pid:
        return jsonify({"error": "Forbidden", "message": "You cannot access another patient's data"}), 403

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
@login_required
def create_patient():
    """
    Register a new walk-in patient (Receptionist ONLY).
    STRICT ROLE RULE: Admin and other staff cannot operationally register patients.
    Normal patients register via the public /register endpoint.
    """
    user = g.current_user
    if not user or user.role != "receptionist":
        return jsonify({
            "error": "Forbidden",
            "message": "Only Receptionists are authorized to operationally register walk-in patients. Admin cannot create operational patient records."
        }), 403

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    age = data.get("age")
    gender = (data.get("gender") or "Male").strip()

    if not name or age is None or not gender:
        return jsonify({"error": "Name, age, and gender are required"}), 400

    try:
        age = int(age)
    except (ValueError, TypeError):
        return jsonify({"error": "Age must be a valid integer"}), 400

    code = get_next_patient_code()

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
@login_required
def update_patient(pid):
    """
    Update patient details.
    - Receptionist & Admin: Can update demographic details.
    - Patient: Can update own contact details.
    """
    user = g.current_user
    if user and user.role == "patient" and user.patient_id != pid:
        return jsonify({"error": "Forbidden", "message": "You cannot modify another patient's data"}), 403

    if user and user.role not in ("receptionist", "admin", "patient"):
        return jsonify({"error": "Forbidden", "message": "You are not authorized to update patient records"}), 403

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
