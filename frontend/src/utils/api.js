import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getDashboard   = ()      => api.get('/dashboard');
export const getPatients    = (q='')  => api.get(`/patients?q=${q}`);
export const createPatient  = (d)     => api.post('/patients', d);
export const updatePatient  = (id,d)  => api.put(`/patients/${id}`, d);
export const deletePatient  = (id)    => api.delete(`/patients/${id}`);

export const getDoctors     = (q='')  => api.get(`/doctors?q=${q}`);
export const createDoctor   = (d)     => api.post('/doctors', d);
export const updateDoctor   = (id,d)  => api.put(`/doctors/${id}`, d);
export const deleteDoctor   = (id)    => api.delete(`/doctors/${id}`);

export const getAppointments = (s='') => api.get(`/appointments${s ? `?status=${s}` : ''}`);
export const createAppointment=(d)    => api.post('/appointments', d);
export const updateAppointment=(id,d) => api.put(`/appointments/${id}`, d);
export const deleteAppointment=(id)   => api.delete(`/appointments/${id}`);

export const getRecords     = (pid)   => api.get(`/records${pid ? `?patient_id=${pid}` : ''}`);
export const createRecord   = (d)     => api.post('/records', d);
export const deleteRecord   = (id)    => api.delete(`/records/${id}`);

export const getWards       = ()      => api.get('/wards');
export const createWard     = (d)     => api.post('/wards', d);
export const updateWard     = (id,d)  => api.put(`/wards/${id}`, d);
export const deleteWard     = (id)    => api.delete(`/wards/${id}`);

export const getStaff       = ()      => api.get('/staff');
export const createStaff    = (d)     => api.post('/staff', d);
export const updateStaff    = (id,d)  => api.put(`/staff/${id}`, d);
export const deleteStaff    = (id)    => api.delete(`/staff/${id}`);

export default api;
