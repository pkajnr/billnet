import { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';

interface AdminProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  bio: string;
  joinedDate: string;
  lastLogin: string;
  totalLogins: number;
}

export default function Profile() {
  const [profile, setProfile] = useState<AdminProfile>({
    id: 1,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@billnet.com',
    phone: '+1234567890',
    role: 'Super Admin',
    avatar: '',
    bio: 'Platform administrator with full access',
    joinedDate: '2024-01-01',
    lastLogin: new Date().toISOString(),
    totalLogins: 152
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);

  useEffect(() => {
    // Load profile from backend
    loadProfile();
  }, []);

  const loadProfile = async () => {
    // This would fetch from backend
    // For now using default values
  };

  const handleEdit = () => {
    setTempProfile(profile);
    setEditing(true);
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setEditing(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setProfile(tempProfile);
      setEditing(false);
      showToast.success('Profile updated successfully');
    } catch (error) {
      showToast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>
        {!editing ? (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-sm p-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            {editing ? (
              <label className="cursor-pointer">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600 hover:bg-gray-100 transition">
                  {tempProfile.avatar ? (
                    <img src={tempProfile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    `${tempProfile.firstName[0]}${tempProfile.lastName[0]}`
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs">
                  ✎
                </div>
              </label>
            ) : (
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  `${profile.firstName[0]}${profile.lastName[0]}`
                )}
              </div>
            )}
          </div>
          <div className="flex-1 text-white">
            <h2 className="text-2xl font-bold mb-1">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-indigo-100 mb-2">{profile.role}</p>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span className="opacity-75">✉</span> {profile.email}
              </span>
              <span className="flex items-center gap-1">
                <span className="opacity-75">📱</span> {profile.phone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Member Since</p>
          <p className="text-xl font-bold text-gray-800">
            {new Date(profile.joinedDate).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Last Login</p>
          <p className="text-xl font-bold text-gray-800">
            {new Date(profile.lastLogin).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Logins</p>
          <p className="text-xl font-bold text-gray-800">{profile.totalLogins}</p>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            {editing ? (
              <input
                type="text"
                value={tempProfile.firstName}
                onChange={(e) => setTempProfile(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-800">{profile.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            {editing ? (
              <input
                type="text"
                value={tempProfile.lastName}
                onChange={(e) => setTempProfile(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-800">{profile.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            {editing ? (
              <input
                type="email"
                value={tempProfile.email}
                onChange={(e) => setTempProfile(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-800">{profile.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            {editing ? (
              <input
                type="tel"
                value={tempProfile.phone}
                onChange={(e) => setTempProfile(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-800">{profile.phone}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            {editing ? (
              <textarea
                value={tempProfile.bio}
                onChange={(e) => setTempProfile(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-800">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Account Information</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-800">User ID</p>
              <p className="text-sm text-gray-600">Unique identifier</p>
            </div>
            <p className="font-mono text-gray-800">#{profile.id}</p>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-800">Role</p>
              <p className="text-sm text-gray-600">Access level</p>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {profile.role}
            </span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-800">Account Status</p>
              <p className="text-sm text-gray-600">Current status</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-800">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">Extra security layer</p>
            </div>
            <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              Enable
            </button>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { action: 'Updated site settings', time: '2 hours ago', icon: '⚙️' },
            { action: 'Approved user verification', time: '5 hours ago', icon: '✓' },
            { action: 'Reviewed new idea', time: '1 day ago', icon: '💡' },
            { action: 'Generated monthly report', time: '2 days ago', icon: '📊' },
            { action: 'Modified user permissions', time: '3 days ago', icon: '👥' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-200 last:border-0">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-lg">
                {activity.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{activity.action}</p>
                <p className="text-sm text-gray-600">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
        <div className="space-y-3">
          <button className="w-full px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition font-medium text-left">
            Export Account Data
          </button>
          <button className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-left">
            Deactivate Account
          </button>
        </div>
      </div>
    </div>
  );
}
