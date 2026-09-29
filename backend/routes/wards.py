from flask import Blueprint, request, jsonify
from database import db
from models import Ward

wards_bp = Blueprint("wards", __name__, url_prefix="/api/wards")


@wards_bp.route("", methods=["GET"])
def get_wards():
    """List all hospital wards with bed capacity and occupancy."""
    wards = Ward.query.order_by(Ward.id.asc()).all()
    return jsonify([w.to_dict() for w in wards])


@wards_bp.route("/<int:wid>", methods=["GET"])
def get_ward(wid):
    """Retrieve single ward by ID."""
    ward = Ward.query.get_or_404(wid)
    return jsonify(ward.to_dict())


@wards_bp.route("", methods=["POST"])
def create_ward():
    """Add a new hospital ward."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    capacity = data.get("capacity")

    if not name or capacity is None:
        return jsonify({"error": "Ward name and capacity are required"}), 400

    try:
        capacity = int(capacity)
    except (ValueError, TypeError):
        return jsonify({"error": "Capacity must be an integer"}), 400

    occupied = 0
    if data.get("occupied") is not None and data.get("occupied") != "":
        try:
            occupied = int(data["occupied"])
        except (ValueError, TypeError):
            occupied = 0

    floor = None
    if data.get("floor") is not None and data.get("floor") != "":
        try:
            floor = int(data["floor"])
        except (ValueError, TypeError):
            floor = None

    ward = Ward(
        name=name,
        ward_type=data.get("ward_type", "General"),
        capacity=capacity,
        occupied=occupied,
        floor=floor,
    )
    db.session.add(ward)
    db.session.commit()
    return jsonify(ward.to_dict()), 201


@wards_bp.route("/<int:wid>", methods=["PUT"])
def update_ward(wid):
    """Update existing ward capacity or occupancy."""
    ward = Ward.query.get_or_404(wid)
    data = request.get_json() or {}

    for key in ("name", "ward_type", "capacity", "occupied", "floor"):
        if key in data and data[key] is not None:
            val = data[key]
            if key in ("capacity", "occupied", "floor") and val != "":
                try:
                    val = int(val)
                except (ValueError, TypeError):
                    continue
            setattr(ward, key, val)

    db.session.commit()
    return jsonify(ward.to_dict())


@wards_bp.route("/<int:wid>", methods=["DELETE"])
def delete_ward(wid):
    """Delete a ward."""
    ward = Ward.query.get_or_404(wid)
    db.session.delete(ward)
    db.session.commit()
    return jsonify({"message": "Ward deleted"})
