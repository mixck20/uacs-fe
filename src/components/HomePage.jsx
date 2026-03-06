import React from "react";
import "./HomePage.css";
import { FaStethoscope, FaClock, FaPhone, FaMapMarkerAlt, FaEnvelope, FaUtensilSpoon, FaWheelchair, FaHeartbeat } from "react-icons/fa";
import uacsLogo from "../assets/uacs logo.png";

const HomePage = () => {
  return (
    <div className="home-page">
      {/* Landscape Banner */}
      <div className="home-banner">
        <div className="banner-content">
          <div className="banner-left">
            <div className="banner-logo-container">
              <img
                src={uacsLogo}
                alt="UACS Logo"
                className="banner-logo"
              />
            </div>
            <div className="banner-text">
              <h1 className="banner-title">UACS</h1>
              <p className="banner-subtitle">University of the Assumption Clinic System</p>
              <p className="banner-description">Providing quality healthcare services to our community</p>
            </div>
          </div>
          <div className="banner-accent"></div>
        </div>
      </div>

      {/* Services Section */}
      <section className="services-section">
        <div className="section-container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">Comprehensive healthcare solutions for students and employees</p>

          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">
                <FaStethoscope />
              </div>
              <h3>General Checkup</h3>
              <p>Professional medical consultations and health screenings for all patients.</p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <FaHeartbeat />
              </div>
              <h3>Medical Consultation</h3>
              <p>Expert doctors available for personalized medical advice and treatment plans.</p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <FaUtensilSpoon />
              </div>
              <h3>Nutrition Guidance</h3>
              <p>Dietary counseling and nutrition planning for optimal health and wellness.</p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <FaWheelchair />
              </div>
              <h3>Physical Therapy</h3>
              <p>Rehabilitation and physical therapy services for injury recovery and mobility.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="schedule-section">
        <div className="section-container">
          <h2 className="section-title">Clinic Schedule</h2>
          <p className="section-subtitle">We are open and ready to serve you</p>

          <div className="schedule-grid">
            <div className="schedule-card">
              <div className="day-header">
                <FaClock className="schedule-icon" />
                <h3>Monday - Friday</h3>
              </div>
              <p className="schedule-time">8:00 AM - 5:00 PM</p>
              <p className="schedule-note">Regular consultation hours</p>
            </div>

            <div className="schedule-card">
              <div className="day-header">
                <FaClock className="schedule-icon" />
                <h3>Saturday</h3>
              </div>
              <p className="schedule-time">9:00 AM - 1:00 PM</p>
              <p className="schedule-note">Limited services available</p>
            </div>

            <div className="schedule-card">
              <div className="day-header">
                <FaClock className="schedule-icon" />
                <h3>Sunday</h3>
              </div>
              <p className="schedule-time">Closed</p>
              <p className="schedule-note">Emergency services only</p>
            </div>

            <div className="schedule-card">
              <div className="day-header">
                <FaClock className="schedule-icon" />
                <h3>Holidays</h3>
              </div>
              <p className="schedule-time">By Appointment</p>
              <p className="schedule-note">Contact clinic for details</p>
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
              <h3>Appointment</h3>
              <p>Book Online or Call</p>
              <p className="contact-detail">Flexible scheduling available</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <h2>Ready to Schedule an Appointment?</h2>
          <p>Click below to book your consultation with our medical team</p>
          <button className="cta-button">Book Appointment</button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
