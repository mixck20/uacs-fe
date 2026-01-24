import React, { useState, useEffect } from 'react';
import ClinicNavbar from './ClinicNavbar';
import { AuthAPI, AdminAPI } from '../api';
import Swal from 'sweetalert2';
import { FaUser, FaEnvelope, FaLock, FaShieldAlt, FaSignOutAlt, FaDownload, FaUpload, FaDatabase } from 'react-icons/fa';
import './ClinicSettings.css';

function ClinicSettings({ onLogout, activePage, setActivePage, user: userProp }) {
  const [currentUser, setCurrentUser] = useState(null);
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

  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(userData);
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
        text: 'Are you sure you want to update your name?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#e51d5e',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, update it!'
      });

      if (!result.isConfirmed) return;

      const updateData = {
        name: profileData.name
      };

      await AuthAPI.updateProfile(updateData);

      // Update local storage
      const updatedUser = { ...currentUser, name: profileData.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        text: 'Your name has been updated successfully',
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

    // Validate password strength
    const passwordErrors = [];
    if (passwordData.newPassword.length < 8) {
      passwordErrors.push("at least 8 characters");
    }
    if (!/[A-Z]/.test(passwordData.newPassword)) {
      passwordErrors.push("one uppercase letter");
    }
    if (!/[a-z]/.test(passwordData.newPassword)) {
      passwordErrors.push("one lowercase letter");
    }
    if (!/[0-9]/.test(passwordData.newPassword)) {
      passwordErrors.push("one number");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword)) {
      passwordErrors.push("one special character");
    }
    
    if (passwordErrors.length > 0) {
      setShowPasswordRequirements(true);
      Swal.fire({
        icon: 'error',
        title: 'Weak Password',
        html: `Password must contain:<br/>• ${passwordErrors.join("<br/>• ")}`,
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

  if (loading) {
    return (
      <div className="clinic-portal">
        <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} user={userProp} />
        <div className="clinic-settings">
          <div className="loading-spinner">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="clinic-portal">
      <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} user={userProp} />
      <div className="clinic-settings">
        <div className="clinic-settings-container">
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
                    </div>

                    <div className="form-actions">
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
                      <span className="info-value">{currentUser?.role || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Account Status:</span>
                      <span className={`info-badge ${currentUser?.isVerified ? 'verified' : 'unverified'}`}>
                        {currentUser?.isVerified ? 'Verified' : 'Unverified'}
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
                        placeholder="Enter new password"
                      />
                    </div>

                    {showPasswordRequirements && (
                      <div className="password-requirements">
                        <small>Password must contain:</small>
                        <ul>
                          <li>At least 8 characters</li>
                          <li>One uppercase letter (A-Z)</li>
                          <li>One lowercase letter (a-z)</li>
                          <li>One number (0-9)</li>
                          <li>One special character (!@#$%^&*)</li>
                        </ul>
                      </div>
                    )}

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
                  <h2>System Data Backup</h2>
                  <p className="section-description">
                    Create a backup of all system data including patients, users, appointments, inventory, and more
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
                  </div>

                  <div className="backup-instructions">
                    <h4>Instructions</h4>
                    <ol>
                      <li><strong>Create Backup:</strong> Click "Create System Backup" to download a JSON file with all your system data</li>
                      <li><strong>Safe Storage:</strong> Keep the backup file in a safe location for disaster recovery</li>
                      <li><strong>Admin Only:</strong> Only admin users can restore data from backups</li>
                    </ol>
                  </div>

                  <div className="backup-warning">
                    <FaShieldAlt />
                    <div>
                      <h4>ℹ️ Important Notes</h4>
                      <ul>
                        <li>You can create backups as a clinic staff member</li>
                        <li>Only Admin users can restore system data from backups</li>
                        <li>All backup actions are logged in the audit trail</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}          </div>
        </div>
      </div>
    </div>
  );
}

export default ClinicSettings;
