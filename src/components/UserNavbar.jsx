import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaUser, FaBell, FaSignOutAlt } from "react-icons/fa";
import "./UserNavbar.css";

const UserNavbar = ({ user, onLogout }) => {
  const location = useLocation();
  const name = user?.firstName ? `${user.firstName} ${user.lastName}` : "User";
  const userRole = user?.role || "Student/Faculty";

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
        </div>
      </div>

      <div className="nav-right">
        <button className="nav-notification">
          <FaBell />
          <span className="notification-badge">2</span>
        </button>
        
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