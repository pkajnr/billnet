import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';

const AdminLogin: React.FC = () => {
  const [adminSecret, setAdminSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminSecret.trim()) {
      showToast.error('Admin secret is required');
      return;
    }

    setLoading(true);

    // Store admin secret in localStorage (in production, use more secure method)
    localStorage.setItem('adminSecret', adminSecret);
    
    // Verify the secret by making a test request
    fetch('http://localhost:5000/api/admin/verify', {
      headers: {
        'x-admin-secret': adminSecret
      }
    })
      .then(res => {
        if (res.ok) {
          showToast.success('Admin login successful');
          navigate('/admin/dashboard');
        } else {
          localStorage.removeItem('adminSecret');
          showToast.error('Invalid admin secret');
        }
      })
      .catch(() => {
        localStorage.removeItem('adminSecret');
        showToast.error('Failed to verify admin credentials');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your admin secret to access the dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="admin-secret" className="sr-only">
                Admin Secret
              </label>
              <input
                id="admin-secret"
                name="adminSecret"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Admin Secret"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Sign in as Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
