from flask import Blueprint, request, jsonify
from database import db
from models import Staff

staff_bp = Blueprint("staff", __name__, url_prefix="/api/staff")


@staff_bp.route("", methods=["GET"])
def get_staff():
    """List all non-clinical staff members."""
    staff_members = Staff.query.order_by(Staff.id.asc()).all()
    return jsonify([s.to_dict() for s in staff_members])


@staff_bp.route("/<int:sid>", methods=["GET"])
def get_single_staff(sid):
    """Retrieve single staff member by ID."""
    staff = Staff.query.get_or_404(sid)
    return jsonify(staff.to_dict())


@staff_bp.route("", methods=["POST"])
def create_staff():
    """Register a new staff member."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    role = data.get("role", "").strip()

    if not name or not role:
        return jsonify({"error": "Staff name and role are required"}), 400

    staff = Staff(
        name=name,
        role=role,
        department=data.get("department"),
        phone=data.get("phone"),
        email=data.get("email"),
        shift=data.get("shift", "Morning"),
    )
    db.session.add(staff)
    db.session.commit()
    return jsonify(staff.to_dict()), 201


@staff_bp.route("/<int:sid>", methods=["PUT"])
def update_staff(sid):
    """Update existing staff member details."""
    staff = Staff.query.get_or_404(sid)
    data = request.get_json() or {}

    for key in ("name", "role", "department", "phone", "email", "shift"):
        if key in data and data[key] is not None:
            setattr(staff, key, data[key])

    db.session.commit()
    return jsonify(staff.to_dict())


@staff_bp.route("/<int:sid>", methods=["DELETE"])
def delete_staff(sid):
    """Delete a staff member."""
    staff = Staff.query.get_or_404(sid)
    db.session.delete(staff)
    db.session.commit()
    return jsonify({"message": "Staff deleted"})
