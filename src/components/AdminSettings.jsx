import React, { useState, useEffect } from 'react';
import AdminPortalLayout from './AdminPortalLayout';
import { AuthAPI, AdminAPI } from '../api';
import Swal from 'sweetalert2';
import { FaUser, FaEnvelope, FaLock, FaShieldAlt, FaDownload, FaUpload, FaDatabase } from 'react-icons/fa';
import './AdminSettings.css';

function AdminSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: ''
  });
  
  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        currentPassword: ''
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    try {
      const result = await Swal.fire({
        title: 'Update Profile?',
        text: 'Are you sure you want to update your profile?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#e51d5e',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, update it!'
      });

      if (!result.isConfirmed) return;

      await AuthAPI.updateProfile({
        name: profileData.name
      });

      // Update local storage
      const updatedUser = { ...user, name: profileData.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        text: 'Your profile has been updated successfully',
        confirmButtonColor: '#e51d5e'
      });

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message || 'Failed to update profile',
        confirmButtonColor: '#e51d5e'
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'New password and confirmation do not match',
        confirmButtonColor: '#e51d5e'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Password Too Short',
        text: 'Password must be at least 6 characters long',
        confirmButtonColor: '#e51d5e'
      });
      return;
    }

    try {
      const result = await Swal.fire({
        title: 'Change Password?',
        text: 'A verification email will be sent to confirm this change',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e51d5e',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, change it!'
      });

      if (!result.isConfirmed) return;

      await AuthAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      Swal.fire({
        icon: 'success',
        title: 'Verification Email Sent!',
        text: 'Please check your email to verify the password change',
        confirmButtonColor: '#e51d5e'
      });

      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Change Failed',
        text: error.message || 'Failed to change password',
        confirmButtonColor: '#e51d5e'
      });
    }
  };

  const handleBackupSystem = async () => {
    try {
      Swal.fire({
        title: 'Creating System Backup',
        html: 'Creating a complete backup of all system data. This may take a moment...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const backupData = await AdminAPI.backupSystemData();

      // Download backup file
      const backupJson = JSON.stringify(backupData, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Backup Successful',
        html: `<p>System backup created successfully</p>
               <p style="font-size: 0.9em; color: #666;">
                 <strong>${backupData.totalRecords}</strong> total records backed up across 10 collections<br>
                 File: system-backup-${new Date().toISOString().split('T')[0]}.json
               </p>`,
        confirmButtonColor: '#10b981'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Backup Failed',
        text: error.message || 'Failed to create system backup',
        confirmButtonColor: '#e51d5e'
      });
    }
  };

  const handleRestoreSystem = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        Swal.fire({
          title: 'File Too Large',
          text: 'Backup file must be less than 100MB',
          icon: 'error',
          confirmButtonColor: '#e51d5e'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const backupData = JSON.parse(event.target.result);

          // Validate backup format
          if (!backupData.collections) {
            Swal.fire({
              title: 'Invalid Backup',
              text: 'The backup file format is invalid. Please use a valid system backup file.',
              icon: 'error',
              confirmButtonColor: '#e51d5e'
            });
            return;
          }

          // Show critical confirmation
          const result = await Swal.fire({
            title: '⚠️ System Restore Warning',
            html: `<p style="color: #d32f2f; font-weight: bold;">This will restore <strong>${backupData.totalRecords}</strong> records across all system collections.</p>
                   <p style="color: #666; font-size: 0.9em; margin-top: 10px;">
                     Existing data will be merged and duplicates will be updated.
                   </p>
                   <p style="color: #d32f2f; font-weight: bold; margin-top: 10px;">
                     ⚠️ This action cannot be undone! Make sure you have a current backup.
                   </p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Restore System Data',
            cancelButtonColor: '#6b7280',
            confirmButtonColor: '#d32f2f',
            input: 'checkbox',
            inputValue: 0,
            inputPlaceholder: 'I understand this action cannot be undone'
          });

          if (!result.isConfirmed) return;

          // Show loading
          Swal.fire({
            title: 'Restoring System Data',
            html: 'Please wait while we restore all system data. This may take several minutes...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          // Submit restore request
          const response = await AdminAPI.restoreSystemData(backupData);

          // Show detailed results
          const collectionSummary = Object.entries(response.results.collections)
            .map(([name, stats]) => `<li>${name}: ${stats.restored} created, ${stats.updated} updated</li>`)
            .join('');

          let message = `<strong>System Restore Completed!</strong><br><br>`;
          message += `Total - Created: ${response.results.totalRestored}, Updated: ${response.results.totalUpdated}, Skipped: ${response.results.totalSkipped}<br><br>`;
          message += `<strong>By Collection:</strong><ul style="text-align: left;">${collectionSummary}</ul>`;

          Swal.fire({
            title: 'Restore Summary',
            html: message,
            icon: 'success',
            confirmButtonColor: '#10b981'
          });
        } catch (error) {
          Swal.fire({
            title: 'Restore Failed',
            text: error.message || 'Failed to process system restore',
            icon: 'error',
            confirmButtonColor: '#e51d5e'
          });
        }
      };

      reader.readAsText(file);
    };

    input.click();
  };

  if (loading) {
    return (
      <AdminPortalLayout>
        <div className="admin-settings">
          <div className="loading-spinner">Loading settings...</div>
        </div>
      </AdminPortalLayout>
    );
  }

  return (
    <AdminPortalLayout>
      <div className="admin-settings">
        <h1>Account Settings</h1>

        <div className="settings-container">
          {/* Tabs */}
          <div className="settings-tabs">
            <button
              className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <FaUser /> Profile Information
            </button>
            <button
              className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <FaShieldAlt /> Security
            </button>
            <button
              className={`settings-tab ${activeTab === 'backup' ? 'active' : ''}`}
              onClick={() => setActiveTab('backup')}
            >
              <FaDatabase /> System Backup
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-content">
              <div className="settings-section">
                <h2>Profile Information</h2>
                <p className="section-description">Update your account information</p>

                <form onSubmit={handleProfileUpdate} className="settings-form">
                  <div className="form-group">
                    <label><FaUser /> Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      required
                    />
                  </div>

                    <div className="form-group">
                      <label><FaEnvelope /> Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="disabled-input"
                      />
                    </div>                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      Update Profile
                    </button>
                  </div>
                </form>
              </div>

              <div className="settings-section">
                <h2>Account Details</h2>
                <div className="account-info">
                  <div className="info-item">
                    <span className="info-label">Role:</span>
                    <span className="info-value">{user?.role || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Account Status:</span>
                    <span className={`info-badge ${user?.isVerified ? 'verified' : 'unverified'}`}>
                      {user?.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-content">
              <div className="settings-section">
                <h2>Change Password</h2>
                <p className="section-description">Update your password to keep your account secure</p>

                <form onSubmit={handlePasswordChange} className="settings-form">
                  <div className="form-group">
                    <label><FaLock /> Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div className="form-group">
                    <label><FaLock /> New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>

                  <div className="form-group">
                    <label><FaLock /> Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      placeholder="Confirm your new password"
                    />
                  </div>

                  <div className="security-notice">
                    <FaShieldAlt />
                    <p>A verification email will be sent to confirm your password change</p>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* System Backup Tab */}
          {activeTab === 'backup' && (
            <div className="settings-content">
              <div className="settings-section">
                <h2>System Data Backup & Restore</h2>
                <p className="section-description">
                  Backup and restore all system data including patients, users, appointments, inventory, and more
                </p>

                <div className="backup-info-box">
                  <FaDatabase />
                  <div>
                    <h4>Complete System Backup</h4>
                    <p>Includes all data from 10 collections: Patients, Users, Appointments, Inventory, Medical Certificates, Emails, Chats, Feedback, Schedules, and Notifications</p>
                  </div>
                </div>

                <div className="backup-actions">
                  <button 
                    className="btn-backup btn-backup-primary" 
                    onClick={handleBackupSystem}
                  >
                    <FaDownload /> Create System Backup
                  </button>

                  <button 
                    className="btn-backup btn-backup-secondary" 
                    onClick={handleRestoreSystem}
                  >
                    <FaUpload /> Restore from Backup
                  </button>
                </div>

                <div className="backup-instructions">
                  <h4>Instructions</h4>
                  <ol>
                    <li><strong>Create Backup:</strong> Click "Create System Backup" to download a JSON file with all your system data</li>
                    <li><strong>Safe Storage:</strong> Keep the backup file in a safe location for disaster recovery</li>
                    <li><strong>Restore:</strong> To restore data, click "Restore from Backup" and select a valid backup file</li>
                    <li><strong>Data Merging:</strong> Restored data will be merged with existing data. Duplicates are automatically updated</li>
                  </ol>
                </div>

                <div className="backup-warning">
                  <FaShieldAlt />
                  <div>
                    <h4>⚠️ Important Notes</h4>
                    <ul>
                      <li>Only Admin users can restore system data</li>
                      <li>Clinic staff can create backups but cannot restore</li>
                      <li>Restore operations cannot be undone - ensure you have a backup before restoring</li>
                      <li>All backup/restore actions are logged in the audit trail</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPortalLayout>
  );
}

export default AdminSettings;
