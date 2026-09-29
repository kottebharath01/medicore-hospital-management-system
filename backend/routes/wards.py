from flask import Blueprint, request, jsonify
from database import db
from models import Ward, Bed, Patient, Doctor, format_code
from routes.auth import login_required, role_required

wards_bp = Blueprint("wards", __name__, url_prefix="/api/wards")


@wards_bp.route("", methods=["GET"])
@login_required
def get_wards():
    """List all hospital wards with dynamic bed capacity, occupied, and available metrics."""
    wards = Ward.query.order_by(Ward.id.asc()).all()
    return jsonify([w.to_dict() for w in wards]), 200


@wards_bp.route("/<int:wid>", methods=["GET"])
@login_required
def get_ward(wid):
    """Retrieve single ward with dynamic bed breakdown."""
    ward = Ward.query.get_or_404(wid)
    data = ward.to_dict()
    beds = (
        Bed.query.filter_by(ward_id=wid)
        .options(db.joinedload(Bed.patient), db.joinedload(Bed.doctor))
        .order_by(Bed.bed_number.asc())
        .all()
    )
    data["beds"] = [b.to_dict() for b in beds]
    return jsonify(data), 200


@wards_bp.route("/<int:wid>/beds", methods=["GET"])
@login_required
def get_ward_beds(wid):
    """Retrieve all beds and patient assignments for a specific ward."""
    beds = (
        Bed.query.filter_by(ward_id=wid)
        .options(db.joinedload(Bed.patient), db.joinedload(Bed.doctor), db.joinedload(Bed.ward))
        .order_by(Bed.bed_number.asc())
        .all()
    )
    return jsonify([b.to_dict() for b in beds]), 200


@wards_bp.route("", methods=["POST"])
@login_required
@role_required("admin")
def create_ward():
    """Create a new hospital ward with WRD-xxxx code."""
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    capacity = data.get("capacity", 10)

    if not name:
        return jsonify({"error": "Ward name is required"}), 400

    next_id = (db.session.query(db.func.max(Ward.id)).scalar() or 0) + 1
    code = format_code("WRD", next_id)

    ward = Ward(
        code=code,
        name=name,
        ward_type=data.get("ward_type", "General"),
        capacity=int(capacity) if str(capacity).isdigit() else 10,
        floor=int(data["floor"]) if str(data.get("floor", "")).isdigit() else 1,
    )
    db.session.add(ward)
    db.session.commit()
    return jsonify(ward.to_dict()), 201


@wards_bp.route("/<int:wid>", methods=["PUT"])
@login_required
@role_required("admin")
def update_ward(wid):
    """Update ward details."""
    ward = Ward.query.get_or_404(wid)
    data = request.get_json() or {}

    ward.name = data.get("name", ward.name)
    ward.ward_type = data.get("ward_type", ward.ward_type)
    if "capacity" in data:
        ward.capacity = int(data["capacity"])
    if "floor" in data:
        ward.floor = int(data["floor"])

    db.session.commit()
    return jsonify(ward.to_dict()), 200


@wards_bp.route("/<int:wid>", methods=["DELETE"])
@login_required
@role_required("admin")
def delete_ward(wid):
    """Delete ward and cascade delete all its beds."""
    ward = Ward.query.get_or_404(wid)
    db.session.delete(ward)
    db.session.commit()
    return jsonify({"message": f"Ward {ward.name} deleted successfully"}), 200


# ─── Individual Bed Management Endpoints ────────────────────────────────────────

@wards_bp.route("/beds", methods=["GET"])
@login_required
def get_all_beds():
    """List all beds across the hospital with optional status or ward_id filter."""
    ward_id = request.args.get("ward_id")
    status = request.args.get("status")

    query = Bed.query.options(
        db.joinedload(Bed.ward),
        db.joinedload(Bed.patient),
        db.joinedload(Bed.doctor),
    )

    if ward_id:
        query = query.filter_by(ward_id=int(ward_id))
    if status:
        query = query.filter_by(status=status)

    beds = query.order_by(Bed.ward_id.asc(), Bed.bed_number.asc()).all()
    return jsonify([b.to_dict() for b in beds]), 200


@wards_bp.route("/beds", methods=["POST"])
@login_required
@role_required("admin", "nurse", "receptionist")
def create_bed():
    """Add a new bed to a ward."""
    data = request.get_json() or {}
    ward_id = data.get("ward_id")
    bed_number = (data.get("bed_number") or "").strip()

    if not ward_id or not bed_number:
        return jsonify({"error": "ward_id and bed_number are required"}), 400

    next_id = (db.session.query(db.func.max(Bed.id)).scalar() or 0) + 1
    code = format_code("BED", next_id)

    bed = Bed(
        code=code,
        bed_number=bed_number,
        ward_id=ward_id,
        status=data.get("status", "Available"),
        notes=data.get("notes"),
    )
    db.session.add(bed)
    db.session.commit()

    loaded = Bed.query.options(db.joinedload(Bed.ward)).get(bed.id)
    return jsonify(loaded.to_dict()), 201


@wards_bp.route("/beds/<int:bid>", methods=["PUT"])
@login_required
@role_required("admin", "nurse", "receptionist")
def update_bed(bid):
    """
    Update bed status and patient allocation.
    Supported statuses: Available, Occupied, Reserved, Maintenance.
    """
    bed = Bed.query.get_or_404(bid)
    data = request.get_json() or {}

    valid_statuses = ("Available", "Occupied", "Reserved", "Maintenance")
    if "status" in data:
        if data["status"] in valid_statuses:
            bed.status = data["status"]
            # If changing to Available, clear patient
            if data["status"] == "Available":
                bed.patient_id = None
        else:
            return jsonify({"error": f"Invalid status. Choose from {', '.join(valid_statuses)}"}), 400

    if "patient_id" in data:
        p_id = data["patient_id"]
        bed.patient_id = p_id if p_id else None
        if p_id:
            bed.status = "Occupied"

    if "assigned_doctor_id" in data:
        bed.assigned_doctor_id = data["assigned_doctor_id"]

    if "notes" in data:
        bed.notes = data["notes"]

    db.session.commit()

    loaded = Bed.query.options(
        db.joinedload(Bed.ward),
        db.joinedload(Bed.patient),
        db.joinedload(Bed.doctor),
    ).get(bid)

    return jsonify(loaded.to_dict()), 200


@wards_bp.route("/beds/<int:bid>", methods=["DELETE"])
@login_required
@role_required("admin")
def delete_bed(bid):
    """Delete bed."""
    bed = Bed.query.get_or_404(bid)
    db.session.delete(bed)
    db.session.commit()
    return jsonify({"message": "Bed deleted successfully"}), 200
