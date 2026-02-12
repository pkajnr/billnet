import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/');
  };

  // Get admin user from localStorage
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const adminInitials = adminUser.firstName && adminUser.lastName 
    ? `${adminUser.firstName[0]}${adminUser.lastName[0]}` 
    : 'A';
  const adminDisplayName = adminUser.firstName 
    ? `${adminUser.firstName} ${adminUser.lastName}` 
    : 'Admin';

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/analytics', icon: '📈', label: 'Analytics' },
    { path: '/admin-users', icon: '👨‍💼', label: 'Admin User Management' },
    { path: '/registered-users', icon: '✅', label: 'Registered Users' },
    { path: '/ideas', icon: '💡', label: 'Ideas' },
    { path: '/verifications', icon: '🔍', label: 'Verifications' },
    { path: '/reports', icon: '📋', label: 'Reports' },
    { path: '/site-settings', icon: '⚙️', label: 'Site Settings' },
    { path: '/settings', icon: '🔧', label: 'Settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Amazon Theme */}
      <header className="bg-[#232F3E] border-b border-gray-700 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded transition text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#FF9900]">BillNet</span> Admin Console
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-700 rounded transition">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF9900] rounded-full"></span>
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded transition"
              >
                <div className="flex flex-col items-end">
                  <span className="text-white font-medium text-sm">{adminDisplayName}</span>
                  <span className="text-xs text-gray-400 capitalize">{adminUser?.role?.replace('_', ' ')}</span>
                </div>
                <div className="w-8 h-8 bg-[#FF9900] rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {adminInitials}
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>👤</span>
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>⚙️</span>
                    <span>Settings</span>
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center gap-2"
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar - Amazon Theme */}
      <aside
        className={`fixed top-[52px] left-0 h-[calc(100vh-52px)] bg-[#37475A] border-r border-gray-700 transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded transition text-sm ${
                isActive(item.path)
                  ? 'bg-[#FF9900] text-white font-semibold shadow-lg'
                  : 'text-gray-200 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`pt-[52px] transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
