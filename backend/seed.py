from datetime import date, datetime
from database import db
from models import User, Doctor, Patient, Ward, Staff, Appointment, MedicalRecord


def seed_database():
    """Seed initial sample data if tables are empty."""

    # 1. Users (ensure accounts for all key hospital roles exist)
    demo_accounts = [
        {"username": "admin", "email": "admin@hospital.com", "role": "admin", "password": "admin123"},
        {"username": "doctor", "email": "doctor@hospital.com", "role": "doctor", "password": "doctor123"},
        {"username": "nurse", "email": "nurse@hospital.com", "role": "nurse", "password": "nurse123"},
        {"username": "receptionist", "email": "reception@hospital.com", "role": "receptionist", "password": "reception123"},
        {"username": "user", "email": "user@hospital.com", "role": "staff", "password": "user123"},
    ]

    for acc in demo_accounts:
        u = User.query.filter_by(username=acc["username"]).first()
        if not u:
            u = User(username=acc["username"], email=acc["email"], role=acc["role"])
            u.set_password(acc["password"])
            db.session.add(u)
        else:
            u.role = acc["role"]
            u.set_password(acc["password"])

    db.session.commit()

    # 2. Doctors
    if Doctor.query.count() == 0:
        doctors = [
            Doctor(name="Dr. Priya Sharma", specialization="Cardiology", phone="9876543210", email="priya@hospital.com", experience=12, fee=800.0, available=True),
            Doctor(name="Dr. Ravi Kumar", specialization="Neurology", phone="9876543211", email="ravi@hospital.com", experience=15, fee=1000.0, available=True),
            Doctor(name="Dr. Ananya Reddy", specialization="Orthopedics", phone="9876543212", email="ananya@hospital.com", experience=8, fee=700.0, available=True),
            Doctor(name="Dr. Suresh Patel", specialization="Pediatrics", phone="9876543213", email="suresh@hospital.com", experience=10, fee=600.0, available=True),
            Doctor(name="Dr. Meera Iyer", specialization="Dermatology", phone="9876543214", email="meera@hospital.com", experience=6, fee=500.0, available=False),
            Doctor(name="Dr. Arjun Nair", specialization="Oncology", phone="9876543215", email="arjun@hospital.com", experience=18, fee=1200.0, available=True),
        ]
        db.session.add_all(doctors)
        db.session.commit()

    # 3. Patients
    if Patient.query.count() == 0:
        patients = [
            Patient(name="Rahul Gupta", age=34, gender="Male", blood_group="O+", phone="9123456780", email="rahul@email.com", address="Hyderabad, TS"),
            Patient(name="Sunita Devi", age=52, gender="Female", blood_group="A+", phone="9123456781", email="sunita@email.com", address="Secunderabad, TS"),
            Patient(name="Amit Singh", age=28, gender="Male", blood_group="B+", phone="9123456782", email="amit@email.com", address="Warangal, TS"),
            Patient(name="Lakshmi Rao", age=45, gender="Female", blood_group="AB-", phone="9123456783", email="lakshmi@email.com", address="Vijayawada, AP"),
            Patient(name="Venkat Reddy", age=61, gender="Male", blood_group="A-", phone="9123456784", email="venkat@email.com", address="Guntur, AP"),
        ]
        db.session.add_all(patients)
        db.session.commit()

    # 4. Wards
    if Ward.query.count() == 0:
        wards = [
            Ward(name="General Ward A", ward_type="General", capacity=30, occupied=18, floor=1),
            Ward(name="ICU", ward_type="Intensive", capacity=10, occupied=7, floor=2),
            Ward(name="Pediatrics", ward_type="Pediatric", capacity=20, occupied=9, floor=3),
            Ward(name="Maternity", ward_type="Maternity", capacity=15, occupied=6, floor=2),
            Ward(name="Cardiology", ward_type="Specialty", capacity=12, occupied=4, floor=4),
        ]
        db.session.add_all(wards)
        db.session.commit()

    # 5. Staff
    if Staff.query.count() == 0:
        staff = [
            Staff(name="Kavitha Nair", role="Head Nurse", department="ICU", phone="9000000001", email="kavitha@hospital.com", shift="Morning"),
            Staff(name="Prakash Babu", role="Lab Technician", department="Pathology", phone="9000000002", email="prakash@hospital.com", shift="Morning"),
            Staff(name="Rekha Varma", role="Pharmacist", department="Pharmacy", phone="9000000003", email="rekha@hospital.com", shift="Evening"),
            Staff(name="Sunil Mehta", role="Receptionist", department="Front Desk", phone="9000000004", email="sunil@hospital.com", shift="Morning"),
            Staff(name="Divya Krishna", role="Nurse", department="Pediatrics", phone="9000000005", email="divya@hospital.com", shift="Night"),
        ]
        db.session.add_all(staff)
        db.session.commit()

    # 6. Appointments
    if Appointment.query.count() == 0:
        p_list = Patient.query.order_by(Patient.id).all()
        d_list = Doctor.query.order_by(Doctor.id).all()
        if p_list and d_list:
            appts = [
                Appointment(patient_id=p_list[0].id, doctor_id=d_list[0].id, date=date(2025, 7, 5), time="10:00", status="Scheduled"),
                Appointment(patient_id=p_list[1 % len(p_list)].id, doctor_id=d_list[1 % len(d_list)].id, date=date(2025, 7, 6), time="11:30", status="Scheduled"),
                Appointment(patient_id=p_list[2 % len(p_list)].id, doctor_id=d_list[2 % len(d_list)].id, date=date(2025, 6, 20), time="09:00", status="Completed"),
                Appointment(patient_id=p_list[3 % len(p_list)].id, doctor_id=d_list[3 % len(d_list)].id, date=date(2025, 6, 22), time="14:00", status="Completed"),
                Appointment(patient_id=p_list[4 % len(p_list)].id, doctor_id=d_list[0].id, date=date(2025, 7, 8), time="16:00", status="Scheduled"),
            ]
            db.session.add_all(appts)
            db.session.commit()

    # 7. Medical Records
    if MedicalRecord.query.count() == 0:
        p_list = Patient.query.order_by(Patient.id).all()
        d_list = Doctor.query.order_by(Doctor.id).all()
        if len(p_list) >= 4 and len(d_list) >= 4:
            records = [
                MedicalRecord(patient_id=p_list[2].id, doctor_id=d_list[2].id, diagnosis="Knee ligament sprain", prescription="Ibuprofen 400mg, Physiotherapy", notes="Follow up in 2 weeks", date=date(2025, 6, 20)),
                MedicalRecord(patient_id=p_list[3].id, doctor_id=d_list[3].id, diagnosis="Seasonal flu", prescription="Paracetamol 500mg, Rest", notes="Recover fully before next visit", date=date(2025, 6, 22)),
            ]
            db.session.add_all(records)
            db.session.commit()
