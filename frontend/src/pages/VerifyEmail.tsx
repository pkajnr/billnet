import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token found');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/auth/verify-email?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Your email has been verified successfully! Redirecting to sign in...');
        setTimeout(() => {
          navigate('/signin');
        }, 3000);
      } else {
        const data = await response.json();
        setStatus('error');
        setMessage(data.error || 'Email verification failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      setMessage('An error occurred during email verification');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="mb-8">
              <div className="w-16 h-16 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Verifying Email</h1>
            <p className="text-gray-600 font-light">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Verified!</h1>
            <p className="text-gray-600 font-light mb-8">{message}</p>
            <Link to="/signin" className="text-yellow-600 hover:text-yellow-700 font-semibold">Back to Sign In</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification Failed</h1>
            <p className="text-gray-600 font-light mb-8">{message}</p>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">The verification link may have expired.</p>
              <Link to="/signup" className="inline-block text-yellow-600 hover:text-yellow-700 font-semibold">Request new verification link</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
