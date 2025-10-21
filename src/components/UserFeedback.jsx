import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import UserPortalLayout from './UserPortalLayout';
import './UserFeedback.css';

const UserFeedback = ({ user, onLogout }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedbackType, setFeedbackType] = useState('general');
  const [formData, setFormData] = useState({
    subject: '',
    feedback: '',
    serviceDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement API call to submit feedback
    console.log({
      type: feedbackType,
      rating: feedbackType === 'service' ? rating : null,
      ...formData
    });
    // Reset form
    setRating(0);
    setFormData({
      subject: '',
      feedback: '',
      serviceDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <UserPortalLayout user={user} onLogout={onLogout}>
      <div className="page-header">
        <h1>Feedback</h1>
        <p className="subtitle">Help us improve our services</p>
      </div>

      <div className="feedback-container">
        <div className="feedback-type-selector">
          <button 
            className={`type-btn ${feedbackType === 'general' ? 'active' : ''}`}
            onClick={() => setFeedbackType('general')}
          >
            General Feedback
          </button>
          <button 
            className={`type-btn ${feedbackType === 'service' ? 'active' : ''}`}
            onClick={() => setFeedbackType('service')}
          >
            Service Experience
          </button>
          <button 
            className={`type-btn ${feedbackType === 'suggestion' ? 'active' : ''}`}
            onClick={() => setFeedbackType('suggestion')}
          >
            Suggestions
          </button>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          {feedbackType === 'service' && (
            <div className="rating-container">
              <p className="rating-label">Rate your experience:</p>
              <div className="stars">
                {[...Array(5)].map((_, index) => {
                  const ratingValue = index + 1;
                  return (
                    <label key={index}>
                      <input
                        type="radio"
                        name="rating"
                        value={ratingValue}
                        onClick={() => setRating(ratingValue)}
                      />
                      <FaStar
                        className="star"
                        color={ratingValue <= (hover || rating) ? "#e51d5e" : "#e4e5e9"}
                        size={32}
                        onMouseEnter={() => setHover(ratingValue)}
                        onMouseLeave={() => setHover(0)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input 
              id="subject"
              name="subject"
              type="text"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder={
                feedbackType === 'general' ? "What's on your mind?" :
                feedbackType === 'service' ? "Which service would you like to review?" :
                "What would you like to suggest?"
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="feedback">Your Feedback</label>
            <textarea 
              id="feedback"
              name="feedback"
              rows="6"
              value={formData.feedback}
              onChange={handleInputChange}
              placeholder={
                feedbackType === 'general' ? "Share your thoughts with us..." :
                feedbackType === 'service' ? "Tell us about your experience..." :
                "Share your suggestions for improvement..."
              }
              required
            ></textarea>
          </div>

          {feedbackType === 'service' && (
            <div className="form-group">
              <label htmlFor="serviceDate">Service Date</label>
              <input 
                id="serviceDate"
                name="serviceDate"
                type="date"
                value={formData.serviceDate}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          )}

          <button type="submit" className="submit-btn">
            Submit Feedback
          </button>
        </form>
      </div>
    </UserPortalLayout>
  );
};

export default UserFeedback;