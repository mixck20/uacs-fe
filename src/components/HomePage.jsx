import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import { FaClock, FaPhone, FaMapMarkerAlt, FaEnvelope, FaHeartbeat } from "react-icons/fa";
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
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/schedule`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      console.log('Schedule fetched successfully:', response.data);
      setSchedule(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedule with auth:', error);
      // Try fetching without auth as fallback
      try {
        console.log('Trying to fetch schedule without auth...');
        const fallbackResponse = await axios.get(`${API_URL}/schedule`);
        console.log('Schedule fetched without auth:', fallbackResponse.data);
        setSchedule(fallbackResponse.data);
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        // Set empty schedule to show "No data" message
        setSchedule({ doctorSchedules: [], staffSchedules: [] });
      }
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.";

  const services = [
    { icon: FaHeartbeat, title: "Service One" },
    { icon: FaHeartbeat, title: "Service Two" },
    { icon: FaHeartbeat, title: "Service Three" },
    { icon: FaHeartbeat, title: "Service Four" }
  ];

  return (
    <div className="home-page">
      {/* Banner - Exact copy of Login Banner Left Side */}
      <div className="home-banner">
        <h1 className="uacs-logo">UACS</h1>
        <p className="uacs-tagline">University of the Assumption Clinic System</p>
        <button className="home-login-btn" onClick={handleLoginClick}>Login</button>
      </div>

      {/* Services Section */}
      <section className="services-section">
        <div className="section-container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">Healthcare services available at our clinic</p>

          <div className="services-grid">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div className="service-card" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="service-icon">
                    <Icon />
                  </div>
                  <h3>{service.title}</h3>
                  <p>{loremIpsum}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="schedule-section">
        <div className="section-container">
          <h2 className="section-title">Clinic Schedule</h2>
          <p className="section-subtitle">Medical and Dental Clinic Staff Schedule</p>

          {loading ? (
            <div className="loading-text">Loading clinic schedule...</div>
          ) : schedule ? (
            <div>
              {/* Physicians */}
              {schedule?.doctorSchedules?.filter(d => d.type === 'physician').length > 0 && (
                <div style={{ marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '1.3rem', color: '#1e293b', marginBottom: '1.5rem', fontWeight: '600' }}>Physicians</h3>
                  <div className="schedule-grid">
                    {schedule.doctorSchedules
                      .filter(d => d.type === 'physician')
                      .map((doctor, index) => (
                        <div className="schedule-card" key={doctor._id || index}>
                          <div className="day-header">
                            <FaClock className="schedule-icon" />
                            <h3>{doctor.name}</h3>
                          </div>
                          <p className="schedule-time">Regular Schedule</p>
                          <p className="schedule-note">{doctor.regularSchedule || 'Not specified'}</p>
                          <p className="schedule-time" style={{ marginTop: '0.75rem' }}>Medical Exam Schedule</p>
                          <p className="schedule-note">{doctor.medicalExaminationSchedule || 'Not specified'}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Dentists */}
              {schedule?.doctorSchedules?.filter(d => d.type === 'dentist').length > 0 && (
                <div style={{ marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '1.3rem', color: '#1e293b', marginBottom: '1.5rem', fontWeight: '600' }}>Dentists</h3>
                  <div className="schedule-grid">
                    {schedule.doctorSchedules
                      .filter(d => d.type === 'dentist')
                      .map((doctor, index) => (
                        <div className="schedule-card" key={doctor._id || index}>
                          <div className="day-header">
                            <FaClock className="schedule-icon" />
                            <h3>{doctor.name}</h3>
                          </div>
                          <p className="schedule-time">Regular Schedule</p>
                          <p className="schedule-note">{doctor.regularSchedule || 'Not specified'}</p>
                          <p className="schedule-time" style={{ marginTop: '0.75rem' }}>Dental Exam Schedule</p>
                          <p className="schedule-note">{doctor.medicalExaminationSchedule || 'Not specified'}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Clinical Staff */}
              {schedule?.staffSchedules?.length > 0 && (
                <div style={{ marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '1.3rem', color: '#1e293b', marginBottom: '1.5rem', fontWeight: '600' }}>University Nurses</h3>
                  <div className="schedule-grid">
                    {schedule.staffSchedules
                      .map((staff, index) => (
                        <div className="schedule-card" key={staff._id || index}>
                          <div className="day-header">
                            <FaClock className="schedule-icon" />
                            <h3>{staff.name}</h3>
                          </div>
                          <p className="schedule-time">{staff.designation || 'Clinical Staff'}</p>
                          <p className="schedule-note">{staff.schedule || staff.time || 'Not specified'}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {!schedule?.doctorSchedules?.length && !schedule?.staffSchedules?.length && (
                <div className="loading-text">No schedule data available</div>
              )}
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
              <p>Del Pilar, San Fernando, Pampanga</p>
              <p className="contact-detail">University of the Assumption</p>
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
