import React, { useState } from "react";
import { FaFileAlt, FaDownload, FaShare, FaLock } from "react-icons/fa";
import UserPortalLayout from "./UserPortalLayout";
import "./UserHealthRecord.css";

const UserHealthRecord = ({ user, onLogout }) => {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <UserPortalLayout user={user} onLogout={onLogout}>
      <div className="health-records-page">
        <div className="page-header">
          <h1>Health Records</h1>
          <p className="user-info">
            {user?.fullName || user?.firstName || 'User'} {user?.role && `(${user.role})`}
          </p>
        </div>

        <div className="records-categories">
          <button 
            className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Records
          </button>
          <button 
            className={`category-btn ${activeCategory === 'consultations' ? 'active' : ''}`}
            onClick={() => setActiveCategory('consultations')}
          >
            Consultations
          </button>
          <button 
            className={`category-btn ${activeCategory === 'lab' ? 'active' : ''}`}
            onClick={() => setActiveCategory('lab')}
          >
            Lab Results
          </button>
          <button 
            className={`category-btn ${activeCategory === 'prescriptions' ? 'active' : ''}`}
            onClick={() => setActiveCategory('prescriptions')}
          >
            Prescriptions
          </button>
        </div>

        <div className="records-grid">
          <div className="no-records-message">
            <FaFileAlt size={48} />
            <h3>No Records Available</h3>
            <p>Your health records will appear here once they are added by the clinic staff.</p>
          </div>
        </div>

        <div className="privacy-notice">
          <FaLock className="lock-icon" />
          <p>Your health records are private and secure. Only you and your healthcare providers can access this information.</p>
        </div>
      </div>
    </UserPortalLayout>
  );
};

export default UserHealthRecord;