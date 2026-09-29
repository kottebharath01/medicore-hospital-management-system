from flask import Blueprint, request, jsonify
from database import db
from models import Patient, Appointment, MedicalRecord

patients_bp = Blueprint("patients", __name__, url_prefix="/api/patients")


@patients_bp.route("", methods=["GET"])
def get_patients():
    """List patients with optional search query on indexed name column."""
    q = request.args.get("q", "").strip()
    query = Patient.query
    if q:
        query = query.filter(Patient.name.ilike(f"%{q}%"))
    patients = query.order_by(Patient.id.desc()).all()
    return jsonify([p.to_dict() for p in patients])


@patients_bp.route("/<int:pid>", methods=["GET"])
def get_patient(pid):
    """Retrieve single patient by ID."""
    patient = Patient.query.get_or_404(pid)
    return jsonify(patient.to_dict())


@patients_bp.route("", methods=["POST"])
def create_patient():
    """Register a new patient."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    age = data.get("age")
    gender = data.get("gender", "").strip()

    if not name or age is None or not gender:
        return jsonify({"error": "Name, age, and gender are required"}), 400

    try:
        age = int(age)
    except (ValueError, TypeError):
        return jsonify({"error": "Age must be a valid integer"}), 400

    patient = Patient(
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

    updatable = ("name", "age", "gender", "blood_group", "phone", "email", "address")
    for key in updatable:
        if key in data:
            val = data[key]
            if key == "age" and val is not None:
                try:
                    val = int(val)
                except (ValueError, TypeError):
                    return jsonify({"error": "Age must be an integer"}), 400
            setattr(patient, key, val)

    db.session.commit()
    return jsonify(patient.to_dict())


@patients_bp.route("/<int:pid>", methods=["DELETE"])
def delete_patient(pid):
    """Delete patient and clean up associated appointments and medical records."""
    patient = Patient.query.get_or_404(pid)

    # Clean up dependent records before removing patient to maintain foreign key integrity
    MedicalRecord.query.filter_by(patient_id=pid).delete()
    Appointment.query.filter_by(patient_id=pid).delete()

    db.session.delete(patient)
    db.session.commit()
    return jsonify({"message": "Patient deleted"})
