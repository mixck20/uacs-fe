import React, { useState } from 'react';
import { FaUser, FaLock, FaBell, FaSave, FaKey } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { AuthAPI } from '../api';
import UserPortalLayout from './UserPortalLayout';
import './UserSettings.css';

const UserSettings = ({ user, onLogout, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile form
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    department: user?.department || '',
    course: user?.course || '',
    yearLevel: user?.yearLevel || '',
    section: user?.section || '',
    contactNumber: user?.contactNumber || '',
    emailUpdates: user?.emailUpdates || false
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await AuthAPI.updateProfile(profileData);
      
      // Update local user state
      if (onUserUpdate && response.user) {
        onUserUpdate(response.user);
      }

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        text: 'Your profile has been updated successfully.',
        confirmButtonColor: '#e51d5e'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message || 'Failed to update profile. Please try again.',
        confirmButtonColor: '#e51d5e'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'New password and confirm password do not match.',
        confirmButtonColor: '#e51d5e'
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Swal.fire({
        icon: 'error',
        title: 'Weak Password',
        text: 'Password must be at least 8 characters long.',
        confirmButtonColor: '#e51d5e'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await AuthAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      // Check if email verification is required
      if (response.requiresVerification) {
        await Swal.fire({
          icon: 'info',
          title: 'Verification Email Sent',
          html: `
            <p>${response.message || 'Please check your email to verify and complete the password change.'}</p>
            <p style="margin-top: 10px; color: #666;">You will be logged out for security purposes.</p>
          `,
          confirmButtonColor: '#e51d5e',
          confirmButtonText: 'OK'
        });
        
        // Logout user for security
        setTimeout(() => {
          onLogout();
        }, 500);
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'Password Changed!',
          text: 'Your password has been changed successfully. Please login again.',
          confirmButtonColor: '#e51d5e'
        });
        
        // Logout user for security
        setTimeout(() => {
          onLogout();
        }, 500);
      }

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Change password error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Change Failed',
        text: error.message || 'Failed to change password. Please try again.',
        confirmButtonColor: '#e51d5e'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserPortalLayout user={user} onLogout={onLogout} currentPage="settings">
      <div className="settings-page">
        <div className="settings-header">
          <h1>Settings</h1>
          <p className="settings-subtitle">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUser /> Profile
          </button>
          <button
            className={`settings-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <FaLock /> Password
          </button>
          <button
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FaBell /> Notifications
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile Information</h2>
              <p className="section-description">Update your personal information</p>
              
              <form onSubmit={handleProfileSubmit} className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="disabled-input"
                  />
                  <small className="field-note">Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                    placeholder="e.g., College of Computer Studies"
                    disabled
                    className="disabled-input"
                  />
                  <small className="field-note">Department cannot be changed</small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="course">Course</label>
                    <input
                      type="text"
                      id="course"
                      name="course"
                      value={profileData.course}
                      onChange={handleProfileChange}
                      placeholder="e.g., BSIT"
                      disabled
                      className="disabled-input"
                    />
                    <small className="field-note">Course cannot be changed</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="yearLevel">Year Level</label>
                    <select
                      id="yearLevel"
                      name="yearLevel"
                      value={profileData.yearLevel}
                      onChange={handleProfileChange}
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="section">Section</label>
                  <input
                    type="text"
                    id="section"
                    name="section"
                    value={profileData.section}
                    onChange={handleProfileChange}
                    placeholder="e.g., A, B, 1 (optional)"
                    maxLength="5"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactNumber">Contact Number</label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={profileData.contactNumber}
                    onChange={handleProfileChange}
                    placeholder="e.g., 09123456789"
                  />
                </div>

                <button type="submit" className="settings-save-btn" disabled={loading}>
                  <FaSave /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="settings-section">
              <h2>Change Password</h2>
              <p className="section-description">Ensure your account is secure</p>
              
              <form onSubmit={handlePasswordSubmit} className="settings-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <small className="field-note">Minimum 8 characters</small>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="security-notice">
                  <p>A verification email will be sent to confirm your password change</p>
                </div>

                <button type="submit" className="settings-save-btn" disabled={loading}>
                  <FaKey /> {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <p className="section-description">Choose how you want to be notified</p>
              
              <form onSubmit={handleProfileSubmit} className="settings-form">
                <div className="notification-setting">
                  <div className="setting-info">
                    <h3>Email Notifications</h3>
                    <p>Receive updates about your appointments and health records via email</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="emailUpdates"
                      checked={profileData.emailUpdates}
                      onChange={handleProfileChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <button type="submit" className="settings-save-btn" disabled={loading}>
                  <FaSave /> {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </UserPortalLayout>
  );
};

export default UserSettings;
