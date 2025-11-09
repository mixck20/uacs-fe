import React, { useState, useEffect } from 'react';
import AdminPortalLayout from './AdminPortalLayout';
import { AdminAPI } from '../api';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaKey, FaBan, FaCheck, FaUpload, FaEye, FaFileDownload } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
  const [selectedUser, setSelectedUser] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: ''
  });

  const departments = [
    "College of Accountancy",
    "College of Hospitality and Tourism Management",
    "School of Business and Public Administration",
    "Institute of Theology and Religious Studies",
    "School of Education",
    "College of Nursing and Pharmacy",
    "School of Arts and Sciences",
    "College of Engineering and Architecture",
    "College of Information Technology"
  ];

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, statusFilter, searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [roleFilter, statusFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await AdminAPI.getAllUsers(
        pagination.page,
        pagination.limit,
        roleFilter,
        statusFilter,
        searchTerm
      );
      setUsers(data.users || []);
      setPagination(prev => ({ 
        ...prev, 
        total: data.pagination?.total || data.total || 0 
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire('Error', error.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      // Create CSV from current users data
      const csvHeader = 'Name,Email,Role,Status,Department,Registered Date\n';
      const csvRows = users.map(user => {
        const date = new Date(user.createdAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return [
          `"${(user.name || 'N/A').replace(/"/g, '""')}"`,
          user.email || 'N/A',
          user.role || 'N/A',
          user.isVerified ? 'Active' : 'Inactive',
          user.department || 'N/A',
          `${year}-${month}-${day}`
        ].join(',');
      }).join('\n');
      
      const csv = csvHeader + csvRows;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      Swal.fire({
        icon: 'success',
        title: 'Export Successful',
        text: 'Users list has been downloaded',
        confirmButtonColor: '#e51d5e'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: error.message || 'Failed to export users',
        confirmButtonColor: '#e51d5e'
      });
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.email || !form.password || !form.role) {
      Swal.fire('Missing Fields', 'Please fill in all required fields', 'warning');
      return;
    }

    try {
      await AdminAPI.createUser(form);
      Swal.fire('Success', 'User created successfully', 'success');
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      Swal.fire('Error', error.message || 'Failed to create user', 'error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.email || !form.role) {
      Swal.fire('Missing Fields', 'Please fill in all required fields', 'warning');
      return;
    }

    try {
      const updateData = { ...form };
      if (!updateData.password) delete updateData.password; // Don't update password if empty
      
      await AdminAPI.updateUser(selectedUser._id, updateData);
      Swal.fire('Success', 'User updated successfully', 'success');
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      Swal.fire('Error', error.message || 'Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const result = await Swal.fire({
      title: 'Delete User?',
      text: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await AdminAPI.deleteUser(userId);
        Swal.fire('Deleted!', 'User has been deleted.', 'success');
        fetchUsers();
      } catch (error) {
        Swal.fire('Error', error.message || 'Failed to delete user', 'error');
      }
    }
  };

  const handleResetPassword = async (userId, userName) => {
    const { value: newPassword } = await Swal.fire({
      title: 'Reset Password',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p style="margin-bottom: 15px; color: #333;">Enter new password for <strong>${userName}</strong></p>
          <input 
            type="password" 
            id="swal-input-password" 
            placeholder="Enter new password (min 6 characters)" 
            autocomplete="new-password"
            style="
              width: 100% !important;
              max-width: 100% !important;
              padding: 12px !important;
              font-size: 16px !important;
              border: 2px solid #ddd !important;
              border-radius: 6px !important;
              box-sizing: border-box !important;
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              margin: 0 auto !important;
              background: white !important;
              color: #333 !important;
            ">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Reset Password',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e51d5e',
      focusConfirm: false,
      didOpen: () => {
        // Focus on input when dialog opens
        const input = document.getElementById('swal-input-password');
        if (input) {
          setTimeout(() => input.focus(), 100);
        }
      },
      preConfirm: () => {
        const password = document.getElementById('swal-input-password').value;
        if (!password || password.length < 6) {
          Swal.showValidationMessage('Password must be at least 6 characters');
          return false;
        }
        return password;
      }
    });

    if (newPassword) {
      try {
        await AdminAPI.resetUserPassword(userId, newPassword);
        Swal.fire({
          title: 'Success',
          text: 'Password has been reset successfully',
          icon: 'success',
          confirmButtonColor: '#e51d5e'
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to reset password',
          icon: 'error',
          confirmButtonColor: '#e51d5e'
        });
      }
    }
  };

  const handleToggleStatus = async (userId, userName, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const result = await Swal.fire({
      title: `${newStatus === 'active' ? 'Activate' : 'Deactivate'} User?`,
      text: `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${userName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'active' ? '#10b981' : '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${newStatus === 'active' ? 'activate' : 'deactivate'}!`
    });

    if (result.isConfirmed) {
      try {
        await AdminAPI.toggleUserStatus(userId);
        Swal.fire('Success', `User has been ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
        fetchUsers();
      } catch (error) {
        Swal.fire('Error', error.message || 'Failed to toggle user status', 'error');
      }
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const userData = await AdminAPI.getUserById(userId);
      setSelectedUser(userData);
      setModalMode('view');
      setShowModal(true);
    } catch (error) {
      Swal.fire('Error', error.message || 'Failed to load user details', 'error');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || ''
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'student',
      department: ''
    });
    setSelectedUser(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <AdminPortalLayout>
      <div className="user-management">
        <div className="page-header">
          <h1>User Management</h1>
          <div className="header-actions">
            <button className="btn-export" onClick={handleExportUsers}>
              <FaFileDownload /> Export CSV
            </button>
            <button className="btn-primary" onClick={openCreateModal}>
              <FaPlus /> Add User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="clinic_staff">Clinic Staff</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="no-data">No users found</div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.department || '-'}</td>
                    <td>
                      <span className={`status-badge ${user.accountStatus || 'active'}`}>
                        {user.accountStatus || 'active'}
                      </span>
                    </td>
                    <td>
                      {user.isVerified ? (
                        <span className="verified-badge">✓</span>
                      ) : (
                        <span className="unverified-badge">✗</span>
                      )}
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => handleViewUser(user._id)}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => openEditModal(user)}
                        title="Edit User"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-icon btn-password"
                        onClick={() => handleResetPassword(user._id, user.name)}
                        title="Reset Password"
                      >
                        <FaKey />
                      </button>
                      <button
                        className={`btn-icon ${user.accountStatus === 'active' ? 'btn-deactivate' : 'btn-activate'}`}
                        onClick={() => handleToggleStatus(user._id, user.name, user.accountStatus || 'active')}
                        title={user.accountStatus === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {user.accountStatus === 'active' ? <FaBan /> : <FaCheck />}
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDeleteUser(user._id, user.name)}
                        title="Delete User"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="pagination-controls">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span className="page-number">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit) || 1}
              </span>
              <button
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {modalMode === 'create' && 'Create New User'}
                  {modalMode === 'edit' && 'Edit User'}
                  {modalMode === 'view' && 'User Details'}
                </h2>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>

              {modalMode === 'view' ? (
                <div className="user-details">
                  <div className="detail-row">
                    <strong>Name:</strong> {selectedUser.name}
                  </div>
                  <div className="detail-row">
                    <strong>Email:</strong> {selectedUser.email}
                  </div>
                  <div className="detail-row">
                    <strong>Role:</strong> <span className={`role-badge ${selectedUser.role}`}>{selectedUser.role}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Status:</strong> <span className={`status-badge ${selectedUser.accountStatus || 'active'}`}>{selectedUser.accountStatus || 'active'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Verified:</strong> {selectedUser.isVerified ? 'Yes' : 'No'}
                  </div>
                  <div className="detail-row">
                    <strong>Department:</strong> {selectedUser.department || 'N/A'}
                  </div>
                  <div className="detail-row">
                    <strong>Created:</strong> {new Date(selectedUser.createdAt).toLocaleString()}
                  </div>
                  <div className="detail-row">
                    <strong>Last Updated:</strong> {new Date(selectedUser.updatedAt).toLocaleString()}
                  </div>
                  
                  {selectedUser.loginHistory && selectedUser.loginHistory.length > 0 && (
                    <div className="login-history">
                      <h3>Recent Login History</h3>
                      {selectedUser.loginHistory.slice(0, 5).map((login, index) => (
                        <div key={index} className="login-item">
                          <div>{new Date(login.timestamp).toLocaleString()}</div>
                          <div className="login-ip">{login.ipAddress}</div>
                          <div className={`login-status ${login.status}`}>{login.status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={modalMode === 'create' ? handleCreateUser : handleUpdateUser}>
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Password {modalMode === 'create' ? '*' : '(leave blank to keep current)'}</label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleFormChange}
                      required={modalMode === 'create'}
                    />
                  </div>

                  <div className="form-group">
                    <label>Role *</label>
                    <select name="role" value={form.role} onChange={handleFormChange} required>
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="clinic_staff">Clinic Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Department *</label>
                    <select 
                      name="department" 
                      value={form.department} 
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {modalMode === 'create' ? 'Create User' : 'Update User'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminPortalLayout>
  );
}

export default UserManagement;
