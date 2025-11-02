import React, { useState, useEffect } from 'react';
import AdminPortalLayout from './AdminPortalLayout';
import { AdminAPI } from '../api';
import { FaSearch, FaFileDownload, FaFilter } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './AuditLogs.css';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resource: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [pagination.page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await AdminAPI.getAuditLogs(pagination.page, pagination.limit, filters);
      setLogs(data.logs || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      Swal.fire('Error', error.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await AdminAPI.getAuditStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExport = async () => {
    try {
      await AdminAPI.exportAuditLogs(filters);
      Swal.fire('Success', 'Audit logs exported successfully', 'success');
    } catch (error) {
      Swal.fire('Error', error.message || 'Failed to export audit logs', 'error');
    }
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      action: '',
      resource: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'success') return 'success';
    if (statusLower === 'failure' || statusLower === 'failed' || statusLower === 'error') return 'error';
    return 'warning';
  };

  return (
    <AdminPortalLayout>
      <div className="audit-logs">
        <div className="page-header">
          <h1>Audit Logs</h1>
          <button className="btn-export" onClick={handleExport}>
            <FaFileDownload /> Export CSV
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="stats-row">
            <div className="stat-card blue">
              <h3>Total Actions (24h)</h3>
              <p>{stats.totalActions || 0}</p>
            </div>
            <div className="stat-card green">
              <h3>Unique Users (24h)</h3>
              <p>{stats.uniqueUsers || 0}</p>
            </div>
            <div className="stat-card red">
              <h3>Failed Actions (24h)</h3>
              <p>{stats.failedActions || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-card">
          <div className="filters-header">
            <h3><FaFilter /> Filters</h3>
            <button className="btn-clear" onClick={clearFilters}>Clear All</button>
          </div>
          
          <div className="filters-grid">
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                name="search"
                placeholder="Search description..."
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label>Action</label>
              <select name="action" value={filters.action} onChange={handleFilterChange}>
                <option value="">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="LOGIN_FAILED">Login Failed</option>
                <option value="CREATE">Create</option>
                <option value="READ">Read</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="EXPORT">Export</option>
                <option value="DOWNLOAD">Download</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Resource</label>
              <select name="resource" value={filters.resource} onChange={handleFilterChange}>
                <option value="">All Resources</option>
                <option value="User">User</option>
                <option value="Patient">Patient</option>
                <option value="Appointment">Appointment</option>
                <option value="Inventory">Inventory</option>
                <option value="Schedule">Schedule</option>
                <option value="Certificate">Certificate</option>
                <option value="Feedback">Feedback</option>
                <option value="Notification">Notification</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="no-data">No audit logs found</div>
          ) : (
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="timestamp-cell">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>{log.user?.name || log.user?.email || 'System'}</td>
                    <td>
                      <span className={`action-badge ${log.action.toLowerCase()}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="resource-badge">
                        {log.resource}
                      </span>
                    </td>
                    <td className="description-cell">{log.description}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit) || 1}</span>
          <button
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>
        </div>
      </div>
    </AdminPortalLayout>
  );
}

export default AuditLogs;
