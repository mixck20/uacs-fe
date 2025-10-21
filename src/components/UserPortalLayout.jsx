import React from 'react';
import UserNavbar from './UserNavbar';
import { FaComments } from 'react-icons/fa';
import './UserPortalLayout.css';

const UserPortalLayout = ({ user, onLogout, children }) => {
  return (
    <div className="user-portal">
      <UserNavbar user={user} onLogout={onLogout} />
      <div className="portal-content">
        <div className="content-wrapper">
          {children}
        </div>
      </div>
      <button className="chatbot-button">
        <FaComments size={24} />
        <span>Ask Nursebot</span>
      </button>
    </div>
  );
};

export default UserPortalLayout;