import React, { useState, useEffect } from 'react';
import { FaStar, FaPaperPlane, FaHistory, FaComments, FaLightbulb, FaCheckCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { FeedbackAPI } from '../api';
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
  const [myFeedback, setMyFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadMyFeedback();
  }, []);

  async function loadMyFeedback() {
    try {
      const data = await FeedbackAPI.getMyFeedback();
      setMyFeedback(data);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation for service feedback
    if (feedbackType === 'service' && rating === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Rating Required',
        text: 'Please provide a rating for service feedback',
        confirmButtonColor: '#e51d5e'
      });
      return;
    }

    setLoading(true);

    try {
      await FeedbackAPI.submitFeedback({
        type: feedbackType,
        subject: formData.subject,
        feedback: formData.feedback,
        rating: feedbackType === 'service' ? rating : null,
        serviceDate: feedbackType === 'service' ? formData.serviceDate : null
      });

      Swal.fire({
        title: 'Feedback Submitted!',
        text: 'Thank you for your feedback. We appreciate your input.',
        icon: 'success',
        confirmButtonColor: '#e51d5e'
      });

      // Reset form
      setRating(0);
      setFormData({
        subject: '',
        feedback: '',
        serviceDate: new Date().toISOString().split('T')[0]
      });
      
      // Reload feedback history
      loadMyFeedback();
    } catch (error) {
      console.error('Submit feedback error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.message || 'Failed to submit feedback. Please try again.',
        confirmButtonColor: '#e51d5e'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'general': return <FaComments />;
      case 'service': return <FaStar />;
      case 'suggestion': return <FaLightbulb />;
      default: return <FaComments />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: '#f59e0b', text: 'Pending' },
      reviewed: { color: '#3b82f6', text: 'Reviewed' },
      responded: { color: '#10b981', text: 'Responded' },
      resolved: { color: '#6b7280', text: 'Resolved' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className="feedback-status-badge" style={{ background: badge.color }}>
        {badge.text}
      </span>
    );
  };

  return (
    <UserPortalLayout user={user} onLogout={onLogout} currentPage="feedback">
      <div className="feedback-page">
        <div className="feedback-header">
          <div>
            <h1>Share Your Feedback</h1>
            <p className="feedback-subtitle">Help us improve our services by sharing your thoughts</p>
          </div>
          <button 
            className="view-history-btn"
            onClick={() => setShowHistory(!showHistory)}
          >
            <FaHistory /> {showHistory ? 'Hide' : 'View'} History
          </button>
        </div>

        {!showHistory ? (
          <>
            {/* Type Selector */}
            <div className="feedback-type-cards">
              <div 
                className={`type-card ${feedbackType === 'general' ? 'active' : ''}`}
                onClick={() => setFeedbackType('general')}
              >
                <div className="type-icon general">
                  <FaComments />
                </div>
                <h3>General Feedback</h3>
                <p>Share your overall thoughts</p>
              </div>
              
              <div 
                className={`type-card ${feedbackType === 'service' ? 'active' : ''}`}
                onClick={() => setFeedbackType('service')}
              >
                <div className="type-icon service">
                  <FaStar />
                </div>
                <h3>Service Experience</h3>
                <p>Rate a specific service</p>
              </div>
              
              <div 
                className={`type-card ${feedbackType === 'suggestion' ? 'active' : ''}`}
                onClick={() => setFeedbackType('suggestion')}
              >
                <div className="type-icon suggestion">
                  <FaLightbulb />
                </div>
                <h3>Suggestions</h3>
                <p>Help us improve</p>
              </div>
            </div>

            {/* Feedback Form */}
            <div className="feedback-form-container">
              <form onSubmit={handleSubmit} className="feedback-form">
                {feedbackType === 'service' && (
                  <div className="rating-section">
                    <label className="form-label">Rate Your Experience</label>
                    <div className="star-rating">
                      {[...Array(5)].map((_, index) => {
                        const ratingValue = index + 1;
                        return (
                          <label key={index} className="star-label">
                            <input
                              type="radio"
                              name="rating"
                              value={ratingValue}
                              onClick={() => setRating(ratingValue)}
                              style={{ display: 'none' }}
                            />
                            <FaStar
                              className="star-icon"
                              size={40}
                              color={ratingValue <= (hover || rating) ? "#e51d5e" : "#e2e8f0"}
                              onMouseEnter={() => setHover(ratingValue)}
                              onMouseLeave={() => setHover(0)}
                            />
                          </label>
                        );
                      })}
                    </div>
                    {rating > 0 && (
                      <p className="rating-text">
                        You rated: <strong>{rating} out of 5 stars</strong>
                      </p>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="subject" className="form-label">Subject</label>
                  <input 
                    id="subject"
                    name="subject"
                    type="text"
                    className="form-input"
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

                {feedbackType === 'service' && (
                  <div className="form-group">
                    <label htmlFor="serviceDate" className="form-label">Service Date</label>
                    <input 
                      id="serviceDate"
                      name="serviceDate"
                      type="date"
                      className="form-input"
                      value={formData.serviceDate}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="feedback" className="form-label">Your Feedback</label>
                  <textarea 
                    id="feedback"
                    name="feedback"
                    rows="6"
                    className="form-textarea"
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

                <button type="submit" className="submit-feedback-btn" disabled={loading}>
                  <FaPaperPlane /> {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            {/* Feedback History */}
            <div className="feedback-history">
              <h2>Your Feedback History</h2>
              {myFeedback.length === 0 ? (
                <div className="no-feedback">
                  <FaComments className="empty-icon" />
                  <p>You haven't submitted any feedback yet</p>
                </div>
              ) : (
                <div className="feedback-list">
                  {myFeedback.map(item => (
                    <div key={item._id} className="feedback-card">
                      <div className="feedback-card-header">
                        <div className="feedback-card-title">
                          <div className="feedback-type-icon">
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <h3>{item.subject}</h3>
                            <p className="feedback-meta">
                              {new Date(item.createdAt).toLocaleDateString()} • {item.type}
                              {item.rating && ` • ${item.rating} stars`}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                      
                      <div className="feedback-card-body">
                        <p className="feedback-text">{item.feedback}</p>
                        
                        {item.response && (
                          <div className="feedback-response">
                            <div className="response-header">
                              <FaCheckCircle className="response-icon" />
                              <strong>Clinic Response:</strong>
                            </div>
                            <p>{item.response}</p>
                            {item.respondedAt && (
                              <p className="response-date">
                                Responded on {new Date(item.respondedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </UserPortalLayout>
  );
};

export default UserFeedback;
