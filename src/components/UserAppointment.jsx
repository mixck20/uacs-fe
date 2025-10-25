import React, { useState } from "react";
import { FaCalendar, FaVideo, FaFileAlt, FaClock, FaStethoscope, FaTimes } from "react-icons/fa";
import UserPortalLayout from "./UserPortalLayout";
import "./UserAppointment.css";
import { AppointmentsAPI } from '../api';
import Swal from 'sweetalert2';

const UserAppointment = ({ user, appointments, onLogout }) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [appointmentType, setAppointmentType] = useState('clinic');
  const currentDate = new Date();
  const [showDetails, setShowDetails] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
    preferredDate: '',
    preferredTime: '',
    type: 'checkup',
    notes: '',
    isOnline: false,
    certificateType: '',
    purpose: ''
  });
  const [loading, setLoading] = useState(false);

  // Use appointments from props, or fallback to empty array if not provided
  const appointmentsList = appointments || [];

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === 'preferredDate') {
      const selectedDate = new Date(value);
      const dayOfWeek = selectedDate.getDay();
      
      // Check if selected day is a weekend (0 = Sunday, 6 = Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        Swal.fire({
          title: "Invalid Date",
          text: "Please select a weekday (Monday to Friday)",
          icon: "warning"
        });
        return;
      }
    }

    if (name === 'preferredTime') {
      const timeValue = value;
      const [hours] = timeValue.split(':').map(Number);
      
      // Check if time is within clinic hours (9 AM to 5 PM)
      if (hours < 9 || hours >= 17) {
        Swal.fire({
          title: "Invalid Time",
          text: "Please select a time between 9:00 AM and 5:00 PM",
          icon: "warning"
        });
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.preferredDate || !formData.preferredTime || !formData.type) {
      Swal.fire({
        title: "Missing Information",
        text: "Please fill in all required fields",
        icon: "warning"
      });
      setLoading(false);
      return;
    }

    try {
      // Map the form data to match backend expectations
      const appointmentData = {
        patientId: user._id, // Add the patient's ID from user prop
        date: formData.preferredDate,
        time: formData.preferredTime,
        reason: appointmentType === 'certificate' ? formData.purpose : formData.notes || formData.type,
        type: appointmentType === 'online' 
          ? 'Online Consultation' 
          : appointmentType === 'certificate'
          ? 'Medical Certificate'
          : 'Clinic Visit',
        isOnline: appointmentType === 'online',
        certificateType: formData.certificateType,
        notes: formData.notes
      };

      const response = await AppointmentsAPI.create(appointmentData);
      
      Swal.fire({
        title: 'Success!',
        text: appointmentType === 'online' 
          ? 'Your online consultation request has been submitted. You will receive the Google Meet link once confirmed.' 
          : appointmentType === 'certificate'
          ? 'Your medical certificate request has been submitted.'
          : 'Your appointment has been booked successfully!',
        icon: 'success'
      });

      // Reset form
      setFormData({
        reason: '',
        preferredDate: '',
        preferredTime: '',
        type: 'checkup',
        notes: '',
        isOnline: false,
        certificateType: '',
        purpose: ''
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to book appointment',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserPortalLayout user={user} onLogout={onLogout}>
      <div className="user-appointment-page">
        <div className="page-header">
          <h1>Appointments</h1>
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
                <FaFileAlt /> Request Med Certificate
              </button>
            </div>

            <form className="appointment-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>{appointmentType === 'certificate' ? 'Medical Certificate Request' : 'Appointment Details'}</h3>
                
                {appointmentType === 'certificate' ? (
                  <>
                    <div className="form-group">
                      <label>Certificate Type</label>
                      <select
                        name="certificateType"
                        value={formData.certificateType}
                        onChange={handleFormChange}
                        required
                      >
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
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleFormChange}
                        placeholder="State the purpose of the certificate"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div className="form-group">
                    <label>Reason for Visit</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select reason</option>
                      <option value="checkup">General Check-up</option>
                      <option value="followup">Follow-up Visit</option>
                      <option value="urgent">Urgent Care</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Preferred Date</label>
                    <input 
                      type="date"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleFormChange}
                      min={currentDate.toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Preferred Time</label>
                    <input
                      type="time"
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleFormChange}
                      min="09:00"
                      max="17:00"
                      step="900" // 15-minute intervals
                      required
                    />
                    <small className="time-note">
                      Clinic hours: 9:00 AM - 5:00 PM, Monday to Friday
                    </small>
                  </div>
                </div>

                <div className="form-group">
                  <label>Additional Information</label>
                  <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    placeholder="Please provide any symptoms or concerns..."
                    rows="4"
                  />
                </div>

                {appointmentType === 'online' && (
                  <>
                    <div className="alert-box info">
                      <p>
                        <FaVideo /> Online consultation will be conducted through Google Meet. 
                        You will receive the meeting link once your appointment is confirmed.
                      </p>
                      <p className="mt-2">
                        <FaComments /> A chat feature will be enabled before the consultation 
                        for any pre-consultation questions or concerns.
                      </p>
                      <p className="mt-2 text-sm">
                        Make sure you have:
                        <ul className="mt-1">
                          <li>• A stable internet connection</li>
                          <li>• A quiet environment for the consultation</li>
                          <li>• Working camera and microphone</li>
                          <li>• Google Chrome or compatible browser installed</li>
                        </ul>
                      </p>
                    </div>
                  </>
                )}

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Booking...' : appointmentType === 'certificate' ? 'Request Certificate' : `Book ${appointmentType === 'online' ? 'Online Consultation' : 'Appointment'}`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* History Section */}
        {activeTab === 'history' && (
          <div className="history-section">
            <div className="appointments-grid">
              {appointmentsList.length > 0 ? (
                appointmentsList.map(appointment => (
                  <div key={appointment.id} className={`appointment-card ${appointment.status.toLowerCase()}`}>
                    <div className="appointment-card-header">
                      <div className="appointment-type">
                        {appointment.type === 'Clinic Visit' ? <FaStethoscope /> : <FaVideo />}
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
                      {appointment.type === 'Online Consultation' && (
                        <div className="online-consultation-details">
                          {appointment.meetLink ? (
                            <a 
                              href={appointment.meetLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="meet-link-btn"
                            >
                              <FaVideo /> Join Google Meet
                            </a>
                          ) : (
                            <p className="awaiting-link">
                              <FaVideo /> Meet link will be provided when confirmed
                            </p>
                          )}
                        </div>
                      )}
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
                          Cancel
                        </button>
                      )}
                      {appointment.status === 'Confirmed' && appointment.type === 'Online Consultation' && (
                        <button 
                          className="chat-btn"
                          onClick={() => window.open('/chat/' + appointment._id, '_blank')}
                        >
                          <FaComments /> Open Chat
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-appointments">
                  <p>No appointments found</p>
                  <button className="schedule-btn" onClick={() => setActiveTab('schedule')}>
                    Schedule New Appointment
                  </button>
                </div>
              )}
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
                {showDetails.notes && (
                  <div className="detail-row">
                    <span>Notes:</span>
                    <span>{showDetails.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </UserPortalLayout>
  );
};

export default UserAppointment;