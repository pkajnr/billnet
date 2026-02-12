import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CookieSettings() {
  const navigate = useNavigate();
  const [cookies, setCookies] = useState({
    essential: true,
    analytics: localStorage.getItem('cookie_analytics') === 'true',
    marketing: localStorage.getItem('cookie_marketing') === 'true',
    personalization: localStorage.getItem('cookie_personalization') === 'true',
  });

  const handleToggle = (key: keyof typeof cookies) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled
    setCookies(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    localStorage.setItem('cookie_analytics', String(cookies.analytics));
    localStorage.setItem('cookie_marketing', String(cookies.marketing));
    localStorage.setItem('cookie_personalization', String(cookies.personalization));
    alert('Cookie preferences saved successfully!');
  };

  const CookieToggle = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-yellow-600' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-light tracking-tight mb-4">
          Cookie Settings
        </h1>
        <p className="text-gray-400 font-light mb-12">
          Manage your cookie preferences
        </p>

        <div className="border border-yellow-600/30 bg-black/50 rounded-none p-8 mb-8">
          <p className="text-gray-300 font-light leading-relaxed">
            We use cookies to enhance your experience on BillNet. Below, you can customize which types of cookies you'd like to accept. Some cookies are essential for the platform to function.
          </p>
        </div>

        <div className="space-y-6">
          {/* Essential Cookies */}
          <div className="border border-yellow-600/30 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-light text-yellow-500 tracking-widest uppercase mb-2">
                  Essential Cookies
                </h3>
                <p className="text-gray-300 font-light leading-relaxed text-sm">
                  These cookies are necessary for the website to function properly. They enable core functionality like security and network management.
                </p>
              </div>
              <div className="ml-4">
                <CookieToggle
                  checked={cookies.essential}
                  onChange={() => {}}
                  disabled={true}
                />
              </div>
            </div>
            <p className="text-gray-500 font-light text-xs mt-4 tracking-widest uppercase">
              Always Enabled
            </p>
          </div>

          {/* Analytics Cookies */}
          <div className="border border-yellow-600/30 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-light text-yellow-500 tracking-widest uppercase mb-2">
                  Analytics Cookies
                </h3>
                <p className="text-gray-300 font-light leading-relaxed text-sm">
                  These cookies help us understand how you use BillNet, allowing us to improve the platform based on your behavior and preferences.
                </p>
              </div>
              <div className="ml-4">
                <CookieToggle
                  checked={cookies.analytics}
                  onChange={() => handleToggle('analytics')}
                />
              </div>
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="border border-yellow-600/30 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-light text-yellow-500 tracking-widest uppercase mb-2">
                  Marketing Cookies
                </h3>
                <p className="text-gray-300 font-light leading-relaxed text-sm">
                  These cookies track your interests and enable us to deliver relevant marketing content and advertisements tailored to your preferences.
                </p>
              </div>
              <div className="ml-4">
                <CookieToggle
                  checked={cookies.marketing}
                  onChange={() => handleToggle('marketing')}
                />
              </div>
            </div>
          </div>

          {/* Personalization Cookies */}
          <div className="border border-yellow-600/30 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-light text-yellow-500 tracking-widest uppercase mb-2">
                  Personalization Cookies
                </h3>
                <p className="text-gray-300 font-light leading-relaxed text-sm">
                  These cookies remember your preferences and settings to provide a personalized experience across BillNet.
                </p>
              </div>
              <div className="ml-4">
                <CookieToggle
                  checked={cookies.personalization}
                  onChange={() => handleToggle('personalization')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-12">
          <button
            onClick={handleSave}
            className="border border-yellow-600 text-yellow-500 hover:bg-yellow-600/10 px-8 py-3 font-light tracking-widest uppercase text-sm transition duration-300"
          >
            Save Preferences
          </button>
          <button
            onClick={() => navigate('/')}
            className="border border-yellow-600/30 text-gray-300 hover:text-yellow-500 px-8 py-3 font-light tracking-widest uppercase text-sm transition duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );

}