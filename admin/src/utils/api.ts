// Admin API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ADMIN_API = {
  VERIFY: `${API_BASE_URL}/api/admin/verify`,
  STATS: `${API_BASE_URL}/api/admin/stats`,
  USERS: `${API_BASE_URL}/api/admin/users`,
  IDEAS: `${API_BASE_URL}/api/admin/ideas`,
  VERIFICATIONS: `${API_BASE_URL}/api/admin/verifications`,
};

export function getAdminHeaders() {
  const adminSecret = localStorage.getItem('adminSecret');
  return {
    'Content-Type': 'application/json',
    'x-admin-secret': adminSecret || '',
  };
}

export { API_BASE_URL };
