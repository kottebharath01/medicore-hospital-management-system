// import axios from 'axios';

// const API = axios.create({
//     baseURL: "https://medicore-backend-uvgi.onrender.com"
// });

// export const getDashboard   = ()      => api.get('/dashboard');
// export const getPatients    = (q='')  => api.get(`/patients?q=${q}`);
// export const createPatient  = (d)     => api.post('/patients', d);
// export const updatePatient  = (id,d)  => api.put(`/patients/${id}`, d);
// export const deletePatient  = (id)    => api.delete(`/patients/${id}`);

// export const getDoctors     = (q='')  => api.get(`/doctors?q=${q}`);
// export const createDoctor   = (d)     => api.post('/doctors', d);
// export const updateDoctor   = (id,d)  => api.put(`/doctors/${id}`, d);
// export const deleteDoctor   = (id)    => api.delete(`/doctors/${id}`);

// export const getAppointments = (s='') => api.get(`/appointments${s ? `?status=${s}` : ''}`);
// export const createAppointment=(d)    => api.post('/appointments', d);
// export const updateAppointment=(id,d) => api.put(`/appointments/${id}`, d);
// export const deleteAppointment=(id)   => api.delete(`/appointments/${id}`);

// export const getRecords     = (pid)   => api.get(`/records${pid ? `?patient_id=${pid}` : ''}`);
// export const createRecord   = (d)     => api.post('/records', d);
// export const deleteRecord   = (id)    => api.delete(`/records/${id}`);

// export const getWards       = ()      => api.get('/wards');
// export const createWard     = (d)     => api.post('/wards', d);
// export const updateWard     = (id,d)  => api.put(`/wards/${id}`, d);
// export const deleteWard     = (id)    => api.delete(`/wards/${id}`);

// export const getStaff       = ()      => api.get('/staff');
// export const createStaff    = (d)     => api.post('/staff', d);
// export const updateStaff    = (id,d)  => api.put(`/staff/${id}`, d);
// export const deleteStaff    = (id)    => api.delete(`/staff/${id}`);

// export default api;




import axios from "axios";

const API = axios.create({
  baseURL: "https://medicore-backend-uvgi.onrender.com/api",
});

// Dashboard
export const getDashboard = () => API.get("/dashboard");

// Patients
export const getPatients = (q = "") => API.get(`/patients?q=${q}`);
export const createPatient = (data) => API.post("/patients", data);
export const updatePatient = (id, data) => API.put(`/patients/${id}`, data);
export const deletePatient = (id) => API.delete(`/patients/${id}`);

// Doctors
export const getDoctors = (q = "") => API.get(`/doctors?q=${q}`);
export const createDoctor = (data) => API.post("/doctors", data);
export const updateDoctor = (id, data) => API.put(`/doctors/${id}`, data);
export const deleteDoctor = (id) => API.delete(`/doctors/${id}`);

// Appointments
export const getAppointments = (status = "") =>
  API.get(`/appointments${status ? `?status=${status}` : ""}`);

export const createAppointment = (data) =>
  API.post("/appointments", data);

export const updateAppointment = (id, data) =>
  API.put(`/appointments/${id}`, data);

export const deleteAppointment = (id) =>
  API.delete(`/appointments/${id}`);

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