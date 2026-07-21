from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
import os

app = Flask(__name__)
CORS(app)

# Database configuration
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(BASE_DIR, 'hospital.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ─── Models ───────────────────────────────────────────────────────────────────

class Patient(db.Model):
    __tablename__ = 'patients'
    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(100), nullable=False)
    age           = db.Column(db.Integer, nullable=False)
    gender        = db.Column(db.String(10), nullable=False)
    blood_group   = db.Column(db.String(5))
    phone         = db.Column(db.String(15))
    email         = db.Column(db.String(100))
    address       = db.Column(db.String(200))
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'age': self.age,
            'gender': self.gender, 'blood_group': self.blood_group,
            'phone': self.phone, 'email': self.email, 'address': self.address,
            'created_at': self.created_at.isoformat()
        }


class Doctor(db.Model):
    __tablename__ = 'doctors'
    id             = db.Column(db.Integer, primary_key=True)
    name           = db.Column(db.String(100), nullable=False)
    specialization = db.Column(db.String(100), nullable=False)
    phone          = db.Column(db.String(15))
    email          = db.Column(db.String(100))
    experience     = db.Column(db.Integer)
    fee            = db.Column(db.Float)
    available      = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name,
            'specialization': self.specialization, 'phone': self.phone,
            'email': self.email, 'experience': self.experience,
            'fee': self.fee, 'available': self.available
        }


class Appointment(db.Model):
    __tablename__ = 'appointments'
    id           = db.Column(db.Integer, primary_key=True)
    patient_id   = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    doctor_id    = db.Column(db.Integer, db.ForeignKey('doctors.id'),  nullable=False)
    date         = db.Column(db.Date, nullable=False)
    time         = db.Column(db.String(10), nullable=False)
    status       = db.Column(db.String(20), default='Scheduled')   # Scheduled / Completed / Cancelled
    notes        = db.Column(db.Text)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship('Patient', backref='appointments')
    doctor  = db.relationship('Doctor',  backref='appointments')

    def to_dict(self):
        return {
            'id': self.id, 'patient_id': self.patient_id,
            'doctor_id': self.doctor_id,
            'patient_name': self.patient.name if self.patient else '',
            'doctor_name':  self.doctor.name  if self.doctor  else '',
            'doctor_specialization': self.doctor.specialization if self.doctor else '',
            'date': self.date.isoformat(), 'time': self.time,
            'status': self.status, 'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }


class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'
    id          = db.Column(db.Integer, primary_key=True)
    patient_id  = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    doctor_id   = db.Column(db.Integer, db.ForeignKey('doctors.id'),  nullable=False)
    diagnosis   = db.Column(db.Text, nullable=False)
    prescription= db.Column(db.Text)
    notes       = db.Column(db.Text)
    date        = db.Column(db.Date, default=date.today)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship('Patient', backref='records')
    doctor  = db.relationship('Doctor',  backref='records')

    def to_dict(self):
        return {
            'id': self.id, 'patient_id': self.patient_id,
            'doctor_id': self.doctor_id,
            'patient_name': self.patient.name if self.patient else '',
            'doctor_name':  self.doctor.name  if self.doctor  else '',
            'diagnosis': self.diagnosis, 'prescription': self.prescription,
            'notes': self.notes, 'date': self.date.isoformat(),
            'created_at': self.created_at.isoformat()
        }


class Ward(db.Model):
    __tablename__ = 'wards'
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(50),  nullable=False)
    ward_type  = db.Column(db.String(50))
    capacity   = db.Column(db.Integer, nullable=False)
    occupied   = db.Column(db.Integer, default=0)
    floor      = db.Column(db.Integer)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'ward_type': self.ward_type,
            'capacity': self.capacity, 'occupied': self.occupied,
            'available': self.capacity - self.occupied, 'floor': self.floor
        }


class Staff(db.Model):
    __tablename__ = 'staff'
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    role       = db.Column(db.String(50),  nullable=False)
    department = db.Column(db.String(100))
    phone      = db.Column(db.String(15))
    email      = db.Column(db.String(100))
    shift      = db.Column(db.String(20))

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'role': self.role,
            'department': self.department, 'phone': self.phone,
            'email': self.email, 'shift': self.shift
        }


# ─── Seed Data ────────────────────────────────────────────────────────────────

def seed_database():
    if Doctor.query.count() == 0:
        doctors = [
            Doctor(name='Dr. Priya Sharma',    specialization='Cardiology',    phone='9876543210', email='priya@hospital.com',   experience=12, fee=800,  available=True),
            Doctor(name='Dr. Ravi Kumar',       specialization='Neurology',     phone='9876543211', email='ravi@hospital.com',    experience=15, fee=1000, available=True),
            Doctor(name='Dr. Ananya Reddy',     specialization='Orthopedics',   phone='9876543212', email='ananya@hospital.com',  experience=8,  fee=700,  available=True),
            Doctor(name='Dr. Suresh Patel',     specialization='Pediatrics',    phone='9876543213', email='suresh@hospital.com',  experience=10, fee=600,  available=True),
            Doctor(name='Dr. Meera Iyer',       specialization='Dermatology',   phone='9876543214', email='meera@hospital.com',   experience=6,  fee=500,  available=False),
            Doctor(name='Dr. Arjun Nair',       specialization='Oncology',      phone='9876543215', email='arjun@hospital.com',   experience=18, fee=1200, available=True),
        ]
        db.session.add_all(doctors)

    if Patient.query.count() == 0:
        patients = [
            Patient(name='Rahul Gupta',   age=34, gender='Male',   blood_group='O+',  phone='9123456780', email='rahul@email.com',  address='Hyderabad, TS'),
            Patient(name='Sunita Devi',   age=52, gender='Female', blood_group='A+',  phone='9123456781', email='sunita@email.com', address='Secunderabad, TS'),
            Patient(name='Amit Singh',    age=28, gender='Male',   blood_group='B+',  phone='9123456782', email='amit@email.com',   address='Warangal, TS'),
            Patient(name='Lakshmi Rao',   age=45, gender='Female', blood_group='AB-', phone='9123456783', email='lakshmi@email.com',address='Vijayawada, AP'),
            Patient(name='Venkat Reddy',  age=61, gender='Male',   blood_group='A-',  phone='9123456784', email='venkat@email.com', address='Guntur, AP'),
        ]
        db.session.add_all(patients)

    if Ward.query.count() == 0:
        wards = [
            Ward(name='General Ward A', ward_type='General',   capacity=30, occupied=18, floor=1),
            Ward(name='ICU',            ward_type='Intensive',  capacity=10, occupied=7,  floor=2),
            Ward(name='Pediatrics',     ward_type='Pediatric', capacity=20, occupied=9,  floor=3),
            Ward(name='Maternity',      ward_type='Maternity', capacity=15, occupied=6,  floor=2),
            Ward(name='Cardiology',     ward_type='Specialty', capacity=12, occupied=4,  floor=4),
        ]
        db.session.add_all(wards)

    if Staff.query.count() == 0:
        staff = [
            Staff(name='Kavitha Nair',   role='Head Nurse',     department='ICU',        phone='9000000001', email='kavitha@hospital.com',  shift='Morning'),
            Staff(name='Prakash Babu',   role='Lab Technician', department='Pathology',  phone='9000000002', email='prakash@hospital.com',  shift='Morning'),
            Staff(name='Rekha Varma',    role='Pharmacist',     department='Pharmacy',   phone='9000000003', email='rekha@hospital.com',    shift='Evening'),
            Staff(name='Sunil Mehta',    role='Receptionist',   department='Front Desk', phone='9000000004', email='sunil@hospital.com',    shift='Morning'),
            Staff(name='Divya Krishna',  role='Nurse',          department='Pediatrics', phone='9000000005', email='divya@hospital.com',    shift='Night'),
        ]
        db.session.add_all(staff)

    if Appointment.query.count() == 0:
        appts = [
            Appointment(patient_id=1, doctor_id=1, date=date(2025, 7, 5),  time='10:00', status='Scheduled'),
            Appointment(patient_id=2, doctor_id=2, date=date(2025, 7, 6),  time='11:30', status='Scheduled'),
            Appointment(patient_id=3, doctor_id=3, date=date(2025, 6, 20), time='09:00', status='Completed'),
            Appointment(patient_id=4, doctor_id=4, date=date(2025, 6, 22), time='14:00', status='Completed'),
            Appointment(patient_id=5, doctor_id=1, date=date(2025, 7, 8),  time='16:00', status='Scheduled'),
        ]
        db.session.add_all(appts)

    if MedicalRecord.query.count() == 0:
        records = [
            MedicalRecord(patient_id=3, doctor_id=3, diagnosis='Knee ligament sprain', prescription='Ibuprofen 400mg, Physiotherapy', notes='Follow up in 2 weeks', date=date(2025, 6, 20)),
            MedicalRecord(patient_id=4, doctor_id=4, diagnosis='Seasonal flu',          prescription='Paracetamol 500mg, Rest',        notes='Recover fully before next visit', date=date(2025, 6, 22)),
        ]
        db.session.add_all(records)

    db.session.commit()


# ─── Dashboard Stats ──────────────────────────────────────────────────────────

@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    total_patients     = Patient.query.count()
    total_doctors      = Doctor.query.count()
    today_appts        = Appointment.query.filter_by(date=date.today()).count()
    scheduled_appts    = Appointment.query.filter_by(status='Scheduled').count()
    available_doctors  = Doctor.query.filter_by(available=True).count()
    total_wards        = Ward.query.count()
    occupied_beds      = db.session.query(db.func.sum(Ward.occupied)).scalar()  or 0
    total_beds         = db.session.query(db.func.sum(Ward.capacity)).scalar()  or 0
    total_staff        = Staff.query.count()

    recent_appointments = Appointment.query.order_by(Appointment.created_at.desc()).limit(5).all()

    return jsonify({
        'stats': {
            'total_patients':    total_patients,
            'total_doctors':     total_doctors,
            'today_appointments':today_appts,
            'scheduled_appointments': scheduled_appts,
            'available_doctors': available_doctors,
            'total_wards':       total_wards,
            'occupied_beds':     occupied_beds,
            'total_beds':        total_beds,
            'total_staff':       total_staff,
        },
        'recent_appointments': [a.to_dict() for a in recent_appointments]
    })


# ─── Patients CRUD ────────────────────────────────────────────────────────────

@app.route('/api/patients', methods=['GET'])
def get_patients():
    q = request.args.get('q', '')
    query = Patient.query
    if q:
        query = query.filter(Patient.name.ilike(f'%{q}%'))
    return jsonify([p.to_dict() for p in query.order_by(Patient.id.desc()).all()])

@app.route('/api/patients/<int:pid>', methods=['GET'])
def get_patient(pid):
    p = Patient.query.get_or_404(pid)
    return jsonify(p.to_dict())

@app.route('/api/patients', methods=['POST'])
def create_patient():
    d = request.json
    p = Patient(**{k: d[k] for k in ('name','age','gender') if k in d},
                blood_group=d.get('blood_group'), phone=d.get('phone'),
                email=d.get('email'), address=d.get('address'))
    db.session.add(p); db.session.commit()
    return jsonify(p.to_dict()), 201

@app.route('/api/patients/<int:pid>', methods=['PUT'])
def update_patient(pid):
    p = Patient.query.get_or_404(pid)
    d = request.json
    for k in ('name','age','gender','blood_group','phone','email','address'):
        if k in d: setattr(p, k, d[k])
    db.session.commit()
    return jsonify(p.to_dict())

@app.route('/api/patients/<int:pid>', methods=['DELETE'])
def delete_patient(pid):
    p = Patient.query.get_or_404(pid)
    db.session.delete(p); db.session.commit()
    return jsonify({'message': 'Patient deleted'})


# ─── Doctors CRUD ─────────────────────────────────────────────────────────────

@app.route('/api/doctors', methods=['GET'])
def get_doctors():
    q = request.args.get('q', '')
    query = Doctor.query
    if q:
        query = query.filter(
            (Doctor.name.ilike(f'%{q}%')) |
            (Doctor.specialization.ilike(f'%{q}%'))
        )
    return jsonify([d.to_dict() for d in query.all()])

@app.route('/api/doctors/<int:did>', methods=['GET'])
def get_doctor(did):
    d = Doctor.query.get_or_404(did)
    return jsonify(d.to_dict())

@app.route('/api/doctors', methods=['POST'])
def create_doctor():
    d = request.json
    doc = Doctor(name=d['name'], specialization=d['specialization'],
                 phone=d.get('phone'), email=d.get('email'),
                 experience=d.get('experience'), fee=d.get('fee'),
                 available=d.get('available', True))
    db.session.add(doc); db.session.commit()
    return jsonify(doc.to_dict()), 201

@app.route('/api/doctors/<int:did>', methods=['PUT'])
def update_doctor(did):
    doc = Doctor.query.get_or_404(did)
    d = request.json
    for k in ('name','specialization','phone','email','experience','fee','available'):
        if k in d: setattr(doc, k, d[k])
    db.session.commit()
    return jsonify(doc.to_dict())

@app.route('/api/doctors/<int:did>', methods=['DELETE'])
def delete_doctor(did):
    doc = Doctor.query.get_or_404(did)
    db.session.delete(doc); db.session.commit()
    return jsonify({'message': 'Doctor deleted'})


# ─── Appointments CRUD ───────────────────────────────────────────────────────

@app.route('/api/appointments', methods=['GET'])
def get_appointments():
    status = request.args.get('status')
    query  = Appointment.query
    if status: query = query.filter_by(status=status)
    return jsonify([a.to_dict() for a in query.order_by(Appointment.date.desc()).all()])

@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    d = request.json
    appt = Appointment(
        patient_id=d['patient_id'], doctor_id=d['doctor_id'],
        date=datetime.strptime(d['date'], '%Y-%m-%d').date(),
        time=d['time'], status=d.get('status','Scheduled'),
        notes=d.get('notes')
    )
    db.session.add(appt); db.session.commit()
    return jsonify(appt.to_dict()), 201

@app.route('/api/appointments/<int:aid>', methods=['PUT'])
def update_appointment(aid):
    appt = Appointment.query.get_or_404(aid)
    d = request.json
    if 'status' in d: appt.status = d['status']
    if 'notes'  in d: appt.notes  = d['notes']
    if 'date'   in d: appt.date   = datetime.strptime(d['date'], '%Y-%m-%d').date()
    if 'time'   in d: appt.time   = d['time']
    db.session.commit()
    return jsonify(appt.to_dict())

@app.route('/api/appointments/<int:aid>', methods=['DELETE'])
def delete_appointment(aid):
    appt = Appointment.query.get_or_404(aid)
    db.session.delete(appt); db.session.commit()
    return jsonify({'message': 'Appointment deleted'})


# ─── Medical Records CRUD ─────────────────────────────────────────────────────

@app.route('/api/records', methods=['GET'])
def get_records():
    pid = request.args.get('patient_id')
    query = MedicalRecord.query
    if pid: query = query.filter_by(patient_id=int(pid))
    return jsonify([r.to_dict() for r in query.order_by(MedicalRecord.date.desc()).all()])

@app.route('/api/records', methods=['POST'])
def create_record():
    d = request.json
    rec = MedicalRecord(
        patient_id=d['patient_id'], doctor_id=d['doctor_id'],
        diagnosis=d['diagnosis'], prescription=d.get('prescription'),
        notes=d.get('notes'),
        date=datetime.strptime(d['date'], '%Y-%m-%d').date() if d.get('date') else date.today()
    )
    db.session.add(rec); db.session.commit()
    return jsonify(rec.to_dict()), 201

@app.route('/api/records/<int:rid>', methods=['DELETE'])
def delete_record(rid):
    rec = MedicalRecord.query.get_or_404(rid)
    db.session.delete(rec); db.session.commit()
    return jsonify({'message': 'Record deleted'})


# ─── Wards CRUD ───────────────────────────────────────────────────────────────

@app.route('/api/wards', methods=['GET'])
def get_wards():
    return jsonify([w.to_dict() for w in Ward.query.all()])

@app.route('/api/wards', methods=['POST'])
def create_ward():
    d = request.json
    w = Ward(name=d['name'], ward_type=d.get('ward_type'),
             capacity=d['capacity'], occupied=d.get('occupied',0),
             floor=d.get('floor'))
    db.session.add(w); db.session.commit()
    return jsonify(w.to_dict()), 201

@app.route('/api/wards/<int:wid>', methods=['PUT'])
def update_ward(wid):
    w = Ward.query.get_or_404(wid)
    d = request.json
    for k in ('name','ward_type','capacity','occupied','floor'):
        if k in d: setattr(w, k, d[k])
    db.session.commit()
    return jsonify(w.to_dict())

@app.route('/api/wards/<int:wid>', methods=['DELETE'])
def delete_ward(wid):
    w = Ward.query.get_or_404(wid)
    db.session.delete(w); db.session.commit()
    return jsonify({'message': 'Ward deleted'})


# ─── Staff CRUD ───────────────────────────────────────────────────────────────

@app.route('/api/staff', methods=['GET'])
def get_staff():
    return jsonify([s.to_dict() for s in Staff.query.all()])

@app.route('/api/staff', methods=['POST'])
def create_staff():
    d = request.json
    s = Staff(name=d['name'], role=d['role'], department=d.get('department'),
              phone=d.get('phone'), email=d.get('email'), shift=d.get('shift'))
    db.session.add(s); db.session.commit()
    return jsonify(s.to_dict()), 201

@app.route('/api/staff/<int:sid>', methods=['PUT'])
def update_staff(sid):
    s = Staff.query.get_or_404(sid)
    d = request.json
    for k in ('name','role','department','phone','email','shift'):
        if k in d: setattr(s, k, d[k])
    db.session.commit()
    return jsonify(s.to_dict())

@app.route('/api/staff/<int:sid>', methods=['DELETE'])
def delete_staff(sid):
    s = Staff.query.get_or_404(sid)
    db.session.delete(s); db.session.commit()
    return jsonify({'message': 'Staff deleted'})


# ─── Boot ─────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_database()
    app.run(debug=True, port=5000)
