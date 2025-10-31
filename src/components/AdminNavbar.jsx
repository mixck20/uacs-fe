import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaCog, FaUsers, FaChartLine, FaFileAlt, FaComments, FaPills, FaBuilding } from 'react-icons/fa';
import { AuthAPI } from '../api';
import './AdminNavbar.css';

function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSettingsDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await AuthAPI.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-container">
        <div className="admin-navbar-brand">
          <Link to="/admin">UA Clinic System</Link>
        </div>
        
        <div className="admin-navbar-links">
          <Link 
            to="/admin" 
            className={isActive('/admin') ? 'active' : ''}
          >
            <FaChartLine /> Dashboard
          </Link>
          <Link 
            to="/admin/users" 
            className={isActive('/admin/users') ? 'active' : ''}
          >
            <FaUsers /> Users
          </Link>
          <Link 
            to="/admin/departments" 
            className={isActive('/admin/departments') ? 'active' : ''}
          >
            <FaBuilding /> Departments
          </Link>
          <Link 
            to="/admin/audit-logs" 
            className={isActive('/admin/audit-logs') ? 'active' : ''}
          >
            <FaFileAlt /> Audit Logs
          </Link>
          <Link 
            to="/admin/feedback" 
            className={isActive('/admin/feedback') ? 'active' : ''}
          >
            <FaComments /> Feedback
          </Link>
          <Link 
            to="/admin/dispensing" 
            className={isActive('/admin/dispensing') ? 'active' : ''}
          >
            <FaPills /> Dispensing
          </Link>
        </div>

        <div className="admin-navbar-user" ref={dropdownRef}>
          <button 
            className="settings-icon-btn"
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
            title="Settings"
          >
            <FaCog className={showSettingsDropdown ? 'rotating' : ''} />
          </button>
          
          {showSettingsDropdown && (
            <div className="settings-dropdown">
              <div className="dropdown-user-info">
                <FaUser />
                <div>
                  <div className="dropdown-user-name">{user.name || 'Admin'}</div>
                  <div className="dropdown-user-role">{user.role || 'Administrator'}</div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <Link to="/admin/settings" className="dropdown-item">
                <FaCog /> Account Settings
              </Link>
              <button onClick={handleLogout} className="dropdown-item logout">
                <FaSignOutAlt /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default AdminNavbar;
