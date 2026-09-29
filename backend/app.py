import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import db
from seed import seed_database

# Import API blueprints
from routes.auth import auth_bp, users_bp
from routes.dashboard import dashboard_bp
from routes.patients import patients_bp
from routes.doctors import doctors_bp
from routes.appointments import appointments_bp
from routes.records import records_bp
from routes.wards import wards_bp
from routes.staff import staff_bp
from routes.departments import departments_bp
from routes.vitals import vitals_bp


class ApiPrefixMiddleware:
    """WSGI middleware ensuring routes like /dashboard or /auth/login transparently resolve to /api/... if /api was omitted by the client."""
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        path = environ.get("PATH_INFO", "")
        # If the request path does not start with /api and is not root / or docs
        if path and not path.startswith("/api") and path != "/":
            environ["PATH_INFO"] = "/api" + path
        return self.wsgi_app(environ, start_response)


def create_app():
    """Application factory for Hospital Management System backend."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all routes (allows React frontend to communicate smoothly)
    CORS(app)

    # Initialize SQLAlchemy database
    db.init_app(app)

    # Register API Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(patients_bp)
    app.register_blueprint(doctors_bp)
    app.register_blueprint(appointments_bp)
    app.register_blueprint(records_bp)
    app.register_blueprint(wards_bp)
    app.register_blueprint(staff_bp)
    app.register_blueprint(departments_bp)
    app.register_blueprint(vitals_bp)

    # Health check endpoints
    @app.route("/")
    @app.route("/api")
    def health():
        return jsonify({
            "status": "healthy",
            "service": "MediCore HMS API",
            "message": "Hospital Management System backend running smoothly."
        }), 200

    # Clean JSON error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad request", "message": str(error)}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"error": "Internal server error"}), 500

    # Initialize database tables and seed baseline data on startup
    with app.app_context():
        db.create_all()
        seed_database()

    # Wrap WSGI app with prefix middleware for seamless routing
    app.wsgi_app = ApiPrefixMiddleware(app.wsgi_app)

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

