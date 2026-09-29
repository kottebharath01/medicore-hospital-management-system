import axios from "axios";

// Ensure API base URL is properly formatted with /api suffix
let rawBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
rawBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
if (!rawBaseUrl.endsWith("/api")) {
  rawBaseUrl += "/api";
}

const API = axios.create({
  baseURL: rawBaseUrl,
});

// Attach JWT token to requests if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// Intercept 401 Unauthorized responses and invalidate auth state
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      try {
        sessionStorage.clear();
      } catch {}
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

// Authentication & Users
export const loginUser = (credentials) => API.post("/auth/login", credentials);
export const registerUser = (userData) => API.post("/auth/register", userData);
export const getCurrentUser = () => API.get("/auth/me");
export const changePassword = (passwords) => API.post("/auth/change-password", passwords);
export const getUsers = () => API.get("/users");
export const createStaffUser = (data) => API.post("/users", data);

// Dashboard
export const getDashboard = () => API.get("/dashboard");
export const getBedOccupancy = () => API.get("/dashboard/bed-occupancy");

// Departments
export const getDepartments = () => API.get("/departments");
export const getDepartment = (id) => API.get(`/departments/${id}`);
export const createDepartment = (data) => API.post("/departments", data);
export const updateDepartment = (id, data) => API.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => API.delete(`/departments/${id}`);

// Patients
export const getPatients = (q = "") => API.get(`/patients?q=${q}`);
export const getPatient = (id) => API.get(`/patients/${id}`);
export const createPatient = (data) => API.post("/patients", data);
export const updatePatient = (id, data) => API.put(`/patients/${id}`, data);
export const deletePatient = (id) => API.delete(`/patients/${id}`);

// Doctors
export const getDoctors = (q = "", deptId = "") =>
  API.get(`/doctors?q=${q}${deptId ? `&department_id=${deptId}` : ""}`);
export const getDoctor = (id) => API.get(`/doctors/${id}`);
export const createDoctor = (data) => API.post("/doctors", data);
export const updateDoctor = (id, data) => API.put(`/doctors/${id}`, data);
export const deleteDoctor = (id) => API.delete(`/doctors/${id}`);
export const resetDoctorPassword = (id, data) => API.post(`/doctors/${id}/reset-password`, data);

// Appointments
export const getAppointments = (status = "", doctorId = "") =>
  API.get(`/appointments${status ? `?status=${status}` : ""}${doctorId ? `&doctor_id=${doctorId}` : ""}`);
export const getMyAppointments = () => API.get("/appointments/my");
export const createAppointment = (data) => API.post("/appointments", data);
export const updateAppointment = (id, data) => API.put(`/appointments/${id}`, data);
export const deleteAppointment = (id) => API.delete(`/appointments/${id}`);

// Medical Records
export const getRecords = (patientId = "") =>
  API.get(`/records${patientId ? `?patient_id=${patientId}` : ""}`);
export const createRecord = (data) => API.post("/records", data);
export const deleteRecord = (id) => API.delete(`/records/${id}`);

// Wards & Beds
export const getWards = () => API.get("/wards");
export const getWard = (id) => API.get(`/wards/${id}`);
export const createWard = (data) => API.post("/wards", data);
export const updateWard = (id, data) => API.put(`/wards/${id}`, data);
export const deleteWard = (id) => API.delete(`/wards/${id}`);

export const getAllBeds = (params = "") => API.get(`/wards/beds${params ? `?${params}` : ""}`);
export const createBed = (data) => API.post("/wards/beds", data);
export const updateBed = (id, data) => API.put(`/wards/beds/${id}`, data);
export const deleteBed = (id) => API.delete(`/wards/beds/${id}`);

// Nursing Vitals
export const getVitals = (patientId = "") =>
  API.get(`/vitals${patientId ? `?patient_id=${patientId}` : ""}`);
export const recordVitals = (data) => API.post("/vitals", data);
export const deleteVitals = (id) => API.delete(`/vitals/${id}`);

// Staff
export const getStaff = () => API.get("/staff");
export const createStaff = (data) => API.post("/staff", data);
export const updateStaff = (id, data) => API.put(`/staff/${id}`, data);
export const deleteStaff = (id) => API.delete(`/staff/${id}`);
export const resetStaffPassword = (id, data) => API.post(`/staff/${id}/reset-password`, data);

export default API;