import React, { useState, useEffect } from 'react';
import AdminPortalLayout from './AdminPortalLayout';
import { AuthAPI } from '../api';
import Swal from 'sweetalert2';
import { FaUser, FaEnvelope, FaLock, FaShieldAlt } from 'react-icons/fa';
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
        </div>
      </div>
    </AdminPortalLayout>
  );
}

export default AdminSettings;
