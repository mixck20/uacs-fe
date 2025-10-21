import React from 'react';
import './ClinicNavbar.css';

const ClinicNavbar = ({ activePage, setActivePage, onLogout }) => {
  return (
    <nav className="clinic-navbar">
      <div className="clinic-brand">UA Clinic System</div>
      <div className="clinic-nav-links">
        <span 
          className={`clinic-nav-link ${activePage === "dashboard" ? "active" : ""}`}
          onClick={() => setActivePage("dashboard")}
        >
          Dashboard
        </span>
        <span 
          className={`clinic-nav-link ${activePage === "patients" ? "active" : ""}`}
          onClick={() => setActivePage("patients")}
        >
          Patients
        </span>
        <span 
          className={`clinic-nav-link ${activePage === "appointment" ? "active" : ""}`}
          onClick={() => setActivePage("appointment")}
        >
          Appointments
        </span>
        <span 
          className={`clinic-nav-link ${activePage === "inventory" ? "active" : ""}`}
          onClick={() => setActivePage("inventory")}
        >
          Inventory
        </span>
        <span 
          className={`clinic-nav-link ${activePage === "ehr" ? "active" : ""}`}
          onClick={() => setActivePage("ehr")}
        >
          EHR
        </span>
        <span 
          className={`clinic-nav-link ${activePage === "email" ? "active" : ""}`}
          onClick={() => setActivePage("email")}
        >
          Email
        </span>
      </div>
      <button className="clinic-logout-btn" onClick={onLogout}>
        Logout
      </button>
    </nav>
  );
};

export default ClinicNavbar;