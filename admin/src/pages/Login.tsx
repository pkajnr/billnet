import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';
import { ADMIN_API } from '../utils/api';

const Login: React.FC = () => {
  const [adminSecret, setAdminSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminSecret.trim()) {
      setError('Admin secret is required');
      return;
    }

    setLoading(true);
    setError('');

    // Store admin secret in localStorage
    localStorage.setItem('adminSecret', adminSecret);
    
    // Verify the secret by making a test request
    fetch(ADMIN_API.VERIFY, {
      headers: {
        'x-admin-secret': adminSecret
      }
    })
      .then(res => {
        if (res.ok) {
          showToast.success('Admin login successful');
          navigate('/dashboard');
        } else {
          localStorage.removeItem('adminSecret');
          setError('Invalid admin secret. Please check your credentials and try again.');
        }
      })
      .catch(() => {
        localStorage.removeItem('adminSecret');
        setError('Failed to verify admin credentials. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo/Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-normal text-gray-900">BillNet Admin</h1>
          </div>

          {/* Sign In Box */}
          <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-2xl font-normal mb-4 text-gray-900">Admin Access</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                ⚠️ {error}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-secret" className="block text-sm font-bold mb-1 text-gray-900">
                  Admin Secret
                </label>
                <input
                  id="admin-secret"
                  name="adminSecret"
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Enter admin secret"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-b from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-medium py-2 px-4 rounded border border-yellow-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Verifying...' : 'Sign in as Admin'}
              </button>
            </form>
            
            <p className="text-xs text-gray-600 mt-4">
              🔒 Admin access is restricted to authorized personnel only.
            </p>
          </div>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-bold text-blue-900 mb-2">Admin Portal</h3>
            <p className="text-xs text-blue-800">
              Manage users, verify accounts, and oversee platform operations.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-gray-300 py-6 px-4 text-center text-xs text-gray-600">
        <p>© 2026 BillNet Admin Portal. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;
