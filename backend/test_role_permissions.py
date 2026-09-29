import sys
import json
from app import create_app
from database import db
from models import User, Doctor, Staff, Patient, Appointment

def run_tests():
    app = create_app()
    client = app.test_client()

    print("==================================================")
    print("STARTING MEDICORE HMS ROLE RESPONSIBILITY TEST SUITE")
    print("==================================================")

    with app.app_context():
        # Pre-cleanup of any lingering test entities
        for uname in ["doc_test_cardio", "nurse_sarah_j", "rec_john_d", "self_pat_user"]:
            u = User.query.filter_by(username=uname).first()
            if u:
                if u.doctor_id:
                    d = db.session.get(Doctor, u.doctor_id)
                    if d: db.session.delete(d)
                if u.staff_id:
                    s = db.session.get(Staff, u.staff_id)
                    if s: db.session.delete(s)
                if u.patient_id:
                    p = db.session.get(Patient, u.patient_id)
                    if p: db.session.delete(p)
                db.session.delete(u)
        p_walkin = Patient.query.filter_by(name="Walkin Ramesh Gupta").first()
        if p_walkin:
            Appointment.query.filter_by(patient_id=p_walkin.id).delete()
            db.session.delete(p_walkin)
        db.session.commit()

        # 1. Admin Login
        res = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert res.status_code == 200, f"Admin login failed: {res.data}"
        admin_token = res.get_json()["token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("[PASS] 1. Admin login successful")

        # 2. Admin creates a Doctor
        doc_payload = {
            "name": "Dr. Test Cardiologist",
            "username": "doc_test_cardio",
            "password": "TempDoctor@123",
            "department_id": 1,
            "specialization": "Cardiology",
            "phone": "9998887771",
            "email": "testcardio@medicore.com"
        }
        res = client.post("/api/doctors", json=doc_payload, headers=admin_headers)
        assert res.status_code == 201, f"Doctor creation failed: {res.data}"
        doc_data = res.get_json()["doctor"]
        assert doc_data["code"].startswith("DOC-"), f"Expected DOC- prefix, got: {doc_data['code']}"
        doc_user = User.query.filter_by(username="doc_test_cardio").first()
        assert doc_user is not None, "Doctor User account not found"
        assert doc_user.must_change_password is True, "Doctor must_change_password flag not True"
        print(f"[PASS] 2. Admin created Doctor: {doc_data['code']} with user must_change_password=True")

        # 3. Admin creates a Nurse
        nurse_payload = {
            "name": "Nurse Sarah Jenkins",
            "role": "Nurse",
            "username": "nurse_sarah_j",
            "password": "TempNurse@123",
            "phone": "9998887772",
            "department": "Cardiology"
        }
        res = client.post("/api/staff", json=nurse_payload, headers=admin_headers)
        assert res.status_code == 201, f"Nurse creation failed: {res.data}"
        nurse_data = res.get_json()["staff"]
        assert nurse_data["code"].startswith("NUR-"), f"Expected NUR- prefix, got: {nurse_data['code']}"
        nurse_user = User.query.filter_by(username="nurse_sarah_j").first()
        assert nurse_user is not None, "Nurse User account not found"
        assert nurse_user.must_change_password is True, "Nurse must_change_password flag not True"
        print(f"[PASS] 3. Admin created Nurse: {nurse_data['code']} with user must_change_password=True")

        # 4. Admin creates a Receptionist
        rec_payload = {
            "name": "Receptionist Johnathan Doe",
            "role": "Receptionist",
            "username": "rec_john_d",
            "password": "TempRec@123",
            "phone": "9998887773",
            "department": "Front Desk"
        }
        res = client.post("/api/staff", json=rec_payload, headers=admin_headers)
        assert res.status_code == 201, f"Receptionist creation failed: {res.data}"
        rec_data = res.get_json()["staff"]
        assert rec_data["code"].startswith("REC-"), f"Expected REC- prefix, got: {rec_data['code']}"
        rec_user = User.query.filter_by(username="rec_john_d").first()
        assert rec_user is not None, "Receptionist User account not found"
        assert rec_user.must_change_password is True, "Receptionist must_change_password flag not True"
        print(f"[PASS] 4. Admin created Receptionist: {rec_data['code']} with user must_change_password=True")

        # 5. Admin attempts to create invalid roles (e.g. Cleaner or Security Officer)
        invalid_staff = {
            "name": "Cleaner Bob",
            "role": "Cleaner",
            "username": "cleaner_bob",
            "password": "Password@123"
        }
        res = client.post("/api/staff", json=invalid_staff, headers=admin_headers)
        assert res.status_code == 400, f"Expected 400 for Cleaner role, got: {res.status_code}"
        print("[PASS] 5. Disallowed staff roles (Cleaner) successfully rejected with HTTP 400")

        # 6. Admin attempts POST /api/patients -> must return HTTP 403 Forbidden
        pat_payload = {
            "name": "Illegal Admin Patient",
            "phone": "9990001111",
            "gender": "Male",
            "age": 45
        }
        res = client.post("/api/patients", json=pat_payload, headers=admin_headers)
        assert res.status_code == 403, f"Expected 403 for Admin creating patient, got: {res.status_code} ({res.data})"
        print("[PASS] 6. Admin POST /api/patients blocked with HTTP 403 Forbidden")

        # 7. Admin attempts POST /api/appointments -> must return HTTP 403 Forbidden
        appt_payload = {
            "patient_id": 1,
            "doctor_id": doc_data["id"],
            "date": "2026-10-15",
            "time": "10:00 AM",
            "reason": "General Checkup"
        }
        res = client.post("/api/appointments", json=appt_payload, headers=admin_headers)
        assert res.status_code == 403, f"Expected 403 for Admin booking appointment, got: {res.status_code} ({res.data})"
        print("[PASS] 7. Admin POST /api/appointments blocked with HTTP 403 Forbidden")

        # 8. Receptionist Login
        res = client.post("/api/auth/login", json={"username": "rec_john_d", "password": "TempRec@123"})
        assert res.status_code == 200, f"Receptionist login failed: {res.data}"
        rec_token = res.get_json()["token"]
        assert res.get_json()["user"]["must_change_password"] is True
        rec_headers = {"Authorization": f"Bearer {rec_token}"}
        print("[PASS] 8. Receptionist logged in (must_change_password=True)")

        # 9. Receptionist registers a walk-in patient via POST /api/patients
        res = client.post("/api/patients", json={
            "name": "Walkin Ramesh Gupta",
            "age": 42,
            "gender": "Male",
            "phone": "9876543210",
            "blood_group": "O+",
            "address": "45 Park Street"
        }, headers=rec_headers)
        assert res.status_code == 201, f"Receptionist patient creation failed: {res.data}"
        walkin_pat = res.get_json()
        assert walkin_pat["code"].startswith("PAT-"), f"Expected PAT- prefix, got: {walkin_pat['code']}"
        print(f"[PASS] 9. Receptionist registered walk-in patient: {walkin_pat['code']} ({walkin_pat['name']})")

        # 10. Receptionist books appointment for walk-in patient
        res = client.post("/api/appointments", json={
            "patient_id": walkin_pat["id"],
            "doctor_id": doc_data["id"],
            "date": "2026-10-20",
            "time": "11:30 AM",
            "reason": "Initial Cardiac Evaluation"
        }, headers=rec_headers)
        assert res.status_code == 201, f"Receptionist booking failed: {res.data}"
        walkin_appt = res.get_json()
        assert walkin_appt["code"].startswith("APT-"), f"Expected APT- prefix, got: {walkin_appt['code']}"
        print(f"[PASS] 10. Receptionist scheduled appointment: {walkin_appt['code']}")

        # 11. Patient Self-Registration
        res = client.post("/api/auth/register", json={
            "name": "Self Registering Patient",
            "username": "self_pat_user",
            "password": "Patient@12345",
            "phone": "9123456780",
            "email": "selfpat@example.com",
            "gender": "Female",
            "age": 28
        })
        assert res.status_code == 201, f"Patient registration failed: {res.data}"
        pat_token = res.get_json()["token"]
        pat_user_data = res.get_json()["user"]
        pat_headers = {"Authorization": f"Bearer {pat_token}"}
        print(f"[PASS] 11. Patient self-registered with User ID {pat_user_data['id']}")

        # 12. Patient books own appointment
        res = client.post("/api/appointments", json={
            "doctor_id": doc_data["id"],
            "date": "2026-10-22",
            "time": "02:00 PM",
            "reason": "Consultation"
        }, headers=pat_headers)
        assert res.status_code == 201, f"Patient booking failed: {res.data}"
        patient_appt = res.get_json()
        assert patient_appt["code"].startswith("APT-")
        print(f"[PASS] 12. Patient self-booked appointment: {patient_appt['code']}")

        # 13. Patient attempts to access another patient's record -> must return 403
        res = client.get(f"/api/patients/{walkin_pat['id']}", headers=pat_headers)
        assert res.status_code == 403, f"Expected 403 for patient accessing another patient, got: {res.status_code}"
        print("[PASS] 13. Patient cross-record access blocked with HTTP 403")

        # 14. Nurse login and first-login password change
        res = client.post("/api/auth/login", json={"username": "nurse_sarah_j", "password": "TempNurse@123"})
        assert res.status_code == 200
        nurse_token = res.get_json()["token"]
        nurse_headers = {"Authorization": f"Bearer {nurse_token}"}
        assert res.get_json()["user"]["must_change_password"] is True

        res = client.post("/api/auth/change-password", json={
            "current_password": "TempNurse@123",
            "new_password": "SarahPersonalPassword@456",
            "confirm_password": "SarahPersonalPassword@456"
        }, headers=nurse_headers)
        assert res.status_code == 200, f"Password change failed: {res.data}"
        assert res.get_json()["user"]["must_change_password"] is False
        print("[PASS] 14. First-login password change completed and reset must_change_password to False")

        # Verify login with new password
        res = client.post("/api/auth/login", json={"username": "nurse_sarah_j", "password": "SarahPersonalPassword@456"})
        assert res.status_code == 200
        assert res.get_json()["user"]["must_change_password"] is False
        print("[PASS] 15. Login with new personal password successful")

        # 16. Verify Dashboard stats
        res = client.get("/api/dashboard", headers=admin_headers)
        assert res.status_code == 200
        stats = res.get_json()["stats"]
        assert "total_nurses" in stats and stats["total_nurses"] >= 1
        assert "total_receptionists" in stats and stats["total_receptionists"] >= 1
        assert "total_doctors" in stats and stats["total_doctors"] >= 1
        print(f"[PASS] 16. Dashboard metrics verified: Doctors={stats['total_doctors']}, Nurses={stats['total_nurses']}, Receptionists={stats['total_receptionists']}")

        # Clean up test entities created
        db.session.delete(db.session.get(Appointment, walkin_appt["id"]))
        db.session.delete(db.session.get(Appointment, patient_appt["id"]))
        db.session.delete(db.session.get(Patient, walkin_pat["id"]))
        pat_rec = Patient.query.filter_by(user_id=pat_user_data["id"]).first()
        if pat_rec: db.session.delete(pat_rec)
        db.session.delete(db.session.get(User, pat_user_data["id"]))
        db.session.delete(db.session.get(Doctor, doc_data["id"]))
        db.session.delete(doc_user)
        db.session.delete(db.session.get(Staff, nurse_data["id"]))
        db.session.delete(nurse_user)
        db.session.delete(db.session.get(Staff, rec_data["id"]))
        db.session.delete(rec_user)
        db.session.commit()
        print("[PASS] 17. Cleaned up test database records")

    print("==================================================")
    print("ALL 17 TESTS PASSED SUCCESSFULLY! FULL COMPLIANCE.")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
