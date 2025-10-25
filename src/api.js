/**
 * Base API configuration
 */
const API_CONFIG = {
  baseUrl: 'https://uacs-be.vercel.app',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

/**
 * Token Management Functions
 */
export function getAuthToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function setAuthToken(token, remember = false) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
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
      credentials: 'include'
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
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    return data;
  },

  register: async (userData) => {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return data;
  },

  verifyEmail: async (token) => {
    const data = await apiFetch('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
    return data;
  },

  resendVerification: async (email) => {
    const data = await apiFetch('/api/auth/resend-verification', {
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
  }
};

/**
 * Patients API endpoints
 */
export const PatientsAPI = {
  list: async (query) => {
    const queryString = query ? `?q=${encodeURIComponent(query)}` : '';
    return await apiFetch(`/api/patients${queryString}`);
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
  }
};

/**
 * Appointments API endpoints
 */
export const AppointmentsAPI = {
  list: async () => {
    return await apiFetch('/api/appointments');
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
    const response = await apiFetch(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData)
    });

    // If we get a Meet link in the response, include it in the returned data
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

  delete: async (id) => {
    return await apiFetch(`/api/appointments/${id}`, {
      method: 'DELETE'
    });
  }
};