from datetime import datetime, date
from werkzeug.security import generate_password_hash, check_password_hash
from database import db


class User(db.Model):
    """User account model for authentication and role-based access."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")  # 'admin' or 'user'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Patient(db.Model):
    """Hospital patient registration and demographic details."""
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    blood_group = db.Column(db.String(5))
    phone = db.Column(db.String(15))
    email = db.Column(db.String(100))
    address = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "blood_group": self.blood_group,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Doctor(db.Model):
    """Medical doctor directory and consultation status."""
    __tablename__ = "doctors"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    specialization = db.Column(db.String(100), nullable=False, index=True)
    phone = db.Column(db.String(15))
    email = db.Column(db.String(100))
    experience = db.Column(db.Integer)
    fee = db.Column(db.Float)
    available = db.Column(db.Boolean, default=True, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "specialization": self.specialization,
            "phone": self.phone,
            "email": self.email,
            "experience": self.experience,
            "fee": self.fee,
            "available": self.available,
        }


class Appointment(db.Model):
    """Patient appointments with doctors."""
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    time = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), default="Scheduled", index=True)  # Scheduled / Completed / Cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship("Patient", backref=db.backref("appointments", lazy=True))
    doctor = db.relationship("Doctor", backref=db.backref("appointments", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "doctor_id": self.doctor_id,
            "patient_name": self.patient.name if self.patient else "",
            "doctor_name": self.doctor.name if self.doctor else "",
            "doctor_specialization": self.doctor.specialization if self.doctor else "",
            "date": self.date.isoformat() if self.date else None,
            "time": self.time,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class MedicalRecord(db.Model):
    """Clinical diagnosis, prescription, and visit history."""
    __tablename__ = "medical_records"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False, index=True)
    diagnosis = db.Column(db.Text, nullable=False)
    prescription = db.Column(db.Text)
    notes = db.Column(db.Text)
    date = db.Column(db.Date, default=date.today, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship("Patient", backref=db.backref("records", lazy=True))
    doctor = db.relationship("Doctor", backref=db.backref("records", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "doctor_id": self.doctor_id,
            "patient_name": self.patient.name if self.patient else "",
            "doctor_name": self.doctor.name if self.doctor else "",
            "diagnosis": self.diagnosis,
            "prescription": self.prescription,
            "notes": self.notes,
            "date": self.date.isoformat() if self.date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Ward(db.Model):
    """Hospital wards and bed allocation capacity."""
    __tablename__ = "wards"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    ward_type = db.Column(db.String(50))
    capacity = db.Column(db.Integer, nullable=False)
    occupied = db.Column(db.Integer, default=0)
    floor = db.Column(db.Integer)

    def to_dict(self):
        cap = self.capacity or 0
        occ = self.occupied or 0
        return {
            "id": self.id,
            "name": self.name,
            "ward_type": self.ward_type,
            "capacity": cap,
            "occupied": occ,
            "available": max(0, cap - occ),
            "floor": self.floor,
        }


class Staff(db.Model):
    """Non-clinical hospital staff members."""
    __tablename__ = "staff"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    department = db.Column(db.String(100))
    phone = db.Column(db.String(15))
    email = db.Column(db.String(100))
    shift = db.Column(db.String(20))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "department": self.department,
            "phone": self.phone,
            "email": self.email,
            "shift": self.shift,
        }
