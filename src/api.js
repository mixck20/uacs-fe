/**
 * Base API configuration
 * 
 * To use localhost for testing:
 * 1. Set USE_LOCALHOST to true
 * 2. Make sure backend is running on port 3000
 * 3. Test Google Meet integration locally
 */
const USE_LOCALHOST = false; // Change to true for local testing

const API_CONFIG = {
  baseUrl: USE_LOCALHOST ? 'http://localhost:3000' : 'https://uacs-be.vercel.app',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
};

/**
 * Token Management Functions
 */
export function getAuthToken() {
  return localStorage.getItem('token');
}

export function setAuthToken(token, remember = false) {
  localStorage.setItem('token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Base API fetch function with error handling and auth
 */
export async function apiFetch(path, options = {}) {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const headers = {
      ...API_CONFIG.headers,
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`
    };

    const url = path.startsWith('http') ? path : `${API_CONFIG.baseUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors'
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error(data?.message || `Request failed (${response.status})`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Public API fetch function (no auth required)
 */
export async function publicApiFetch(path, options = {}) {
  try {
    const headers = {
      ...API_CONFIG.headers,
      ...(options.headers || {})
    };

    const url = path.startsWith('http') ? path : `${API_CONFIG.baseUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors'
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error(data?.message || `Request failed (${response.status})`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Authentication API endpoints
 */
export const AuthAPI = {
  login: async (credentials) => {
    const data = await publicApiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    return data;
  },

  register: async (userData) => {
    const data = await publicApiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return data;
  },

  verifyEmail: async (token) => {
    const data = await publicApiFetch('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
    return data;
  },

  resendVerification: async (email) => {
    const data = await publicApiFetch('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    return data;
  },

  logout: async () => {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      removeAuthToken();
    }
  },

  verifyToken: async () => {
    const data = await apiFetch('/api/auth/verify');
    return data;
  },

  updateProfile: async (data) => {
    return await apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  changePassword: async (data) => {
    return await apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

/**
 * Patients API endpoints
 */
export const PatientsAPI = {
  list: async (filter = '', search = '', showArchived = false) => {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (search) params.append('search', search);
    if (showArchived) params.append('showArchived', 'true');
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await apiFetch(`/api/patients${queryString}`);
  },

  get: async (id) => {
    return await apiFetch(`/api/patients/${id}`);
  },

  getMyRecords: async () => {
    return await apiFetch('/api/patients/my-records');
  },

  create: async (patientData) => {
    return await apiFetch('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patientData)
    });
  },

  update: async (id, patientData) => {
    return await apiFetch(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData)
    });
  },

  delete: async (id) => {
    return await apiFetch(`/api/patients/${id}`, {
      method: 'DELETE'
    });
  },

  addVisit: async (id, visitData) => {
    return await apiFetch(`/api/patients/${id}/visits`, {
      method: 'POST',
      body: JSON.stringify(visitData)
    });
  },

  archive: async (id, reason, notes) => {
    return await apiFetch(`/api/patients/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes })
    });
  },

  restore: async (id) => {
    return await apiFetch(`/api/patients/${id}/restore`, {
      method: 'POST'
    });
  }
};

/**
 * Inventory API endpoints
 */
export const InventoryAPI = {
  list: async (lowStock = false) => {
    const queryString = lowStock ? '?lowStock=1' : '';
    return await apiFetch(`/api/inventory${queryString}`);
  },

  create: async (itemData) => {
    return await apiFetch('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  },

  update: async (id, itemData) => {
    return await apiFetch(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
  },

  delete: async (id) => {
    return await apiFetch(`/api/inventory/${id}`, {
      method: 'DELETE'
    });
  },

  // Dispensing methods
  dispense: async (dispenseData) => {
    return await apiFetch('/api/inventory/dispense', {
      method: 'POST',
      body: JSON.stringify(dispenseData)
    });
  },

  getDispensingHistory: async (itemId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiFetch(`/api/inventory/dispensing/history/${itemId}?${queryString}`);
  },

  getAllDispensingRecords: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiFetch(`/api/inventory/dispensing/records?${queryString}`);
  },

  getDispensingStats: async (period = 30) => {
    return await apiFetch(`/api/inventory/dispensing/stats?period=${period}`);
  }
};

/**
 * Appointments API endpoints
 */
export const AppointmentsAPI = {
  list: async () => {
    return await apiFetch('/api/appointments');
  },

  getUserAppointments: async () => {
    return await apiFetch('/api/appointments/user/my-appointments');
  },

  create: async (appointmentData) => {
    // Add requiresMeetLink flag for online consultations
    if (appointmentData.isOnline || appointmentData.consultationType === 'Online') {
      appointmentData.requiresMeetLink = true;
    }
    
    const response = await apiFetch('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });

    // If it's an online consultation and we got a Meet link, include it in the response
    if (response.meetLink) {
      return {
        ...response,
        data: {
          ...response.data,
          meetLink: response.meetLink
        }
      };
    }
    
    return response;
  },

  update: async (id, appointmentData) => {
    try {
      // Ensure we're sending the correct data for Meet link creation
      const payload = {
        ...appointmentData,
        requiresGoogleMeet: appointmentData.requiresGoogleMeet || appointmentData.type === 'Online Consultation',
        meetDetails: appointmentData.requiresGoogleMeet ? {
          date: appointmentData.date,
          time: appointmentData.time,
          duration: appointmentData.duration || 30
        } : undefined
      };

      const response = await apiFetch(`/api/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      // Handle various response formats
      if (response.meetLink) {
        return {
          ...response,
          meetLink: response.meetLink
        };
      } else if (response.data?.meetLink) {
        return {
          ...response,
          meetLink: response.data.meetLink
        };
      } else if (response.consultationDetails?.meetLink) {
        return {
          ...response,
          meetLink: response.consultationDetails.meetLink
        };
      }

      return response;
    } catch (error) {
      console.error('Appointment update error:', error);
      throw new Error(error.message || 'Failed to update appointment');
    }
  },

  delete: async (id) => {
    return await apiFetch(`/api/appointments/${id}`, {
      method: 'DELETE'
    });
  },

  // Filter appointments
  getFiltered: async (filters) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.search) queryParams.append('search', filters.search);
    
    return await apiFetch(`/api/appointments/filtered?${queryParams.toString()}`);
  },

  // Cancel appointment
  cancel: async (id, reason) => {
    return await apiFetch(`/api/appointments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // Request reschedule
  reschedule: async (id, newDate, newTime, reason) => {
    return await apiFetch(`/api/appointments/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ newDate, newTime, reason })
    });
  },

  // Respond to reschedule request (clinic only)
  respondToReschedule: async (id, requestId, action, note = '') => {
    return await apiFetch(`/api/appointments/${id}/reschedule/${requestId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action, note })
    });
  },

  // Add consultation notes (clinic only)
  addConsultationNotes: async (id, notes) => {
    return await apiFetch(`/api/appointments/${id}/consultation-notes`, {
      method: 'POST',
      body: JSON.stringify(notes)
    });
  },

  // Get available time slots
  getAvailableTimeSlots: async (date, type) => {
    const queryParams = new URLSearchParams();
    queryParams.append('date', date);
    if (type) queryParams.append('type', type);
    
    return await apiFetch(`/api/appointments/time-slots/available?${queryParams.toString()}`);
  },

  // Create time slots (admin only)
  createTimeSlots: async (slotsData) => {
    return await apiFetch('/api/appointments/time-slots/create', {
      method: 'POST',
      body: JSON.stringify(slotsData)
    });
  }
};

/**
 * Notifications API endpoints
 */
export const NotificationsAPI = {
  getUserNotifications: async () => {
    return await apiFetch('/api/notifications/user');
  },

  getUnreadCount: async () => {
    return await apiFetch('/api/notifications/unread-count');
  },

  markAsRead: async (id) => {
    return await apiFetch(`/api/notifications/mark-read/${id}`, {
      method: 'POST'
    });
  },

  markAllAsRead: async () => {
    return await apiFetch('/api/notifications/mark-all-read', {
      method: 'POST'
    });
  },

  deleteNotification: async (id) => {
    return await apiFetch(`/api/notifications/${id}`, {
      method: 'DELETE'
    });
  },

  deleteAllNotifications: async () => {
    return await apiFetch('/api/notifications', {
      method: 'DELETE'
    });
  }
};

/**
 * Chat API endpoints
 */
export const ChatAPI = {
  getAppointmentChat: async (appointmentId) => {
    return await apiFetch(`/api/chat/appointment/${appointmentId}`);
  },

  sendMessage: async (appointmentId, text) => {
    return await apiFetch(`/api/chat/appointment/${appointmentId}/message`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  },

  markMessagesAsRead: async (appointmentId) => {
    return await apiFetch(`/api/chat/appointment/${appointmentId}/mark-read`, {
      method: 'POST'
    });
  },

  getUnreadCount: async () => {
    return await apiFetch('/api/chat/unread-count');
  }
};

/**
 * Medical Certificate API endpoints
 */
export const CertificateAPI = {
  // User: Request a certificate
  requestCertificate: async (purpose, requestNotes) => {
    return await apiFetch('/api/certificates/request', {
      method: 'POST',
      body: JSON.stringify({ purpose, requestNotes })
    });
  },

  // User: Get my certificates
  getMyCertificates: async () => {
    return await apiFetch('/api/certificates/my-certificates');
  },

  // User: Download certificate PDF
  downloadCertificate: async (id) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_CONFIG.baseUrl}/api/certificates/${id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical-certificate-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  // Clinic: Get all certificates
  getAllCertificates: async (status = null) => {
    const queryParam = status ? `?status=${status}` : '';
    return await apiFetch(`/api/certificates${queryParam}`);
  },

  // Clinic: Issue certificate
  issueCertificate: async (id, data) => {
    return await apiFetch(`/api/certificates/${id}/issue`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Clinic: Reject certificate
  rejectCertificate: async (id, rejectionReason) => {
    return await apiFetch(`/api/certificates/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason })
    });
  }
};

/**
 * Feedback API endpoints
 */
export const FeedbackAPI = {
  // User: Submit feedback
  submitFeedback: async (data) => {
    return await apiFetch('/api/feedback/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // User: Get my feedback
  getMyFeedback: async () => {
    return await apiFetch('/api/feedback/my-feedback');
  },

  // Clinic: Get all feedback
  getAllFeedback: async (status = null, type = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    const queryString = params.toString();
    return await apiFetch(`/api/feedback/all${queryString ? '?' + queryString : ''}`);
  },

  // Clinic: Get feedback statistics
  getFeedbackStats: async () => {
    return await apiFetch('/api/feedback/stats');
  },

  // Clinic: Update feedback status
  updateFeedbackStatus: async (id, status) => {
    return await apiFetch(`/api/feedback/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  // Clinic: Respond to feedback
  respondToFeedback: async (id, response) => {
    return await apiFetch(`/api/feedback/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response })
    });
  },

  // Delete feedback
  deleteFeedback: async (id) => {
    return await apiFetch(`/api/feedback/${id}`, {
      method: 'DELETE'
    });
  }
};

/**
 * Admin API endpoints
 */
export const AdminAPI = {
  // User Management
  getAllUsers: async (page = 1, limit = 20, role = null, status = null, search = null) => {
    const params = new URLSearchParams({ page, limit });
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return await apiFetch(`/api/admin/users?${params.toString()}`);
  },

  getUserById: async (id) => {
    return await apiFetch(`/api/admin/users/${id}`);
  },

  createUser: async (userData) => {
    return await apiFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  updateUser: async (id, userData) => {
    return await apiFetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  deleteUser: async (id) => {
    return await apiFetch(`/api/admin/users/${id}`, {
      method: 'DELETE'
    });
  },

  resetUserPassword: async (id, newPassword) => {
    return await apiFetch(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  },

  toggleUserStatus: async (id) => {
    return await apiFetch(`/api/admin/users/${id}/toggle-status`, {
      method: 'POST'
    });
  },

  // Bulk user import
  importUsers: async (users) => {
    return await apiFetch('/api/admin/users/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ users })
    });
  },

  // Audit Logs
  getAuditLogs: async (page = 1, limit = 50, filters = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.resource) params.append('resource', filters.resource);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    return await apiFetch(`/api/admin/audit-logs?${params.toString()}`);
  },

  getAuditStats: async () => {
    return await apiFetch('/api/admin/audit-logs/stats');
  },

  exportAuditLogs: async (filters = {}) => {
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(`${API_CONFIG.baseUrl}/api/admin/audit-logs/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  },

  // Analytics
  getAnalytics: async () => {
    return await apiFetch('/api/admin/analytics');
  },

  exportAnalytics: async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_CONFIG.baseUrl}/api/admin/analytics/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  },

  // Feedback Management
  getAllFeedbackAdmin: async (status = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const queryString = params.toString();
    return await apiFetch(`/api/admin/feedback${queryString ? '?' + queryString : ''}`);
  },

  updateFeedbackStatusAdmin: async (id, status, response = null) => {
    return await apiFetch(`/api/admin/feedback/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, response })
    });
  }
};

/**
 * Email API endpoints
 */
export const EmailAPI = {
  // Send email
  sendEmail: async (data) => {
    return await apiFetch('/api/email/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Get email history
  getEmailHistory: async (page = 1, limit = 20, type = null, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    return await apiFetch(`/api/email/history?${params.toString()}`);
  },

  // Get email statistics
  getEmailStats: async () => {
    return await apiFetch('/api/email/stats');
  },

  // Delete email record
  deleteEmail: async (id) => {
    return await apiFetch(`/api/email/${id}`, {
      method: 'DELETE'
    });
  },

  // Create email template
  createTemplate: async (data) => {
    return await apiFetch('/api/email/templates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Get all templates
  getTemplates: async (type = null, category = null, active = null) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (category) params.append('category', category);
    if (active !== null) params.append('active', active);
    const queryString = params.toString();
    return await apiFetch(`/api/email/templates${queryString ? '?' + queryString : ''}`);
  },

  // Update template
  updateTemplate: async (id, data) => {
    return await apiFetch(`/api/email/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Delete template
  deleteTemplate: async (id) => {
    return await apiFetch(`/api/email/templates/${id}`, {
      method: 'DELETE'
    });
  },

  // Check SMTP configuration
  checkSMTPConfig: async () => {
    return await apiFetch('/api/email/smtp-config');
  }
};

// AI Chat API
export const AIChatAPI = {
  // Send message to AI
  sendMessage: async (message, history = []) => {
    return await apiFetch('/api/ai-chat/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history })
    });
  },

  // Get FAQ suggestions
  getFAQs: async () => {
    return await apiFetch('/api/ai-chat/faqs');
  },

  // Get available slots
  getAvailableSlots: async () => {
    return await apiFetch('/api/ai-chat/available-slots');
  }
};
