from flask import Blueprint, request, jsonify
from database import db
from models import Doctor, Appointment, MedicalRecord

doctors_bp = Blueprint("doctors", __name__, url_prefix="/api/doctors")


@doctors_bp.route("", methods=["GET"])
def get_doctors():
    """List doctors with optional search query on name or specialization."""
    q = request.args.get("q", "").strip()
    query = Doctor.query
    if q:
        query = query.filter(
            (Doctor.name.ilike(f"%{q}%")) | (Doctor.specialization.ilike(f"%{q}%"))
        )
    doctors = query.order_by(Doctor.id.asc()).all()
    return jsonify([d.to_dict() for d in doctors])


@doctors_bp.route("/<int:did>", methods=["GET"])
def get_doctor(did):
    """Retrieve single doctor by ID."""
    doctor = Doctor.query.get_or_404(did)
    return jsonify(doctor.to_dict())


@doctors_bp.route("", methods=["POST"])
def create_doctor():
    """Register a new doctor."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    specialization = data.get("specialization", "").strip()

    if not name or not specialization:
        return jsonify({"error": "Name and specialization are required"}), 400

    experience = data.get("experience")
    if experience is not None and experience != "":
        try:
            experience = int(experience)
        except (ValueError, TypeError):
            experience = None
    else:
        experience = None

    fee = data.get("fee")
    if fee is not None and fee != "":
        try:
            fee = float(fee)
        except (ValueError, TypeError):
            fee = None
    else:
        fee = None

    doctor = Doctor(
        name=name,
        specialization=specialization,
        phone=data.get("phone"),
        email=data.get("email"),
        experience=experience,
        fee=fee,
        available=data.get("available", True),
    )
    db.session.add(doctor)
    db.session.commit()
    return jsonify(doctor.to_dict()), 201


@doctors_bp.route("/<int:did>", methods=["PUT"])
def update_doctor(did):
    """Update existing doctor details."""
    doctor = Doctor.query.get_or_404(did)
    data = request.get_json() or {}

    updatable = ("name", "specialization", "phone", "email", "experience", "fee", "available")
    for key in updatable:
        if key in data:
            val = data[key]
            if key == "experience" and val is not None and val != "":
                val = int(val)
            elif key == "fee" and val is not None and val != "":
                val = float(val)
            setattr(doctor, key, val)

    db.session.commit()
    return jsonify(doctor.to_dict())


@doctors_bp.route("/<int:did>", methods=["DELETE"])
def delete_doctor(did):
    """Delete doctor and clean up dependent appointments and records."""
    doctor = Doctor.query.get_or_404(did)

    MedicalRecord.query.filter_by(doctor_id=did).delete()
    Appointment.query.filter_by(doctor_id=did).delete()

    db.session.delete(doctor)
    db.session.commit()
    return jsonify({"message": "Doctor deleted"})
