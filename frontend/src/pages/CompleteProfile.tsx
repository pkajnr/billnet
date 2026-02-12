import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';
import FileUpload from '../components/FileUpload';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: '',
    bio: '',
    profileImage: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      profileImage: url
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.role) {
      setError('Please select your role');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/complete-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: formData.role,
          bio: formData.bio,
          profileImage: formData.profileImage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update stored user data
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...storedUser,
          role: formData.role,
          bio: formData.bio,
          profileImage: formData.profileImage,
          isProfileCompleted: true
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        showToast.success('Your profile is now complete!', 'Profile Complete');
        navigate('/explore');
      } else {
        setError(data.error || 'Failed to complete profile. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor: 'var(--color-bg-secondary)'}}>
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{color: 'var(--color-text)'}}>
              Welcome to BillNet! 🎉
            </h1>
            <p className="text-secondary">
              Let's complete your profile to get started
            </p>
          </div>

          {/* Profile Completion Form */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6" style={{color: 'var(--color-text)'}}>
              Complete Your Profile
            </h2>
            
            {error && (
              <div className="form-error mb-4">
                ⚠️ {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="form-label">
                  I am a <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Select your role</option>
                  <option value="entrepreneur">Entrepreneur - I have ideas to share</option>
                  <option value="investor">Investor - I want to invest in ideas</option>
                </select>
                <p className="text-xs text-secondary mt-1">
                  {formData.role === 'entrepreneur' 
                    ? 'As an entrepreneur, you can post your business ideas and receive investments.'
                    : formData.role === 'investor'
                    ? 'As an investor, you can browse ideas and invest in promising projects.'
                    : 'Choose the role that best describes you'}
                </p>
              </div>

              {/* Profile Image Upload */}
              <div>
                <label className="form-label">
                  Profile Image (Optional)
                </label>
                <FileUpload
                  type="profile"
                  onUploadSuccess={handleImageUpload}
                  accept="image/*"
                  maxSize={5}
                />
                {formData.profileImage && (
                  <div className="mt-3 flex items-center gap-3">
                    <img 
                      src={formData.profileImage} 
                      alt="Profile preview" 
                      className="w-16 h-16 rounded-full object-cover border-2"
                      style={{borderColor: 'var(--color-border)'}}
                    />
                    <span className="text-sm text-secondary">Profile image uploaded</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="form-label">
                  Bio (Optional)
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="form-input"
                  placeholder={formData.role === 'entrepreneur' 
                    ? 'Tell us about yourself and your entrepreneurial journey...'
                    : formData.role === 'investor'
                    ? 'Tell us about your investment interests and expertise...'
                    : 'Tell us about yourself...'}
                  maxLength={500}
                />
                <p className="text-xs text-secondary mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading || !formData.role}
                  className="btn btn-primary flex-1"
                >
                  {isLoading ? 'Completing Profile...' : 'Complete Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to skip profile completion? You can complete it later from your settings.')) {
                      navigate('/explore');
                    }
                  }}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  Skip for Now
                </button>
              </div>
            </form>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-center text-secondary mt-6 px-4">
            Your profile information will be visible to other users on the platform.
            You can update your profile anytime from your settings.
          </p>
        </div>
      </div>
    </div>
  );
}
