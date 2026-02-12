import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_API, getAdminHeaders } from '../utils/api';
import { showToast } from '../utils/toast';

interface Stats {
  totalUsers: number;
  totalIdeas: number;
  pendingVerifications: number;
  totalInvestments: number;
  recentSignups: number;
  activeUsers: number;
}

export default function NewDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(ADMIN_API.STATS, {
        headers: getAdminHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        showToast.error('Failed to fetch statistics');
      }
    } catch (error) {
      showToast.error('Error loading statistics');
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    { title: 'Manage Users', icon: '👥', path: '/users', color: 'bg-blue-500', description: 'View and manage all users' },
    { title: 'Verify Accounts', icon: '✅', path: '/verifications', color: 'bg-green-500', description: 'Review verification requests' },
    { title: 'Review Ideas', icon: '💡', path: '/ideas', color: 'bg-yellow-500', description: 'Moderate posted ideas' },
    { title: 'View Reports', icon: '📈', path: '/reports', color: 'bg-purple-500', description: 'Analytics and reports' },
    { title: 'Site Settings', icon: '⚙️', path: '/site-settings', color: 'bg-gray-500', description: 'Configure platform' },
    { title: 'Registered Users', icon: '📋', path: '/registered-users', color: 'bg-indigo-500', description: 'All registered users' },
  ];

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', color: 'bg-blue-500', change: '+12%' },
    { label: 'Total Ideas', value: stats?.totalIdeas || 0, icon: '💡', color: 'bg-yellow-500', change: '+8%' },
    { label: 'Pending Verifications', value: stats?.pendingVerifications || 0, icon: '🔍', color: 'bg-orange-500', change: '-3%' },
    { label: 'Active Users', value: stats?.activeUsers || 0, icon: '✅', color: 'bg-green-500', change: '+15%' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  // Get admin user from localStorage
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const adminName = adminUser.firstName || adminUser.username || 'Admin';
  const adminRole = adminUser.role ? adminUser.role.charAt(0).toUpperCase() + adminUser.role.slice(1).replace('_', ' ') : '';

  return (
    <div className="space-y-6">
      {/* Welcome Header - Amazon Theme */}
      <div className="bg-gradient-to-r from-[#232F3E] to-[#37475A] rounded-lg p-6 text-white border-l-4 border-[#FF9900]">
        <h1 className="text-2xl font-bold mb-2">Welcome Back, {adminName}!</h1>
        <p className="text-gray-300">{adminRole && <span className="font-semibold text-[#FF9900]">{adminRole}</span>}{adminRole && ' - '}Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Grid - Amazon Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 hover:border-[#FF9900] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.color} w-10 h-10 rounded flex items-center justify-center text-xl`}>
                {stat.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-600 text-xs font-medium mb-1 uppercase tracking-wide">{stat.label}</h3>
            <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Quick Links - Amazon Style */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link, index) => (
            <button
              key={index}
              onClick={() => navigate(link.path)}
              className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 hover:border-[#FF9900] hover:shadow-md transition text-left group"
            >
              <div className={`${link.color} w-10 h-10 rounded flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition`}>
                {link.icon}
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{link.title}</h3>
              <p className="text-sm text-gray-600">{link.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity - Amazon Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-900">Recent Signups</h3>
            <button
              onClick={() => navigate('/users')}
              className="text-sm text-[#FF9900] hover:text-[#E88B00] font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                <div className="w-9 h-9 bg-[#FF9900] bg-opacity-10 rounded-full flex items-center justify-center text-[#FF9900] font-bold text-sm">
                  U{i}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">User {i}</p>
                  <p className="text-xs text-gray-500 truncate">user{i}@example.com</p>
                </div>
                <span className="text-xs text-gray-400">2h ago</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-900">Pending Actions</h3>
            <button
              onClick={() => navigate('/verifications')}
              className="text-sm text-[#FF9900] hover:text-[#E88B00] font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded border border-orange-200">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔍</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Verifications Pending</p>
                  <p className="text-xs text-gray-600">{stats?.pendingVerifications || 0} requests</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/verifications')}
                className="px-3 py-1.5 bg-[#FF9900] text-white rounded hover:bg-[#E88B00] transition text-sm font-medium"
              >
                Review
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">New Ideas Posted</p>
                  <p className="text-xs text-gray-600">12 new ideas</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/ideas')}
                className="px-3 py-1.5 bg-[#FF9900] text-white rounded hover:bg-[#E88B00] transition text-sm font-medium"
              >
                Review
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="font-medium text-gray-800">New User Registrations</p>
                  <p className="text-sm text-gray-600">{stats?.recentSignups || 0} today</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/registered-users')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Server Status: <span className="font-semibold text-green-600">Online</span></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Database: <span className="font-semibold text-green-600">Connected</span></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Last Backup: <span className="font-semibold text-yellow-600">2 hours ago</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
