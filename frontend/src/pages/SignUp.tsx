import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { showToast } from '../utils/toast';

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success('Account created! Please check your email to verify your account.', 'Success');
        navigate('/signin');
      } else {
        setError(data.error || 'Sign up failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred during sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor: 'var(--color-bg-secondary)'}}>
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo/Title */}

          {/* Sign Up Box */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4" style={{color: 'var(--color-text)'}}>Create account</h2>
            
            {error && (
              <div className="form-error mb-4">
                ⚠️ {error}
              </div>
            )}
            
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="form-label">
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="form-label">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  Re-enter password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Confirm password"
                />
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4"
                />
                <label htmlFor="agreeToTerms" className="text-xs text-secondary">
                  I agree to BillNet's{' '}
                  <Link to="/terms">Terms of Use</Link>{' '}
                  and <Link to="/privacy">Privacy Policy</Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? 'Creating account...' : 'Create your BillNet account'}
              </button>
            </form>
          </div>

          {/* Sign In Link */}
          <p className="text-xs text-secondary mt-5 text-center">
            Already have an account?{' '}
            <Link to="/signin">Sign in</Link>
          </p>
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