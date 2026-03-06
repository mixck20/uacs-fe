import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import { FaClock, FaPhone, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";
import axios from "axios";

const API_URL = 'https://uacs-be.vercel.app/api';

const HomePage = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await axios.get(`${API_URL}/schedule`);
      setSchedule(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="home-page">
      {/* Banner - Exact copy of Login Banner Left Side */}
      <div className="home-banner">
        <h1 className="uacs-logo">UACS</h1>
        <p className="uacs-tagline">University of the Assumption Clinic System</p>
        <button className="home-login-btn" onClick={handleLoginClick}>Login</button>
      </div>

      {/* Schedule Section */}
      <section className="schedule-section">
        <div className="section-container">
          <h2 className="section-title">Clinic Schedule</h2>
          <p className="section-subtitle">Medical and Dental Clinic Staff Schedule</p>

          {loading ? (
            <div className="loading-text">Loading clinic schedule...</div>
          ) : schedule?.staffSchedules && schedule.staffSchedules.length > 0 ? (
            <div className="schedule-grid">
              {schedule.staffSchedules.slice(0, 4).map((staff, index) => (
                <div className="schedule-card" key={staff._id || index}>
                  <div className="day-header">
                    <FaClock className="schedule-icon" />
                    <h3>{staff.name}</h3>
                  </div>
                  <p className="schedule-time">{staff.dayOfDuty || 'Not specified'}</p>
                  <p className="schedule-note">{staff.time || 'Not specified'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="loading-text">No schedule data available</div>
          )}
        </div>
      </section>

      {/* Contacts Section */}
      <section className="contacts-section">
        <div className="section-container">
          <h2 className="section-title">Contact Us</h2>
          <p className="section-subtitle">Get in touch with the clinic for any inquiries</p>

          <div className="contacts-grid">
            <div className="contact-card">
              <div className="contact-icon">
                <FaPhone />
              </div>
              <h3>Phone</h3>
              <p>+63 (2) 8123-8000</p>
              <p className="contact-detail">Available during clinic hours</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <FaEnvelope />
              </div>
              <h3>Email</h3>
              <p>clinic@ua.edu.ph</p>
              <p className="contact-detail">Response within 24 hours</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <FaMapMarkerAlt />
              </div>
              <h3>Location</h3>
              <p>University of the Assumption</p>
              <p className="contact-detail">Makati, Metro Manila</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <FaClock />
              </div>
              <h3>Hours</h3>
              <p>Monday - Friday: 8AM - 5PM</p>
              <p className="contact-detail">Saturday: 9AM - 1PM</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
