import React, { useMemo } from "react";
import ClinicNavbar from "./ClinicNavbar";
import "./ClinicDashboard.css";
import { FaUsers, FaClipboardList, FaClock, FaBoxes, FaExclamationTriangle, FaChartLine, FaPlus, FaFileAlt, FaBox } from "react-icons/fa";
import { getRelativeTime, formatDate } from "../utils/timeUtils";

const ClinicDashboard = ({ setActivePage, activePage, sidebarOpen, setSidebarOpen, patients = [], inventory = [], appointments = [], onLogout }) => {
  // Real data from patients and inventory state with default values
  const name = "Clinic Staff";
  const totalPatients = patients?.length || 0;
  
  // Real appointment data
  const totalAppointments = appointments ? appointments.length : 0;
  const pendingAppointments = appointments ? appointments.filter(apt => apt.status === "Pending").length : 0;
  const confirmedAppointments = appointments ? appointments.filter(apt => apt.status === "Confirmed").length : 0;
  const completedAppointments = appointments ? appointments.filter(apt => apt.status === "Completed").length : 0;
  
  // Real inventory data
  const totalInventoryItems = inventory.length;
  const medicineItems = inventory.filter(item => item.category === "Medicine");
  const availableMedicines = medicineItems.filter(item => item.quantity > 10).length;
  const shortageMedicines = medicineItems.filter(item => item.quantity <= 10).length;
  
  const lastBackup = new Date().toLocaleDateString();
  
  // Today's activity metrics
  const todayPatients = patients.filter(p => {
    const today = new Date().toDateString();
    const patientDate = p.createdAt ? new Date(p.createdAt).toDateString() : "";
    return patientDate === today;
  }).length;

  // Determine latest inventory item using createdAt or ObjectId timestamp fallback
  const latestInventoryItem = useMemo(() => {
    if (!inventory || inventory.length === 0) return null;
    const mapped = inventory.map(it => {
      let ts = 0;
      if (it.createdAt) {
        const d = new Date(it.createdAt);
        if (!isNaN(d.getTime())) ts = d.getTime();
      }
      if (ts === 0 && it.id && typeof it.id === "string" && it.id.length >= 8) {
        try {
          const unix = parseInt(it.id.substring(0, 8), 16);
          if (!isNaN(unix)) ts = unix * 1000;
        } catch {
          ts = 0;
        }
      }
      return { ...it, _ts: ts };
    });
    mapped.sort((a, b) => (b._ts || 0) - (a._ts || 0));
    return mapped[0] || null;
  }, [inventory]);

  return (
    <div>
      <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <div className="dashboard-title">DASHBOARD</div>
            <div className="dashboard-welcome">
              Welcome, <span className="dashboard-staff-name">{name}</span>
            </div>
          </div>
          <button className="dashboard-download-btn">
            Download Report <span className="arrow">↓</span>
          </button>
        </div>

        <div className="dashboard-cards-grid">
          <div className="dashboard-card" onClick={() => setActivePage("patients")}>
            <div className="card-header">
              Total Patients
              <span className="card-link">View Full List →</span>
            </div>
            <div className="card-number">{totalPatients}</div>
          </div>
          
          <div className="dashboard-card" onClick={() => setActivePage("appointment")}>
            <div className="card-header">
              Total Appointments
              <span className="card-link">View Full List →</span>
            </div>
            <div className="card-number">{totalAppointments}</div>
          </div>
          
          <div className="dashboard-card" onClick={() => setActivePage("appointment")}>
            <div className="card-header">
              Pending Requests
              <span className="card-link">View Full List →</span>
            </div>
            <div className="card-number">{pendingAppointments}</div>
          </div>

          <div className="dashboard-card" onClick={() => setActivePage("inventory")}>
            <div className="card-header">
              Inventory Status
              <span className="card-link">View All Items →</span>
            </div>
            <div className="inventory-stats">
              <div>
                <div className="inventory-number">{availableMedicines}</div>
                <div className="inventory-label">Medicine Available</div>
              </div>
              <div>
                <div className="inventory-number">{shortageMedicines}</div>
                <div className="inventory-label">Medicine Shortage</div>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              Today's Activity
              <span className="card-link">View Details →</span>
            </div>
            <div className="today-stats">
              <div className="today-number">{todayPatients}</div>
              <div className="today-label">New Patients Today</div>
            </div>
          </div>

          <div className="dashboard-card activity-card">
            <div className="card-header">Recent Activity</div>
            <div className="recent-activity">
              {patients.length > 0 ? (
                <div className="activity-item">
                  <div className="activity-icon"><FaUsers /></div>
                  <div className="activity-details">
                    <div className="activity-text">Latest patient added: <strong>{patients[0]?.fullName || patients[0]?.name || 'Unknown'}</strong></div>
                    <div className="activity-time">{getRelativeTime(patients[0]?.createdAt ? new Date(patients[0].createdAt) : undefined)}</div>
                  </div>
                </div>
              ) : (
                <div className="activity-item">
                  <div className="activity-icon"><FaFileAlt /></div>
                  <div className="activity-details">
                    <div className="activity-text">No patients added yet</div>
                    <div className="activity-time">Add your first patient</div>
                  </div>
                </div>
              )}
              {patients.length > 1 && (
                <div className="activity-item">
                  <div className="activity-icon"><FaChartLine /></div>
                  <div className="activity-details">
                    <div className="activity-text">Total patients: <strong>{totalPatients}</strong></div>
                    <div className="activity-time">Updated {formatDate(new Date())}</div>
                  </div>
                </div>
              )}
              {latestInventoryItem && (
                <div className="activity-item">
                  <div className="activity-icon"><FaBox /></div>
                  <div className="activity-details">
                    <div className="activity-text">Latest item added: <strong>{latestInventoryItem.name || 'Unknown'}</strong></div>
                    <div className="activity-time">
                      {getRelativeTime(
                        latestInventoryItem.createdAt
                          ? new Date(latestInventoryItem.createdAt)
                          : (latestInventoryItem._ts ? new Date(latestInventoryItem._ts) : undefined)
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDashboard;