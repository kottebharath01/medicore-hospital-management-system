from datetime import datetime
from flask import Blueprint, request, jsonify
from database import db
from models import Appointment, Patient, Doctor

appointments_bp = Blueprint("appointments", __name__, url_prefix="/api/appointments")


@appointments_bp.route("", methods=["GET"])
def get_appointments():
    """
    List appointments with optional status filter.
    Uses joinedload on patient and doctor to eliminate N+1 queries.
    """
    status = request.args.get("status", "").strip()
    query = Appointment.query.options(
        db.joinedload(Appointment.patient),
        db.joinedload(Appointment.doctor),
    )
    if status:
        query = query.filter_by(status=status)

    appointments = query.order_by(Appointment.date.desc(), Appointment.id.desc()).all()
    return jsonify([a.to_dict() for a in appointments])


@appointments_bp.route("/<int:aid>", methods=["GET"])
def get_appointment(aid):
    """Retrieve single appointment by ID."""
    appt = Appointment.query.options(
        db.joinedload(Appointment.patient),
        db.joinedload(Appointment.doctor),
    ).filter_by(id=aid).first_or_404()
    return jsonify(appt.to_dict())


@appointments_bp.route("", methods=["POST"])
def create_appointment():
    """Schedule a new appointment."""
    data = request.get_json() or {}
    patient_id = data.get("patient_id")
    doctor_id = data.get("doctor_id")
    date_str = data.get("date", "").strip()
    time_str = data.get("time", "").strip()

    if not patient_id or not doctor_id or not date_str or not time_str:
        return jsonify({"error": "patient_id, doctor_id, date, and time are required"}), 400

    # Verify patient and doctor exist
    if not Patient.query.get(patient_id):
        return jsonify({"error": f"Patient with ID {patient_id} does not exist"}), 404
    if not Doctor.query.get(doctor_id):
        return jsonify({"error": f"Doctor with ID {doctor_id} does not exist"}), 404

    try:
        parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Expected YYYY-MM-DD"}), 400

    appt = Appointment(
        patient_id=int(patient_id),
        doctor_id=int(doctor_id),
        date=parsed_date,
        time=time_str,
        status=data.get("status", "Scheduled"),
        notes=data.get("notes"),
    )
    db.session.add(appt)
    db.session.commit()
    return jsonify(appt.to_dict()), 201


@appointments_bp.route("/<int:aid>", methods=["PUT"])
def update_appointment(aid):
    """Update appointment status, date, time, or notes."""
    appt = Appointment.query.get_or_404(aid)
    data = request.get_json() or {}

    if "status" in data:
        appt.status = data["status"]
    if "notes" in data:
        appt.notes = data["notes"]
    if "time" in data:
        appt.time = data["time"]
    if "date" in data and data["date"]:
        try:
            appt.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Expected YYYY-MM-DD"}), 400

    db.session.commit()
    return jsonify(appt.to_dict())


@appointments_bp.route("/<int:aid>", methods=["DELETE"])
def delete_appointment(aid):
    """Cancel / remove an appointment."""
    appt = Appointment.query.get_or_404(aid)
    db.session.delete(appt)
    db.session.commit()
    return jsonify({"message": "Appointment deleted"})
