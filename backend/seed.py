from datetime import date, datetime
from database import db
from models import User, Department, Doctor, Patient, Ward, Bed, Staff, Appointment, MedicalRecord, VitalSign, format_code


def run_migrations():
    """Apply non-destructive schema additions to ensure all columns exist in PostgreSQL."""
    statements = [
        "ALTER TABLE doctors ADD COLUMN IF NOT EXISTS code VARCHAR(20);",
        "ALTER TABLE doctors ADD COLUMN IF NOT EXISTS department_id INTEGER;",
        "ALTER TABLE staff ADD COLUMN IF NOT EXISTS code VARCHAR(20);",
        "ALTER TABLE staff ADD COLUMN IF NOT EXISTS department_id INTEGER;",
        "ALTER TABLE patients ADD COLUMN IF NOT EXISTS code VARCHAR(20);",
        "ALTER TABLE patients ADD COLUMN IF NOT EXISTS user_id INTEGER;",
        "ALTER TABLE wards ADD COLUMN IF NOT EXISTS code VARCHAR(20);",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS code VARCHAR(20);",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS department_id INTEGER;",
        "ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS code VARCHAR(20);",
        "ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS treatment TEXT;",
        "ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS medicines TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_id INTEGER;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS patient_id INTEGER;",
    ]
    for stmt in statements:
        try:
            db.session.execute(db.text(stmt))
            db.session.commit()
        except Exception:
            db.session.rollback()


def seed_database():
    """Idempotently seed database with baseline departments, doctors, wards, beds, staff, and multi-role accounts."""
    run_migrations()

    # 1. Departments
    dept_map = {}
    default_departments = [
        ("Cardiology", "Heart and cardiovascular care"),
        ("Neurology", "Brain, spine, and neurological disorders"),
        ("Orthopedics", "Bone, joint, and musculoskeletal system"),
        ("Pediatrics", "Infant, child, and adolescent healthcare"),
        ("Dermatology", "Skin, hair, and nail treatments"),
        ("Oncology", "Cancer diagnosis and comprehensive care"),
        ("Emergency & ICU", "Immediate critical and trauma life support"),
    ]
    for idx, (d_name, d_desc) in enumerate(default_departments, 1):
        dept = Department.query.filter_by(name=d_name).first()
        if not dept:
            dept = Department(code=format_code("DEP", idx), name=d_name, description=d_desc)
            db.session.add(dept)
            db.session.flush()
        dept_map[d_name] = dept.id
    db.session.commit()

    # 2. Doctors
    default_doctors = [
        ("Dr. Priya Sharma", "Cardiology", "9876543210", "priya@hospital.com", 12, 800.0, True),
        ("Dr. Ravi Kumar", "Neurology", "9876543211", "ravi@hospital.com", 15, 1000.0, True),
        ("Dr. Ananya Reddy", "Orthopedics", "9876543212", "ananya@hospital.com", 8, 700.0, True),
        ("Dr. Suresh Patel", "Pediatrics", "9876543213", "suresh@hospital.com", 10, 600.0, True),
        ("Dr. Meera Iyer", "Dermatology", "9876543214", "meera@hospital.com", 6, 500.0, False),
        ("Dr. Arjun Nair", "Oncology", "9876543215", "arjun@hospital.com", 18, 1200.0, True),
    ]
    for idx, (name, spec, phone, email, exp, fee, avail) in enumerate(default_doctors, 1):
        doc = Doctor.query.filter_by(email=email).first()
        dept_id = dept_map.get(spec)
        if not doc:
            doc = Doctor(
                code=format_code("DOC", idx),
                department_id=dept_id,
                name=name,
                specialization=spec,
                phone=phone,
                email=email,
                experience=exp,
                fee=fee,
                available=avail,
            )
            db.session.add(doc)
        else:
            if not doc.code:
                doc.code = format_code("DOC", doc.id)
            if not doc.department_id:
                doc.department_id = dept_id
    db.session.commit()

    # 3. Patients
    default_patients = [
        ("Rahul Gupta", 34, "Male", "O+", "9123456780", "rahul@email.com", "Hyderabad, TS"),
        ("Sunita Devi", 52, "Female", "A+", "9123456781", "sunita@email.com", "Secunderabad, TS"),
        ("Amit Singh", 28, "Male", "B+", "9123456782", "amit@email.com", "Warangal, TS"),
        ("Lakshmi Rao", 45, "Female", "AB-", "9123456783", "lakshmi@email.com", "Vijayawada, AP"),
        ("Venkat Reddy", 61, "Male", "A-", "9123456784", "venkat@email.com", "Guntur, AP"),
    ]
    for idx, (name, age, gender, bg, phone, email, addr) in enumerate(default_patients, 1):
        pat = Patient.query.filter_by(email=email).first()
        if not pat:
            pat = Patient(
                code=format_code("PAT", idx),
                name=name,
                age=age,
                gender=gender,
                blood_group=bg,
                phone=phone,
                email=email,
                address=addr,
            )
            db.session.add(pat)
        else:
            if not pat.code:
                pat.code = format_code("PAT", pat.id)
    db.session.commit()

    # 4. Wards
    default_wards = [
        ("General Ward A", "General", 20, 1),
        ("ICU", "Intensive", 10, 2),
        ("Pediatrics Ward", "Pediatric", 15, 3),
        ("Maternity Ward", "Maternity", 12, 2),
        ("Cardiology Ward", "Specialty", 10, 4),
    ]
    ward_objs = []
    for idx, (w_name, w_type, cap, floor) in enumerate(default_wards, 1):
        w = Ward.query.filter_by(name=w_name).first()
        if not w:
            w = Ward(code=format_code("WRD", idx), name=w_name, ward_type=w_type, capacity=cap, floor=floor)
            db.session.add(w)
            db.session.flush()
        else:
            if not w.code:
                w.code = format_code("WRD", w.id)
        ward_objs.append(w)
    db.session.commit()

    # 5. Beds (Seed individual beds for interactive bed occupancy)
    if Bed.query.count() == 0:
        p_list = Patient.query.order_by(Patient.id).all()
        d_list = Doctor.query.order_by(Doctor.id).all()
        bed_counter = 1
        for w in ward_objs:
            # Generate 4-6 beds per ward
            num_beds = 6 if w.name != "ICU" else 4
            for b_num in range(1, num_beds + 1):
                bed_code = format_code("BED", bed_counter)
                bed_name = f"{w.name[:3].upper()}-{str(b_num).zfill(2)}"
                
                # Assign some beds as occupied
                status = "Available"
                p_id = None
                doc_id = None
                notes = None
                if b_num == 1 and p_list and len(p_list) >= (bed_counter % len(p_list) + 1):
                    status = "Occupied"
                    p_id = p_list[bed_counter % len(p_list)].id
                    doc_id = d_list[0].id if d_list else None
                    notes = "Admitted for observation"
                elif b_num == 2 and bed_counter % 2 == 0 and len(p_list) > 1:
                    status = "Occupied"
                    p_id = p_list[1].id
                    doc_id = d_list[1].id if len(d_list) > 1 else None
                    notes = "Post-operative recovery"

                bed = Bed(
                    code=bed_code,
                    bed_number=bed_name,
                    ward_id=w.id,
                    status=status,
                    patient_id=p_id,
                    assigned_doctor_id=doc_id,
                    notes=notes,
                )
                db.session.add(bed)
                bed_counter += 1
        db.session.commit()

    # 6. Staff
    default_staff = [
        ("Kavitha Nair", "Head Nurse", "Emergency & ICU", "9000000001", "kavitha@hospital.com", "Morning"),
        ("Prakash Babu", "Lab Technician", "Cardiology", "9000000002", "prakash@hospital.com", "Morning"),
        ("Rekha Varma", "Pharmacist", "Emergency & ICU", "9000000003", "rekha@hospital.com", "Evening"),
        ("Sunil Mehta", "Receptionist", "Emergency & ICU", "9000000004", "sunil@hospital.com", "Morning"),
        ("Divya Krishna", "Nurse", "Pediatrics", "9000000005", "divya@hospital.com", "Night"),
    ]
    for idx, (name, role, dept_str, phone, email, shift) in enumerate(default_staff, 1):
        stf = Staff.query.filter_by(email=email).first()
        dept_id = dept_map.get(dept_str)
        prefix = "NUR" if "nurse" in role.lower() else "STF"
        if not stf:
            stf = Staff(
                code=format_code(prefix, idx),
                name=name,
                role=role,
                department_id=dept_id,
                department=dept_str,
                phone=phone,
                email=email,
                shift=shift,
            )
            db.session.add(stf)
        else:
            if not stf.code:
                stf.code = format_code(prefix, stf.id)
            if not stf.department_id:
                stf.department_id = dept_id
    db.session.commit()

    # 7. Appointments
    if Appointment.query.count() == 0:
        p_list = Patient.query.order_by(Patient.id).all()
        d_list = Doctor.query.order_by(Doctor.id).all()
        if p_list and d_list:
            appts = [
                Appointment(code=format_code("APT", 1), patient_id=p_list[0].id, doctor_id=d_list[0].id, department_id=d_list[0].department_id, date=date(2025, 7, 5), time="10:00", status="Scheduled", notes="Routine checkup"),
                Appointment(code=format_code("APT", 2), patient_id=p_list[1].id, doctor_id=d_list[1].id, department_id=d_list[1].department_id, date=date(2025, 7, 6), time="11:30", status="Confirmed", notes="Neurology follow up"),
                Appointment(code=format_code("APT", 3), patient_id=p_list[2].id, doctor_id=d_list[2].id, department_id=d_list[2].department_id, date=date(2025, 6, 20), time="09:00", status="Completed", notes="Knee evaluation"),
                Appointment(code=format_code("APT", 4), patient_id=p_list[3].id, doctor_id=d_list[3].id, department_id=d_list[3].department_id, date=date(2025, 6, 22), time="14:00", status="Completed", notes="Fever consult"),
                Appointment(code=format_code("APT", 5), patient_id=p_list[4].id, doctor_id=d_list[0].id, department_id=d_list[0].department_id, date=date(2025, 7, 8), time="16:00", status="Scheduled", notes="Chest tightness"),
            ]
            db.session.add_all(appts)
            db.session.commit()
    else:
        # Ensure code is populated
        for appt in Appointment.query.all():
            if not appt.code:
                appt.code = format_code("APT", appt.id)
        db.session.commit()

    # 8. Medical Records
    if MedicalRecord.query.count() == 0:
        p_list = Patient.query.order_by(Patient.id).all()
        d_list = Doctor.query.order_by(Doctor.id).all()
        if len(p_list) >= 4 and len(d_list) >= 4:
            records = [
                MedicalRecord(
                    code=format_code("MED", 1),
                    patient_id=p_list[2].id,
                    doctor_id=d_list[2].id,
                    diagnosis="Knee ligament sprain (Grade 1)",
                    prescription="Ibuprofen 400mg twice daily after meals for 5 days",
                    treatment="Physiotherapy, rest, ice compression",
                    medicines="Ibuprofen 400mg, Gel ice pack",
                    notes="Follow up in 2 weeks if pain persists",
                    date=date(2025, 6, 20)
                ),
                MedicalRecord(
                    code=format_code("MED", 2),
                    patient_id=p_list[3].id,
                    doctor_id=d_list[3].id,
                    diagnosis="Acute Viral Upper Respiratory Infection",
                    prescription="Paracetamol 500mg as needed, Vitamin C 500mg once daily",
                    treatment="Oral rehydration, adequate sleep, fever monitoring",
                    medicines="Paracetamol 500mg, Vitamin C, Saline nasal spray",
                    notes="Rest at home until fever subsides",
                    date=date(2025, 6, 22)
                ),
            ]
            db.session.add_all(records)
            db.session.commit()
    else:
        for rec in MedicalRecord.query.all():
            if not rec.code:
                rec.code = format_code("MED", rec.id)
        db.session.commit()

    # 9. Vital Signs (Nursing observations)
    if VitalSign.query.count() == 0:
        p_list = Patient.query.order_by(Patient.id).all()
        if p_list:
            vitals = [
                VitalSign(
                    code=format_code("VIT", 1),
                    patient_id=p_list[0].id,
                    nurse_name="Kavitha Nair",
                    blood_pressure="120/80",
                    heart_rate=72,
                    temperature=98.6,
                    respiratory_rate=16,
                    oxygen_saturation=99,
                    notes="Patient resting comfortably, vital signs normal."
                ),
                VitalSign(
                    code=format_code("VIT", 2),
                    patient_id=p_list[1].id,
                    nurse_name="Divya Krishna",
                    blood_pressure="130/85",
                    heart_rate=78,
                    temperature=99.1,
                    respiratory_rate=18,
                    oxygen_saturation=98,
                    notes="Slight low-grade fever noted, doctor notified."
                ),
            ]
            db.session.add_all(vitals)
            db.session.commit()

    # 10. Role-based User Accounts
    p1 = Patient.query.filter_by(name="Rahul Gupta").first()
    d1 = Doctor.query.filter_by(name="Dr. Priya Sharma").first()

    demo_accounts = [
        {
            "username": "admin",
            "name": "System Administrator",
            "email": "admin@hospital.com",
            "role": "admin",
            "password": "admin123",
            "patient_id": None,
            "doctor_id": None,
        },
        {
            "username": "doctor",
            "name": "Dr. Priya Sharma",
            "email": "doctor@hospital.com",
            "role": "doctor",
            "password": "doctor123",
            "patient_id": None,
            "doctor_id": d1.id if d1 else 1,
        },
        {
            "username": "nurse",
            "name": "Kavitha Nair",
            "email": "nurse@hospital.com",
            "role": "nurse",
            "password": "nurse123",
            "patient_id": None,
            "doctor_id": None,
        },
        {
            "username": "receptionist",
            "name": "Sunil Mehta",
            "email": "reception@hospital.com",
            "role": "receptionist",
            "password": "receptionist123",
            "patient_id": None,
            "doctor_id": None,
        },
        {
            "username": "patient",
            "name": "Rahul Gupta",
            "email": "patient@hospital.com",
            "role": "patient",
            "password": "patient123",
            "patient_id": p1.id if p1 else 1,
            "doctor_id": None,
        },
        {
            "username": "user",
            "name": "Rahul Gupta",
            "email": "user@hospital.com",
            "role": "patient",
            "password": "user123",
            "patient_id": p1.id if p1 else 1,
            "doctor_id": None,
        },
    ]

    for acc in demo_accounts:
        u = User.query.filter_by(username=acc["username"]).first()
        if not u:
            u = User(
                username=acc["username"],
                name=acc["name"],
                email=acc["email"],
                role=acc["role"],
                patient_id=acc["patient_id"],
                doctor_id=acc["doctor_id"],
            )
            u.set_password(acc["password"])
            db.session.add(u)
        else:
            u.name = acc["name"]
            u.role = acc["role"]
            u.patient_id = acc["patient_id"]
            u.doctor_id = acc["doctor_id"]
            u.set_password(acc["password"])

    db.session.commit()
