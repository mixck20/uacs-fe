import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaUser, FaBell, FaSignOutAlt, FaCheckCircle } from "react-icons/fa";
import "./UserNavbar.css";

const UserNavbar = ({ user, onLogout }) => {
  const location = useLocation();
  const name = user?.firstName ? `${user.firstName} ${user.lastName}` : "User";
  const userRole = user?.role || "Student/Faculty";
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = React.useRef(null);

  useEffect(() => {
    // Add click outside handler
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Check if there's a verification notification
    const verifiedEmail = localStorage.getItem('verifiedEmail');
    const verificationTime = localStorage.getItem('verificationTime');
    
    // For testing - ensure we have a notification
    if (!verifiedEmail) {
      localStorage.setItem('verifiedEmail', 'test@example.com');
      localStorage.setItem('verificationTime', new Date().toLocaleString());
    }
    
    const testEmail = localStorage.getItem('verifiedEmail');
    const testTime = localStorage.getItem('verificationTime');
    
    if (testEmail && testTime) {
      const newNotification = {
        id: 'email-verification',
        type: 'success',
        icon: <FaCheckCircle className="notification-icon success" />,
        title: 'Email Verified',
        message: `Your email (${testEmail}) has been successfully verified.`,
        time: testTime
      };

      setNotifications(prev => {
        // Only add if not already present
        if (!prev.find(n => n.id === 'email-verification')) {
          return [...prev, newNotification];
        }
        return prev;
      });
    }
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (id === 'email-verification') {
      localStorage.removeItem('verifiedEmail');
      localStorage.removeItem('verificationTime');
    }
  };

  return (
    <nav className="portal-navbar">
      <div className="nav-left">
        <div className="nav-brand">UA Clinic System</div>
      </div>

      <div className="nav-center">
        <div className="nav-links">
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/appointments" className={`nav-link ${location.pathname === '/appointments' ? 'active' : ''}`}>Appointments</Link>
          <Link to="/records" className={`nav-link ${location.pathname === '/records' ? 'active' : ''}`}>Health Records</Link>
          <Link to="/feedback" className={`nav-link ${location.pathname === '/feedback' ? 'active' : ''}`}>Feedback</Link>
        </div>
      </div>

      <div className="nav-right">
        <div className="notification-wrapper" ref={notificationRef}>
          <button className="nav-notification" onClick={handleNotificationClick}>
            <FaBell />
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </button>
          
          {showNotifications && notifications.length > 0 && (
            <div className="notifications-dropdown">
              {notifications.map(notification => (
                <div key={notification.id} className="notification-item">
                  {notification.icon}
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{notification.time}</div>
                  </div>
                  <button 
                    className="notification-close"
                    onClick={() => clearNotification(notification.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="nav-user">
          <div className="user-icon">
            <FaUser />
          </div>
          <div className="user-info">
            <span className="user-name">{name}</span>
            <span className="user-role">{userRole}</span>
          </div>
          <button className="nav-logout" onClick={onLogout}>
            <FaSignOutAlt />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default UserNavbar;