import React, { useState } from 'react';
import { FaRobot, FaTimes, FaRegPaperPlane } from 'react-icons/fa';
import './ChatbotDialog.css';

const ChatbotDialog = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hi! I\'m Nursebot, your clinic assistant. How can I help you today?',
      timestamp: new Date(),
      suggestions: [
        'Book an appointment',
        'Check medical records',
        'Find a doctor',
        'Get health information'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // TODO: Implement actual chatbot API integration
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: `I understand you're asking about ${input.trim()}. I'm still learning to help with that!`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsProcessing(false);
    }, 1000);
  };

  return isOpen ? (
    <div className="chatbot-dialog">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <FaRobot size={20} />
          <span>Nursebot Assistant</span>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="Close chatbot">
          <FaTimes size={16} />
        </button>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            {message.type === 'bot' && <FaRobot className="bot-icon" size={20} />}
            <div className="message-content">
              <p>{message.content}</p>
              <small className="timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>
              {message.suggestions && (
                <div className="chatbot-hint">
                  <p>I can help you with:</p>
                  <ul>
                    {message.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form className="chatbot-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isProcessing}
        />
        <button 
          type="submit" 
          className="send-btn" 
          disabled={!input.trim() || isProcessing}
          aria-label="Send message"
        >
          <FaRegPaperPlane size={16} />
        </button>
      </form>
    </div>
  ) : null;
};

export default ChatbotDialog;