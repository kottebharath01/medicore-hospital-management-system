from flask import Blueprint, request, jsonify
from database import db
from models import Staff, format_code
from routes.auth import login_required, role_required

staff_bp = Blueprint("staff", __name__, url_prefix="/api/staff")


@staff_bp.route("", methods=["GET"])
def get_staff():
    """List staff members with optional department filter."""
    dept_id = request.args.get("department_id")
    query = Staff.query.options(db.joinedload(Staff.department_rel))
    if dept_id:
        query = query.filter_by(department_id=int(dept_id))
    staff_members = query.order_by(Staff.id.asc()).all()
    return jsonify([s.to_dict() for s in staff_members]), 200


@staff_bp.route("/<int:sid>", methods=["GET"])
def get_single_staff(sid):
    """Retrieve single staff member by ID."""
    staff = Staff.query.get_or_404(sid)
    return jsonify(staff.to_dict()), 200


@staff_bp.route("", methods=["POST"])
def create_staff():
    """Register a new staff member with STF-xxxx or NUR-xxxx code."""
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    role = (data.get("role") or "").strip()

    if not name or not role:
        return jsonify({"error": "Staff name and role are required"}), 400

    next_id = (db.session.query(db.func.max(Staff.id)).scalar() or 0) + 1
    prefix = "NUR" if "nurse" in role.lower() else "STF"
    code = format_code(prefix, next_id)

    staff = Staff(
        code=code,
        name=name,
        role=role,
        department_id=data.get("department_id"),
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

    for key in ("name", "role", "department", "department_id", "phone", "email", "shift"):
        if key in data and data[key] is not None:
            setattr(staff, key, data[key])

    db.session.commit()
    return jsonify(staff.to_dict()), 200


@staff_bp.route("/<int:sid>", methods=["DELETE"])
@login_required
@role_required("admin")
def delete_staff(sid):
    """Delete staff member (Admin only)."""
    staff = Staff.query.get_or_404(sid)
    db.session.delete(staff)
    db.session.commit()
    return jsonify({"message": f"Staff member {staff.name} deleted successfully"}), 200
