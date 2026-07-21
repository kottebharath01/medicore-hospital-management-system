# MediCore — Hospital Management System

A full-stack Hospital Management System built with **React.js** (frontend) and **Python Flask** (backend), featuring a SQLite database.

---

## Project Structure

```
hospital-management-system/
├── backend/
│   ├── app.py              ← Flask REST API
│   ├── requirements.txt    ← Python dependencies
│   └── hospital.db         ← SQLite DB (auto-created on first run)
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/     ← Sidebar, Topbar, Modal
    │   ├── pages/          ← Dashboard, Patients, Doctors, Appointments, Records, Wards, Staff
    │   ├── utils/api.js    ← Axios API client
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

---

## Features

- **Dashboard** — Live stats, charts (Recharts), bed occupancy, doctor availability
- **Patients** — Full CRUD with search
- **Doctors** — Full CRUD with specialization, fees, availability
- **Appointments** — Schedule, complete, cancel appointments
- **Medical Records** — Diagnoses and prescriptions per patient
- **Wards & Beds** — Occupancy tracking with visual progress bars
- **Staff** — Non-clinical personnel management

---

## Prerequisites

- Python 3.8+
- Node.js 16+ & npm

---

## Setup & Run

### Step 1 — Backend

```bash
cd hospital-management-system/backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

Backend runs at: **http://localhost:5000**

### Step 2 — Frontend (new terminal)

```bash
cd hospital-management-system/frontend
npm install
npm start
```

Frontend runs at: **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Stats and recent appointments |
| GET/POST | /api/patients | List / create patients |
| GET/PUT/DELETE | /api/patients/:id | Get / update / delete patient |
| GET/POST | /api/doctors | List / create doctors |
| GET/PUT/DELETE | /api/doctors/:id | Get / update / delete doctor |
| GET/POST | /api/appointments | List / create appointments |
| PUT/DELETE | /api/appointments/:id | Update / delete appointment |
| GET/POST | /api/records | List / create medical records |
| DELETE | /api/records/:id | Delete record |
| GET/POST | /api/wards | List / create wards |
| PUT/DELETE | /api/wards/:id | Update / delete ward |
| GET/POST | /api/staff | List / create staff |
| PUT/DELETE | /api/staff/:id | Update / delete staff |
