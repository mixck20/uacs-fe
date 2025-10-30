import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { FaCalendar, FaBell, FaFileMedical, FaHistory, FaUserMd, FaComments } from "react-icons/fa";
import { getRelativeTime, formatDate } from "../utils/timeUtils";
import UserPortalLayout from "./UserPortalLayout";
import "./UserDashboard.css";

const UserDashboard = ({ user, appointments, announcements, medicalRecords, onLogout }) => {
  const name = user?.fullName || "User";
  const userRole = user?.role || "Student/Faculty"; // To differentiate between student and faculty

  // Filter upcoming appointments
  const upcomingAppointments = useMemo(() => {
    return appointments?.filter(apt => 
      new Date(apt.date) >= new Date('2025-10-16 13:20:55') && apt.status !== "Completed"
    ) || [];
  }, [appointments]);

  // Get recent announcements
  const recentAnnouncements = announcements?.slice(0, 3) || [];

  return (
    <UserPortalLayout user={user} onLogout={onLogout} currentPage="dashboard">
      {/* Main Content */}
      <main className="dashboard-content">
        <div className="welcome-section">
          <h1>Hello, {user?.firstName || "User"}</h1>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-button">
            <FaCalendar /> Schedule Appointment
          </button>
          <button className="action-button">
            <FaUserMd /> Request Online Consultation
          </button>
          <button className="action-button">
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
                  <div key={apt.id} className="appointment-item">
                    <div className="appointment-date">{formatDate(new Date(apt.date))}</div>
                    <div className="appointment-type">{apt.type}</div>
                    <div className="appointment-status">{apt.status}</div>
                  </div>
                ))
              ) : (
                <p className="no-records">No upcoming appointments</p>
              )}
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2><FaBell /> Clinic Announcements</h2>
              <Link to="/announcements" className="view-all">View All</Link>
            </div>
            <div className="card-content">
              {recentAnnouncements.map(announcement => (
                <div key={announcement.id} className="announcement-item">
                  <h3>{announcement.title}</h3>
                  <p>{announcement.content}</p>
                  <small>{getRelativeTime(new Date(announcement.date))}</small>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Medical History */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2><FaHistory /> Medical History</h2>
              <Link to="/records" className="view-all">View All</Link>
            </div>
            <div className="card-content">
              {medicalRecords?.length > 0 ? (
                medicalRecords.slice(0, 3).map(record => (
                  <div key={record.id} className="medical-record-item">
                    <div className="record-date">{formatDate(new Date(record.date))}</div>
                    <div className="record-type">{record.type}</div>
                    <div className="record-summary">{record.summary}</div>
                  </div>
                ))
              ) : (
                <p className="no-records">No medical records found</p>
              )}
            </div>
          </div>

          {/* Feedback Section */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2><FaComments /> Service Feedback</h2>
            </div>
            <div className="card-content">
              <textarea 
                placeholder="Share your experience with our clinic services or report any issues..." 
                className="feedback-input"
              />
              <button className="submit-feedback">Submit Feedback</button>
            </div>
          </div>
        </div>
      </main>
    </UserPortalLayout>
  );
};

export default UserDashboard;