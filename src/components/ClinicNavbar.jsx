import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { NotificationsAPI } from '../api';
import './ClinicNavbar.css';

const ClinicNavbar = ({ activePage, setActivePage, onLogout, user }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const settingsRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettingsDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const data = await NotificationsAPI.getUserNotifications();
      setNotifications(data.slice(0, 5)); // Show only last 5 notifications
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  async function loadUnreadCount() {
    try {
      const data = await NotificationsAPI.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }

  async function markAsRead(id) {
    try {
      await NotificationsAPI.markAsRead(id);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      await NotificationsAPI.markAllAsRead();
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  }

  const handleNavClick = (page) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  return (
    <nav className="clinic-navbar">
      <div className="clinic-brand">UA Clinic System</div>
      
      <button 
        className="clinic-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`clinic-nav-links ${menuOpen ? 'open' : ''}`}>
        <span 
          className={`clinic-nav-link ${activePage === "dashboard" ? "active" : ""}`}
          onClick={() => handleNavClick("dashboard")}
        >
          Dashboard
        </span>
        <span 
          className={`clinic-nav-link ${activePage === "patients" ? "active" : ""}`}
          onClick={() => handleNavClick("patients")}
        >
          Patients
        </span>
        <span 
          className={`clinic-nav-link ${activePage === "appointment" ? "active" : ""}`}
          onClick={() => handleNavClick("appointment")}
        >
          Appointments
        </span>
        <span 
          className={`clinic-nav-link ${activePage === "inventory" ? "active" : ""}`}
          onClick={() => handleNavClick("inventory")}
        >
          Inventory
        </span>
        <span 
          className={`clinic-nav-link ${activePage === "ehr" ? "active" : ""}`}
          onClick={() => handleNavClick("ehr")}
        >
          EHR
        </span>
        <span 
          className={`clinic-nav-link ${activePage === "schedule" ? "active" : ""}`}
          onClick={() => handleNavClick("schedule")}
        >
          Schedule
        </span>
      </div>
      
      {/* Notification Bell */}
      <div className="clinic-notification-container">
        <button 
          className="clinic-notification-bell"
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label="Notifications"
        >
          <FaBell />
          {unreadCount > 0 && (
            <span className="clinic-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {showNotifications && (
          <div className="clinic-notification-dropdown">
            <div className="clinic-notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="mark-all-read-btn">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="clinic-notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">No notifications</div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification._id}
                    className={`clinic-notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => !notification.read && markAsRead(notification._id)}
                  >
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{getTimeAgo(notification.createdAt)}</div>
                    </div>
                    {!notification.read && <div className="notification-dot"></div>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Dropdown */}
      <div className="clinic-settings-wrapper" ref={settingsRef}>
        <button 
          className="clinic-settings-icon-btn"
          onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
          title="Settings"
        >
          <FaCog className={showSettingsDropdown ? 'rotating' : ''} />
        </button>
        
        {showSettingsDropdown && (
          <div className="clinic-settings-dropdown">
            <div className="clinic-dropdown-user-info">
              <FaUser />
              <div>
                <div className="clinic-dropdown-user-name">{user?.name || 'Clinic Staff'}</div>
                <div className="clinic-dropdown-user-role">{user?.role || 'Staff'}</div>
              </div>
            </div>
            <div className="clinic-dropdown-divider"></div>
            <button 
              className="clinic-dropdown-item"
              onClick={() => {
                handleNavClick("settings");
                setShowSettingsDropdown(false);
              }}
            >
              <FaCog /> Account Settings
            </button>
            <button 
              className="clinic-dropdown-item clinic-logout"
              onClick={() => {
                setShowSettingsDropdown(false);
                onLogout();
              }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default ClinicNavbar;