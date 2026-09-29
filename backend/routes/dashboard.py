from datetime import date
from flask import Blueprint, jsonify
from database import db
from models import Patient, Doctor, Appointment, Ward, Bed, Staff, Department
from routes.auth import login_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("", methods=["GET"])
@login_required
def get_dashboard():
    """
    Get aggregated hospital overview statistics and recent appointments.
    Optimized with single-query bed metrics and joinedload for recent appointments
    to completely eliminate N+1 database roundtrips.
    """
    today = date.today()

    # Calculate live bed statistics from Bed table if populated, otherwise Ward table
    bed_count = Bed.query.count()
    if bed_count > 0:
        total_beds = bed_count
        occupied_beds = Bed.query.filter_by(status="Occupied").count()
        available_beds = Bed.query.filter_by(status="Available").count()
    else:
        bed_stats = db.session.query(
            db.func.coalesce(db.func.sum(Ward.occupied), 0).label("occupied"),
            db.func.coalesce(db.func.sum(Ward.capacity), 0).label("capacity"),
        ).one()
        total_beds = int(bed_stats.capacity)
        occupied_beds = int(bed_stats.occupied)
        available_beds = max(0, total_beds - occupied_beds)

    # Fast indexed counts
    total_patients = Patient.query.count()
    total_doctors = Doctor.query.count()
    available_doctors = Doctor.query.filter_by(available=True).count()
    today_appts = Appointment.query.filter_by(date=today).count()
    scheduled_appts = Appointment.query.filter(Appointment.status.in_(["Scheduled", "Confirmed"])).count()
    total_wards = Ward.query.count()
    total_staff = Staff.query.count()
    total_departments = Department.query.count()

    # Eager load relationships to prevent N+1 queries
    recent_appointments = (
        Appointment.query.options(
            db.joinedload(Appointment.patient),
            db.joinedload(Appointment.doctor),
            db.joinedload(Appointment.department),
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
            "occupied_beds": occupied_beds,
            "total_beds": total_beds,
            "available_beds": available_beds,
            "total_staff": total_staff,
            "total_departments": total_departments,
        },
        "recent_appointments": [a.to_dict() for a in recent_appointments],
    })


@dashboard_bp.route("/bed-occupancy", methods=["GET"])
@login_required
def get_bed_occupancy():
    """
    Return detailed live occupancy list for all currently occupied hospital beds.
    Includes Bed Number, Patient ID, Patient Name, Ward, Assigned Doctor, and Status.
    """
    occupied_beds = (
        Bed.query.filter_by(status="Occupied")
        .options(
            db.joinedload(Bed.ward),
            db.joinedload(Bed.patient),
            db.joinedload(Bed.doctor),
        )
        .order_by(Bed.ward_id.asc(), Bed.bed_number.asc())
        .all()
    )
    return jsonify([b.to_dict() for b in occupied_beds]), 200
