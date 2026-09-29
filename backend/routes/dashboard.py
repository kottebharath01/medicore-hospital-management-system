from datetime import date
from flask import Blueprint, jsonify
from database import db
from models import Patient, Doctor, Appointment, Ward, Staff

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("", methods=["GET"])
def get_dashboard():
    """
    Get aggregated hospital overview statistics and recent appointments.
    Optimized with single-query bed metrics and joinedload for recent appointments
    to completely eliminate N+1 database roundtrips.
    """
    today = date.today()

    # Aggregate bed occupancy metrics in a single query
    bed_stats = db.session.query(
        db.func.coalesce(db.func.sum(Ward.occupied), 0).label("occupied"),
        db.func.coalesce(db.func.sum(Ward.capacity), 0).label("capacity"),
    ).one()

    # Fast indexed counts
    total_patients = Patient.query.count()
    total_doctors = Doctor.query.count()
    available_doctors = Doctor.query.filter_by(available=True).count()
    today_appts = Appointment.query.filter_by(date=today).count()
    scheduled_appts = Appointment.query.filter_by(status="Scheduled").count()
    total_wards = Ward.query.count()
    total_staff = Staff.query.count()

    # Eager load relationships to prevent N+1 queries
    recent_appointments = (
        Appointment.query.options(
            db.joinedload(Appointment.patient),
            db.joinedload(Appointment.doctor),
        )
        .order_by(Appointment.created_at.desc())
        .limit(5)
        .all()
    )

    return jsonify({
        "stats": {
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "today_appointments": today_appts,
            "scheduled_appointments": scheduled_appts,
            "available_doctors": available_doctors,
            "total_wards": total_wards,
            "occupied_beds": int(bed_stats.occupied),
            "total_beds": int(bed_stats.capacity),
            "total_staff": total_staff,
        },
        "recent_appointments": [a.to_dict() for a in recent_appointments],
    })
