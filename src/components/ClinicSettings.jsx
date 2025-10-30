import React, { useState, useEffect } from 'react';
import ClinicNavbar from './ClinicNavbar';
import { AuthAPI } from '../api';
import Swal from 'sweetalert2';
import { FaUser, FaEnvelope, FaLock, FaShieldAlt, FaSignOutAlt } from 'react-icons/fa';
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
    
    // Check if email changed - require password
    if (profileData.email !== currentUser.email && !profileData.currentPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Required',
        text: 'Please enter your current password to change your email',
        confirmButtonColor: '#e51d5e'
      });
      return;
    }

    try {
      const result = await Swal.fire({
        title: 'Update Profile?',
        text: profileData.email !== currentUser.email 
          ? 'A verification email will be sent to your new email address'
          : 'Are you sure you want to update your profile?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#e51d5e',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, update it!'
      });

      if (!result.isConfirmed) return;

      const updateData = {
        name: profileData.name,
        ...(profileData.email !== currentUser.email && {
          email: profileData.email,
          currentPassword: profileData.currentPassword
        })
      };

      await AuthAPI.updateProfile(updateData);

      // Update local storage
      const updatedUser = { ...currentUser, name: profileData.name };
      if (profileData.email === currentUser.email) {
        updatedUser.email = profileData.email;
      }
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        text: profileData.email !== currentUser.email
          ? 'Please check your new email to verify the change'
          : 'Your profile has been updated successfully',
        confirmButtonColor: '#e51d5e'
      });

      // Clear password field
      setProfileData(prev => ({ ...prev, currentPassword: '' }));

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
                className={`settings-tab ${activeTab === 'logout' ? 'active' : ''}`}
                onClick={() => setActiveTab('logout')}
              >
                <FaSignOutAlt /> Logout
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
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        required
                      />
                      {profileData.email !== user?.email && (
                        <small className="form-hint">
                          A verification email will be sent to the new address
                        </small>
                      )}
                    </div>

                    {profileData.email !== user?.email && (
                      <div className="form-group">
                        <label><FaLock /> Current Password (required for email change)</label>
                        <input
                          type="password"
                          value={profileData.currentPassword}
                          onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                          placeholder="Enter your current password"
                        />
                      </div>
                    )}

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

            {/* Logout Tab */}
            {activeTab === 'logout' && (
              <div className="settings-content">
                <div className="settings-section">
                  <h2>Logout</h2>
                  <p className="section-description">Sign out of your account</p>

                  <div className="logout-section">
                    <div className="logout-info">
                      <FaSignOutAlt size={48} color="#e51d5e" />
                      <h3>Ready to leave?</h3>
                      <p>Click the button below to safely log out of your account.</p>
                    </div>

                    <button 
                      className="btn-logout" 
                      onClick={onLogout}
                    >
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClinicSettings;
