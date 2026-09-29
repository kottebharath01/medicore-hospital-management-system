from datetime import datetime, date
from werkzeug.security import generate_password_hash, check_password_hash
from database import db


def format_code(prefix: str, id_val: int) -> str:
    """Format human-readable business ID such as PAT-0001, DOC-0001, BED-0008."""
    return f"{prefix}-{str(id_val or 0).zfill(4)}"


class User(db.Model):
    """User account model for authentication and role-based access control."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="patient")  # admin, doctor, nurse, receptionist, patient
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship("Patient", foreign_keys=[patient_id], uselist=False)
    doctor = db.relationship("Doctor", foreign_keys=[doctor_id], uselist=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        pat_code = self.patient.code if self.patient else (format_code("PAT", self.patient_id) if self.patient_id else None)
        doc_code = self.doctor.code if self.doctor else (format_code("DOC", self.doctor_id) if self.doctor_id else None)
        return {
            "id": self.id,
            "username": self.username,
            "name": self.name or self.username,
            "email": self.email,
            "role": self.role,
            "code": pat_code or doc_code,
            "patient_id": self.patient_id,
            "patient_code": pat_code,
            "doctor_id": self.doctor_id,
            "doctor_code": doc_code,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Department(db.Model):
    """Hospital clinical department (e.g., Cardiology, Neurology, Pediatrics)."""
    __tablename__ = "departments"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    doctors = db.relationship("Doctor", backref="department_rel", lazy="dynamic")
    staff = db.relationship("Staff", backref="department_rel", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code or format_code("DEP", self.id),
            "name": self.name,
            "description": self.description or "",
            "doctors_count": self.doctors.count() if hasattr(self, "doctors") else 0,
            "staff_count": self.staff.count() if hasattr(self, "staff") else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Patient(db.Model):
    """Hospital patient registration and demographic details."""
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, index=True)
    user_id = db.Column(db.Integer, nullable=True)
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
            "code": self.code or format_code("PAT", self.id),
            "user_id": self.user_id,
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
    code = db.Column(db.String(20), unique=True, index=True)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True, index=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    specialization = db.Column(db.String(100), nullable=False, index=True)
    phone = db.Column(db.String(15))
    email = db.Column(db.String(100))
    experience = db.Column(db.Integer)
    fee = db.Column(db.Float)
    available = db.Column(db.Boolean, default=True, index=True)

    def to_dict(self):
        dept_name = self.department_rel.name if self.department_rel else self.specialization
        return {
            "id": self.id,
            "code": self.code or format_code("DOC", self.id),
            "name": self.name,
            "specialization": self.specialization,
            "department_id": self.department_id,
            "department_name": dept_name,
            "phone": self.phone,
            "email": self.email,
            "experience": self.experience,
            "fee": self.fee,
            "available": self.available,
        }


class Ward(db.Model):
    """Hospital wards and room capacity."""
    __tablename__ = "wards"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, index=True)
    name = db.Column(db.String(50), nullable=False)
    ward_type = db.Column(db.String(50))
    capacity = db.Column(db.Integer, nullable=False, default=10)
    occupied = db.Column(db.Integer, default=0)
    floor = db.Column(db.Integer)

    beds = db.relationship("Bed", backref="ward", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        bed_count = self.beds.count() if hasattr(self, "beds") else 0
        if bed_count > 0:
            total = bed_count
            occ = self.beds.filter_by(status="Occupied").count()
            avail = self.beds.filter_by(status="Available").count()
        else:
            total = self.capacity or 0
            occ = self.occupied or 0
            avail = max(0, total - occ)

        return {
            "id": self.id,
            "code": self.code or format_code("WRD", self.id),
            "name": self.name,
            "ward_type": self.ward_type,
            "capacity": total,
            "occupied": occ,
            "available": avail,
            "floor": self.floor,
        }


class Bed(db.Model):
    """Individual hospital bed allocation and occupancy status."""
    __tablename__ = "beds"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, index=True)
    bed_number = db.Column(db.String(20), nullable=False, index=True)
    ward_id = db.Column(db.Integer, db.ForeignKey("wards.id", ondelete="CASCADE"), nullable=False, index=True)
    status = db.Column(db.String(20), default="Available", index=True)  # Available, Occupied, Reserved, Maintenance
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True, index=True)
    notes = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = db.relationship("Patient", foreign_keys=[patient_id])
    doctor = db.relationship("Doctor", foreign_keys=[assigned_doctor_id])

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code or format_code("BED", self.id),
            "bed_number": self.bed_number,
            "ward_id": self.ward_id,
            "ward_name": self.ward.name if self.ward else "",
            "status": self.status,
            "patient_id": self.patient_id,
            "patient_name": self.patient.name if self.patient else None,
            "patient_code": self.patient.code if self.patient else (format_code("PAT", self.patient_id) if self.patient_id else None),
            "assigned_doctor_id": self.assigned_doctor_id,
            "doctor_name": self.doctor.name if self.doctor else None,
            "notes": self.notes,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Staff(db.Model):
    """Clinical and non-clinical hospital staff members."""
    __tablename__ = "staff"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, index=True)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True, index=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # Head Nurse, Nurse, Lab Technician, Pharmacist, Receptionist
    department = db.Column(db.String(100))
    phone = db.Column(db.String(15))
    email = db.Column(db.String(100))
    shift = db.Column(db.String(20))

    def to_dict(self):
        dept_name = self.department_rel.name if self.department_rel else self.department
        prefix = "NUR" if "nurse" in self.role.lower() else "STF"
        return {
            "id": self.id,
            "code": self.code or format_code(prefix, self.id),
            "name": self.name,
            "role": self.role,
            "department_id": self.department_id,
            "department": dept_name,
            "phone": self.phone,
            "email": self.email,
            "shift": self.shift,
        }


class Appointment(db.Model):
    """Patient appointments scheduled with doctors."""
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False, index=True)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    time = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), default="Scheduled", index=True)  # Scheduled, Confirmed, Completed, Cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship("Patient", backref=db.backref("appointments", lazy=True))
    doctor = db.relationship("Doctor", backref=db.backref("appointments", lazy=True))
    department = db.relationship("Department", foreign_keys=[department_id])

    def to_dict(self):
        dept_name = self.department.name if self.department else (self.doctor.specialization if self.doctor else "")
        return {
            "id": self.id,
            "code": self.code or format_code("APT", self.id),
            "patient_id": self.patient_id,
            "patient_name": self.patient.name if self.patient else "",
            "patient_code": self.patient.code if self.patient else format_code("PAT", self.patient_id),
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.name if self.doctor else "",
            "doctor_specialization": self.doctor.specialization if self.doctor else "",
            "department_id": self.department_id,
            "department_name": dept_name,
            "date": self.date.isoformat() if self.date else None,
            "time": self.time,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class MedicalRecord(db.Model):
    """Clinical diagnosis, prescription, medicines, treatment, and visit history."""
    __tablename__ = "medical_records"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False, index=True)
    diagnosis = db.Column(db.Text, nullable=False)
    prescription = db.Column(db.Text)
    treatment = db.Column(db.Text)
    medicines = db.Column(db.Text)
    notes = db.Column(db.Text)
    date = db.Column(db.Date, default=date.today, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship("Patient", backref=db.backref("records", lazy=True))
    doctor = db.relationship("Doctor", backref=db.backref("records", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code or format_code("MED", self.id),
            "patient_id": self.patient_id,
            "patient_name": self.patient.name if self.patient else "",
            "patient_code": self.patient.code if self.patient else format_code("PAT", self.patient_id),
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.name if self.doctor else "",
            "doctor_specialization": self.doctor.specialization if self.doctor else "",
            "diagnosis": self.diagnosis,
            "prescription": self.prescription,
            "treatment": self.treatment,
            "medicines": self.medicines,
            "notes": self.notes,
            "date": self.date.isoformat() if self.date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class VitalSign(db.Model):
    """Patient vital signs recorded by nursing staff."""
    __tablename__ = "vital_signs"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    nurse_name = db.Column(db.String(100), nullable=False)
    blood_pressure = db.Column(db.String(20))
    heart_rate = db.Column(db.Integer)
    temperature = db.Column(db.Float)
    respiratory_rate = db.Column(db.Integer)
    oxygen_saturation = db.Column(db.Integer)
    notes = db.Column(db.Text)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship("Patient", backref=db.backref("vital_signs", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code or format_code("VIT", self.id),
            "patient_id": self.patient_id,
            "patient_name": self.patient.name if self.patient else "",
            "patient_code": self.patient.code if self.patient else format_code("PAT", self.patient_id),
            "nurse_name": self.nurse_name,
            "blood_pressure": self.blood_pressure,
            "heart_rate": self.heart_rate,
            "temperature": self.temperature,
            "respiratory_rate": self.respiratory_rate,
            "oxygen_saturation": self.oxygen_saturation,
            "notes": self.notes,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None,
        }
