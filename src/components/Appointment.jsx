import React, { useState, useEffect } from "react";
import ClinicNavbar from "./ClinicNavbar";
import "./Appointment.css";
import { 
  FaCalendarPlus, 
  FaCheck, 
  FaTimes, 
  FaVideo, 
  FaUser, 
  FaComment,
  FaClock,
  FaCalendar,
  FaInbox
} from "react-icons/fa";
import { AppointmentsAPI } from "../api";
import Swal from "sweetalert2";

function Appointment({ setActivePage, activePage, patients, onLogout }) {
  const [activeSection, setActiveSection] = useState('appointments'); // 'appointments' or 'consultations'
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showMeetForm, setShowMeetForm] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    patientId: '',
    patientName: '',
    consultationType: 'Video Call',
    reason: ''
  });
  const [form, setForm] = useState({
    patientId: "",
    patientName: "",
    type: "Checkup",
    date: "",
    time: "",
    reason: "",
    status: "Pending",
    isOnline: false
  });

  const [meetForm, setMeetForm] = useState({
    meetLink: "",
    scheduledTime: "",
    message: ""
  });

  const [studentRequests, setStudentRequests] = useState([]);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await AppointmentsAPI.list();
      const mapped = data.map(d => ({
        id: d._id,
        patientName: d.requester?.name || 'N/A',
        type: d.type || 'Checkup',
        date: d.preferredDate ? new Date(d.preferredDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
        time: d.time || '09:00',
        reason: d.concern || d.reason,
        status: (d.status || 'pending').charAt(0).toUpperCase() + (d.status || 'pending').slice(1),
        isOnline: d.isOnline || false,
        meetLink: d.meetLink || null
      }));
      setAppointments(mapped);
    } catch (err) {
      console.error(err);
      Swal.fire({ 
        title: "Failed to load appointments", 
        text: err.message, 
        icon: "error" 
      });
    }
  };

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  }

  function handleMeetFormChange(e) {
    const { name, value } = e.target;
    setMeetForm(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleAddAppointment(e) {
    e.preventDefault();
    if (!form.patientId || !form.date || !form.time || !form.reason) {
      Swal.fire({
        title: "Missing Information",
        text: "Please fill all required fields.",
        icon: "warning"
      });
      return;
    }

    try {
      const appointmentData = {
        patientId: form.patientId,
        date: form.date,
        time: form.time,
        reason: form.reason,
        type: form.appointmentType || form.type,
        isOnline: form.isOnline
      };

      const response = await AppointmentsAPI.create(appointmentData);
      
      if (response) {
        await loadAppointments();
        setForm({
          patientId: "",
          patientName: "",
          type: "Checkup",
          date: "",
          time: "",
          reason: "",
          status: "Pending"
        });
        setShowForm(false);

        Swal.fire({
          title: "Appointment Created",
          text: "The appointment has been scheduled successfully",
          icon: "success"
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Failed to Create Appointment",
        text: err.message,
        icon: "error"
      });
    }
  }

  function handleConsultationFormChange(e) {
    const { name, value } = e.target;
    setConsultationForm(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleStartConsultation(e) {
    e.preventDefault();
    const { patientId, consultationType, reason } = consultationForm;
    
    if (!patientId || !consultationType || !reason) {
      Swal.fire({
        title: "Missing Information",
        text: "Please fill all required fields for the consultation",
        icon: "warning"
      });
      return;
    }

    try {
      const appointmentData = {
        patientId,
        type: "Online Consultation",
        isOnline: true,
        reason,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        consultationType
      };

      const response = await AppointmentsAPI.create(appointmentData);

      if (response) {
        setShowConsultation(false);
        setConsultationForm({
          patientId: '',
          patientName: '',
          consultationType: 'Video Call',
          reason: ''
        });
        await loadAppointments();

        Swal.fire({
          title: "Consultation Started",
          text: "The online consultation has been initialized successfully",
          icon: "success"
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Failed to Start Consultation",
        text: err.message,
        icon: "error"
      });
    }
  }

  async function handleCreateMeetLink(e) {
    e.preventDefault();
    if (!meetForm.scheduledTime) {
      Swal.fire({
        title: "Missing Information",
        text: "Please provide the scheduled time for the consultation",
        icon: "warning"
      });
      return;
    }

    try {
      // The backend will generate the Meet link automatically
      const response = await AppointmentsAPI.update(selectedRequest.id, {
        status: "Confirmed",
        scheduledTime: meetForm.scheduledTime,
        message: meetForm.message,
        isOnline: true,
        type: "Online Consultation"
      });

      if (response) {
        await loadAppointments();
        setMeetForm({
          scheduledTime: "",
          message: ""
        });
        setShowMeetForm(false);
        setSelectedRequest(null);

        Swal.fire({
          title: "Online Consultation Scheduled",
          text: "A Google Meet link has been generated and sent to the patient",
          icon: "success"
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Failed to Schedule Online Consultation",
        text: err.message,
        icon: "error"
      });
    }
  }

  async function updateAppointmentStatus(id, newStatus) {
    try {
      const response = await AppointmentsAPI.update(id, { 
        status: newStatus.toLowerCase() 
      });
      
      if (response) {
        await loadAppointments();
        
        if (newStatus === "Confirmed") {
          Swal.fire({
            title: "Appointment Confirmed",
            text: "The patient will be notified",
            icon: "success"
          });
        }
      }
    } catch (err) {
      Swal.fire({ 
        title: "Failed to update status", 
        text: err.message, 
        icon: "error" 
      });
    }
  }

  const userRequests = appointments.filter(apt => apt.status === "Pending");
  const onlineConsultations = appointments.filter(apt => apt.isOnline);
  const regularAppointments = appointments.filter(apt => !apt.isOnline);

  return (
    <div className="clinic-container">
      <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} />
      <div className="clinic-content">
        <div className="appointment-header">
          <h1 className="appointment-title">Appointments</h1>
          <div className="header-actions">
            <button 
              className="appointment-btn secondary" 
              onClick={() => setShowConsultation(true)}
            >
              <FaVideo /> Start Consultation
            </button>
            <button 
              className="appointment-btn primary" 
              onClick={() => setShowForm(true)}
            >
              <FaCalendarPlus /> New Appointment
            </button>
          </div>
        </div>

        {/* Active Online Consultation */}
        {currentCall && (
          <div className="call-interface">
            <div className="call-header">
              <h3><FaVideo /> Active Consultation</h3>
              <span className="call-status">In Progress</span>
            </div>
            <div className="call-info">
              <div className="call-patient">
                <strong>Patient:</strong> {currentCall.patientName}
              </div>
              <div className="call-duration">
                <strong>Duration:</strong> {Math.floor((new Date() - new Date(currentCall.startTime)) / 1000 / 60)}m
              </div>
              <div className="meet-link">
                <strong>Google Meet:</strong>
                <a href={currentCall.meetLink} target="_blank" rel="noopener noreferrer">
                  Join Meeting <FaVideo />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Main Appointments Table */}
        <div className="appointments-section">
          <div className="filters">
            <button 
              className={`filter-btn ${!activeSection || activeSection === 'all' ? 'active' : ''}`}
              onClick={() => setActiveSection('all')}
            >
              All Appointments
            </button>
            <button 
              className={`filter-btn ${activeSection === 'in-person' ? 'active' : ''}`}
              onClick={() => setActiveSection('in-person')}
            >
              In-Person
            </button>
            <button 
              className={`filter-btn ${activeSection === 'online' ? 'active' : ''}`}
              onClick={() => setActiveSection('online')}
            >
              Online
            </button>
          </div>

          <table className="appointments-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Type</th>
                <th>Date & Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data">No appointments scheduled</td>
                </tr>
              ) : (
                appointments
                  .filter(apt => {
                    if (activeSection === 'in-person') return !apt.isOnline;
                    if (activeSection === 'online') return apt.isOnline;
                    return true;
                  })
                  .map(appointment => (
                    <tr key={appointment.id} className={`appointment-row ${appointment.status.toLowerCase()}`}>
                      <td>{appointment.patientName}</td>
                      <td>
                        {appointment.type}
                        {appointment.meetLink && (
                          <a 
                            href={appointment.meetLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="meet-link"
                          >
                            <FaVideo />
                          </a>
                        )}
                      </td>
                      <td>{new Date(appointment.date + 'T' + appointment.time).toLocaleString()}</td>
                      <td>{appointment.reason}</td>
                      <td>
                        <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="appointment-actions-cell">
                        {appointment.status === "Pending" && (
                          <>
                            <button 
                              className="action-btn confirm"
                              onClick={() => {
                                if (appointment.isOnline) {
                                  setSelectedRequest(appointment);
                                  setShowMeetForm(true);
                                } else {
                                  updateAppointmentStatus(appointment.id, "Confirmed");
                                }
                              }}
                            >
                              {appointment.isOnline ? <><FaVideo /> Create Meet</> : <><FaCheck /> Confirm</>}
                            </button>
                            <button 
                              className="action-btn reject"
                              onClick={() => updateAppointmentStatus(appointment.id, "Cancelled")}
                            >
                              <FaTimes /> Cancel
                            </button>
                          </>
                        )}
                        {appointment.status === "Confirmed" && (
                          <button 
                            className="action-btn complete"
                            onClick={() => updateAppointmentStatus(appointment.id, "Completed")}
                          >
                            <FaCheck /> Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>



                 {/* Chat Interface */}
         {showChat && selectedRequest && (
           <div className="chat-modal">
             <div className="chat-modal-content">
               <div className="chat-header">
                 <h3><FaComments /> Chat with {selectedRequest.studentName}</h3>
                 <button className="close-btn" onClick={() => setShowChat(false)}><FaTimes /></button>
               </div>
              <div className="chat-messages">
                <div className="message clinic">
                  <div className="message-content">
                    Hello {selectedRequest.studentName}! Your consultation request has been confirmed. How can I help you today?
                  </div>
                  <div className="message-time">Just now</div>
                </div>
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                />
                <button onClick={handleSendChatMessage}>Send</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Appointment Modal */}
        {showForm && (
          <div className="appointment-modal">
            <div className="appointment-modal-content">
              <h2>Schedule New Appointment</h2>
              <form onSubmit={handleAddAppointment}>
                <div className="form-row">
                  <select
                    name="patientId"
                    value={form.patientId}
                    onChange={(e) => {
                      const patient = patients.find(p => p.id === parseInt(e.target.value));
                      setForm({
                        ...form,
                        patientId: e.target.value,
                        patientName: patient ? patient.name : ""
                      });
                    }}
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>{patient.name}</option>
                    ))}
                  </select>
                  <select
                    name="appointmentType"
                    value={form.appointmentType}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="Checkup">Checkup</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Emergency">Emergency</option>
                    <option value="In-Person-Consultation">In-Person Consultation</option>
                    <option value="Online-Consultation">Online Consultation</option>
                  </select>
                </div>
                <div className="form-row">
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleFormChange}
                    required
                  />
                  <input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleFormChange}
                    min="09:00"
                    max="17:00"
                    step="900"
                    required
                  />
                  <small className="time-note">
                    Clinic hours: 9:00 AM - 5:00 PM
                  </small>
                </div>
                <div className="form-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isOnline"
                      checked={form.isOnline}
                      onChange={(e) => {
                        const isOnline = e.target.checked;
                        setForm(prev => ({
                          ...prev,
                          isOnline,
                          appointmentType: isOnline ? "Online-Consultation" : "In-Person-Consultation"
                        }));
                      }}
                    />
                    Online Consultation (Google Meet)
                  </label>
                </div>
                <textarea
                  name="reason"
                  placeholder="Reason for appointment"
                  value={form.reason}
                  onChange={handleFormChange}
                  rows="3"
                />
                <div className="modal-actions">
                  <button type="submit" className="appointment-btn primary">Schedule</button>
                  <button type="button" className="appointment-btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Start Consultation Modal */}
        {showConsultation && (
          <div className="appointment-modal">
            <div className="appointment-modal-content">
              <h2>Start Online Consultation</h2>
              <form onSubmit={handleStartConsultation}>
                <div className="form-row">
                  <select
                    name="patientId"
                    value={consultationForm.patientId}
                    onChange={(e) => {
                      const patient = patients.find(p => p.id === parseInt(e.target.value));
                      setConsultationForm({
                        ...consultationForm,
                        patientId: e.target.value,
                        patientName: patient ? patient.name : ""
                      });
                    }}
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>{patient.name}</option>
                    ))}
                  </select>
                  <select
                    name="consultationType"
                    value={consultationForm.consultationType}
                    onChange={handleConsultationFormChange}
                    required
                  >
                    <option value="Video Call">Video Call</option>
                    <option value="Voice Call">Voice Call</option>
                    <option value="Chat">Chat</option>
                  </select>
                </div>
                <textarea
                  name="reason"
                  placeholder="Reason for consultation"
                  value={consultationForm.reason}
                  onChange={handleConsultationFormChange}
                  rows="3"
                />
                                 <div className="modal-actions">
                   <button type="submit" className="appointment-btn primary"><FaPhone /> Start Call</button>
                   <button type="button" className="appointment-btn secondary" onClick={() => setShowConsultation(false)}>Cancel</button>
                 </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Appointment;
