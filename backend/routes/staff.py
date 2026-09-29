from flask import Blueprint, request, jsonify
from database import db
from models import Staff, User, format_code
from routes.auth import login_required, role_required

staff_bp = Blueprint("staff", __name__, url_prefix="/api/staff")


@staff_bp.route("", methods=["GET"])
@login_required
def get_staff():
    """List staff members with optional department filter."""
    dept_id = request.args.get("department_id")
    query = Staff.query.options(db.joinedload(Staff.department_rel))
    if dept_id:
        query = query.filter_by(department_id=int(dept_id))
    staff_members = query.order_by(Staff.id.asc()).all()
    return jsonify([s.to_dict() for s in staff_members]), 200


@staff_bp.route("/<int:sid>", methods=["GET"])
@login_required
def get_single_staff(sid):
    """Retrieve single staff member by ID."""
    staff = Staff.query.get_or_404(sid)
    return jsonify(staff.to_dict()), 200


def get_next_staff_code(prefix):
    existing = [s.code for s in Staff.query.filter(Staff.code.like(f"{prefix}-%")).all() if s.code]
    max_num = 0
    for c in existing:
        try:
            num = int(c.split("-")[-1])
            if num > max_num:
                max_num = num
        except (ValueError, IndexError):
            pass
    return format_code(prefix, max_num + 1)


@staff_bp.route("", methods=["POST"])
@login_required
@role_required("admin")
def create_staff():
    """
    Register a new staff member with auto-generated NUR-xxxx or REC-xxxx code
    and linked User authentication account (Admin only).
    Admin manually provides: Staff Name, Username, Initial Password, Role (Nurse or Receptionist).
    System automatically generates: Unique Staff ID (NUR-xxxx or REC-xxxx).
    """
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    role = (data.get("role") or "").strip()
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    confirm_password = (data.get("confirm_password") or "").strip()
    email = (data.get("email") or "").strip().lower()

    if not name or not role:
        return jsonify({"error": "Staff name and role are required"}), 400

    # Strict staff role restriction: Only Nurse and Receptionist
    if role not in ("Nurse", "Receptionist", "Head Nurse"):
        return jsonify({"error": "Invalid role. The staff role must be either 'Nurse' or 'Receptionist'."}), 400

    if not username or not password:
        return jsonify({"error": "Username and initial password are required to create a staff account"}), 400

    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters long"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    if confirm_password and password != confirm_password:
        return jsonify({"error": "Password and confirmation do not match"}), 400

    # Strict username uniqueness check across the entire users table
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists. Please choose another username."}), 409

    # Determine role and code prefix: NUR for Nurse, REC for Receptionist
    role_lower = role.lower()
    if "reception" in role_lower:
        user_role = "receptionist"
        prefix = "REC"
    else:
        user_role = "nurse"
        prefix = "NUR"

    code = get_next_staff_code(prefix)

    # Validate or generate email
    if not email:
        email = f"{username.lower()}@hospital.com"
        if User.query.filter_by(email=email).first():
            email = f"{username.lower()}_{prefix.lower()}@hospital.com"
    else:
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email is already registered. Please provide a different email address."}), 409

    # Atomic creation of both Staff profile and User login account
    try:
        staff = Staff(
            code=code,
            name=name,
            role=role,
            department_id=data.get("department_id"),
            department=data.get("department"),
            phone=data.get("phone"),
            email=email,
            shift=data.get("shift", "Morning"),
        )
        db.session.add(staff)
        db.session.flush()

        user = User(
            username=username,
            name=name,
            email=email,
            role=user_role,
            staff_id=staff.id,
            must_change_password=True,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        staff.user_id = user.id
        db.session.commit()

        return jsonify({
            "message": f"Staff profile and credentials created successfully for {staff.name}.",
            "staff": staff.to_dict(),
            "credentials": {
                "name": staff.name,
                "code": staff.code,
                "username": user.username,
                "role": user_role
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create staff account", "details": str(e)}), 500


@staff_bp.route("/<int:sid>/reset-password", methods=["POST"])
@login_required
@role_required("admin")
def reset_staff_password(sid):
    """
    Admin-only endpoint to reset the login password for a Staff member.
    Validates new password, hashes with bcrypt, and requires password change on next login.
    """
    staff = Staff.query.get_or_404(sid)
    user = User.query.filter((User.staff_id == sid) | (User.id == staff.user_id)).first()

    if not user:
        return jsonify({"error": f"No user login account found for {staff.name}"}), 404

    data = request.get_json() or {}
    new_password = (data.get("new_password") or data.get("password") or "").strip()
    confirm_password = (data.get("confirm_password") or "").strip()

    if not new_password:
        return jsonify({"error": "New password is required"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters long"}), 400

    if confirm_password and new_password != confirm_password:
        return jsonify({"error": "New password and confirmation do not match"}), 400

    user.set_password(new_password)
    user.must_change_password = True
    db.session.commit()

    return jsonify({
        "message": f"Password for {staff.name} ({user.username}) has been successfully reset."
    }), 200


@staff_bp.route("/<int:sid>", methods=["PUT"])
@login_required
@role_required("admin")
def update_staff(sid):
    """Update existing staff member details."""
    staff = Staff.query.get_or_404(sid)
    data = request.get_json() or {}

    for key in ("name", "role", "department", "department_id", "phone", "email", "shift"):
        if key in data and data[key] is not None:
            setattr(staff, key, data[key])

    # Also update linked user's name/email if changed
    user = User.query.filter((User.staff_id == sid) | (User.id == staff.user_id)).first()
    if user:
        user.name = staff.name
        if staff.email:
            user.email = staff.email

    db.session.commit()
    return jsonify(staff.to_dict()), 200


@staff_bp.route("/<int:sid>", methods=["DELETE"])
@login_required
@role_required("admin")
def delete_staff(sid):
    """Delete staff member and associated login credentials (Admin only)."""
    staff = Staff.query.get_or_404(sid)
    user = User.query.filter((User.staff_id == sid) | (User.id == staff.user_id)).first()
    if user:
        db.session.delete(user)
    db.session.delete(staff)
    db.session.commit()
    return jsonify({"message": f"Staff member {staff.name} and associated credentials removed successfully"}), 200
