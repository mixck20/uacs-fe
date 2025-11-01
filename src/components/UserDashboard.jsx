import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCalendar, FaFileMedical, FaHistory, FaUserMd, FaSpinner, FaCheckCircle, FaClock, FaExclamationCircle } from "react-icons/fa";
import { formatDate } from "../utils/timeUtils";
import { PatientsAPI } from "../api";
import UserPortalLayout from "./UserPortalLayout";
import "./UserDashboard.css";

const UserDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await PatientsAPI.getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter upcoming appointments
  const upcomingAppointments = useMemo(() => {
    if (!dashboardData?.appointments) return [];
    const now = new Date();
    return dashboardData.appointments.filter(apt => 
      new Date(apt.date) >= now && apt.status !== "Completed" && apt.status !== "Cancelled"
    );
  }, [dashboardData?.appointments]);

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
      case 'approved':
      case 'issued':
        return <FaCheckCircle className="status-icon success" />;
      case 'pending':
        return <FaClock className="status-icon warning" />;
      case 'cancelled':
      case 'rejected':
        return <FaExclamationCircle className="status-icon error" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <UserPortalLayout user={user} onLogout={onLogout} currentPage="dashboard">
        <main className="dashboard-content">
          <div className="loading-container">
            <FaSpinner className="spinner" />
            <p>Loading your dashboard...</p>
          </div>
        </main>
      </UserPortalLayout>
    );
  }

  return (
    <UserPortalLayout user={user} onLogout={onLogout} currentPage="dashboard">
      {/* Main Content */}
      <main className="dashboard-content">
        <div className="welcome-section">
          <h1>Hello, {dashboardData?.user?.fullName || user?.firstName || "User"}</h1>
          {dashboardData?.stats && (
            <div className="quick-stats">
              <div className="stat-item">
                <span className="stat-number">{dashboardData.stats.totalVisits}</span>
                <span className="stat-label">Total Visits</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{dashboardData.stats.upcomingAppointments}</span>
                <span className="stat-label">Upcoming</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{dashboardData.stats.pendingCertificates}</span>
                <span className="stat-label">Pending Certificates</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-button" onClick={() => navigate('/appointments')}>
            <FaCalendar /> Schedule Appointment
          </button>
          <button className="action-button" onClick={() => navigate('/schedule')}>
            <FaUserMd /> Request Online Consultation
          </button>
          <button className="action-button" onClick={() => navigate('/certificates')}>
            <FaFileMedical /> Request Medical Certificate
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Upcoming Appointments */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2><FaCalendar /> Upcoming Appointments</h2>
              <Link to="/appointments" className="view-all">View All</Link>
            </div>
            <div className="card-content">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(apt => (
                  <div key={apt._id} className="appointment-item">
                    <div className="appointment-info">
                      <div className="appointment-date">{formatDate(new Date(apt.date))} at {apt.time}</div>
                      <div className="appointment-type">{apt.type}</div>
                      {apt.meetLink && (
                        <a href={apt.meetLink} target="_blank" rel="noopener noreferrer" className="meet-link">
                          Join Meeting
                        </a>
                      )}
                    </div>
                    <div className="appointment-status-badge">
                      {getStatusIcon(apt.status)}
                      <span>{apt.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-records">No upcoming appointments</p>
              )}
            </div>
          </div>

          {/* Recent Medical History */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2><FaHistory /> Recent Visits</h2>
              <Link to="/records" className="view-all">View All</Link>
            </div>
            <div className="card-content">
              {dashboardData?.recentVisits?.length > 0 ? (
                dashboardData.recentVisits.map((visit, index) => (
                  <div key={index} className="medical-record-item">
                    <div className="record-date">{formatDate(new Date(visit.date))}</div>
                    <div className="record-details">
                      <strong>Diagnosis:</strong> {visit.diagnosis || 'N/A'}
                    </div>
                    {visit.physician && (
                      <div className="record-physician">Dr. {visit.physician}</div>
                    )}
                    {visit.prescriptions?.length > 0 && (
                      <div className="record-prescriptions">
                        <strong>Prescriptions:</strong> {visit.prescriptions.length} item(s)
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-records">No medical records found</p>
              )}
            </div>
          </div>

          {/* Certificates Status */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2><FaFileMedical /> Medical Certificates</h2>
              <Link to="/certificates" className="view-all">View All</Link>
            </div>
            <div className="card-content">
              {dashboardData?.certificates?.length > 0 ? (
                dashboardData.certificates.map(cert => (
                  <div key={cert._id} className="certificate-item">
                    <div className="certificate-info">
                      <div className="certificate-purpose">{cert.purpose}</div>
                      <small>Requested: {formatDate(new Date(cert.requestedAt))}</small>
                    </div>
                    <div className="certificate-status-badge">
                      {getStatusIcon(cert.status)}
                      <span>{cert.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-records">No certificate requests</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </UserPortalLayout>
  );
};

export default UserDashboard;