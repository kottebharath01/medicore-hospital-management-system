from datetime import datetime, date
from flask import Blueprint, request, jsonify, g
from database import db
from models import MedicalRecord, Patient, Doctor, format_code
from routes.auth import login_required, role_required

records_bp = Blueprint("records", __name__, url_prefix="/api/records")


@records_bp.route("", methods=["GET"])
@login_required
def get_records():
    """
    List clinical medical records with role-based privacy protection.
    - Patient role: Exclusively restricted to their own medical records.
    - Doctor role: Automatically pre-filters to their patients or allows search.
    - Admin: Full view.
    """
    user = g.current_user
    pid = request.args.get("patient_id")
    did = request.args.get("doctor_id")

    query = MedicalRecord.query.options(
        db.joinedload(MedicalRecord.patient),
        db.joinedload(MedicalRecord.doctor),
    )

    if user and user.role == "patient":
        if user.patient_id:
            query = query.filter_by(patient_id=user.patient_id)
        else:
            return jsonify([]), 200
    elif user and user.role == "doctor":
        if user.doctor_id:
            query = query.filter_by(doctor_id=user.doctor_id)

    if pid and (not user or user.role != "patient"):
        query = query.filter_by(patient_id=int(pid))
    if did and (not user or user.role != "doctor"):
        query = query.filter_by(doctor_id=int(did))

    records = query.order_by(MedicalRecord.date.desc(), MedicalRecord.id.desc()).all()
    return jsonify([r.to_dict() for r in records]), 200


@records_bp.route("/<int:rid>", methods=["GET"])
@login_required
def get_record(rid):
    """Retrieve single medical record by ID with role authorization."""
    user = g.current_user
    rec = MedicalRecord.query.options(
        db.joinedload(MedicalRecord.patient),
        db.joinedload(MedicalRecord.doctor),
    ).filter_by(id=rid).first_or_404()

    if user and user.role == "patient" and user.patient_id != rec.patient_id:
        return jsonify({"error": "Forbidden", "message": "You cannot access another patient's medical records"}), 403

    return jsonify(rec.to_dict()), 200


@records_bp.route("", methods=["POST"])
@login_required
@role_required("admin", "doctor", "nurse")
def create_record():
    """Create a new clinical medical record with diagnosis, prescription, treatment, and medicines."""
    data = request.get_json() or {}
    user = g.current_user

    patient_id = data.get("patient_id")
    doctor_id = user.doctor_id if (user and user.role == "doctor") else data.get("doctor_id")
    diagnosis = (data.get("diagnosis") or "").strip()
    prescription = data.get("prescription")
    treatment = data.get("treatment")
    medicines = data.get("medicines")
    notes = data.get("notes")

    if not patient_id or not doctor_id or not diagnosis:
        return jsonify({"error": "patient_id, doctor_id, and diagnosis are required"}), 400

    if not Patient.query.get(patient_id):
        return jsonify({"error": f"Patient ID {patient_id} does not exist"}), 404
    if not Doctor.query.get(doctor_id):
        return jsonify({"error": f"Doctor ID {doctor_id} does not exist"}), 404

    date_val = date.today()
    if data.get("date"):
        try:
            date_val = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Expected YYYY-MM-DD"}), 400

    next_id = (db.session.query(db.func.max(MedicalRecord.id)).scalar() or 0) + 1
    code = format_code("MED", next_id)

    record = MedicalRecord(
        code=code,
        patient_id=patient_id,
        doctor_id=doctor_id,
        diagnosis=diagnosis,
        prescription=prescription,
        treatment=treatment,
        medicines=medicines,
        notes=notes,
        date=date_val,
    )
    db.session.add(record)
    db.session.commit()

    loaded = MedicalRecord.query.options(
        db.joinedload(MedicalRecord.patient),
        db.joinedload(MedicalRecord.doctor),
    ).get(record.id)

    return jsonify(loaded.to_dict()), 201


@records_bp.route("/<int:rid>", methods=["DELETE"])
@login_required
@role_required("admin", "doctor")
def delete_record(rid):
    """Delete medical record (Admin or Doctor only)."""
    record = MedicalRecord.query.get_or_404(rid)
    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "Medical record deleted successfully"}), 200
