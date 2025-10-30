import React, { useState, useEffect } from 'react';
import AdminPortalLayout from './AdminPortalLayout';
import { AdminAPI } from '../api';
import { FaUsers, FaUserCheck, FaUserTimes, FaCalendarCheck, FaCalendarTimes, FaExclamationTriangle, FaChartLine, FaFileDownload } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './AdminDashboard.css';

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [auditStats, setAuditStats] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [analyticsData, auditData] = await Promise.all([
        AdminAPI.getAnalytics(),
        AdminAPI.getAuditStats()
      ]);

      setAnalytics(analyticsData);
      setAuditStats(auditData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAnalytics = async () => {
    try {
      setExporting(true);
      await AdminAPI.exportAnalytics();
      Swal.fire({
        icon: 'success',
        title: 'Export Successful',
        text: 'Analytics report has been downloaded',
        confirmButtonColor: '#e51d5e'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: error.message || 'Failed to export analytics',
        confirmButtonColor: '#e51d5e'
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <AdminPortalLayout>
        <div className="admin-dashboard">
          <div className="loading-spinner">Loading dashboard...</div>
        </div>
      </AdminPortalLayout>
    );
  }

  if (error) {
    return (
      <AdminPortalLayout>
        <div className="admin-dashboard">
          <div className="error-message">{error}</div>
        </div>
      </AdminPortalLayout>
    );
  }

  return (
    <AdminPortalLayout>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <button 
            className="btn-export" 
            onClick={handleExportAnalytics}
            disabled={exporting}
          >
            <FaFileDownload /> {exporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
        
        {/* User Statistics */}
        <section className="dashboard-section">
          <h2>User Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <h3>Total Users</h3>
                <p className="stat-number">{analytics?.userStats?.total || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaUserCheck />
              </div>
              <div className="stat-content">
                <h3>Active Users</h3>
                <p className="stat-number">{analytics?.userStats?.active || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaUserTimes />
              </div>
              <div className="stat-content">
                <h3>Inactive Users</h3>
                <p className="stat-number">{analytics?.userStats?.inactive || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaChartLine />
              </div>
              <div className="stat-content">
                <h3>New (30 days)</h3>
                <p className="stat-number">{analytics?.userStats?.newUsers || 0}</p>
              </div>
            </div>
          </div>

          {/* Users by Role */}
          <div className="role-breakdown">
            <h3>Users by Role</h3>
            <div className="role-stats">
              {analytics?.usersByRole?.map((role) => (
                <div key={role._id} className="role-item">
                  <span className="role-name">{role._id || 'Unknown'}</span>
                  <span className="role-count">{role.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Appointment Statistics */}
        <section className="dashboard-section">
          <h2>Appointment Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaCalendarCheck />
              </div>
              <div className="stat-content">
                <h3>Completed</h3>
                <p className="stat-number">{analytics?.appointmentStats?.completed || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaCalendarTimes />
              </div>
              <div className="stat-content">
                <h3>Pending</h3>
                <p className="stat-number">{analytics?.appointmentStats?.pending || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaCalendarTimes />
              </div>
              <div className="stat-content">
                <h3>Cancelled</h3>
                <p className="stat-number">{analytics?.appointmentStats?.cancelled || 0}</p>
              </div>
            </div>
          </div>

          {/* Appointments by Status */}
          <div className="appointment-breakdown">
            <h3>All Appointments</h3>
            <div className="appointment-stats">
              {analytics?.appointmentsByStatus?.map((status) => (
                <div key={status._id} className="appointment-item">
                  <span className="appointment-status">{status._id || 'Unknown'}</span>
                  <span className="appointment-count">{status.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Common Complaints */}
        <section className="dashboard-section">
          <h2>Common Complaints</h2>
          <div className="complaints-list">
            {analytics?.commonComplaints?.length > 0 ? (
              analytics.commonComplaints.map((complaint, index) => (
                <div key={index} className="complaint-item">
                  <FaExclamationTriangle className="complaint-icon" />
                  <span className="complaint-text">{complaint._id}</span>
                  <span className="complaint-count">{complaint.count} cases</span>
                </div>
              ))
            ) : (
              <p className="no-data">No complaint data available</p>
            )}
          </div>
        </section>

        {/* Peak Hours */}
        <section className="dashboard-section">
          <h2>Peak Hours</h2>
          <div className="peak-hours-chart">
            {analytics?.peakHours?.length > 0 ? (
              analytics.peakHours.map((hour) => (
                <div key={hour._id} className="hour-bar">
                  <div className="hour-label">{hour._id}:00</div>
                  <div className="hour-bar-container">
                    <div 
                      className="hour-bar-fill" 
                      style={{ 
                        width: `${(hour.count / Math.max(...analytics.peakHours.map(h => h.count))) * 100}%` 
                      }}
                    >
                      {hour.count}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No peak hours data available</p>
            )}
          </div>
        </section>

        {/* Visit Frequency */}
        <section className="dashboard-section">
          <h2>Visit Frequency</h2>
          <div className="visit-frequency-grid">
            {analytics?.visitFrequency?.map((freq) => (
              <div key={freq.category} className="frequency-card">
                <h4>{freq.category}</h4>
                <p className="frequency-count">{freq.count} users</p>
              </div>
            ))}
          </div>
        </section>

        {/* Audit Activity */}
        <section className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="audit-summary">
            <div className="audit-stat">
              <span>Total Actions (24h):</span>
              <strong>{auditStats?.totalActions || 0}</strong>
            </div>
            <div className="audit-stat">
              <span>Unique Users (24h):</span>
              <strong>{auditStats?.uniqueUsers || 0}</strong>
            </div>
            <div className="audit-stat">
              <span>Failed Actions (24h):</span>
              <strong className="error-text">{auditStats?.failedActions || 0}</strong>
            </div>
          </div>

          <div className="action-breakdown">
            <h3>Actions by Type</h3>
            <div className="action-stats">
              {auditStats?.actionsByType?.map((action) => (
                <div key={action._id} className="action-item">
                  <span className="action-type">{action._id}</span>
                  <span className="action-count">{action.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AdminPortalLayout>
  );
}

export default AdminDashboard;
