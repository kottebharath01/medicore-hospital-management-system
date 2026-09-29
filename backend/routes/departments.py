from flask import Blueprint, request, jsonify
from database import db
from models import Department, format_code
from routes.auth import login_required, role_required

departments_bp = Blueprint("departments", __name__, url_prefix="/api/departments")


@departments_bp.route("", methods=["GET"])
@login_required
def get_departments():
    """List all hospital clinical departments with dynamic doctor and staff counts."""
    depts = Department.query.order_by(Department.id.asc()).all()
    return jsonify([d.to_dict() for d in depts]), 200


@departments_bp.route("/<int:dept_id>", methods=["GET"])
@login_required
def get_department(dept_id):
    """Retrieve details for a single department."""
    dept = Department.query.get_or_404(dept_id)
    data = dept.to_dict()
    data["doctors"] = [doc.to_dict() for doc in dept.doctors.all()]
    data["staff"] = [s.to_dict() for s in dept.staff.all()]
    return jsonify(data), 200


@departments_bp.route("", methods=["POST"])
@login_required
@role_required("admin")
def create_department():
    """Create a new hospital department (Admin only)."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    description = data.get("description", "").strip()

    if not name:
        return jsonify({"error": "Department name is required"}), 400

    if Department.query.filter_by(name=name).first():
        return jsonify({"error": f"Department '{name}' already exists"}), 409

    count = Department.query.count() + 1
    dept = Department(
        code=format_code("DEP", count),
        name=name,
        description=description,
    )
    db.session.add(dept)
    db.session.commit()
    return jsonify(dept.to_dict()), 201


@departments_bp.route("/<int:dept_id>", methods=["PUT"])
@login_required
@role_required("admin")
def update_department(dept_id):
    """Update department details (Admin only)."""
    dept = Department.query.get_or_404(dept_id)
    data = request.get_json() or {}

    dept.name = data.get("name", dept.name)
    dept.description = data.get("description", dept.description)
    db.session.commit()
    return jsonify(dept.to_dict()), 200


@departments_bp.route("/<int:dept_id>", methods=["DELETE"])
@login_required
@role_required("admin")
def delete_department(dept_id):
    """Delete department (Admin only)."""
    dept = Department.query.get_or_404(dept_id)
    db.session.delete(dept)
    db.session.commit()
    return jsonify({"message": f"Department '{dept.name}' deleted successfully"}), 200
