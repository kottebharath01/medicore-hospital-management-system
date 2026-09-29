from datetime import datetime
from flask import Blueprint, request, jsonify, g
from database import db
from models import Appointment, Patient, Doctor, Department, format_code
from routes.auth import get_current_user_from_request, login_required

appointments_bp = Blueprint("appointments", __name__, url_prefix="/api/appointments")


@appointments_bp.route("", methods=["GET"])
def get_appointments():
    """
    List appointments with role-based filtering and eager loading.
    - Patient role: Automatically restricted to their own appointments only.
    - Doctor role: Automatically restricted to their own assigned appointments.
    - Admin/Receptionist: Access all appointments with optional filters.
    """
    user = get_current_user_from_request()
    status = request.args.get("status", "").strip()
    doctor_id = request.args.get("doctor_id")
    patient_id = request.args.get("patient_id")

    query = Appointment.query.options(
        db.joinedload(Appointment.patient),
        db.joinedload(Appointment.doctor),
        db.joinedload(Appointment.department),
    )

    # Role-based restriction
    if user and user.role == "patient":
        if user.patient_id:
            query = query.filter_by(patient_id=user.patient_id)
        else:
            return jsonify([]), 200
    elif user and user.role == "doctor":
        if user.doctor_id:
            query = query.filter_by(doctor_id=user.doctor_id)

    # Query param filters
    if status:
        query = query.filter_by(status=status)
    if doctor_id and (not user or user.role != "doctor"):
        query = query.filter_by(doctor_id=int(doctor_id))
    if patient_id and (not user or user.role != "patient"):
        query = query.filter_by(patient_id=int(patient_id))

    appointments = query.order_by(Appointment.date.desc(), Appointment.time.asc()).all()
    return jsonify([a.to_dict() for a in appointments]), 200


@appointments_bp.route("/my", methods=["GET"])
@login_required
def get_my_appointments():
    """Direct endpoint for logged-in Patient to view exclusively their appointments."""
    user = g.current_user
    if not user.patient_id:
        return jsonify([]), 200

    appointments = (
        Appointment.query.filter_by(patient_id=user.patient_id)
        .options(
            db.joinedload(Appointment.patient),
            db.joinedload(Appointment.doctor),
            db.joinedload(Appointment.department),
        )
        .order_by(Appointment.date.desc(), Appointment.time.asc())
        .all()
    )
    return jsonify([a.to_dict() for a in appointments]), 200


@appointments_bp.route("/<int:aid>", methods=["GET"])
def get_appointment(aid):
    """Retrieve single appointment by ID with role check."""
    user = get_current_user_from_request()
    appt = Appointment.query.options(
        db.joinedload(Appointment.patient),
        db.joinedload(Appointment.doctor),
        db.joinedload(Appointment.department),
    ).filter_by(id=aid).first_or_404()

    # Normal patient cannot access other patient's appointment
    if user and user.role == "patient" and user.patient_id != appt.patient_id:
        return jsonify({"error": "Forbidden", "message": "You cannot access another patient's appointment"}), 403

    return jsonify(appt.to_dict()), 200


@appointments_bp.route("", methods=["POST"])
def create_appointment():
    """
    Schedule an appointment.
    If authenticated as a Patient, patient_id is automatically obtained from the account.
    """
    user = get_current_user_from_request()
    data = request.get_json() or {}

    # Auto-resolve patient_id for patient accounts
    if user and user.role == "patient":
        patient_id = user.patient_id
    else:
        patient_id = data.get("patient_id")

    doctor_id = data.get("doctor_id")
    department_id = data.get("department_id")
    date_str = (data.get("date") or "").strip()
    time_str = (data.get("time") or "").strip()
    notes = data.get("notes")
    status = data.get("status", "Scheduled")

    if not patient_id or not doctor_id or not date_str or not time_str:
        return jsonify({"error": "Patient, doctor, date, and time are required"}), 400

    patient = None
    if str(patient_id).isdigit():
        patient = Patient.query.get(int(patient_id))
    if not patient and isinstance(patient_id, str):
        patient = Patient.query.filter_by(code=patient_id).first()
    if not patient:
        return jsonify({"error": f"Patient '{patient_id}' does not exist"}), 404

    doctor = None
    if str(doctor_id).isdigit():
        doctor = Doctor.query.get(int(doctor_id))
    if not doctor and isinstance(doctor_id, str):
        doctor = Doctor.query.filter_by(code=doctor_id).first()
    if not doctor:
        return jsonify({"error": f"Doctor '{doctor_id}' does not exist"}), 404

    # If department not provided, derive from doctor
    dept = None
    if department_id:
        if str(department_id).isdigit():
            dept = Department.query.get(int(department_id))
        if not dept and isinstance(department_id, str):
            dept = Department.query.filter((Department.code == department_id) | (Department.name == department_id)).first()
    if not dept and doctor.department_id:
        dept = Department.query.get(doctor.department_id)

    dept_id = dept.id if dept else None

    try:
        parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Expected YYYY-MM-DD"}), 400

    next_id = (db.session.query(db.func.max(Appointment.id)).scalar() or 0) + 1
    code = format_code("APT", next_id)

    appt = Appointment(
        code=code,
        patient_id=patient.id,
        doctor_id=doctor.id,
        department_id=dept_id,
        date=parsed_date,
        time=time_str,
        status=status,
        notes=notes,
    )
    db.session.add(appt)
    db.session.commit()

    # Re-query with eager loading to return full relations
    loaded = Appointment.query.options(
        db.joinedload(Appointment.patient),
        db.joinedload(Appointment.doctor),
        db.joinedload(Appointment.department),
    ).get(appt.id)

    return jsonify(loaded.to_dict()), 201


@appointments_bp.route("/<int:aid>", methods=["PUT"])
def update_appointment(aid):
    """Update appointment status (Scheduled, Confirmed, Completed, Cancelled) or details."""
    user = get_current_user_from_request()
    appt = Appointment.query.get_or_404(aid)

    # Normal patient can only cancel their own appointment
    if user and user.role == "patient" and user.patient_id != appt.patient_id:
        return jsonify({"error": "Forbidden", "message": "You cannot modify another patient's appointment"}), 403

    data = request.get_json() or {}

    if "status" in data:
        valid_statuses = ("Scheduled", "Confirmed", "Completed", "Cancelled")
        if data["status"] in valid_statuses:
            appt.status = data["status"]
        else:
            return jsonify({"error": f"Invalid status. Choose from {', '.join(valid_statuses)}"}), 400

    if "notes" in data:
        appt.notes = data["notes"]
    if "date" in data and data["date"]:
        try:
            appt.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format"}), 400
    if "time" in data and data["time"]:
        appt.time = data["time"]

    db.session.commit()
    return jsonify(appt.to_dict()), 200


@appointments_bp.route("/<int:aid>", methods=["DELETE"])
def delete_appointment(aid):
    """Cancel and delete an appointment."""
    user = get_current_user_from_request()
    appt = Appointment.query.get_or_404(aid)

    if user and user.role == "patient" and user.patient_id != appt.patient_id:
        return jsonify({"error": "Forbidden", "message": "You cannot delete another patient's appointment"}), 403

    db.session.delete(appt)
    db.session.commit()
    return jsonify({"message": "Appointment deleted successfully"}), 200
