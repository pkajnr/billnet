import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { showToast } from '../utils/toast';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        
        // Save user data if provided by backend
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          // If backend doesn't send user, fetch it separately
          try {
            const profileRes = await fetch('http://localhost:5000/api/user/profile', {
              headers: {
                'Authorization': `Bearer ${data.token}`,
                'Content-Type': 'application/json',
              },
            });
            if (profileRes.ok) {
              const userData = await profileRes.json();
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        }
        
        // Check if user needs to complete profile
        const user = data.user || JSON.parse(localStorage.getItem('user') || '{}');
        if (user.isProfileCompleted === false) {
          showToast.info('Please complete your profile to continue', 'Welcome!');
          navigate('/complete-profile');
        } else {
          showToast.success('Welcome back!', 'Sign In Successful');
          navigate('/explore');
        }
      } else {
        setError(data.error || 'There was a problem signing in. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred during sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor: 'var(--color-bg-secondary)'}}>
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo/Title */}

          {/* Sign In Box */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4" style={{color: 'var(--color-text)'}}>Sign in</h2>
            
            {error && (
              <div className="form-error mb-4">
                ⚠️ {error}
              </div>
            )}
            
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
            
            <p className="text-xs text-secondary mt-4">
              By continuing, you agree to BillNet's{' '}
              <Link to="/terms">Terms of Use</Link>{' '}
              and <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="divider"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-2 text-sm text-muted" style={{backgroundColor: 'var(--color-bg-secondary)'}}>New to BillNet?</span>
            </div>
          </div>

          {/* Create Account Button */}
          <Link to="/signup" className="btn btn-secondary w-full">
            Create your BillNet account
          </Link>
        </div>
      </div>
      
      {/* Footer */}
      <footer style={{borderTop: '1px solid var(--color-border)'}} className="py-6 px-4 text-center text-xs text-secondary">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link to="/terms">Terms of Use</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/about">About</Link>
        </div>
        <p className="mt-2">© 2026 BillNet. All rights reserved.</p>
      </footer>
    </div>
  );

}
