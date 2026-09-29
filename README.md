# 🏥 MediCore - Hospital Management System

A full-stack Hospital Management System built using **React.js** and **Flask** to simplify hospital administration. The application allows management of patients, doctors, appointments, medical records, wards, and staff through a modern web interface with RESTful APIs.

## 🌐 Live Demo

### Frontend
https://medicore-hospital-management-system-zeta.vercel.app/

### Backend API
https://medicore-backend-uvgi.onrender.com

---

# 📌 Features

### Dashboard
- Hospital statistics dashboard
- Patient count
- Doctor count
- Appointment summary
- Ward statistics
- Staff statistics

### Patient Management
- Add new patient
- Update patient details
- Delete patient
- Search patients

### Doctor Management
- Add doctor
- Update doctor
- Delete doctor
- Search doctors

### Appointment Management
- Schedule appointments
- Update appointments
- Cancel appointments
- View appointment history

### Medical Records
- Create medical records
- View patient records
- Delete records

### Ward Management
- Manage hospital wards
- Update bed occupancy
- Delete wards

### Staff Management
- Add staff
- Update staff
- Delete staff

---

# 🛠 Tech Stack

## Frontend
- React.js 18
- Axios (with JWT interceptors)
- Lucide React (Icons)
- Recharts (Visualizations)
- React Hot Toast

## Backend
- Python 3.12 / 3.13
- Flask 3.0 (Modular Blueprints architecture)
- Flask-SQLAlchemy 3.1 / SQLAlchemy 2.0
- psycopg2-binary 2.9 (PostgreSQL driver)
- PyJWT (Authentication & token verification)
- Flask-CORS 4.0

## Database
- Local PostgreSQL 18 (with connection pooling & optimized indexed joins)

## Version Control
- Git & GitHub

---

# 📂 Project Structure

```
medicore-hospital-management-system
│
├── backend
│   ├── routes/              # Modular API Blueprints
│   │   ├── auth.py          # Authentication & user management
│   │   ├── dashboard.py     # Aggregated analytics (53% faster)
│   │   ├── patients.py      # Patient CRUD & indexed search
│   │   ├── doctors.py       # Doctor directory & availability
│   │   ├── appointments.py  # Appointments with eager loading (56% faster)
│   │   ├── records.py       # Medical records & diagnoses
│   │   ├── wards.py         # Wards & bed capacity tracking
│   │   └── staff.py         # Non-clinical staff management
│   ├── app.py               # Application factory & error handlers
│   ├── config.py            # Environment configuration & DB pooling
│   ├── database.py          # SQLAlchemy instance
│   ├── models.py            # Relational models with indexes & foreign keys
│   ├── seed.py              # Automated database seeding & test accounts
│   ├── requirements.txt     # Clean, pruned dependencies (only 7 packages)
│   └── .env                 # Local PostgreSQL credentials (gitignored)
│
├── frontend
│   ├── src/
│   │   ├── components/      # Sidebar, Topbar (with auth status), Modal
│   │   ├── pages/           # Dashboard, Patients, Doctors, Appointments, etc.
│   │   └── utils/api.js     # Axios client with JWT auth headers
│   ├── package.json
│   └── .env                 # Local API URL configuration
│
├── README.md
└── .gitignore
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/kottebharath01/medicore-hospital-management-system.git
```

```
cd medicore-hospital-management-system
```

---

## Backend Setup

```
cd backend
```

Create virtual environment

```bash
python -m venv venv
```

Activate environment

Windows

```bash
venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run backend

```bash
python app.py
```

Backend runs on

```
http://localhost:5000
```

---

## Frontend Setup

```
cd frontend
```

Install dependencies

```bash
npm install
```

Run frontend

```bash
npm start
```

or

```bash
npm run dev
```

Frontend runs on

```
http://localhost:3000
```

---

# 📡 API Endpoints

## Dashboard

```
GET /api/dashboard
```

## Patients

```
GET /api/patients
POST /api/patients
PUT /api/patients/{id}
DELETE /api/patients/{id}
```

## Doctors

```
GET /api/doctors
POST /api/doctors
PUT /api/doctors/{id}
DELETE /api/doctors/{id}
```

## Appointments

```
GET /api/appointments
POST /api/appointments
PUT /api/appointments/{id}
DELETE /api/appointments/{id}
```

## Medical Records

```
GET /api/records
POST /api/records
DELETE /api/records/{id}
```

## Wards

```
GET /api/wards
POST /api/wards
PUT /api/wards/{id}
DELETE /api/wards/{id}
```

## Staff

```
GET /api/staff
POST /api/staff
PUT /api/staff/{id}
DELETE /api/staff/{id}
```

---

# 🎯 Learning Outcomes

During this project I gained practical experience in:

- Building REST APIs using Flask
- React component-based development
- SQLAlchemy ORM
- CRUD operations
- Client-server communication using Axios
- Git and GitHub version control
- Backend deployment using Render
- Frontend deployment using Vercel
- Debugging deployment issues
- API integration
- Full-stack application development

---

# 🚧 Current Limitations

- SQLite database is used
- No authentication
- No authorization
- No role-based access
- No image upload
- No email notifications

---

# 🔮 Future Improvements

- PostgreSQL Integration
- JWT Authentication
- Role-Based Access Control
- File Upload
- PDF Reports
- Email Notifications
- Dashboard Analytics
- Docker Support
- Environment Variables
- CI/CD Pipeline

---

# 👨‍💻 Author

**Bharath Kotte**

GitHub:
https://github.com/kottebharath01

LinkedIn:
https://www.linkedin.com/in/kottebharath

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.