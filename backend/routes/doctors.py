from flask import Blueprint, request, jsonify
from database import db
from models import Doctor, User, Appointment, MedicalRecord, format_code
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
    """
    Register a new doctor with unique business ID DOC-xxxx and linked User account (Admin only).
    Admin manually provides: Doctor Name, Username, Initial Password.
    System automatically generates: Unique Doctor ID (DOC-xxxx).
    """
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    confirm_password = (data.get("confirm_password") or "").strip()
    specialization = (data.get("specialization") or "").strip()
    email = (data.get("email") or "").strip().lower()

    if not name or not specialization:
        return jsonify({"error": "Doctor name and specialization are required"}), 400

    if not username or not password:
        return jsonify({"error": "Username and initial password are required to create a doctor account"}), 400

    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters long"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    if confirm_password and password != confirm_password:
        return jsonify({"error": "Password and confirmation do not match"}), 400

    # Strict username uniqueness check across the entire users table
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists. Please choose another username."}), 409

    # Generate or validate email
    next_id = (db.session.query(db.func.max(Doctor.id)).scalar() or 0) + 1
    code = format_code("DOC", next_id)

    if not email:
        email = f"{username.lower()}@hospital.com"
        # Avoid conflict if default email happens to exist
        if User.query.filter_by(email=email).first():
            email = f"{username.lower()}{next_id}@hospital.com"
    else:
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email is already registered. Please provide a different email address."}), 409

    # Atomic creation of both Doctor profile and User login account
    try:
        doctor = Doctor(
            code=code,
            name=name,
            specialization=specialization,
            department_id=data.get("department_id"),
            phone=data.get("phone"),
            email=email,
            experience=int(data["experience"]) if str(data.get("experience", "")).isdigit() else 0,
            fee=float(data["fee"]) if data.get("fee") else 500.0,
            available=bool(data.get("available", True)),
        )
        db.session.add(doctor)
        db.session.flush()

        user = User(
            username=username,
            name=name,
            email=email,
            role="doctor",
            doctor_id=doctor.id,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        doctor.user_id = user.id
        db.session.commit()

        display_name = doctor.name if doctor.name.lower().startswith("dr.") else f"Dr. {doctor.name}"
        return jsonify({
            "message": f"Doctor profile and credentials created successfully for {display_name}.",
            "doctor": doctor.to_dict(),
            "credentials": {
                "name": doctor.name,
                "code": doctor.code,
                "username": user.username,
                "role": "doctor"
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create doctor account", "details": str(e)}), 500


@doctors_bp.route("/<int:did>/reset-password", methods=["POST"])
@login_required
@role_required("admin")
def reset_doctor_password(did):
    """
    Admin-only endpoint to reset the login password for a Doctor account.
    Validates new password, hashes with bcrypt, and invalidates old password.
    """
    doctor = Doctor.query.get_or_404(did)
    user = User.query.filter((User.doctor_id == did) | (User.id == doctor.user_id)).first()

    display_name = doctor.name if doctor.name.lower().startswith("dr.") else f"Dr. {doctor.name}"

    if not user:
        return jsonify({"error": f"No user login account found for {display_name}"}), 404

    data = request.get_json() or {}
    new_password = (data.get("new_password") or data.get("password") or "").strip()
    confirm_password = (data.get("confirm_password") or "").strip()

    if not new_password:
        return jsonify({"error": "New password is required"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters long"}), 400

    if confirm_password and new_password != confirm_password:
        return jsonify({"error": "New password and confirmation do not match"}), 400

    user.set_password(new_password)
    db.session.commit()

    return jsonify({
        "message": f"Password for {display_name} ({user.username}) has been successfully reset."
    }), 200


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

    # Also update linked user's name/email if changed
    user = User.query.filter((User.doctor_id == did) | (User.id == doctor.user_id)).first()
    if user:
        user.name = doctor.name
        if doctor.email:
            user.email = doctor.email

    db.session.commit()
    return jsonify(doctor.to_dict()), 200


@doctors_bp.route("/<int:did>", methods=["DELETE"])
@login_required
@role_required("admin")
def delete_doctor(did):
    """Delete doctor account and associated login credentials (Admin only)."""
    doctor = Doctor.query.get_or_404(did)
    user = User.query.filter((User.doctor_id == did) | (User.id == doctor.user_id)).first()
    if user:
        db.session.delete(user)
    db.session.delete(doctor)
    db.session.commit()
    return jsonify({"message": f"Doctor {doctor.name} and associated credentials removed successfully"}), 200
