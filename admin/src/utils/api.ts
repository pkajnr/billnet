// Admin API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ADMIN_API = {
  VERIFY: `${API_BASE_URL}/api/admin/verify`,
  STATS: `${API_BASE_URL}/api/admin/stats`,
  ANALYTICS: `${API_BASE_URL}/api/admin/analytics`,
  USERS: `${API_BASE_URL}/api/admin/users`,
  IDEAS: `${API_BASE_URL}/api/admin/ideas`,
  VERIFICATIONS: `${API_BASE_URL}/api/admin/verifications`,
};

export function getAdminHeaders() {
  const adminToken = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken || ''}`,
  };
}

export { API_BASE_URL };
