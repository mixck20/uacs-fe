import React, { useState } from 'react';
import UserNavbar from './UserNavbar';
import { FaComments } from 'react-icons/fa';
import ChatbotDialog from './ChatbotDialog';
import './UserPortalLayout.css';

const UserPortalLayout = ({ user, onLogout, children }) => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const handleOpenChatbot = () => {
    setIsChatbotOpen(true);
  };

  const handleCloseChatbot = () => {
    setIsChatbotOpen(false);
  };

  return (
    <div className="user-portal">
      <UserNavbar user={user} onLogout={onLogout} />
      <div className="portal-content">
        <div className="content-wrapper">
          {children}
        </div>
      </div>
      <button className="chatbot-button" onClick={handleOpenChatbot}>
        <FaComments size={24} />
        <span>Ask Nursebot</span>
      </button>
      <ChatbotDialog isOpen={isChatbotOpen} onClose={handleCloseChatbot} />
    </div>
  );
};

export default UserPortalLayout;