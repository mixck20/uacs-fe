import React, { useState, useEffect } from "react";
import ClinicNavbar from "./ClinicNavbar";
import "./Appointment.css";
import { 
  FaCalendarPlus, FaPhone, FaCheck, FaTimes, FaCommentDots, FaUser, 
  FaClock, FaVideo, FaMicrophone, FaCalendar, FaFilter, FaStethoscope,
  FaMapMarkerAlt, FaEnvelope, FaLink, FaPaperPlane, FaEllipsisV, FaSearch,
  FaFileAlt, FaNotesMedical, FaCalendarAlt
} from "react-icons/fa";
import { AppointmentsAPI, ChatAPI, PatientsAPI } from "../api";
import Swal from "sweetalert2";

// Helper function to format time in 12-hour format with AM/PM
const formatTime12Hour = (time24) => {
  if (!time24) return 'Not set';
  
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Convert 0 to 12 for midnight
  
  return `${hour12}:${minutes} ${ampm}`;
};

function Appointment({ setActivePage, activePage, sidebarOpen, setSidebarOpen, patients, appointments, setAppointments, onLogout, user }) {
  const [currentCall, setCurrentCall] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({}); // Track unread messages per appointment
  const [activeFilter, setActiveFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showHealthRecordModal, setShowHealthRecordModal] = useState(false);
  const [healthRecordForm, setHealthRecordForm] = useState({
    diagnosis: '',
    treatment: '',
    prescriptions: [],
    vitalSigns: {
      bloodPressure: '',
      temperature: '',
      heartRate: '',
      weight: '',
      height: ''
    },
    notes: ''
  });
  const [selectedAppointmentForRecord, setSelectedAppointmentForRecord] = useState(null);
  const [visitTemplates] = useState([
    {
      name: 'General Checkup',
      diagnosis: 'Routine health checkup',
      treatment: 'General wellness assessment',
      prescriptions: []
    },
    {
      name: 'Vaccination',
      diagnosis: 'Immunization',
      treatment: 'Vaccine administration',
      prescriptions: []
    },
    {
      name: 'Consultation',
      diagnosis: 'Medical consultation',
      treatment: 'Advised treatment plan',
      prescriptions: []
    }
  ]);

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
              <div style="text-align: left; padding: 0 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                  <svg style="width: 20px; height: 20px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span style="color: #374151; font-weight: 500;">Appointment has been confirmed</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                  <svg style="width: 20px; height: 20px; color: #f59e0b;" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  <span style="color: #374151; font-weight: 500;">Google Meet link creation pending</span>
                </div>
                <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">You can try creating the Meet link again later or use another video conferencing solution.</p>
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
            <div style="text-align: left; padding: 0 1rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                <svg style="width: 20px; height: 20px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span style="color: #374151; font-weight: 500;">Google Meet link has been created</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                <svg style="width: 20px; height: 20px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span style="color: #374151; font-weight: 500;">Chat has been enabled</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                <svg style="width: 20px; height: 20px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span style="color: #374151; font-weight: 500;">Patient will be notified</span>
              </div>
              <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #374151;">Meet Link:</p>
                <p style="margin: 0; word-break: break-all;">
                  <a href="${response.consultationDetails.meetLink}" target="_blank" style="color: #3b82f6; text-decoration: none;">
                    ${response.consultationDetails.meetLink}
                  </a>
                </p>
              </div>
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

  // Initialize empty student requests state
  const [studentRequests, setStudentRequests] = useState([]);

  // Load appointments from backend and poll for updates
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await AppointmentsAPI.list();
        console.log('Loaded appointments:', data);
        console.log('First appointment user data:', data[0]?.user);
        setAppointments(data);
      } catch (err) {
        console.error(err);
        // Only show error on initial load, not on polling failures
        if (appointments.length === 0) {
          Swal.fire({ title: "Failed to load appointments", text: err.message, icon: "error" });
        }
      }
    };

    // Initial fetch
    fetchAppointments();

    // Poll every 5 seconds for new appointments
    const intervalId = setInterval(fetchAppointments, 5000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for unread messages across all appointments (every 10 seconds)
  useEffect(() => {
    const checkUnreadMessages = async () => {
      try {
        const unreadCounts = {};
        for (const appointment of appointments) {
          if (appointment.consultationDetails?.chatEnabled) {
            const chatData = await ChatAPI.getAppointmentChat(appointment.id);
            const unreadCount = chatData.messages.filter(msg => 
              msg.sender === 'user' && !msg.read
            ).length;
            if (unreadCount > 0) {
              unreadCounts[appointment.id] = unreadCount;
            }
          }
        }
        setUnreadMessages(unreadCounts);
      } catch (error) {
        console.error('Error checking unread messages:', error);
      }
    };

    if (appointments.length > 0) {
      checkUnreadMessages();
      const intervalId = setInterval(checkUnreadMessages, 10000);
      return () => clearInterval(intervalId);
    }
  }, [appointments]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
            <div style="text-align: left; padding: 0 1rem;">
              <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p style="margin: 0 0 0.25rem 0;"><strong style="color: #374151;">Patient:</strong> <span style="color: #6b7280;">${appointment.patientName}</span></p>
                <p style="margin: 0 0 0.25rem 0;"><strong style="color: #374151;">Date:</strong> <span style="color: #6b7280;">${new Date(appointment.date).toLocaleDateString()}</span></p>
                <p style="margin: 0;"><strong style="color: #374151;">Time:</strong> <span style="color: #6b7280;">${formatTime12Hour(appointment.time)}</span></p>
              </div>
              <p style="margin: 0 0 0.75rem 0; font-weight: 600; color: #374151;">This will:</p>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <svg style="width: 18px; height: 18px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span style="color: #374151;">Create a Google Meet link for the consultation</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <svg style="width: 18px; height: 18px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span style="color: #374151;">Enable chat for pre-consultation communication</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <svg style="width: 18px; height: 18px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span style="color: #374151;">Send confirmation notification to the patient</span>
                </div>
              </div>
              <p style="margin-top: 1rem; margin-bottom: 0; color: #6b7280; font-size: 0.85rem; line-height: 1.4;">
                <strong>Note:</strong> If you're using a free Google account, you may need to create the Meet link manually and share it with the patient.
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

      // Prepare payload - include additional data for online consultations
      const payload = { status: newStatus };
      
      // If confirming an online consultation, add necessary data for Meet link creation
      if (newStatus === 'Confirmed' && appointment.type === 'Online Consultation') {
        payload.type = 'Online Consultation';
        payload.isOnline = true;
        payload.requiresGoogleMeet = true;
        payload.date = appointment.date;
        payload.time = appointment.time;
        payload.duration = 30;
      }
      
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
            <div style="text-align: left; padding: 0 1rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                <svg style="width: 20px; height: 20px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span style="color: #374151; font-weight: 500;">The appointment has been confirmed</span>
              </div>
              ${meetLink ? `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                  <svg style="width: 20px; height: 20px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span style="color: #374151; font-weight: 500;">Google Meet link has been created</span>
                </div>
                <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">
                  <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #374151;">Meet Link:</p>
                  <p style="margin: 0; word-break: break-all;">
                    <a href="${meetLink}" target="_blank" style="color: #3b82f6; text-decoration: none;">${meetLink}</a>
                  </p>
                </div>
                <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">
                  The patient will see this link in their appointment details.
                </p>
              ` : `
                <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-top: 1rem; margin-bottom: 1rem;">
                  <svg style="width: 20px; height: 20px; color: #f59e0b; flex-shrink: 0; margin-top: 0.25rem;" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  <div>
                    <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #374151;">To create a Google Meet link:</p>
                    <ol style="margin: 0; padding-left: 1.25rem; color: #374151; font-size: 0.9rem;">
                      <li>Go to <a href="https://meet.google.com" target="_blank" style="color: #3b82f6;">meet.google.com</a></li>
                      <li>Click "New meeting" → "Create a meeting for later"</li>
                      <li>Copy the meeting link</li>
                      <li>Share it with the patient via email or phone</li>
                    </ol>
                  </div>
                </div>
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
  async function handleSendChatMessage() {
    if (chatMessage.trim() && selectedRequest) {
      try {
        await ChatAPI.sendMessage(selectedRequest.id, chatMessage.trim());
        setChatMessage("");
        // Reload messages after sending
        await loadChatMessages(selectedRequest.id);
      } catch (error) {
        console.error('Error sending message:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to send message',
          icon: 'error'
        });
      }
    }
  }

  // Load chat messages
  async function loadChatMessages(appointmentId) {
    try {
      const chatData = await ChatAPI.getAppointmentChat(appointmentId);
      const formattedMessages = chatData.messages.map(msg => ({
        id: msg._id,
        sender: msg.sender,
        text: msg.text,
        time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: msg.read
      }));
      setChatMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  }

  // Open chat for online consultations (pending or confirmed)
  async function openChat(request) {
    // Allow chat for online appointments that are Pending or Confirmed
    if (request.status === "Pending" || request.status === "Confirmed") {
      setSelectedRequest(request);
      setShowChat(true);
      
      // Clear unread count for this appointment
      setUnreadMessages(prev => {
        const updated = { ...prev };
        delete updated[request.id];
        return updated;
      });
      
      await loadChatMessages(request.id);
      
      // Mark messages as read
      try {
        await ChatAPI.markMessagesAsRead(request.id);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  }

  // Poll for new messages when chat is open
  useEffect(() => {
    if (!showChat || !selectedRequest) return;

    let previousMessageCount = chatMessages.length;

    const pollMessages = async () => {
      try {
        await loadChatMessages(selectedRequest.id);
        
        // Check for new user messages
        if (chatMessages.length > previousMessageCount) {
          const newMsg = chatMessages[chatMessages.length - 1];
          if (newMsg.sender === 'user') {
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New Patient Message', {
                body: `${selectedRequest.patientName}: ${newMsg.text.substring(0, 100)}`,
                icon: '/favicon.ico'
              });
            }
            // Play sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZizcIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrj9H0164pBjWQ1vLSeSwGLYTO8t2PQHJ3D'); 
            audio.play().catch(e => console.log('Audio play failed:', e));
          }
        }
        previousMessageCount = chatMessages.length;
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    // Poll every 3 seconds for real-time feel
    const intervalId = setInterval(pollMessages, 3000);

    return () => clearInterval(intervalId);
  }, [showChat, selectedRequest, chatMessages.length]);

  // Handle reschedule approval
  const handleRescheduleResponse = async (appointment, requestId, action) => {
    const result = await Swal.fire({
      title: action === 'approve' ? 'Approve Reschedule?' : 'Reject Reschedule?',
      html: `
        <div style="text-align: left; margin-top: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">
            ${action === 'approve' ? 'Approval Note (Optional)' : 'Reason for Rejection'}
          </label>
          <textarea 
            id="response-note" 
            style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e5; border-radius: 12px; min-height: 80px; font-family: inherit; font-size: 0.95rem;"
            placeholder="${action === 'approve' ? 'Add any notes...' : 'Please provide a reason...'}"
          ></textarea>
        </div>
      `,
      icon: action === 'approve' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: action === 'approve' ? 'Approve' : 'Reject',
      cancelButtonText: 'Cancel',
      confirmButtonColor: action === 'approve' ? '#10b981' : '#dc2626',
      preConfirm: () => {
        const note = document.getElementById('response-note').value.trim();
        if (action === 'reject' && !note) {
          Swal.showValidationMessage('Please provide a reason');
        }
        return note;
      }
    });

    if (result.isConfirmed) {
      try {
        await AppointmentsAPI.respondToReschedule(
          appointment.id,
          requestId,
          action,
          result.value
        );
        
        // Reload appointments
        const updatedAppointments = await AppointmentsAPI.list();
        setAppointments(updatedAppointments);
        
        Swal.fire({
          title: action === 'approve' ? 'Approved!' : 'Rejected',
          text: `Reschedule request has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
          icon: 'success'
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to process reschedule request',
          icon: 'error'
        });
      }
    }
  };

  // Handle consultation notes
  const handleAddConsultationNotes = async (appointment) => {
    const result = await Swal.fire({
      title: 'Add Consultation Notes',
      html: `
        <div style="text-align: left; margin-top: 1rem; max-height: 500px; overflow-y: auto; padding: 0 10px;">
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; font-size: 14px;">
              Diagnosis *
            </label>
            <input 
              id="swal-diagnosis" 
              type="text" 
              style="width: 100%; padding: 10px; border: 2px solid #e0e0e5; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; outline: none;"
              placeholder="Enter diagnosis..."
            />
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; font-size: 14px;">
              Symptoms
            </label>
            <textarea 
              id="swal-symptoms" 
              rows="3"
              style="width: 100%; padding: 10px; border: 2px solid #e0e0e5; border-radius: 8px; min-height: 60px; font-family: inherit; font-size: 14px; box-sizing: border-box; resize: vertical; outline: none;"
              placeholder="List symptoms..."
            ></textarea>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; font-size: 14px;">
              Vital Signs
            </label>
            <input 
              id="swal-vitalSigns" 
              type="text" 
              style="width: 100%; padding: 10px; border: 2px solid #e0e0e5; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; outline: none;"
              placeholder="BP, Temp, Pulse, etc..."
            />
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; font-size: 14px;">
              Assessment
            </label>
            <textarea 
              id="swal-assessment" 
              rows="4"
              style="width: 100%; padding: 10px; border: 2px solid #e0e0e5; border-radius: 8px; min-height: 80px; font-family: inherit; font-size: 14px; box-sizing: border-box; resize: vertical; outline: none;"
              placeholder="Clinical assessment..."
            ></textarea>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; font-size: 14px;">
              Treatment Plan
            </label>
            <textarea 
              id="swal-treatment" 
              rows="4"
              style="width: 100%; padding: 10px; border: 2px solid #e0e0e5; border-radius: 8px; min-height: 80px; font-family: inherit; font-size: 14px; box-sizing: border-box; resize: vertical; outline: none;"
              placeholder="Recommended treatment..."
            ></textarea>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; font-size: 14px;">
              Prescriptions (JSON format or leave blank)
            </label>
            <textarea 
              id="swal-prescriptions" 
              rows="3"
              style="width: 100%; padding: 10px; border: 2px solid #e0e0e5; border-radius: 8px; min-height: 60px; font-family: 'Courier New', monospace; font-size: 13px; box-sizing: border-box; resize: vertical; outline: none;"
              placeholder='[{"medication":"Paracetamol","dosage":"500mg","frequency":"3x daily","duration":"5 days"}]'
            ></textarea>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: flex; align-items: center; cursor: pointer; user-select: none;">
              <input 
                id="swal-followUpRequired" 
                type="checkbox" 
                style="margin-right: 8px; cursor: pointer; width: 18px; height: 18px;"
              />
              <span style="font-weight: 600; color: #333; font-size: 14px;">Follow-up Required?</span>
            </label>
          </div>
          
          <div id="swal-followUpDate" style="display: none; margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; font-size: 14px;">
              Follow-up Date
            </label>
            <input 
              id="swal-followUpDateInput" 
              type="date" 
              style="width: 100%; padding: 10px; border: 2px solid #e0e0e5; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; outline: none;"
            />
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; font-size: 14px;">
              Follow-up Notes
            </label>
            <textarea 
              id="swal-followUpNotes" 
              rows="3"
              style="width: 100%; padding: 10px; border: 2px solid #e0e0e5; border-radius: 8px; min-height: 60px; font-family: inherit; font-size: 14px; box-sizing: border-box; resize: vertical; outline: none;"
              placeholder="Additional recommendations..."
            ></textarea>
          </div>
        </div>
      `,
      width: '650px',
      showCancelButton: true,
      confirmButtonText: 'Save Notes',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e51d5e',
      didOpen: () => {
        // Add event listener for follow-up checkbox
        const followUpCheckbox = document.getElementById('swal-followUpRequired');
        const followUpDateDiv = document.getElementById('swal-followUpDate');
        followUpCheckbox.addEventListener('change', function() {
          followUpDateDiv.style.display = this.checked ? 'block' : 'none';
        });
      },
      preConfirm: () => {
        const diagnosis = document.getElementById('swal-diagnosis').value.trim();
        if (!diagnosis) {
          Swal.showValidationMessage('Diagnosis is required');
          return false;
        }

        const prescriptionsText = document.getElementById('swal-prescriptions').value.trim();
        let prescriptions = [];
        if (prescriptionsText) {
          try {
            prescriptions = JSON.parse(prescriptionsText);
          } catch (e) {
            Swal.showValidationMessage('Invalid prescriptions format. Must be valid JSON or leave blank.');
            return false;
          }
        }

        return {
          diagnosis,
          symptoms: document.getElementById('swal-symptoms').value.trim(),
          vitalSigns: document.getElementById('swal-vitalSigns').value.trim(),
          assessment: document.getElementById('swal-assessment').value.trim(),
          treatment: document.getElementById('swal-treatment').value.trim(),
          prescriptions,
          followUpRecommendations: {
            required: document.getElementById('swal-followUpRequired').checked,
            date: document.getElementById('swal-followUpDateInput').value,
            notes: document.getElementById('swal-followUpNotes').value.trim()
          }
        };
      }
    });

    if (result.isConfirmed) {
      try {
        await AppointmentsAPI.addConsultationNotes(appointment.id, result.value);
        
        // Reload appointments
        const updatedAppointments = await AppointmentsAPI.list();
        setAppointments(updatedAppointments);
        
        Swal.fire({
          title: 'Success!',
          text: 'Consultation notes have been saved.',
          icon: 'success'
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to save consultation notes',
          icon: 'error'
        });
      }
    }
  };

  // Open health record modal for completed appointment
  const openHealthRecordModal = (appointment) => {
    setSelectedAppointmentForRecord(appointment);
    setHealthRecordForm({
      diagnosis: '',
      treatment: '',
      prescriptions: [],
      vitalSigns: {
        bloodPressure: '',
        temperature: '',
        heartRate: '',
        weight: '',
        height: ''
      },
      notes: ''
    });
    setShowHealthRecordModal(true);
  };

  // Apply visit template
  const applyTemplate = (template) => {
    setHealthRecordForm(prev => ({
      ...prev,
      diagnosis: template.diagnosis,
      treatment: template.treatment,
      prescriptions: template.prescriptions
    }));
  };

  // Handle health record form change
  const handleHealthRecordChange = (field, value) => {
    if (field.startsWith('vitalSigns.')) {
      const vitalField = field.split('.')[1];
      setHealthRecordForm(prev => ({
        ...prev,
        vitalSigns: {
          ...prev.vitalSigns,
          [vitalField]: value
        }
      }));
    } else {
      setHealthRecordForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Add prescription
  const addPrescription = () => {
    setHealthRecordForm(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, { medication: '', dosage: '', instructions: '' }]
    }));
  };

  // Remove prescription
  const removePrescription = (index) => {
    setHealthRecordForm(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index)
    }));
  };

  // Update prescription
  const updatePrescription = (index, field, value) => {
    setHealthRecordForm(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  // Submit health record
  const submitHealthRecord = async () => {
    if (!selectedAppointmentForRecord) return;

    // Validation
    if (!healthRecordForm.diagnosis.trim()) {
      Swal.fire('Error', 'Diagnosis is required', 'error');
      return;
    }
    if (!healthRecordForm.treatment.trim()) {
      Swal.fire('Error', 'Treatment is required', 'error');
      return;
    }

    try {
      Swal.fire({
        title: 'Saving...',
        text: 'Adding health record',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      console.log('Selected appointment for record:', selectedAppointmentForRecord);
      
      // Get patient ID from appointment
      let patientId = selectedAppointmentForRecord.patientId || selectedAppointmentForRecord.patient?._id;
      console.log('Initial patientId:', patientId);
      console.log('userId in appointment:', selectedAppointmentForRecord.userId);
      console.log('user in appointment:', selectedAppointmentForRecord.user);
      
      // Always verify patient exists or create one
      const userInfo = selectedAppointmentForRecord.userId || selectedAppointmentForRecord.user;
      
      if (userInfo) {
        console.log('Verifying/creating patient for user:', userInfo);
        
        try {
          // Try to find existing patient by userId
          const allPatients = await PatientsAPI.list();
          console.log('All patients:', allPatients.length);
          
          // Extract the actual user ID (could be string, object with _id, or object with id)
          let userId;
          if (typeof userInfo === 'string') {
            userId = userInfo;
          } else if (userInfo._id) {
            userId = userInfo._id;
          } else if (userInfo.id) {
            userId = userInfo.id;
          } else {
            // userInfo is the user object but doesn't have _id or id
            console.log('User object without ID, searching by email:', userInfo.email);
            
            // Try to find by email in patients list
            const patientByEmail = allPatients.find(p => p.email === userInfo.email);
            
            if (patientByEmail) {
              patientId = patientByEmail._id;
              console.log('✅ Found existing patient by email:', patientId);
              userId = null; // Skip the userId-based search below
            } else {
              // No patient found in list, but one might exist in DB (if list is filtered)
              // Try to create, and if duplicate error, fetch all and retry
              console.log('⚠️ No patient found in list, attempting to create');
              try {
                const newPatientData = {
                  fullName: userInfo.name || userInfo.fullName || selectedAppointmentForRecord.patientName || 'Unknown',
                  email: userInfo.email || '',
                  role: userInfo.role || 'Student',
                  courseYear: userInfo.courseYear || '',
                  isRegisteredUser: false,
                  contact: userInfo.contact || '',
                  address: userInfo.address || '',
                  studentId: `TEMP-${Date.now()}`
                };
                
                console.log('Creating patient with data:', newPatientData);
                const newPatient = await PatientsAPI.create(newPatientData);
                patientId = newPatient._id;
                console.log('✅ Created new patient:', patientId);
                userId = null;
              } catch (createError) {
                // If duplicate email error, fetch the patient by querying all without filters
                if (createError.message.includes('E11000') && createError.message.includes('email')) {
                  console.log('⚠️ Patient exists with this email, fetching without filters');
                  const allPatientsUnfiltered = await PatientsAPI.list('all', '');
                  const existingPatient = allPatientsUnfiltered.find(p => p.email === userInfo.email);
                  if (existingPatient) {
                    patientId = existingPatient._id;
                    console.log('✅ Found existing patient after duplicate error:', patientId);
                    
                    // Update patient to link with userId if not already linked
                    if (!existingPatient.userId) {
                      console.log('🔗 Linking patient to user');
                      try {
                        await PatientsAPI.update(patientId, { isRegisteredUser: false });
                        console.log('✅ Patient record updated');
                      } catch (updateError) {
                        console.warn('⚠️ Could not update patient:', updateError.message);
                      }
                    }
                    userId = null;
                  } else {
                    throw createError; // Re-throw if still not found
                  }
                } else {
                  throw createError; // Re-throw other errors
                }
              }
            }
          }
          
          if (userId) {
            console.log('Looking for patient with userId:', userId);
            
            const existingPatient = allPatients.find(p => {
              const pUserId = p.userId?._id || p.userId;
              console.log('Comparing patient userId:', pUserId, 'with target:', userId);
              return pUserId === userId;
            });
            
            if (existingPatient) {
              patientId = existingPatient._id;
              console.log('✅ Found existing patient:', patientId);
            } else {
              // Create new patient record
              console.log('⚠️ No patient found, creating new patient with userId link');
              
              try {
                const newPatientData = {
                  userId: userId,
                  fullName: userInfo.name || userInfo.fullName || selectedAppointmentForRecord.patientName || 'Unknown',
                  email: userInfo.email || '',
                  role: userInfo.role || 'Student',
                  courseYear: userInfo.courseYear || '',
                  isRegisteredUser: true,
                  contact: userInfo.contact || '',
                  address: userInfo.address || '',
                  studentId: `TEMP-${Date.now()}`
                };
                
                console.log('Creating patient with data:', newPatientData);
                const newPatient = await PatientsAPI.create(newPatientData);
                patientId = newPatient._id;
                console.log('✅ Created new patient:', patientId);
              } catch (createError) {
                // If duplicate email error, fetch the patient by querying all without filters
                if (createError.message.includes('E11000') && createError.message.includes('email')) {
                  console.log('⚠️ Patient exists with this email, fetching without filters');
                  const allPatientsUnfiltered = await PatientsAPI.list('all', '');
                  const existingPatient = allPatientsUnfiltered.find(p => p.email === userInfo.email);
                  if (existingPatient) {
                    patientId = existingPatient._id;
                    console.log('✅ Found existing patient after duplicate error:', patientId);
                    
                    // Update patient to link with userId if not already linked
                    if (userId && !existingPatient.userId) {
                      console.log('🔗 Linking patient to userId:', userId);
                      try {
                        await PatientsAPI.update(patientId, { userId: userId, isRegisteredUser: true });
                        console.log('✅ Patient linked to user account');
                      } catch (updateError) {
                        console.warn('⚠️ Could not link patient to user:', updateError.message);
                      }
                    }
                  } else {
                    throw createError; // Re-throw if still not found
                  }
                } else {
                  throw createError; // Re-throw other errors
                }
              }
            }
          }
        } catch (patientError) {
          console.error('❌ Error finding/creating patient:', patientError);
          throw new Error(`Could not find or create patient record: ${patientError.message}`);
        }
      } else {
        console.warn('⚠️ No user information in appointment, using existing patientId:', patientId);
      }
      
      if (!patientId) {
        throw new Error('Patient ID not found. Please ensure the user has a patient record.');
      }

      console.log('Adding visit to patient:', patientId);
      const visitData = {
        appointmentId: selectedAppointmentForRecord.id,
        ...healthRecordForm
      };
      console.log('Visit data:', visitData);

      await PatientsAPI.addVisit(patientId, visitData);

      Swal.fire({
        title: 'Success!',
        text: 'Health record has been added successfully',
        icon: 'success'
      });

      setShowHealthRecordModal(false);
      setSelectedAppointmentForRecord(null);

    } catch (error) {
      console.error('Error adding health record:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to add health record',
        icon: 'error'
      });
    }
  };

  // Filter appointments by status
  // Filter appointments based on active filter and search
  const filteredAppointments = appointments
    .filter(apt => {
      // Filter by status/type
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
    .filter(apt => {
      // Filter by search term
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        apt.patientName?.toLowerCase().includes(search) ||
        apt.reason?.toLowerCase().includes(search) ||
        apt.type?.toLowerCase().includes(search) ||
        apt.user?.courseYear?.toLowerCase().includes(search)
      );
    });

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm]);

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
      <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} user={user} />
      <div className="clinic-content">
        
        {/* Header */}
        <div className="appointment-header">
          <div className="header-content">
            <h1 className="appointment-title">Appointments & Consultations</h1>
            <p className="appointment-subtitle">Manage patient appointments and online consultations</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="appointment-stats-grid">
          <div className="stat-card stat-today">
            <div className="stat-icon">
              <FaCalendar />
            </div>
            <div className="stat-details">
              <div className="stat-number">{todayAppointments.length}</div>
              <div className="stat-label">Today</div>
            </div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-details">
              <div className="stat-number">{pendingAppointments.length}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-card stat-confirmed">
            <div className="stat-icon">
              <FaCheck />
            </div>
            <div className="stat-details">
              <div className="stat-number">{confirmedAppointments.length}</div>
              <div className="stat-label">Confirmed</div>
            </div>
          </div>
          <div className="stat-card stat-completed">
            <div className="stat-icon">
              <FaStethoscope />
            </div>
            <div className="stat-details">
              <div className="stat-number">{completedAppointments.length}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        </div>

        {/* Active Call Interface */}
        {currentCall && (
          <div className="active-call-card">
            <div className="call-card-header">
              <div className="call-status-badge pulsing">
                <span className="pulse-dot"></span>
                Active Consultation
              </div>
              <button className="call-end-btn" onClick={handleEndCall}>
                <FaTimes /> End Call
              </button>
            </div>
            <div className="call-card-body">
              <div className="call-patient-info">
                <div className="patient-avatar">
                  {currentCall.patientName?.charAt(0).toUpperCase()}
                </div>
                <div className="patient-details">
                  <h3>{currentCall.patientName}</h3>
                  <p>{currentCall.consultationType}</p>
                </div>
              </div>
              <div className="call-duration">
                <FaClock /> {Math.floor((new Date() - new Date(currentCall.startTime)) / 1000 / 60)} min
              </div>
            </div>
            <div className="call-card-controls">
              <button className="call-control-btn"><FaMicrophone /> Mute</button>
              <button className="call-control-btn"><FaVideo /> Camera</button>
              <button className="call-control-btn"><FaCommentDots /> Chat</button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="appointments-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by patient name, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              <FaClock /> Pending
            </button>
            <button 
              className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <FaCalendar /> All
            </button>
            <button 
              className={`filter-tab ${activeFilter === 'online' ? 'active' : ''}`}
              onClick={() => setActiveFilter('online')}
            >
              <FaVideo /> Online
            </button>
            <button 
              className={`filter-tab ${activeFilter === 'inPerson' ? 'active' : ''}`}
              onClick={() => setActiveFilter('inPerson')}
            >
              <FaMapMarkerAlt /> In-Person
            </button>
            <button 
              className={`filter-tab ${activeFilter === 'today' ? 'active' : ''}`}
              onClick={() => setActiveFilter('today')}
            >
              <FaStethoscope /> Today
            </button>
          </div>
        </div>

        {/* Appointments Grid */}
        <div className="appointments-grid">
          {filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <FaCalendar className="empty-icon" />
              <h3>No appointments found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          ) : (
            paginatedAppointments.map(appointment => (
              <div key={appointment.id} className={`appointment-card appointment-${appointment.status?.toLowerCase()}`}>
                <div className="appointment-card-header">
                  <div className="appointment-type-badge">
                    {appointment.type === 'Online Consultation' ? (
                      <><FaVideo /> Online</>
                    ) : (
                      <><FaMapMarkerAlt /> In-Person</>
                    )}
                  </div>
                  <button 
                    className="appointment-menu-btn"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <FaEllipsisV />
                  </button>
                </div>

                <div className="appointment-card-body">
                  <div className="patient-info">
                    <div className="patient-avatar-sm">
                      <FaUser />
                    </div>
                    <div>
                      <h4 className="patient-name">
                        {appointment.patientName || 'Unknown Patient'}
                      </h4>
                      <p className="patient-course">
                        {appointment.user?.courseYear || 
                         (appointment.user?.role && appointment.user.role !== 'student' && appointment.user.role !== 'STUDENT' 
                           ? appointment.user.role.toUpperCase() 
                           : 'No course info')}
                      </p>
                    </div>
                  </div>

                  <div className="appointment-details">
                    <div className="detail-row">
                      <FaCalendar className="detail-icon" />
                      <span>{new Date(appointment.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                    <div className="detail-row">
                      <FaClock className="detail-icon" />
                      <span>{formatTime12Hour(appointment.time)}</span>
                    </div>
                    <div className="detail-row">
                      <FaStethoscope className="detail-icon" />
                      <span>{appointment.reason || 'No reason provided'}</span>
                    </div>
                  </div>

                  <div className={`status-badge status-${appointment.status?.toLowerCase()}`}>
                    {appointment.status}
                  </div>

                  {/* Cancellation Reason */}
                  {appointment.status === 'Cancelled' && appointment.cancelReason && (
                    <div className="cancellation-section">
                      <div className="cancellation-header">
                        <FaTimes className="cancel-icon" />
                        <strong>Cancellation Reason</strong>
                      </div>
                      <p className="cancel-reason-text">{appointment.cancelReason}</p>
                      {appointment.cancelledAt && (
                        <p className="cancel-date">
                          Cancelled on {new Date(appointment.cancelledAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Online Consultation Features */}
                  {appointment.type === 'Online Consultation' && (
                    <div className="online-consultation-section">
                      {appointment.consultationDetails?.meetLink && (
                        <div className="meet-link-container">
                          <FaLink className="link-icon" />
                          <a 
                            href={appointment.consultationDetails.meetLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="meet-link-text"
                          >
                            Join Google Meet
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chat available for Pending and Confirmed appointments */}
                  {(appointment.status === 'Pending' || appointment.status === 'Confirmed') && (
                    <div className="chat-section">
                      <button 
                        className="chat-btn"
                        onClick={() => openChat(appointment)}
                        style={{ position: 'relative' }}
                      >
                        <FaCommentDots /> Open Chat
                        {unreadMessages[appointment.id] > 0 && (
                          <span className="unread-badge-clinic">{unreadMessages[appointment.id]}</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="appointment-card-footer">
                  {/* Pending reschedule requests */}
                  {appointment.rescheduleRequests && appointment.rescheduleRequests.some(r => r.status === 'pending') && (
                    <div className="reschedule-alert">
                      <span><FaCalendarAlt /> Reschedule request pending</span>
                      <div className="reschedule-actions">
                        {appointment.rescheduleRequests.filter(r => r.status === 'pending').map(request => (
                          <div key={request._id} className="reschedule-request">
                            <p>New date/time: {new Date(request.newDate).toLocaleDateString()} at {request.newTime}</p>
                            <div className="request-buttons">
                              <button 
                                className="action-btn action-confirm-sm"
                                onClick={() => handleRescheduleResponse(appointment, request._id, 'approve')}
                              >
                                Approve
                              </button>
                              <button 
                                className="action-btn action-decline-sm"
                                onClick={() => handleRescheduleResponse(appointment, request._id, 'reject')}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {appointment.status === 'Pending' && (
                    <>
                      <button 
                        className="action-btn action-confirm"
                        onClick={() => {
                          if (appointment.type === 'Online Consultation') {
                            handleConfirmConsultation(appointment);
                          } else {
                            updateAppointmentStatus(appointment.id, 'Confirmed');
                          }
                        }}
                      >
                        <FaCheck /> Confirm
                      </button>
                      <button 
                        className="action-btn action-decline"
                        onClick={() => updateAppointmentStatus(appointment.id, 'Declined')}
                      >
                        <FaTimes /> Decline
                      </button>
                    </>
                  )}
                  {appointment.status === 'Confirmed' && (
                    <button 
                      className="action-btn action-complete"
                      onClick={() => updateAppointmentStatus(appointment.id, 'Completed')}
                    >
                      <FaCheck /> Mark Complete
                    </button>
                  )}
                  {appointment.status === 'Completed' && !appointment.consultationNotes && (
                    <>
                      <button 
                        className="action-btn action-notes"
                        onClick={() => handleAddConsultationNotes(appointment)}
                      >
                        <FaFileAlt /> Add Consultation Notes
                      </button>
                      <button 
                        className="action-btn action-health-record"
                        onClick={() => openHealthRecordModal(appointment)}
                      >
                        <FaNotesMedical /> Add Health Record
                      </button>
                    </>
                  )}
                  {appointment.status === 'Completed' && appointment.consultationNotes && (
                    <>
                      <span className="notes-added-badge">
                        <FaCheck /> Consultation notes recorded
                      </span>
                      <button 
                        className="action-btn action-health-record"
                        onClick={() => openHealthRecordModal(appointment)}
                      >
                        <FaNotesMedical /> Add Health Record
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredAppointments.length > itemsPerPage && (
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages} ({filteredAppointments.length} total)
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}

        {/* Chat Interface */}
        {showChat && selectedRequest && (
          <div className="chat-modal-overlay" onClick={() => setShowChat(false)}>
            <div className="chat-modal-modern" onClick={(e) => e.stopPropagation()}>
              <div className="chat-modal-header">
                <div>
                  <h3>Chat with {selectedRequest.patientName}</h3>
                  <p>Pre-consultation discussion</p>
                </div>
                <button className="close-btn-icon" onClick={() => setShowChat(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="chat-messages-area">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`chat-message ${msg.sender}`}>
                    <div className="message-content">
                      <p>{msg.text}</p>
                      <span className="message-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-input-area">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                />
                <button className="send-btn-modern" onClick={handleSendChatMessage}>
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Health Record Modal */}
        {showHealthRecordModal && selectedAppointmentForRecord && (
          <div className="appointment-modal" onClick={() => setShowHealthRecordModal(false)}>
            <div className="appointment-modal-content health-record-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2><FaNotesMedical /> Add Health Record</h2>
                <p className="modal-subtitle">
                  Patient: {selectedAppointmentForRecord.patientName} | 
                  Date: {new Date(selectedAppointmentForRecord.date).toLocaleDateString()}
                </p>
              </div>

              {/* Visit Templates */}
              <div className="visit-templates">
                <label>Quick Templates:</label>
                <div className="template-buttons">
                  {visitTemplates.map((template, index) => (
                    <button 
                      key={index}
                      type="button"
                      className="template-btn"
                      onClick={() => applyTemplate(template)}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="health-record-form">
                {/* Diagnosis */}
                <div className="form-group">
                  <label>Diagnosis *</label>
                  <input
                    type="text"
                    value={healthRecordForm.diagnosis}
                    onChange={(e) => handleHealthRecordChange('diagnosis', e.target.value)}
                    placeholder="Enter diagnosis..."
                    required
                  />
                </div>

                {/* Treatment */}
                <div className="form-group">
                  <label>Treatment Plan *</label>
                  <textarea
                    value={healthRecordForm.treatment}
                    onChange={(e) => handleHealthRecordChange('treatment', e.target.value)}
                    placeholder="Enter treatment plan..."
                    rows="3"
                    required
                  />
                </div>

                {/* Vital Signs */}
                <div className="form-group">
                  <label>Vital Signs</label>
                  <div className="vitals-grid">
                    <input
                      type="text"
                      placeholder="Blood Pressure"
                      value={healthRecordForm.vitalSigns.bloodPressure}
                      onChange={(e) => handleHealthRecordChange('vitalSigns.bloodPressure', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Temperature"
                      value={healthRecordForm.vitalSigns.temperature}
                      onChange={(e) => handleHealthRecordChange('vitalSigns.temperature', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Heart Rate"
                      value={healthRecordForm.vitalSigns.heartRate}
                      onChange={(e) => handleHealthRecordChange('vitalSigns.heartRate', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Weight"
                      value={healthRecordForm.vitalSigns.weight}
                      onChange={(e) => handleHealthRecordChange('vitalSigns.weight', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Height"
                      value={healthRecordForm.vitalSigns.height}
                      onChange={(e) => handleHealthRecordChange('vitalSigns.height', e.target.value)}
                    />
                  </div>
                </div>

                {/* Prescriptions */}
                <div className="form-group">
                  <label>Prescriptions</label>
                  {healthRecordForm.prescriptions.map((prescription, index) => (
                    <div key={index} className="prescription-row">
                      <input
                        type="text"
                        placeholder="Medication"
                        value={prescription.medication}
                        onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Dosage"
                        value={prescription.dosage}
                        onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Instructions"
                        value={prescription.instructions}
                        onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                      />
                      <button 
                        type="button" 
                        className="remove-btn"
                        onClick={() => removePrescription(index)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="add-prescription-btn"
                    onClick={addPrescription}
                  >
                    + Add Prescription
                  </button>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label>Additional Notes</label>
                  <textarea
                    value={healthRecordForm.notes}
                    onChange={(e) => handleHealthRecordChange('notes', e.target.value)}
                    placeholder="Additional notes..."
                    rows="4"
                  />
                </div>

                {/* Actions */}
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="appointment-btn primary"
                    onClick={submitHealthRecord}
                  >
                    <FaCheck /> Save Health Record
                  </button>
                  <button 
                    type="button" 
                    className="appointment-btn secondary"
                    onClick={() => setShowHealthRecordModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Appointment;
