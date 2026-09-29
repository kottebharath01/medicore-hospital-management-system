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
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication & Users
export const loginUser = (credentials) => API.post("/auth/login", credentials);
export const registerUser = (userData) => API.post("/auth/register", userData);
export const getCurrentUser = () => API.get("/auth/me");
export const getUsers = () => API.get("/users");

// Dashboard
export const getDashboard = () => API.get("/dashboard");

// Patients
export const getPatients = (q = "") => API.get(`/patients?q=${q}`);
export const getPatient = (id) => API.get(`/patients/${id}`);
export const createPatient = (data) => API.post("/patients", data);
export const updatePatient = (id, data) => API.put(`/patients/${id}`, data);
export const deletePatient = (id) => API.delete(`/patients/${id}`);

// Doctors
export const getDoctors = (q = "") => API.get(`/doctors?q=${q}`);
export const getDoctor = (id) => API.get(`/doctors/${id}`);
export const createDoctor = (data) => API.post("/doctors", data);
export const updateDoctor = (id, data) => API.put(`/doctors/${id}`, data);
export const deleteDoctor = (id) => API.delete(`/doctors/${id}`);

// Appointments
export const getAppointments = (status = "") =>
  API.get(`/appointments${status ? `?status=${status}` : ""}`);
export const createAppointment = (data) => API.post("/appointments", data);
export const updateAppointment = (id, data) => API.put(`/appointments/${id}`, data);
export const deleteAppointment = (id) => API.delete(`/appointments/${id}`);

// Medical Records
export const getRecords = (patientId = "") =>
  API.get(`/records${patientId ? `?patient_id=${patientId}` : ""}`);
export const createRecord = (data) => API.post("/records", data);
export const deleteRecord = (id) => API.delete(`/records/${id}`);

// Wards
export const getWards = () => API.get("/wards");
export const createWard = (data) => API.post("/wards", data);
export const updateWard = (id, data) => API.put(`/wards/${id}`, data);
export const deleteWard = (id) => API.delete(`/wards/${id}`);

// Staff
export const getStaff = () => API.get("/staff");
export const createStaff = (data) => API.post("/staff", data);
export const updateStaff = (id, data) => API.put(`/staff/${id}`, data);
export const deleteStaff = (id) => API.delete(`/staff/${id}`);

export default API;