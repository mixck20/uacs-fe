import React from "react";
import "./HomePage.css";
import { FaClock, FaPhone, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";

const HomePage = () => {
  return (
    <div className="home-page">
      {/* Landscape Banner */}
      <div className="home-banner">
        <div className="banner-content">
          <div className="banner-text">
            <h1 className="banner-title">UACS</h1>
            <p className="banner-subtitle">University of the Assumption Clinic System</p>
          </div>
          <div className="banner-accent"></div>
        </div>
      </div>

      {/* Schedule Section */}
      <section className="schedule-section">
        <div className="section-container">
          <h2 className="section-title">Clinic Schedule</h2>
          <p className="section-subtitle">We are open and ready to serve you</p>

          <div className="schedule-grid">
            <div className="schedule-card">
              <div className="day-header">
                <FaClock className="schedule-icon" />
                <h3 className="placeholder"></h3>
              </div>
              <p className="schedule-time placeholder"></p>
              <p className="schedule-note placeholder"></p>
            </div>

            <div className="schedule-card">
              <div className="day-header">
                <FaClock className="schedule-icon" />
                <h3 className="placeholder"></h3>
              </div>
              <p className="schedule-time placeholder"></p>
              <p className="schedule-note placeholder"></p>
            </div>

            <div className="schedule-card">
              <div className="day-header">
                <FaClock className="schedule-icon" />
                <h3 className="placeholder"></h3>
              </div>
              <p className="schedule-time placeholder"></p>
              <p className="schedule-note placeholder"></p>
            </div>

            <div className="schedule-card">
              <div className="day-header">
                <FaClock className="schedule-icon" />
                <h3 className="placeholder"></h3>
              </div>
              <p className="schedule-time placeholder"></p>
              <p className="schedule-note placeholder"></p>
            </div>
          </div>
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
              <h3 className="placeholder"></h3>
              <p className="placeholder"></p>
              <p className="contact-detail placeholder"></p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <FaEnvelope />
              </div>
              <h3 className="placeholder"></h3>
              <p className="placeholder"></p>
              <p className="contact-detail placeholder"></p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <FaMapMarkerAlt />
              </div>
              <h3 className="placeholder"></h3>
              <p className="placeholder"></p>
              <p className="contact-detail placeholder"></p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <FaClock />
              </div>
              <h3 className="placeholder"></h3>
              <p className="placeholder"></p>
              <p className="contact-detail placeholder"></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
