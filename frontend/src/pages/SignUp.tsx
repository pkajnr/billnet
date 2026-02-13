import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { showToast } from '../utils/toast';

const COMMON_PASSWORDS = [
  'password',
  'password123',
  'qwerty',
  'qwerty123',
  '123456',
  '123456789',
  'admin',
  'welcome',
  'letmein',
  'iloveyou',
  'abc123',
  'default',
  'changeme',
];

const validateSignupPassword = (
  password: string,
  context: { firstName: string; lastName: string; email: string }
): string[] => {
  const issues: string[] = [];
  const trimmedPassword = password.trim();

  if (trimmedPassword.length < 12) {
    issues.push('Password must be at least 12 characters long.');
  }

  if (trimmedPassword.length > 128) {
    issues.push('Password must be 128 characters or fewer.');
  }

  if (/\s/.test(password)) {
    issues.push('Password cannot contain spaces.');
  }

  if (!/[a-z]/.test(password)) {
    issues.push('Password must include at least one lowercase letter.');
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('Password must include at least one uppercase letter.');
  }

  if (!/[0-9]/.test(password)) {
    issues.push('Password must include at least one number.');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    issues.push('Password must include at least one special character.');
  }

  if (/(.)\1{2,}/.test(password)) {
    issues.push('Password cannot contain the same character repeated 3 or more times in a row.');
  }

  const lowerPassword = password.toLowerCase();
  const lowerNoSymbols = lowerPassword.replace(/[^a-z0-9]/g, '');
  const emailLocalPart = context.email.split('@')[0]?.toLowerCase() || '';
  const firstName = context.firstName.toLowerCase();
  const lastName = context.lastName.toLowerCase();

  if (COMMON_PASSWORDS.some(common => lowerNoSymbols.includes(common))) {
    issues.push('Password is too common. Choose a more unique password.');
  }

  const personalTokens = [emailLocalPart, firstName, lastName]
    .map(token => token.replace(/[^a-z0-9]/g, ''))
    .filter(token => token.length >= 3);

  if (personalTokens.some(token => lowerNoSymbols.includes(token))) {
    issues.push('Password cannot include your name or email username.');
  }

  const weakSequences = ['1234', 'abcd', 'qwerty'];
  if (weakSequences.some(sequence => lowerNoSymbols.includes(sequence))) {
    issues.push('Password cannot contain predictable sequences like 1234, abcd, or qwerty.');
  }

  return issues;
};

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
  const [errors, setErrors] = useState<string[]>([]);

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

    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateSignupPassword(formData.password, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setErrors(['Passwords do not match.']);
      return;
    }

    if (!formData.agreeToTerms) {
      setErrors(['Please agree to the terms and conditions.']);
      return;
    }

    setIsLoading(true);
    setErrors([]);
    
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
        if (Array.isArray(data.passwordErrors) && data.passwordErrors.length > 0) {
          setErrors(data.passwordErrors);
        } else {
          setErrors([data.error || 'Sign up failed. Please try again.']);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors(['An error occurred during sign up. Please try again.']);
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
            
            {errors.length > 0 && (
              <div className="form-error mb-4" role="alert" aria-live="polite">
                <p className="font-semibold mb-2">Please fix the following:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
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
                  placeholder="Use 12+ characters"
                />
                <p className="text-xs text-secondary mt-1">
                  Use 12+ characters with uppercase, lowercase, number, and symbol.
                </p>
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