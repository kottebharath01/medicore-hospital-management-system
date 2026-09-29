from flask import Blueprint, request, jsonify
from database import db
from models import VitalSign, Patient, format_code
from routes.auth import login_required, role_required

vitals_bp = Blueprint("vitals", __name__, url_prefix="/api/vitals")


@vitals_bp.route("", methods=["GET"])
def get_vitals():
    """List vital signs with optional patient_id filter."""
    pid = request.args.get("patient_id")
    query = VitalSign.query.options(db.joinedload(VitalSign.patient))
    if pid:
        query = query.filter_by(patient_id=int(pid))
    vitals = query.order_by(VitalSign.recorded_at.desc(), VitalSign.id.desc()).all()
    return jsonify([v.to_dict() for v in vitals]), 200


@vitals_bp.route("", methods=["POST"])
def record_vitals():
    """Record patient vital signs and nursing observation."""
    data = request.get_json() or {}
    patient_id = data.get("patient_id")
    nurse_name = (data.get("nurse_name") or "Staff Nurse").strip()
    blood_pressure = data.get("blood_pressure")
    heart_rate = data.get("heart_rate")
    temperature = data.get("temperature")
    respiratory_rate = data.get("respiratory_rate")
    oxygen_saturation = data.get("oxygen_saturation")
    notes = data.get("notes")

    if not patient_id:
        return jsonify({"error": "patient_id is required"}), 400

    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": f"Patient with ID {patient_id} does not exist"}), 404

    next_id = (db.session.query(db.func.max(VitalSign.id)).scalar() or 0) + 1
    code = format_code("VIT", next_id)

    vital = VitalSign(
        code=code,
        patient_id=patient_id,
        nurse_name=nurse_name,
        blood_pressure=blood_pressure,
        heart_rate=int(heart_rate) if str(heart_rate).isdigit() else None,
        temperature=float(temperature) if temperature else None,
        respiratory_rate=int(respiratory_rate) if str(respiratory_rate).isdigit() else None,
        oxygen_saturation=int(oxygen_saturation) if str(oxygen_saturation).isdigit() else None,
        notes=notes,
    )
    db.session.add(vital)
    db.session.commit()

    loaded = VitalSign.query.options(db.joinedload(VitalSign.patient)).get(vital.id)
    return jsonify(loaded.to_dict()), 201


@vitals_bp.route("/<int:vid>", methods=["DELETE"])
@login_required
@role_required("admin", "nurse")
def delete_vitals(vid):
    """Delete a vital sign record (Admin or Nurse only)."""
    vital = VitalSign.query.get_or_404(vid)
    db.session.delete(vital)
    db.session.commit()
    return jsonify({"message": "Vital signs record deleted successfully"}), 200
