import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';
import { showToast } from '../utils/toast';

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    mfaCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          mfaCode: mfaRequired ? credentials.mfaCode : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.mfaRequired) {
          setMfaRequired(true);
          showToast.info('Please enter your MFA code');
        } else {
          showToast.error(data.error || 'Login failed');
          if (data.attemptsRemaining !== undefined) {
            showToast.warning(`${data.attemptsRemaining} attempts remaining`);
          }
        }
        return;
      }

      // Store authentication data
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.admin));
      
      showToast.success(`Welcome, ${data.admin.firstName}!`);
      navigate('/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      showToast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#232F3E] via-[#37475A] to-[#131A22] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title - Amazon Style */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-lg shadow-lg mb-4">
            <span className="text-3xl font-bold text-[#FF9900]">B</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-[#FF9900]">BillNet</span> Admin Console
          </h1>
          <p className="text-gray-300">Secure Administration Portal</p>
        </div>

        {/* Login Card - Amazon Style */}
        <div className="bg-white rounded-lg shadow-2xl p-8 border-t-4 border-[#FF9900]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {mfaRequired ? 'Two-Factor Authentication' : 'Sign In'}
            </h2>
            <p className="text-gray-600">
              {mfaRequired 
                ? 'Enter the 6-digit code from your authenticator app' 
                : 'Enter your credentials to access the admin panel'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!mfaRequired ? (
              <>
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      required
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] text-gray-900"
                      placeholder="Enter username"
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] text-gray-900"
                      placeholder="Enter password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* MFA Code Field */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authentication Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={credentials.mfaCode}
                    onChange={(e) => setCredentials({ ...credentials, mfaCode: e.target.value.replace(/\D/g, '') })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] text-center text-2xl tracking-widest font-mono text-gray-900"
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMfaRequired(false);
                    setCredentials({ ...credentials, mfaCode: '' });
                  }}
                  className="mt-3 text-sm text-[#FF9900] hover:text-[#E88B00] font-medium"
                >
                  ← Back to login
                </button>
              </div>
            )}

            {/* Submit Button - Amazon Style */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF9900] text-white py-3 px-4 rounded font-bold hover:bg-[#E88B00] focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                mfaRequired ? 'Verify Code' : 'Sign In'
              )}
            </button>
          </form>

          {/* Security Notice - Amazon Style */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1 text-gray-900">Security Notice</p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• This is a secure admin portal</li>
                  <li>• All actions are logged</li>
                  <li>• 5 failed attempts will lock your account</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-300 text-sm">
            Protected by enterprise-grade security
          </p>
          <p className="text-gray-400 text-xs mt-2">
            BillNet © 2026 | All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
