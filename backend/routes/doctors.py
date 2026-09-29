from flask import Blueprint, request, jsonify
from database import db
from models import Doctor, Appointment, MedicalRecord, format_code
from routes.auth import login_required, role_required

doctors_bp = Blueprint("doctors", __name__, url_prefix="/api/doctors")


@doctors_bp.route("", methods=["GET"])
@login_required
def get_doctors():
    """List doctors with optional search query on name, specialization, or department."""
    q = request.args.get("q", "").strip()
    dept_id = request.args.get("department_id")
    query = Doctor.query.options(db.joinedload(Doctor.department_rel))

    if q:
        query = query.filter(
            (Doctor.name.ilike(f"%{q}%"))
            | (Doctor.specialization.ilike(f"%{q}%"))
            | (Doctor.code.ilike(f"%{q}%"))
        )
    if dept_id:
        query = query.filter_by(department_id=int(dept_id))

    doctors = query.order_by(Doctor.id.asc()).all()
    return jsonify([d.to_dict() for d in doctors])


@doctors_bp.route("/<int:did>", methods=["GET"])
@login_required
def get_doctor(did):
    """Retrieve doctor profile, consultation fee, and active appointments."""
    doctor = Doctor.query.get_or_404(did)
    data = doctor.to_dict()

    # Include recent appointments
    appointments = (
        Appointment.query.filter_by(doctor_id=did)
        .options(db.joinedload(Appointment.patient))
        .order_by(Appointment.date.desc())
        .limit(10)
        .all()
    )
    data["appointments"] = [a.to_dict() for a in appointments]
    return jsonify(data), 200


@doctors_bp.route("", methods=["POST"])
@login_required
@role_required("admin")
def create_doctor():
    """Register a new doctor with unique business ID DOC-xxxx (Admin only)."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    specialization = data.get("specialization", "").strip()

    if not name or not specialization:
        return jsonify({"error": "Name and specialization are required"}), 400

    next_id = (db.session.query(db.func.max(Doctor.id)).scalar() or 0) + 1
    code = format_code("DOC", next_id)

    doctor = Doctor(
        code=code,
        name=name,
        specialization=specialization,
        department_id=data.get("department_id"),
        phone=data.get("phone"),
        email=data.get("email"),
        experience=int(data["experience"]) if str(data.get("experience", "")).isdigit() else 0,
        fee=float(data["fee"]) if data.get("fee") else 500.0,
        available=bool(data.get("available", True)),
    )
    db.session.add(doctor)
    db.session.commit()
    return jsonify(doctor.to_dict()), 201


@doctors_bp.route("/<int:did>", methods=["PUT"])
@login_required
@role_required("admin", "doctor")
def update_doctor(did):
    """Update doctor details and consultation availability."""
    doctor = Doctor.query.get_or_404(did)
    data = request.get_json() or {}

    doctor.name = data.get("name", doctor.name)
    doctor.specialization = data.get("specialization", doctor.specialization)
    if "department_id" in data:
        doctor.department_id = data["department_id"]
    doctor.phone = data.get("phone", doctor.phone)
    doctor.email = data.get("email", doctor.email)
    if "experience" in data:
        doctor.experience = int(data["experience"]) if str(data["experience"]).isdigit() else doctor.experience
    if "fee" in data:
        doctor.fee = float(data["fee"]) if data["fee"] else doctor.fee
    if "available" in data:
        doctor.available = bool(data["available"])

    db.session.commit()
    return jsonify(doctor.to_dict()), 200


@doctors_bp.route("/<int:did>", methods=["DELETE"])
@login_required
@role_required("admin")
def delete_doctor(did):
    """Delete doctor account (Admin only)."""
    doctor = Doctor.query.get_or_404(did)
    db.session.delete(doctor)
    db.session.commit()
    return jsonify({"message": f"Doctor {doctor.name} deleted successfully"}), 200
