import datetime
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify, current_app, g
from database import db
from models import User, Patient, format_code

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
users_bp = Blueprint("users", __name__, url_prefix="/api/users")


def create_token(user):
    """Generate a signed JWT token containing user id, username, and role."""
    payload = {
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "patient_id": user.patient_id,
        "doctor_id": user.doctor_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def decode_token(token):
    """Decode and verify a JWT token."""
    try:
        return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def get_current_user_from_request():
    """Retrieve User object from Bearer Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        return None
    return User.query.get(payload["user_id"])


def login_required(f):
    """Decorator requiring a valid JWT authentication token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user_from_request()
        if not user:
            return jsonify({"error": "Unauthorized", "message": "Valid authentication token required"}), 401
        g.current_user = user
        return f(*args, **kwargs)
    return decorated


def role_required(*allowed_roles):
    """Decorator requiring specific role(s) or admin authorization."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user_from_request()
            if not user:
                return jsonify({"error": "Unauthorized", "message": "Authentication required"}), 401
            # Admin always has superuser bypass
            if user.role != "admin" and user.role not in allowed_roles:
                return jsonify({
                    "error": "Forbidden",
                    "message": f"Access denied. Role '{user.role}' is not authorized to access this resource."
                }), 403
            g.current_user = user
            return f(*args, **kwargs)
        return decorated
    return decorator


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Public registration endpoint.
    STRICT SECURITY RULE: Public registration is ONLY permitted for Normal Users / Patients.
    Doctor, Nurse, Receptionist, and Admin accounts must be created by Admin.
    """
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    name = data.get("name", "").strip() or username
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    age = data.get("age", 30)
    gender = data.get("gender", "Male")
    phone = data.get("phone", "")
    address = data.get("address", "")
    blood_group = data.get("blood_group", "O+")

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Username or email is already registered"}), 409

    # Always create as patient role
    user = User(
        username=username,
        name=name,
        email=email,
        role="patient",
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    # Automatically create linked Patient record with unique PAT-xxxx business ID
    patient = Patient(
        code=format_code("PAT", user.id + 100),
        user_id=user.id,
        name=name,
        age=int(age) if str(age).isdigit() else 30,
        gender=gender,
        blood_group=blood_group,
        phone=phone,
        email=email,
        address=address,
    )
    db.session.add(patient)
    db.session.flush()

    # Back-link patient_id
    user.patient_id = patient.id
    db.session.commit()

    token = create_token(user)
    return jsonify({
        "message": f"Welcome, {name}! Your patient account was created successfully.",
        "token": token,
        "user": user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Fast indexed login via username or email."""
    data = request.get_json() or {}
    identifier = (data.get("username") or data.get("email") or "").strip()
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Username/email and password are required"}), 400

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    token = create_token(user)
    return jsonify({
        "message": f"Welcome back, {user.name or user.username}!",
        "token": token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/me", methods=["GET"])
@login_required
def get_current_user():
    """Return profile of currently logged-in user via Bearer token."""
    return jsonify(g.current_user.to_dict()), 200


@auth_bp.route("/change-password", methods=["POST"])
@login_required
def change_password():
    """
    Secure password change endpoint.
    Validates current password, checks matching new password, hashes securely, and updates.
    """
    user = g.current_user
    data = request.get_json() or {}
    current_password = data.get("current_password") or data.get("old_password", "")
    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password") or new_password

    if not current_password or not new_password:
        return jsonify({"error": "Current password and new password are required"}), 400

    if not user.check_password(current_password):
        return jsonify({"error": "Current password does not match"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters long"}), 400

    if new_password != confirm_password:
        return jsonify({"error": "New password and confirmation do not match"}), 400

    user.set_password(new_password)
    user.must_change_password = False
    db.session.commit()
    return jsonify({
        "message": "Password changed successfully! You may now use your new password.",
        "user": user.to_dict()
    }), 200


@users_bp.route("", methods=["GET"])
@login_required
@role_required("admin")
def list_users():
    """List all system user accounts (Admin only)."""
    users = User.query.order_by(User.id.asc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@users_bp.route("", methods=["POST"])
@login_required
@role_required("admin")
def create_staff_user():
    """Admin-only endpoint to create staff accounts (Doctor, Nurse, Receptionist, Admin)."""
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    name = data.get("name", "").strip() or username
    email = data.get("email", "").strip().lower()
    password = data.get("password", "hospital123")
    role = data.get("role", "staff").lower()
    doctor_id = data.get("doctor_id")

    valid_roles = ("admin", "doctor", "nurse", "receptionist", "patient", "staff")
    if role not in valid_roles:
        return jsonify({"error": f"Invalid role. Choose from {', '.join(valid_roles)}"}), 400

    if not username or not email:
        return jsonify({"error": "Username and email are required"}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Username or email is already registered"}), 409

    user = User(
        username=username,
        name=name,
        email=email,
        role=role,
        doctor_id=doctor_id,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": f"Account for {username} ({role}) created successfully", "user": user.to_dict()}), 201
