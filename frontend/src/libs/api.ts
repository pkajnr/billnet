// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    SIGNIN: `${API_BASE_URL}/api/auth/signin`,
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  },
  
  // User endpoints
  USER: {
    PROFILE: `${API_BASE_URL}/api/user/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/api/user/profile`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/user/password`,
  },
  
  // Ideas endpoints (for entrepreneurs)
  IDEAS: {
    LIST: `${API_BASE_URL}/api/ideas`,
    CREATE: `${API_BASE_URL}/api/ideas`,
    GET: (id: string) => `${API_BASE_URL}/api/ideas/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/ideas/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/ideas/${id}`,
  },
  
  // Investment endpoints (for investors)
  INVESTMENTS: {
    LIST: `${API_BASE_URL}/api/investments`,
    CREATE: `${API_BASE_URL}/api/investments`,
    GET: (id: string) => `${API_BASE_URL}/api/investments/${id}`,
  },
  
  // Messages endpoints
  MESSAGES: {
    LIST: `${API_BASE_URL}/api/messages`,
    SEND: `${API_BASE_URL}/api/messages`,
    GET_CONVERSATION: (id: string) => `${API_BASE_URL}/api/messages/conversation/${id}`,
  },
};

// Helper function to get auth headers
export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

// Helper function for API calls
export async function apiCall(
  url: string,
  options: RequestInit = {}
) {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
