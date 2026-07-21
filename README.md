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
- React.js
- Axios
- CSS
- JavaScript

## Backend
- Python
- Flask
- Flask SQLAlchemy
- Flask CORS

## Database
- SQLite

## Deployment
- Vercel
- Render

## Version Control
- Git
- GitHub

---

# 📂 Project Structure

```
medicore-hospital-management-system
│
├── backend
│   ├── app.py
│   ├── hospital.db
│   ├── requirements.txt
│   └── ...
│
├── frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── ...
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