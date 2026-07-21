import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar      from './components/Sidebar';
import Topbar       from './components/Topbar';
import Dashboard    from './pages/Dashboard';
import Patients     from './pages/Patients';
import Doctors      from './pages/Doctors';
import Appointments from './pages/Appointments';
import Records      from './pages/Records';
import Wards        from './pages/Wards';
import Staff        from './pages/Staff';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <Routes>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/patients"     element={<Patients />} />
            <Route path="/doctors"      element={<Doctors />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/records"      element={<Records />} />
            <Route path="/wards"        element={<Wards />} />
            <Route path="/staff"        element={<Staff />} />
          </Routes>
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily:'Inter,sans-serif', fontSize:'0.875rem', borderRadius:'10px', boxShadow:'0 4px 16px rgba(0,0,0,0.12)' },
          success: { iconTheme: { primary:'#00a99d', secondary:'#fff' } },
        }}
      />
    </BrowserRouter>
  );
}
