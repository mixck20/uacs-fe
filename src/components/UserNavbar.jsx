import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBell, FaCheckCircle, FaTimesCircle, FaCalendarCheck, FaEnvelope, FaCog, FaUser, FaLock, FaSignOutAlt } from "react-icons/fa";
import { NotificationsAPI } from "../api";
import "./UserNavbar.css";

const UserNavbar = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = React.useRef(null);
  const settingsRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const data = await NotificationsAPI.getUserNotifications();
      
      // Transform backend notifications to frontend format
      const transformedNotifications = data.map(notif => ({
        id: notif._id,
        type: getNotificationType(notif.type),
        title: notif.title,
        message: notif.message,
        time: formatNotificationTime(notif.createdAt),
        data: notif.data,
        read: notif.read
      }));

      // Add email verification notification from localStorage if exists
      const verifiedEmail = localStorage.getItem('verifiedEmail');
      const verificationTime = localStorage.getItem('verificationTime');
      
      if (verifiedEmail && verificationTime) {
        const emailNotification = {
          id: 'email-verification',
          type: 'success',
          title: 'Email Verified',
          message: `Your email (${verifiedEmail}) has been successfully verified.`,
          time: verificationTime,
          read: false
        };
        
        // Only add if not already in the list
        if (!transformedNotifications.find(n => n.id === 'email-verification')) {
          transformedNotifications.unshift(emailNotification);
        }
      }

      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Get notification type class for styling
  const getNotificationType = (type) => {
    switch (type) {
      case 'appointment_confirmed':
        return 'success';
      case 'appointment_declined':
        return 'error';
      case 'appointment_completed':
        return 'info';
      case 'appointment_rescheduled':
        return 'warning';
      case 'clinic_message':
        return 'message';
      case 'email_verification':
        return 'success';
      default:
        return 'info';
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle />;
      case 'error':
        return <FaTimesCircle />;
      case 'info':
        return <FaCalendarCheck />;
      case 'warning':
        return <FaCalendarCheck />;
      case 'message':
        return <FaEnvelope />;
      default:
        return <FaBell />;
    }
  };

  // Format notification time
  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  const clearNotification = async (id) => {
    // Handle email verification notification separately
    if (id === 'email-verification') {
      setNotifications(prev => prev.filter(n => n.id !== id));
      localStorage.removeItem('verifiedEmail');
      localStorage.removeItem('verificationTime');
      return;
    }

    try {
      await NotificationsAPI.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await NotificationsAPI.deleteAllNotifications();
      localStorage.removeItem('verifiedEmail');
      localStorage.removeItem('verificationTime');
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    if (id === 'email-verification') return; // Skip localStorage notifications
    
    try {
      await NotificationsAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <nav className="user-navbar">
      <div className="user-brand">UA Clinic System</div>
      
      <button 
        className="user-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`user-nav-links ${menuOpen ? 'open' : ''}`}>
        <Link 
          to="/dashboard" 
          className={`user-nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          Dashboard
        </Link>
        <Link 
          to="/appointments" 
          className={`user-nav-link ${location.pathname === '/appointments' ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          Appointments
        </Link>
        <Link 
          to="/records" 
          className={`user-nav-link ${location.pathname === '/records' ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          Medical Records
        </Link>
        <Link 
          to="/feedback" 
          className={`user-nav-link ${location.pathname === '/feedback' ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          Feedback
        </Link>
        <Link 
          to="/schedule" 
          className={`user-nav-link ${location.pathname === '/schedule' ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          Schedule
        </Link>
      </div>
      
      <div className="user-nav-right">
        <div className="user-notification-wrapper" ref={notificationRef}>
          <button 
            className="user-notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <FaBell />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="user-notification-badge">{notifications.filter(n => !n.read).length}</span>
            )}
          </button>

          {showNotifications && (
            <div className="user-notification-dropdown">
              <div className="user-notification-header">
                <h3>Notifications</h3>
                <div className="notification-actions">
                  {notifications.some(n => !n.read) && (
                    <button 
                      className="mark-all-read-btn"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      className="clear-all-btn"
                      onClick={clearAllNotifications}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              <div className="user-notification-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <FaBell />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${notification.type} ${notification.read ? 'read' : ''}`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                      style={{ cursor: notification.read ? 'default' : 'pointer' }}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                      <button 
                        className="notification-close"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings Dropdown */}
        <div className="user-settings-wrapper" ref={settingsRef}>
          <button 
            className="user-settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Settings"
          >
            <FaCog />
          </button>

          {showSettings && (
            <div className="user-settings-dropdown">
              <div className="settings-user-info">
                <div className="settings-user-avatar">
                  <FaUser />
                </div>
                <div className="settings-user-details">
                  <h4>{user?.firstName} {user?.lastName}</h4>
                  <p>{user?.email}</p>
                </div>
              </div>
              <div className="settings-menu">
                <button 
                  className="settings-menu-item"
                  onClick={() => {
                    navigate('/settings');
                    setShowSettings(false);
                  }}
                >
                  <FaCog />
                  <span>Account Settings</span>
                </button>
                <div className="settings-divider"></div>
                <button 
                  className="settings-menu-item logout-item"
                  onClick={() => {
                    setShowSettings(false);
                    onLogout();
                  }}
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default UserNavbar;