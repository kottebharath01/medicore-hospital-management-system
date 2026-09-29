from datetime import datetime, date
from flask import Blueprint, request, jsonify
from database import db
from models import MedicalRecord, Patient, Doctor

records_bp = Blueprint("records", __name__, url_prefix="/api/records")


@records_bp.route("", methods=["GET"])
def get_records():
    """
    List medical records with optional patient_id filter.
    Eager loads patient and doctor to eliminate N+1 queries.
    """
    pid = request.args.get("patient_id")
    query = MedicalRecord.query.options(
        db.joinedload(MedicalRecord.patient),
        db.joinedload(MedicalRecord.doctor),
    )
    if pid:
        try:
            query = query.filter_by(patient_id=int(pid))
        except ValueError:
            return jsonify({"error": "Invalid patient_id"}), 400

    records = query.order_by(MedicalRecord.date.desc(), MedicalRecord.id.desc()).all()
    return jsonify([r.to_dict() for r in records])


@records_bp.route("/<int:rid>", methods=["GET"])
def get_record(rid):
    """Retrieve single medical record by ID."""
    rec = MedicalRecord.query.options(
        db.joinedload(MedicalRecord.patient),
        db.joinedload(MedicalRecord.doctor),
    ).filter_by(id=rid).first_or_404()
    return jsonify(rec.to_dict())


@records_bp.route("", methods=["POST"])
def create_record():
    """Add a new medical record."""
    data = request.get_json() or {}
    patient_id = data.get("patient_id")
    doctor_id = data.get("doctor_id")
    diagnosis = data.get("diagnosis", "").strip()

    if not patient_id or not doctor_id or not diagnosis:
        return jsonify({"error": "patient_id, doctor_id, and diagnosis are required"}), 400

    if not Patient.query.get(patient_id):
        return jsonify({"error": f"Patient with ID {patient_id} does not exist"}), 404
    if not Doctor.query.get(doctor_id):
        return jsonify({"error": f"Doctor with ID {doctor_id} does not exist"}), 404

    date_val = date.today()
    if data.get("date"):
        try:
            date_val = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Expected YYYY-MM-DD"}), 400

    rec = MedicalRecord(
        patient_id=int(patient_id),
        doctor_id=int(doctor_id),
        diagnosis=diagnosis,
        prescription=data.get("prescription"),
        notes=data.get("notes"),
        date=date_val,
    )
    db.session.add(rec)
    db.session.commit()
    return jsonify(rec.to_dict()), 201


@records_bp.route("/<int:rid>", methods=["DELETE"])
def delete_record(rid):
    """Delete a medical record."""
    rec = MedicalRecord.query.get_or_404(rid)
    db.session.delete(rec)
    db.session.commit()
    return jsonify({"message": "Record deleted"})
