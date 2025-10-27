import React, { useState, useEffect } from "react";
import ClinicNavbar from "./ClinicNavbar";
import "./Appointment.css";
import { FaCalendarPlus, FaPhone, FaCheck, FaTimes, FaCommentDots, FaUser, FaClock, FaVideo, FaMicrophone, FaCalendar, FaFilter, FaStethoscope } from "react-icons/fa";
import { AppointmentsAPI } from "../api";
import Swal from "sweetalert2";

function Appointment({ setActivePage, activePage, sidebarOpen, setSidebarOpen, patients, appointments, setAppointments, onLogout }) {
  const [showForm, setShowForm] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState('all');

  // Handler for confirming online consultations
  const handleConfirmConsultation = async (appointment) => {
    try {
      const result = await Swal.fire({
        title: 'Confirm Online Consultation',
        text: 'This will create a Google Meet link and enable chat for the patient.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Confirm',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Creating consultation...',
          text: 'Setting up Google Meet and chat...',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Prepare the update payload
        const payload = {
          status: 'Confirmed',
          type: 'Online Consultation',
          requiresGoogleMeet: true,
          date: appointment.date,
          time: appointment.time,
          duration: 30 // Default duration in minutes
        };

        const response = await AppointmentsAPI.update(appointment.id, payload);

        if (!response || !response.consultationDetails?.meetLink) {
          // If Meet link creation fails, show warning but keep appointment confirmed
          await Swal.fire({
            title: 'Appointment Confirmed',
            html: `
              <div>
                <p>✅ Appointment has been confirmed</p>
                <p>⚠️ Google Meet link creation pending</p>
                <p style="margin-top: 1em">You can try creating the Meet link again later or use another video conferencing solution.</p>
              </div>
            `,
            icon: 'warning'
          });
          return;
        }

        // Update local state
        setAppointments(appointments.map(apt =>
          apt.id === appointment.id
            ? {
                ...apt,
                status: 'Confirmed',
                type: 'Online Consultation',
                consultationDetails: {
                  ...apt.consultationDetails,
                  meetLink: response.consultationDetails.meetLink,
                  chatEnabled: true
                }
              }
            : apt
        ));

        // Show success message
        await Swal.fire({
          title: 'Consultation Confirmed',
          html: `
            <div>
              <p>✅ Google Meet link has been created</p>
              <p>✅ Chat has been enabled</p>
              <p>✅ Patient will be notified</p>
              <br>
              <p><strong>Meet Link:</strong></p>
              <p style="word-break: break-all;"><a href="${response.consultationDetails.meetLink}" target="_blank">${response.consultationDetails.meetLink}</a></p>
            </div>
          `,
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to confirm consultation',
        icon: 'error'
      });
    }
  };
  const [form, setForm] = useState({
    patientId: "",
    patientName: "",
    appointmentType: "Checkup",
    date: "",
    time: "",
    reason: "",
    status: "Pending",
    isOnline: false,
    meetLink: null
  });

  const [consultationForm, setConsultationForm] = useState({
    patientId: "",
    patientName: "",
    consultationType: "Video Call",
    reason: "",
    status: "Waiting"
  });

  // Initialize empty student requests state
  const [studentRequests, setStudentRequests] = useState([]);

  // Load appointments from backend
  useEffect(() => {
    AppointmentsAPI.list().then(data => {
      // Normalize into UI shape
      const mapped = data.map(d => ({
        id: d._id,
        patientName: d.requester?.name || 'N/A',
        appointmentType: 'Consultation',
        date: d.preferredDate ? new Date(d.preferredDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
        time: '09:00',
        reason: d.concern,
        status: (d.status || 'pending').charAt(0).toUpperCase() + (d.status || 'pending').slice(1),
      }));
      setAppointments(mapped);
    }).catch(err => {
      console.error(err);
      Swal.fire({ title: "Failed to load appointments", text: err.message, icon: "error" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleConsultationFormChange(e) {
    setConsultationForm({ ...consultationForm, [e.target.name]: e.target.value });
  }

  function handleAddAppointment(e) {
    e.preventDefault();
    if (form.patientId && form.date && form.time) {
      const newAppointment = {
        id: Date.now(),
        ...form,
        createdAt: new Date().toISOString()
      };
      setAppointments([...appointments, newAppointment]);
      setForm({ patientId: "", patientName: "", appointmentType: "Check-up", date: "", time: "", reason: "", status: "Pending" });
      setShowForm(false);
    } else {
      alert("Please fill all required fields.");
    }
  }

  function handleStartConsultation(e) {
    e.preventDefault();
    if (consultationForm.patientId) {
      const newConsultation = {
        id: Date.now(),
        ...consultationForm,
        startTime: new Date().toISOString(),
        status: "In Progress"
      };
      setCurrentCall(newConsultation);
      setShowConsultation(false);
      setConsultationForm({ patientId: "", patientName: "", consultationType: "Video Call", reason: "", status: "Waiting" });
    } else {
      alert("Please select a patient for consultation.");
    }
    // Here you would integrate with actual video calling service
    // For now, we'll simulate the call interface
  }

  function handleEndCall() {
    if (currentCall) {
      const endedConsultation = {
        ...currentCall,
        endTime: new Date().toISOString(),
        status: "Completed",
        duration: Math.floor((new Date() - new Date(currentCall.startTime)) / 1000 / 60) // minutes
      };
      setAppointments([...appointments, endedConsultation]);
      setCurrentCall(null);
    }
  }

  async function updateAppointmentStatus(id, newStatus) {
    try {
      const appointment = appointments.find(apt => apt.id === id);
      
      // For online consultations being confirmed
      if (newStatus === 'Confirmed' && appointment.type === 'Online Consultation') {
        const result = await Swal.fire({
          title: 'Confirm Online Consultation',
          html: `
            <div style="text-align: left;">
              <p><strong>Patient:</strong> ${appointment.patientName}</p>
              <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${appointment.time}</p>
              <p style="margin-top: 1em;">This will:</p>
              <ul>
                <li>✓ Create a Google Meet link for the consultation</li>
                <li>✓ Enable chat for pre-consultation communication</li>
                <li>✓ Send confirmation email to the patient</li>
              </ul>
              <p style="margin-top: 1em; color: #666; font-size: 0.9em;">
                Note: Using free Google Workspace, you'll need to create the Meet link manually 
                and share it with the patient.
              </p>
            </div>
          `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, Confirm',
          cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) {
          return;
        }
      }

      const payload = { status: newStatus };
      const response = await AppointmentsAPI.update(id, payload);
      
      // Update the appointments list with the response data
      setAppointments(appointments.map(apt => 
        apt.id === id ? { 
          ...apt, 
          status: newStatus,
          consultationDetails: response.consultationDetails || apt.consultationDetails
        } : apt
      ));

      if (newStatus === 'Confirmed' && appointment.type === 'Online Consultation') {
        const meetLink = response.consultationDetails?.meetLink || response.meetLink;
        
        Swal.fire({
          title: 'Online Consultation Confirmed',
          html: `
            <div style="text-align: left;">
              <p>✅ The appointment has been confirmed</p>
              ${meetLink ? `
                <p>✅ Google Meet link has been created</p>
                <p style="margin-top: 1em;"><strong>Meet Link:</strong></p>
                <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px;">
                  <a href="${meetLink}" target="_blank">${meetLink}</a>
                </p>
                <p style="margin-top: 1em; color: #666;">
                  The patient will see this link in their appointment details.
                </p>
              ` : `
                <p style="margin-top: 1em; color: #f39c12;">
                  ⚠️ To create a Google Meet link:
                </p>
                <ol style="margin-top: 0.5em; text-align: left;">
                  <li>Go to <a href="https://meet.google.com" target="_blank">meet.google.com</a></li>
                  <li>Click "New meeting" → "Create a meeting for later"</li>
                  <li>Copy the meeting link</li>
                  <li>Share it with the patient via email or phone</li>
                </ol>
              `}
            </div>
          `,
          icon: meetLink ? 'success' : 'info',
          width: 600
        });
      } else {
        Swal.fire({
          title: 'Success',
          text: `Appointment status updated to ${newStatus}`,
          icon: 'success',
          timer: 2000
        });
      }
    } catch (err) {
      console.error('Update error:', err);
      Swal.fire({ 
        title: "Failed to update status", 
        text: err.message || 'An error occurred', 
        icon: "error" 
      });
    }
  }

  // Handle student request status updates
  function updateStudentRequestStatus(id, newStatus) {
    setStudentRequests(requests => 
      requests.map(req => 
        req.id === id ? { ...req, status: newStatus } : req
      )
    );
  }

  // Handle chat functionality
  function handleSendChatMessage() {
    if (chatMessage.trim() && selectedRequest) {
      // In real app, this would send message to student
      console.log(`Sending message to ${selectedRequest.studentName}: ${chatMessage}`);
      setChatMessage("");
    }
  }

  // Open chat for confirmed requests
  function openChat(request) {
    if (request.status === "Confirmed") {
      setSelectedRequest(request);
      setShowChat(true);
    }
  }

  // Filter appointments by status
  const pendingAppointments = appointments.filter(apt => apt.status === "Pending");
  const confirmedAppointments = appointments.filter(apt => apt.status === "Confirmed");
  const completedAppointments = appointments.filter(apt => apt.status === "Completed");
  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toDateString();
    const aptDate = new Date(apt.date).toDateString();
    return aptDate === today;
  });

  return (
    <div className="clinic-container">
      <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} />
      <div className="clinic-content">
        <div className="appointment-header">
          <h1 className="appointment-title">Appointments & Consultations</h1>
          <div className="appointment-actions">
                         <button className="appointment-btn primary" onClick={() => setShowForm(true)}>
               <FaCalendarPlus /> Add Appointment
             </button>
             <button className="appointment-btn secondary" onClick={() => setShowConsultation(true)}>
               <FaPhone /> Start Consultation
             </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="appointment-stats">
          <div className="stat-card">
            <div className="stat-number">{todayAppointments.length}</div>
            <div className="stat-label">Today's Appointments</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{pendingAppointments.length}</div>
            <div className="stat-label">Pending Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{confirmedAppointments.length}</div>
            <div className="stat-label">Confirmed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{completedAppointments.length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        {/* Current Call Interface */}
                 {currentCall && (
           <div className="call-interface">
             <div className="call-header">
               <h3><FaUser style={{color: '#28a745'}} /> Active Consultation</h3>
               <span className="call-status">In Progress</span>
             </div>
             <div className="call-info">
               <div className="call-patient">
                 <strong>Patient:</strong> {currentCall.patientName}
               </div>
               <div className="call-type">
                 <strong>Type:</strong> {currentCall.consultationType}
               </div>
               <div className="call-duration">
                 <strong>Duration:</strong> {Math.floor((new Date() - new Date(currentCall.startTime)) / 1000 / 60)}m
               </div>
             </div>
             <div className="call-controls">
               <button className="call-btn end-call" onClick={handleEndCall}>
                 <FaPhone /> End Call
               </button>
               <button className="call-btn mute"><FaMicrophone /> Mute</button>
               <button className="call-btn video"><FaVideo /> Video</button>
             </div>
           </div>
         )}

        {/* All Appointments Section */}
        <div className="appointments-section">
          <h2><FaUser /> Appointment & Consultation Requests</h2>
          
          <div className="consultation-filters">
            <button 
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Appointments
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              Pending
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'online' ? 'active' : ''}`}
              onClick={() => setActiveFilter('online')}
            >
              Online Consultations
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'inPerson' ? 'active' : ''}`}
              onClick={() => setActiveFilter('inPerson')}
            >
              In-Person Visits
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'today' ? 'active' : ''}`}
              onClick={() => setActiveFilter('today')}
            >
              Today's Appointments
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
              {appointments
                .filter(apt => {
                  switch (activeFilter) {
                    case 'pending':
                      return apt.status === 'Pending';
                    case 'online':
                      return apt.type === 'Online Consultation';
                    case 'inPerson':
                      return apt.type === 'In-Person-Consultation' || apt.type === 'Clinic Visit';
                    case 'today':
                      const today = new Date().toDateString();
                      const aptDate = new Date(apt.date).toDateString();
                      return aptDate === today;
                    default:
                      return true;
                  }
                })
                .length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data">No appointments found</td>
                </tr>
              ) : (
                appointments
                .filter(apt => {
                  switch (activeFilter) {
                    case 'pending':
                      return apt.status === 'Pending';
                    case 'online':
                      return apt.type === 'Online Consultation';
                    case 'inPerson':
                      return apt.type === 'In-Person-Consultation' || apt.type === 'Clinic Visit';
                    case 'today':
                      const today = new Date().toDateString();
                      const aptDate = new Date(apt.date).toDateString();
                      return aptDate === today;
                    default:
                      return true;
                  }
                })
                .map(appointment => (
                  <tr key={appointment.id} className={`appointment-row ${appointment.status.toLowerCase()}`}>
                    <td>{appointment.patientName}</td>
                    <td>
                      <div className="appointment-type-cell">
                        {appointment.type === 'Online Consultation' ? (
                          <div className="online-consultation-info">
                            <span className="type-label">
                              <FaVideo /> Online Consultation
                            </span>
                            {appointment.meetLink && (
                              <div className="meet-actions">
                                <a 
                                  href={appointment.meetLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="meet-link"
                                >
                                  <FaVideo /> Join Meet
                                </a>
                                <button
                                  className="chat-link"
                                  onClick={() => openChat(appointment)}
                                >
                                  <FaCommentDots /> Chat
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span>{appointment.appointmentType}</span>
                        )}
                      </div>
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
                             onClick={() => updateAppointmentStatus(appointment.id, "Confirmed")}
                           >
                             <FaCheck /> Confirm
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
                 <h3><FaCommentDots /> Chat with {selectedRequest.studentName}</h3>
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
                    required
                  />
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
