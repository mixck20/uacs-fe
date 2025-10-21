import React, { useState } from "react";
import { FaCalendar, FaVideo, FaFileAlt, FaClock, FaStethoscope, FaTimes } from "react-icons/fa";
import "./UserAppointment.css";

const UserAppointmentPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [appointmentType, setAppointmentType] = useState('clinic');
  const currentDate = new Date('2025-10-16 13:28:07');
  const [showDetails, setShowDetails] = useState(null);

  // Mock data for appointments
  const appointments = [
    {
      id: 1,
      type: 'Clinic Visit',
      date: '2025-10-20',
      time: '10:00',
      reason: 'General Check-up',
      status: 'Pending',
      notes: 'Awaiting confirmation from clinic'
    },
    {
      id: 2,
      type: 'Medical Certificate',
      date: '2025-10-15',
      time: '14:30',
      reason: 'For academic purposes',
      status: 'Confirmed',
      notes: 'Please bring your student ID'
    }
  ];

  return (
    <div className="user-appointment-page">
      <div className="page-header">
        <h1>Appointments & Medical Certificates</h1>
        <p className="user-info">
          Welcome, {user?.fullName || 'mixck20'} | {currentDate.toLocaleString()}
        </p>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Book Appointment
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          My Appointments
        </button>
      </div>

      {/* Booking Section */}
      {activeTab === 'schedule' && (
        <div className="schedule-section">
          <div className="appointment-type-selector">
            <button 
              className={`type-btn ${appointmentType === 'clinic' ? 'active' : ''}`}
              onClick={() => setAppointmentType('clinic')}
            >
              <FaStethoscope /> Clinic Visit
            </button>
            <button 
              className={`type-btn ${appointmentType === 'online' ? 'active' : ''}`}
              onClick={() => setAppointmentType('online')}
            >
              <FaVideo /> Online Consultation
            </button>
            <button 
              className={`type-btn ${appointmentType === 'certificate' ? 'active' : ''}`}
              onClick={() => setAppointmentType('certificate')}
            >
              <FaFileAlt /> Medical Certificate
            </button>
          </div>

          <form className="appointment-form">
            <div className="form-section">
              <h3>{appointmentType === 'certificate' ? 'Certificate Request Details' : 'Appointment Details'}</h3>
              
              {appointmentType === 'certificate' ? (
                <>
                  <div className="form-group">
                    <label>Certificate Type</label>
                    <select required>
                      <option value="">Select type</option>
                      <option value="medical">Medical Certificate</option>
                      <option value="fitness">Fitness Certificate</option>
                      <option value="excuse">Excuse Letter</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Purpose</label>
                    <input 
                      type="text"
                      placeholder="State the purpose of the certificate"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Reason for Visit</label>
                    <select required>
                      <option value="">Select reason</option>
                      <option value="checkup">General Check-up</option>
                      <option value="followup">Follow-up Visit</option>
                      <option value="urgent">Urgent Care</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Preferred Date</label>
                  <input 
                    type="date"
                    min={currentDate.toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Preferred Time</label>
                  <select required>
                    <option value="">Select time</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Additional Information</label>
                <textarea 
                  placeholder={appointmentType === 'certificate' 
                    ? "Any additional details for your certificate request..."
                    : "Please provide any symptoms or concerns..."
                  }
                  rows="4"
                />
              </div>

              {appointmentType === 'online' && (
                <div className="alert-box">
                  <p>
                    <FaVideo /> Online consultation will be conducted through our secure video platform. 
                    Make sure you have a stable internet connection and a quiet environment.
                  </p>
                </div>
              )}

              <button type="submit" className="submit-btn">
                {appointmentType === 'certificate' 
                  ? 'Submit Certificate Request' 
                  : 'Book Appointment'
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Section */}
      {activeTab === 'history' && (
        <div className="history-section">
          <div className="appointments-grid">
            {appointments.map(appointment => (
              <div key={appointment.id} className={`appointment-card ${appointment.status.toLowerCase()}`}>
                <div className="appointment-card-header">
                  <div className="appointment-type">
                    {appointment.type === 'Clinic Visit' ? <FaStethoscope /> :
                     appointment.type === 'Online Consultation' ? <FaVideo /> : <FaFileAlt />}
                    {appointment.type}
                  </div>
                  <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                    {appointment.status}
                  </span>
                </div>
                
                <div className="appointment-details">
                  <p><FaCalendar /> {appointment.date}</p>
                  <p><FaClock /> {appointment.time}</p>
                  <p className="reason">{appointment.reason}</p>
                </div>

                <div className="appointment-actions">
                  <button 
                    className="details-btn"
                    onClick={() => setShowDetails(appointment)}
                  >
                    View Details
                  </button>
                  {appointment.status === 'Pending' && (
                    <button className="cancel-btn">
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <div className="details-modal">
          <div className="details-content">
            <div className="details-header">
              <h3>Appointment Details</h3>
              <button className="close-btn" onClick={() => setShowDetails(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="details-body">
              <div className="detail-row">
                <span>Type:</span>
                <span>{showDetails.type}</span>
              </div>
              <div className="detail-row">
                <span>Date:</span>
                <span>{showDetails.date}</span>
              </div>
              <div className="detail-row">
                <span>Time:</span>
                <span>{showDetails.time}</span>
              </div>
              <div className="detail-row">
                <span>Status:</span>
                <span className={`status-badge ${showDetails.status.toLowerCase()}`}>
                  {showDetails.status}
                </span>
              </div>
              <div className="detail-row">
                <span>Reason:</span>
                <span>{showDetails.reason}</span>
              </div>
              <div className="detail-row">
                <span>Notes:</span>
                <span>{showDetails.notes}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAppointment;