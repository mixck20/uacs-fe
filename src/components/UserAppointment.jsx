import React, { useState, useEffect } from "react";
import { FaCalendar, FaVideo, FaFileAlt, FaClock, FaStethoscope, FaTimes, FaCommentDots, FaPlus, FaCheckCircle, FaExclamationCircle, FaHourglassHalf, FaMapMarkerAlt, FaEnvelope, FaPhone, FaLink, FaPaperPlane, FaTimesCircle, FaCalendarCheck, FaInfoCircle } from "react-icons/fa";
import UserPortalLayout from "./UserPortalLayout";
import "./UserAppointment.css";
import { AppointmentsAPI, ChatAPI } from '../api';
import Swal from 'sweetalert2';
import { useDebounce } from '../hooks/useDebounce';
import { useRateLimit } from '../hooks/useRateLimit';
import { sanitizeText, sanitizeFormData } from '../utils/sanitize';

const UserAppointment = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [appointmentType, setAppointmentType] = useState('clinic');
  const currentDate = new Date();
  const [showDetails, setShowDetails] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadMessages, setUnreadMessages] = useState({}); // Track unread messages per appointment
  const [formData, setFormData] = useState({
    reason: '',
    preferredDate: '',
    preferredTime: '',
    type: 'checkup',
    notes: '',
    isOnline: false
  });

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Debounce search input (500ms delay)
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Rate limiting for API calls
  const { checkRateLimit } = useRateLimit(10, 60000); // 10 calls per minute

  // Load user's appointments on component mount
  useEffect(() => {
    loadAppointments();
  }, []);

  // Auto-apply filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      return; // Wait for debounce
    }
    
    // Auto-apply if any filter is set
    const hasFilters = filters.status || filters.type || filters.startDate || filters.endDate || debouncedSearch;
    if (hasFilters) {
      applyFilters();
    } else {
      setFilteredAppointments([]);
    }
  }, [debouncedSearch, filters.status, filters.type, filters.startDate, filters.endDate]);

  // Poll for new chat messages when chat is open
  useEffect(() => {
    if (!showChat || !selectedAppointment) return;

    const pollMessages = async () => {
      try {
        const chatData = await ChatAPI.getAppointmentChat(selectedAppointment.id);
        console.log('Chat data received:', chatData);
        const formattedMessages = chatData.messages.map(msg => {
          console.log('Message sender:', msg.sender, 'Text:', msg.text);
          return {
            id: msg._id,
            sender: msg.sender,
            text: msg.text,
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: msg.read
          };
        });
        
        // Check for new messages and show browser notification
        if (formattedMessages.length > chatMessages.length) {
          const newMsg = formattedMessages[formattedMessages.length - 1];
          if (newMsg.sender === 'clinic') {
            // Show browser notification for clinic messages
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New Message from Clinic', {
                body: newMsg.text.substring(0, 100),
                icon: '/favicon.ico'
              });
            }
            // Play sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZizcIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrj9H0164pBjWQ1vLSeSwGLYTO8t2PQHJ3D'); 
            audio.play().catch(e => console.log('Audio play failed:', e));
          }
        }
        
        setChatMessages(formattedMessages);
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    // Poll every 3 seconds when chat is open for real-time feel
    const intervalId = setInterval(pollMessages, 3000);

    return () => clearInterval(intervalId);
  }, [showChat, selectedAppointment, chatMessages.length]);

  // Poll for unread messages across all appointments (every 10 seconds for real-time feel)
  useEffect(() => {
    const checkUnreadMessages = async () => {
      try {
        const unreadCounts = {};
        for (const appointment of appointments) {
          const chatData = await ChatAPI.getAppointmentChat(appointment.id);
          const unreadCount = chatData.messages.filter(msg => 
            msg.sender === 'clinic' && !msg.read
          ).length;
          if (unreadCount > 0) {
            unreadCounts[appointment.id] = unreadCount;
          }
        }
        setUnreadMessages(unreadCounts);
      } catch (error) {
        console.error('Error checking unread messages:', error);
      }
    };

    // Check immediately and then every 10 seconds for faster updates
    checkUnreadMessages();
    const intervalId = setInterval(checkUnreadMessages, 10000);

    return () => clearInterval(intervalId);
  }, [appointments]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadAppointments = async () => {
    try {
      console.log('=== LOADING APPOINTMENTS ===');
      console.log('Current user:', user);
      
      const data = await AppointmentsAPI.getUserAppointments();
      console.log('Raw appointments data received:', data);
      console.log('Number of appointments:', data.length);
      
      // Debug each appointment
      data.forEach((apt, index) => {
        console.log(`Appointment ${index + 1}:`, {
          id: apt.id,
          status: apt.status,
          type: apt.type,
          date: apt.date,
          time: apt.time,
          reason: apt.reason?.substring(0, 50)
        });
      });
      
      setAppointments(data);
      console.log('Appointments set to state');
      console.log('=== LOADING COMPLETE ===');
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  };

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

      // If time is already selected and date is today, revalidate the time
      if (formData.preferredTime && value) {
        const today = new Date();
        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate.getTime() === today.getTime()) {
          const [hours, minutes] = formData.preferredTime.split(':').map(Number);
          const currentTime = new Date();
          const selectedTime = new Date();
          selectedTime.setHours(hours, minutes, 0, 0);
          
          if (selectedTime <= currentTime) {
            Swal.fire({
              title: "Invalid Time",
              text: "The selected time has already passed for today. Please choose a future time or a different date.",
              icon: "warning"
            });
            // Clear the time field
            setFormData(prev => ({
              ...prev,
              [name]: value,
              preferredTime: ''
            }));
            return;
          }
        }
      }
    }

    if (name === 'preferredTime') {
      // Check if selected date is today and time has already passed
      if (formData.preferredDate && value) {
        const selectedDate = new Date(formData.preferredDate);
        const today = new Date();
        
        // Reset time to compare dates only
        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate.getTime() === today.getTime()) {
          // Selected date is today, check if time has passed
          const [hours] = value.split(':').map(Number);
          const currentTime = new Date();
          const selectedTime = new Date();
          selectedTime.setHours(hours, 0, 0, 0);
          
          if (selectedTime <= currentTime) {
            Swal.fire({
              title: "Invalid Time",
              text: "The selected time has already passed. Please choose a future time.",
              icon: "warning"
            });
            return;
          }
        }
      }
    }

    // Sanitize text inputs
    let sanitizedValue = value;
    if (typeof value === 'string' && (name === 'reason' || name === 'notes' || name === 'purpose')) {
      sanitizedValue = sanitizeText(value, 500);
    }

    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check rate limit
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      Swal.fire({
        title: "Too Many Requests",
        text: `Please wait ${rateLimitCheck.resetIn} seconds before submitting again.`,
        icon: "warning"
      });
      setLoading(false);
      return;
    }

    // Debug log to check user data
    console.log('User data:', user);

    if (!user || (!user._id && !user.id)) {
      console.error('Missing user data:', user);
      Swal.fire({
        title: "Authentication Error",
        text: "Session data is invalid. Please try logging out and logging in again.",
        icon: "error"
      });
      setLoading(false);
      return;
    }

    // Check for pending or confirmed appointments to prevent double booking
    const hasPendingOrConfirmed = appointments.some(apt => 
      apt.status === 'Pending' || apt.status === 'Confirmed'
    );

    if (hasPendingOrConfirmed) {
      Swal.fire({
        title: "Appointment Already Exists",
        html: `
          <div style="text-align: left;">
            <p>You already have a pending or confirmed appointment.</p>
            <p style="margin-top: 1rem; color: #666;">
              <strong>Note:</strong> You can only have one active appointment at a time.
            </p>
            <p style="margin-top: 0.5rem; color: #666;">
              Please wait for your current appointment to be completed or cancelled before booking a new one.
            </p>
            <p style="margin-top: 0.5rem; color: #666;">
              If you need to change your appointment, use the <strong>Reschedule</strong> button instead.
            </p>
          </div>
        `,
        icon: "warning",
        confirmButtonText: "View My Appointments",
        showCancelButton: true,
        cancelButtonText: "Close"
      }).then((result) => {
        if (result.isConfirmed) {
          setActiveTab('history');
        }
      });
      setLoading(false);
      return;
    }

    if (!formData.preferredDate || !formData.preferredTime) {
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
        patientId: user._id || user.id, // This will be used as userId in backend
        date: formData.preferredDate,
        time: formData.preferredTime,
        reason: formData.reason || formData.notes || formData.type || 'General consultation',
        type: appointmentType === 'online' 
          ? 'Online Consultation' 
          : 'Clinic Visit',
        isOnline: appointmentType === 'online',
        notes: formData.notes || '',
        status: 'Pending'
      };

      console.log('Submitting appointment data:', appointmentData);

      const response = await AppointmentsAPI.create(appointmentData);
      
      Swal.fire({
        title: 'Success!',
        text: appointmentType === 'online' 
          ? 'Your online consultation request has been submitted. You will receive the Google Meet link once confirmed.' 
          : 'Your appointment has been booked successfully!',
        icon: 'success'
      });

      // Reload appointments to show the new one
      await loadAppointments();

      // Reset form
      setFormData({
        reason: '',
        preferredDate: '',
        preferredTime: '',
        type: 'checkup',
        notes: '',
        isOnline: false
      });
      
      // Switch to history tab to show the new appointment
      setActiveTab('history');
    } catch (error) {
      console.error('Appointment creation error:', error);
      
      // Check if it's the existing appointment error
      if (error.message && error.message.includes('already have a pending or confirmed appointment')) {
        const errorData = error.response?.data || {};
        const existingApt = errorData.existingAppointment;
        
        let detailsHtml = '';
        if (existingApt) {
          const aptDate = new Date(existingApt.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          detailsHtml = `
            <div style="
              background: #fef3c7; 
              border: 2px solid #f59e0b; 
              border-radius: 12px; 
              padding: 1.5rem; 
              margin: 1rem 0;
              text-align: left;
            ">
              <h4 style="margin: 0 0 1rem 0; color: #92400e; font-size: 1.1rem;">
                📋 Your Existing Appointment
              </h4>
              <p style="margin: 0.5rem 0; color: #78350f;"><strong>Type:</strong> ${existingApt.type}</p>
              <p style="margin: 0.5rem 0; color: #78350f;"><strong>Date:</strong> ${aptDate}</p>
              <p style="margin: 0.5rem 0; color: #78350f;"><strong>Time:</strong> ${existingApt.time}</p>
              <p style="margin: 0.5rem 0; color: #78350f;"><strong>Status:</strong> ${existingApt.status}</p>
              ${existingApt.reason ? `<p style="margin: 0.5rem 0; color: #78350f;"><strong>Reason:</strong> ${existingApt.reason}</p>` : ''}
            </div>
          `;
        }
        
        Swal.fire({
          title: 'Appointment Already Exists',
          html: `
            <p style="color: #374151; margin-bottom: 1rem;">
              You already have a ${existingApt ? existingApt.status.toLowerCase() : 'pending/confirmed'} appointment. 
              Please wait for it to be completed or cancelled before booking a new one.
            </p>
            ${detailsHtml}
            <p style="color: #6b7280; margin-top: 1rem; font-size: 0.9rem;">
              You can view your appointment details in the "Appointment History" tab.
            </p>
          `,
          icon: "warning",
          confirmButtonText: "View My Appointments",
          showCancelButton: true,
          cancelButtonText: "Close"
        }).then((result) => {
          if (result.isConfirmed) {
            setActiveTab('history');
            loadAppointments(); // Refresh to ensure we see the appointment
          }
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to book appointment',
          icon: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = async (appointment) => {
    setSelectedAppointment(appointment);
    setShowChat(true);
    setLoading(true);
    
    // Clear unread count for this appointment
    setUnreadMessages(prev => {
      const updated = { ...prev };
      delete updated[appointment.id];
      return updated;
    });
    
    try {
      // Fetch chat messages from API
      const chatData = await ChatAPI.getAppointmentChat(appointment.id);
      
      console.log('Loading chat for appointment:', appointment.id);
      console.log('Chat messages:', chatData.messages);
      
      // Transform backend messages to frontend format
      const formattedMessages = chatData.messages.map(msg => {
        console.log('Formatting message - Sender:', msg.sender, 'SenderName:', msg.senderName);
        return {
          id: msg._id,
          sender: msg.sender,
          text: msg.text,
          time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: msg.read
        };
      });
      
      setChatMessages(formattedMessages);
      
      // Mark messages as read
      await ChatAPI.markMessagesAsRead(appointment.id);
    } catch (error) {
      console.error('Error loading chat:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load chat messages',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = async () => {
    setIsFiltering(true);
    try {
      const data = await AppointmentsAPI.getFiltered(filters);
      setFilteredAppointments(data);
    } catch (error) {
      console.error('Failed to apply filters:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to filter appointments',
        icon: 'error'
      });
    } finally {
      setIsFiltering(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setFilteredAppointments([]);
  };

  // Use filtered appointments if filtering, otherwise use all appointments
  const displayAppointments = filteredAppointments.length > 0 || Object.values(filters).some(v => v !== '') 
    ? filteredAppointments 
    : appointments;
  
  // Debug logging
  console.log('=== RENDER DEBUG ===');
  console.log('appointments:', appointments.length);
  console.log('filteredAppointments:', filteredAppointments.length);
  console.log('filters:', filters);
  console.log('displayAppointments:', displayAppointments.length);
  console.log('==================');

  const handleCancelAppointment = async (appointmentId) => {
    const result = await Swal.fire({
      title: 'Cancel Appointment',
      html: `
        <div style="text-align: left; margin-top: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">
            Reason for Cancellation
          </label>
          <textarea 
            id="cancel-reason" 
            style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e5; border-radius: 12px; min-height: 100px; font-family: inherit; font-size: 0.95rem;"
            placeholder="Please provide a reason for cancelling..."
          ></textarea>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'Keep Appointment',
      confirmButtonColor: '#dc2626',
      preConfirm: () => {
        const reason = document.getElementById('cancel-reason').value.trim();
        if (!reason) {
          Swal.showValidationMessage('Please provide a reason');
        }
        return reason;
      }
    });

    if (result.isConfirmed) {
      try {
        await AppointmentsAPI.cancel(appointmentId, result.value);
        await loadAppointments(); // Reload the list
        Swal.fire({
          title: 'Cancelled!',
          text: 'Your appointment has been cancelled.',
          icon: 'success'
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to cancel appointment',
          icon: 'error'
        });
      }
    }
  };

  const handleRescheduleRequest = async (appointment) => {
    const result = await Swal.fire({
      title: 'Request Reschedule',
      html: `
        <div style="text-align: left; margin-top: 1rem;">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">
              New Preferred Date
            </label>
            <input 
              type="date" 
              id="reschedule-date" 
              min="${new Date().toISOString().split('T')[0]}"
              style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e5; border-radius: 12px; font-size: 0.95rem;"
            />
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">
              New Preferred Time
            </label>
            <select 
              id="reschedule-time" 
              style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e5; border-radius: 12px; font-size: 0.95rem;"
            >
              <option value="">Select time</option>
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="13:00">1:00 PM</option>
              <option value="14:00">2:00 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="16:00">4:00 PM</option>
            </select>
            <small style="color: #666; font-size: 0.85rem;">Clinic hours: 9:00 AM - 4:00 PM</small>
          </div>
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">
              Reason for Rescheduling
            </label>
            <textarea 
              id="reschedule-reason" 
              style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e5; border-radius: 12px; min-height: 80px; font-family: inherit; font-size: 0.95rem;"
              placeholder="Please provide a reason..."
            ></textarea>
          </div>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Submit Request',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e51d5e',
      preConfirm: () => {
        const date = document.getElementById('reschedule-date').value;
        const time = document.getElementById('reschedule-time').value;
        const reason = document.getElementById('reschedule-reason').value.trim();
        
        if (!date || !time || !reason) {
          Swal.showValidationMessage('Please fill in all fields');
        }
        
        return { date, time, reason };
      }
    });

    if (result.isConfirmed) {
      try {
        await AppointmentsAPI.reschedule(
          appointment.id, 
          result.value.date, 
          result.value.time, 
          result.value.reason
        );
        await loadAppointments();
        Swal.fire({
          title: 'Request Submitted!',
          text: 'Your reschedule request has been sent to the clinic. You will be notified once reviewed.',
          icon: 'success'
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to submit reschedule request',
          icon: 'error'
        });
      }
    }
  };



  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedAppointment) return;
    
    try {
      // Send message to API
      const response = await ChatAPI.sendMessage(selectedAppointment.id, newMessage.trim());
      
      // Add message to local state
      const newMsg = response.chat.messages[response.chat.messages.length - 1];
      const formattedMessage = {
        id: newMsg._id,
        sender: newMsg.sender,
        text: newMsg.text,
        time: new Date(newMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: newMsg.read
      };
      
      setChatMessages([...chatMessages, formattedMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to send message',
        icon: 'error'
      });
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <FaInfoCircle />;
    switch(status.toLowerCase()) {
      case 'confirmed': return <FaCheckCircle />;
      case 'pending': return <FaHourglassHalf />;
      case 'completed': return <FaCalendarCheck />;
      case 'cancelled': return <FaTimesCircle />;
      case 'declined': return <FaExclamationCircle />;
      default: return <FaInfoCircle />;
    }
  };

  // Calculate appointment statistics
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'Pending').length,
    confirmed: appointments.filter(a => a.status === 'Confirmed').length,
    upcoming: appointments.filter(a => {
      const appointmentDate = new Date(a.date);
      return appointmentDate >= new Date() && a.status === 'Confirmed';
    }).length
  };

  return (
    <UserPortalLayout user={user} onLogout={onLogout} currentPage="appointments">
      <div className="user-appointment-page">
        {/* Modern Header */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">
              <FaCalendar className="title-icon" />
              My Appointments
            </h1>
            <p className="page-subtitle">Schedule and manage your medical consultations</p>
          </div>
          <button 
            className="new-appointment-btn"
            onClick={() => setActiveTab('schedule')}
          >
            <FaPlus /> Book New Appointment
          </button>
        </div>

        {/* Modern Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              <FaPlus /> Book Appointment
            </button>
            <button 
              className={`tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FaCalendar /> My Appointments
            </button>
          </div>
        </div>

        {/* Booking Section */}
        {activeTab === 'schedule' && (
          <div className="schedule-section">
            {/* Active Appointment Alert */}
            {appointments.some(apt => apt.status === 'Pending' || apt.status === 'Confirmed') && (
              <div className="active-appointment-alert">
                <div className="alert-icon">
                  <FaExclamationCircle />
                </div>
                <div className="alert-content">
                  <h4>You have an active appointment</h4>
                  <p>You already have a {appointments.find(apt => apt.status === 'Pending' || apt.status === 'Confirmed')?.status.toLowerCase()} appointment. 
                  You cannot book another appointment until your current one is completed or cancelled.</p>
                  <button 
                    className="view-appointment-btn"
                    onClick={() => setActiveTab('history')}
                  >
                    View My Appointments
                  </button>
                </div>
              </div>
            )}
            
            {/* Appointment Type Cards */}
            <div className="type-selector-grid">
              <div 
                className={`type-card ${appointmentType === 'clinic' ? 'active' : ''}`}
                onClick={() => setAppointmentType('clinic')}
              >
                <div className="type-icon">
                  <FaStethoscope />
                </div>
                <h3>Clinic Visit</h3>
                <p>In-person consultation at our clinic</p>
                <div className="type-features">
                  <span><FaMapMarkerAlt /> UA Clinic</span>
                  <span><FaClock /> Mon-Fri, 9AM-5PM</span>
                </div>
              </div>

              <div 
                className={`type-card ${appointmentType === 'online' ? 'active' : ''}`}
                onClick={() => setAppointmentType('online')}
              >
                <div className="type-icon online">
                  <FaVideo />
                </div>
                <h3>Online Consultation</h3>
                <p>Video call via Google Meet</p>
                <div className="type-features">
                  <span><FaVideo /> Virtual Meeting</span>
                  <span><FaCommentDots /> Pre-chat Available</span>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <form 
              className={`appointment-form-modern ${appointments.some(apt => apt.status === 'Pending' || apt.status === 'Confirmed') ? 'form-disabled' : ''}`} 
              onSubmit={handleSubmit}
            >
              <div className="form-card">
                <div className="form-card-header">
                  <h3>
                    {appointmentType === 'online' 
                      ? 'Online Consultation Booking' 
                      : 'Schedule Clinic Appointment'}
                  </h3>
                  <p>Fill in the details below to book your appointment</p>
                </div>
                
                <div className="form-card-body">
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
                    <select
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select time</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                    <small className="time-note">
                      Clinic hours: 9:00 AM - 4:00 PM, Monday to Friday
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
                  <div className="info-alert">
                    <div className="alert-icon">
                      <FaInfoCircle />
                    </div>
                    <div className="alert-content">
                      <h4><FaVideo /> Online Consultation via Google Meet</h4>
                      <p>You will receive the meeting link once your appointment is confirmed.</p>
                      <p><FaCommentDots /> Pre-consultation chat will be available to discuss any concerns before the meeting.</p>
                      <div className="requirements-list">
                        <strong>Please ensure you have:</strong>
                        <ul>
                          <li>• Stable internet connection</li>
                          <li>• Quiet environment for consultation</li>
                          <li>• Working camera and microphone</li>
                          <li>• Google Chrome or compatible browser</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="submit-btn-modern"
                  disabled={loading || appointments.some(apt => apt.status === 'Pending' || apt.status === 'Confirmed')}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span> Booking...
                    </>
                  ) : appointments.some(apt => apt.status === 'Pending' || apt.status === 'Confirmed') ? (
                    <>
                      <FaTimesCircle />
                      Cannot Book - Active Appointment Exists
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      {`Book ${appointmentType === 'online' ? 'Online Consultation' : 'Appointment'}`}
                    </>
                  )}
                </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* History Section - Modernized */}
        {activeTab === 'history' && (
          <div className="history-section">
            {/* Filter Panel */}
            <div className="filter-panel">
              <div className="filter-header">
                <h3><FaCheckCircle /> Filter Appointments</h3>
                <p>Refine your appointment list</p>
              </div>
              
              <div className="filter-controls">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>Status</label>
                    <select name="status" value={filters.status} onChange={handleFilterChange}>
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Declined">Declined</option>
                      <option value="Rescheduled">Rescheduled</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label>Type</label>
                    <select name="type" value={filters.type} onChange={handleFilterChange}>
                      <option value="">All Types</option>
                      <option value="Online Consultation">Online Consultation</option>
                      <option value="Clinic Visit">Clinic Visit</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label>Start Date</label>
                    <input 
                      type="date" 
                      name="startDate" 
                      value={filters.startDate} 
                      onChange={handleFilterChange}
                    />
                  </div>
                  
                  <div className="filter-group">
                    <label>End Date</label>
                    <input 
                      type="date" 
                      name="endDate" 
                      value={filters.endDate} 
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
                
                <div className="filter-row">
                  <div className="filter-group flex-grow">
                    <label>Search</label>
                    <input 
                      type="text" 
                      name="search" 
                      value={filters.search} 
                      onChange={handleFilterChange}
                      placeholder="Search by reason or notes..."
                    />
                  </div>
                  
                  <div className="filter-actions">
                    <button 
                      onClick={applyFilters} 
                      className="apply-filter-btn"
                      disabled={isFiltering}
                    >
                      {isFiltering ? 'Filtering...' : 'Apply Filters'}
                    </button>
                    <button 
                      onClick={clearFilters} 
                      className="clear-filter-btn"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {displayAppointments.length > 0 ? (
              <div className="appointments-grid-modern">
                {displayAppointments.map(appointment => {
                  // Safety check: ensure appointment is valid
                  const appointmentId = appointment?.id || appointment?._id;
                  if (!appointment || !appointmentId) {
                    console.warn('Invalid appointment data:', appointment);
                    return null;
                  }
                  
                  return (
                  <div key={appointmentId} className={`appointment-card-modern status-${(appointment.status || 'pending').toLowerCase()}`}>
                    {/* Card Header */}
                    <div className="card-header-modern">
                      <div className="appointment-type-badge">
                        {appointment.type === 'Online Consultation' ? <FaVideo /> : <FaStethoscope />}
                        {appointment.type || 'Appointment'}
                      </div>
                      <div className={`status-badge-modern status-${(appointment.status || 'pending').toLowerCase()}`}>
                        {getStatusIcon(appointment.status || 'Pending')}
                        {appointment.status || 'Pending'}
                      </div>
                    </div>
                    
                    {/* Card Body */}
                    <div className="card-body-modern">
                      <div className="appointment-info-grid">
                        <div className="info-item">
                          <FaCalendar className="info-icon" />
                          <div>
                            <span className="info-label">Date</span>
                            <span className="info-value">
                              {appointment.date 
                                ? new Date(appointment.date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })
                                : 'Date not set'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="info-item">
                          <FaClock className="info-icon" />
                          <div>
                            <span className="info-label">Time</span>
                            <span className="info-value">{appointment.time || 'Not set'}</span>
                          </div>
                        </div>
                        
                        <div className="info-item full-width">
                          <FaStethoscope className="info-icon" />
                          <div>
                            <span className="info-label">Reason</span>
                            <span className="info-value">{appointment.reason || 'No reason provided'}</span>
                          </div>
                        </div>

                        {/* Queue Information */}
                        {appointment.queueNumber && appointment.type === 'Clinic Visit' && (
                          <div className="info-item queue-info">
                            <FaHourglassHalf className="info-icon queue-icon" />
                            <div>
                              <span className="info-label">Queue Position</span>
                              <div className="queue-details">
                                <span className="queue-number">#{appointment.queueNumber}</span>
                                {appointment.queueStatus && typeof appointment.queueStatus === 'string' && (
                                  <span className={`queue-status status-${appointment.queueStatus.toLowerCase()}`}>
                                    {appointment.queueStatus}
                                  </span>
                                )}
                              </div>
                              {appointment.estimatedWaitTime && appointment.queueStatus === 'Waiting' && (
                                <span className="wait-time">Est. wait: {appointment.estimatedWaitTime} min</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Online Consultation Section */}
                      {appointment.type === 'Online Consultation' && (
                        <div className="online-section-modern">
                          <div className="online-header">
                            <FaVideo />
                            <h4>Online Consultation</h4>
                          </div>
                          
                          {appointment.status === 'Completed' ? (
                            <div className="meet-completed">
                              <FaCheckCircle />
                              <span>Consultation completed</span>
                            </div>
                          ) : appointment.consultationDetails?.meetLink ? (
                            <div className="meet-ready">
                              <p className="meet-message">Your consultation is ready!</p>
                              <a 
                                href={appointment.consultationDetails.meetLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="join-meet-btn"
                              >
                                <FaVideo /> Join Google Meet
                              </a>
                            </div>
                          ) : appointment.status === 'Confirmed' ? (
                            <div className="meet-pending">
                              <FaClock />
                              <span>Setting up Google Meet link...</span>
                            </div>
                          ) : appointment.status === 'Declined' ? (
                            <div className="meet-declined">
                              <FaTimesCircle />
                              <span>Consultation request was declined</span>
                            </div>
                          ) : (
                            <div className="meet-waiting">
                              <FaHourglassHalf />
                              <span>Awaiting confirmation from clinic</span>
                            </div>
                          )}
                          
                          {appointment.consultationDetails?.chatEnabled && appointment.status !== 'Completed' && (
                            <button 
                              className="chat-btn-modern"
                              onClick={() => handleOpenChat(appointment)}
                              style={{ position: 'relative' }}
                            >
                              <FaCommentDots /> Open Chat
                              {unreadMessages[appointment.id] > 0 && (
                                <span className="unread-badge">{unreadMessages[appointment.id]}</span>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Consultation Notes Section */}
                      {appointment.status === 'Completed' && appointment.consultationNotes && (
                        <div className="consultation-notes-section">
                          <div className="notes-header">
                            <FaFileAlt />
                            <h4>Consultation Summary</h4>
                          </div>
                          
                          <div className="notes-grid">
                            {appointment.consultationNotes.diagnosis && (
                              <div className="note-item">
                                <span className="note-label">Diagnosis</span>
                                <span className="note-value">{String(appointment.consultationNotes.diagnosis)}</span>
                              </div>
                            )}
                            
                            {appointment.consultationNotes.symptoms && (
                              <div className="note-item">
                                <span className="note-label">Symptoms</span>
                                <span className="note-value">{String(appointment.consultationNotes.symptoms)}</span>
                              </div>
                            )}
                            
                            {appointment.consultationNotes.vitalSigns && (
                              <div className="note-item">
                                <span className="note-label">Vital Signs</span>
                                <span className="note-value">{String(appointment.consultationNotes.vitalSigns)}</span>
                              </div>
                            )}
                            
                            {appointment.consultationNotes.assessment && (
                              <div className="note-item">
                                <span className="note-label">Assessment</span>
                                <span className="note-value">{String(appointment.consultationNotes.assessment)}</span>
                              </div>
                            )}
                            
                            {appointment.consultationNotes.treatment && (
                              <div className="note-item">
                                <span className="note-label">Treatment Plan</span>
                                <span className="note-value">{String(appointment.consultationNotes.treatment)}</span>
                              </div>
                            )}
                          </div>
                          
                          {appointment.prescriptions && appointment.prescriptions.length > 0 && (
                            <div className="prescriptions-section">
                              <h5>Prescriptions</h5>
                              <div className="prescriptions-list">
                                {appointment.prescriptions.map((rx, index) => (
                                  <div key={index} className="prescription-item">
                                    <div className="rx-header">
                                      <strong>{String(rx.medication || 'N/A')}</strong>
                                      <span className="rx-dosage">{String(rx.dosage || 'N/A')}</span>
                                    </div>
                                    <div className="rx-details">
                                      <span>Frequency: {String(rx.frequency || 'N/A')}</span>
                                      <span>Duration: {String(rx.duration || 'N/A')}</span>
                                    </div>
                                    {rx.instructions && (
                                      <div className="rx-instructions">{String(rx.instructions)}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {appointment.followUpRecommendations && typeof appointment.followUpRecommendations === 'object' && (
                            <div className="followup-section">
                              <h5>Follow-up Recommendations</h5>
                              {appointment.followUpRecommendations.required && (
                                <div className="followup-item">
                                  <span className="followup-label">Follow-up Required:</span>
                                  <span className="followup-date">
                                    {appointment.followUpRecommendations.date 
                                      ? new Date(appointment.followUpRecommendations.date).toLocaleDateString()
                                      : 'Date TBD'}
                                  </span>
                                </div>
                              )}
                              {appointment.followUpRecommendations.notes && typeof appointment.followUpRecommendations.notes === 'string' && (
                                <div className="followup-notes">{appointment.followUpRecommendations.notes}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="card-footer-modern">
                      <button 
                        className="details-btn-modern"
                        onClick={() => setShowDetails(appointment)}
                      >
                        <FaInfoCircle /> View Details
                      </button>
                      {(appointment.status === 'Pending' || appointment.status === 'Confirmed') && (
                        <>
                          <button 
                            className="reschedule-btn-modern"
                            onClick={() => handleRescheduleRequest(appointment)}
                          >
                            <FaCalendarCheck /> Reschedule
                          </button>
                          <button 
                            className="cancel-btn-modern"
                            onClick={() => handleCancelAppointment(appointment.id)}
                          >
                            <FaTimes /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-modern">
                <div className="empty-icon">
                  <FaCalendar />
                </div>
                <h3>No Appointments Yet</h3>
                <p>You haven't scheduled any appointments. Book your first consultation now!</p>
                <button className="schedule-btn-modern" onClick={() => setActiveTab('schedule')}>
                  <FaPlus /> Schedule New Appointment
                </button>
              </div>
            )}
          </div>
        )}

        {/* Chat Modal */}
        {showChat && selectedAppointment && (
          <div className="chat-modal-overlay">
            <div className="chat-modal-modern">
              <div className="chat-modal-header">
                <div>
                  <h3>Chat</h3>
                  <p>Appointment: {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time}</p>
                </div>
                <button className="close-btn-icon" onClick={() => setShowChat(false)}>
                  <FaTimes />
                </button>
              </div>
              
              <div className="chat-messages-area">
                {chatMessages.map(msg => {
                  console.log('Rendering message:', { id: msg.id, sender: msg.sender, text: msg.text.substring(0, 30) });
                  
                  // SWAPPED: If backend data is backwards, swap the logic here
                  const messageStyle = msg.sender === 'clinic' 
                    ? { justifyContent: 'flex-start', display: 'flex', width: '100%' }  // Clinic LEFT
                    : { justifyContent: 'flex-end', display: 'flex', width: '100%' };   // User RIGHT
                  
                  // Also swap the class names to get correct colors
                  const swappedClass = msg.sender === 'clinic' ? 'user' : 'clinic';
                  
                  return (
                    <div key={msg.id} className={`chat-message ${swappedClass}`} style={messageStyle}>
                      <div className="message-content">
                        <p>{msg.text}</p>
                        <span className="message-time">{msg.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="chat-input-area">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                />
                <button onClick={handleSendMessage} className="send-btn-modern">
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal - Modernized */}
        {showDetails && (
          <div className="modal-overlay">
            <div className="modal-content-modern">
              <div className="modal-header-modern">
                <h3>
                  <FaCalendar /> Appointment Details
                </h3>
                <button className="close-btn-icon" onClick={() => setShowDetails(null)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body-modern">
                <div className="detail-row-modern">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{showDetails.type}</span>
                </div>
                <div className="detail-row-modern">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{new Date(showDetails.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="detail-row-modern">
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">{showDetails.time}</span>
                </div>
                <div className="detail-row-modern">
                  <span className="detail-label">Status:</span>
                  <div className={`status-badge-modern status-${showDetails.status.toLowerCase()}`}>
                    {getStatusIcon(showDetails.status)}
                    {showDetails.status}
                  </div>
                </div>
                <div className="detail-row-modern">
                  <span className="detail-label">Reason:</span>
                  <span className="detail-value">{showDetails.reason}</span>
                </div>
                {showDetails.notes && (
                  <div className="detail-row-modern full">
                    <span className="detail-label">Additional Notes:</span>
                    <span className="detail-value">{showDetails.notes}</span>
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