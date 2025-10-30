import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaTimes, FaRegPaperPlane, FaLightbulb } from 'react-icons/fa';
import { AIChatAPI } from '../api';
import Swal from 'sweetalert2';
import './ChatbotDialog.css';

const ChatbotDialog = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi! I\'m Nursebot Assistant. I can help you with appointments, medicines, medical certificates, and clinic information. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [showFaqs, setShowFaqs] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load FAQs when opened
  useEffect(() => {
    if (isOpen && faqs.length === 0) {
      loadFAQs();
    }
  }, [isOpen]);

  const loadFAQs = async () => {
    try {
      const response = await AIChatAPI.getFAQs();
      setFaqs(response.faqs || []);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    }
  };

  const handleFAQClick = (question) => {
    setInput(question);
    setShowFaqs(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input.trim();
    setInput('');
    setIsProcessing(true);
    setShowFaqs(false);

    try {
      // Prepare chat history for API
      const history = messages.map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      const response = await AIChatAPI.sendMessage(messageText, history);
      
      const botResponse = {
        id: messages.length + 2,
        sender: 'bot',
        text: response.message,
        timestamp: new Date(),
        context: response.context
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('AI Chat error:', error);
      
      const errorMessage = {
        id: messages.length + 2,
        sender: 'bot',
        text: error.message === 'User not found' 
          ? 'Please log in again to continue chatting.'
          : 'Sorry, I\'m having trouble processing your request. Please try again or contact the clinic directly at (555) 123-4567.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);

      if (error.message === 'User not found') {
        Swal.fire({
          icon: 'warning',
          title: 'Session Expired',
          text: 'Please log in again to continue.',
          confirmButtonColor: '#e51d5e'
        }).then(() => {
          localStorage.clear();
          window.location.href = '/login';
        });
      }
    } finally {
      setIsProcessing(false);
    }
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
          <div key={message.id} className={`message ${message.sender}`}>
            {message.sender === 'bot' && <FaRobot className="bot-icon" size={20} />}
            <div className="message-content">
              <p style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
              <small className="timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="message bot">
            <FaRobot className="bot-icon" size={20} />
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {showFaqs && faqs.length > 0 && messages.length === 1 && (
          <div className="faq-suggestions">
            <div className="faq-header">
              <FaLightbulb size={16} />
              <span>Suggested Questions:</span>
            </div>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <button
                  key={index}
                  className="faq-button"
                  onClick={() => handleFAQClick(faq.question)}
                >
                  {faq.question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chatbot-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask me anything about the clinic..."
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