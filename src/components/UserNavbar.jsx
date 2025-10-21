import React from "react";
import { FaUser, FaBell, FaSignOutAlt } from "react-icons/fa";
import "./UserNavbar.css";

const UserNavbar = ({ user, onLogout }) => {
  const name = user?.firstName ? `${user.firstName} ${user.lastName}` : "User";
  const userRole = user?.role || "Student/Faculty";

  return (
    <nav className="portal-navbar">
      <div className="nav-left">
        <div className="nav-brand">UA Clinic System</div>
      </div>

      <div className="nav-center">
        <div className="nav-links">
          <a href="#dashboard" className="nav-link active">Dashboard</a>
          <a href="#appointments" className="nav-link">Appointments</a>
          <a href="#records" className="nav-link">Health Records</a>
          <a href="#certificates" className="nav-link">Certificates</a>
          <a href="#feedback" className="nav-link">Feedback</a>
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