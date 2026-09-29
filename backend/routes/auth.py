import datetime
import jwt
from flask import Blueprint, request, jsonify, current_app
from database import db
from models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
users_bp = Blueprint("users", __name__, url_prefix="/api/users")


def create_token(user):
    """Generate a signed JWT token containing user id, username, and role."""
    payload = {
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def decode_token(token):
    """Decode and verify a JWT token."""
    try:
        return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user account."""
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "user")

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Username or email already registered"}), 409

    user = User(username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_token(user)
    return jsonify({"message": "User registered successfully", "token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Fast indexed login via username or email."""
    data = request.get_json() or {}
    identifier = data.get("username") or data.get("email") or ""
    identifier = identifier.strip()
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Username/email and password are required"}), 400

    # Fast indexed lookup on either username or email
    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_token(user)
    return jsonify({"message": "Login successful", "token": token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    """Return profile of currently logged-in user via Bearer token."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Authorization token required"}), 401

    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user = User.query.get(payload["user_id"])
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user.to_dict()), 200


@users_bp.route("", methods=["GET"])
def list_users():
    """List all user accounts."""
    users = User.query.order_by(User.id.asc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@users_bp.route("/<int:user_id>/role", methods=["PUT"])
def update_user_role(user_id):
    """Update role for a user account."""
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    role = data.get("role")
    if not role or role not in ("admin", "user"):
        return jsonify({"error": "Valid role ('admin' or 'user') is required"}), 400

    user.role = role
    db.session.commit()
    return jsonify({"message": "Role updated", "user": user.to_dict()}), 200
