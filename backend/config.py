import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Simple configuration class for Hospital Management System."""

    # Secret key for JWT and session management
    SECRET_KEY = os.environ.get("SECRET_KEY", "medicore-secret-hospital-key-2026")

    # Build database URI: prefer DATABASE_URL, else construct from DB_* variables
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        db_host = os.environ.get("DB_HOST", "localhost")
        db_port = os.environ.get("DB_PORT", "5432")
        db_name = os.environ.get("DB_NAME", "hospital_management")
        db_user = os.environ.get("DB_USER", "hms_user")
        db_password = os.environ.get("DB_PASSWORD", "hms_password")
        db_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

    # Handle postgres:// alias from cloud providers like Render/Heroku
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Connection pooling for high performance local PostgreSQL access
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
    }
