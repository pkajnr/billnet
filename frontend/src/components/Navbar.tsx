import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [walletBalance, setWalletBalance] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'bid' | 'follow' | 'comment' | 'favorite' | 'message';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    relatedUserId?: number;
    relatedIdeaId?: number;
  }>>([]);

  useEffect(() => {
    // Check login status and load user role
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      
      if (token) {
        // All users have wallets now
        fetchWalletBalance();
        // Load notifications
        fetchNotifications();
      }
    };

    checkAuthStatus();

    // Listen for custom auth change event
    const handleAuthChange = () => {
      checkAuthStatus();
    };

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        checkAuthStatus();
      }
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);

    // Close dropdowns when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-profile-dropdown]')) {
        setIsProfileOpen(false);
      }
      if (!target.closest('[data-notifications-dropdown]')) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.walletBalance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fall back to mock notifications
      const mockNotifications = [
        {
          id: '1',
          type: 'bid' as const,
          title: 'New Bid Received',
          message: 'Someone placed a bid on your idea',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];
      setNotifications(mockNotifications);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };


  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationAsRead(notif.id);
    setIsNotificationsOpen(false);
    
    // Navigate based on notification type
    switch (notif.type) {
      case 'bid':
        // Navigate to My Listings (where entrepreneur manages bids)
        if (notif.relatedIdeaId) {
          navigate('/my-ideas');
        } else {
          navigate('/my-bids');
        }
        break;
      case 'comment':
        // Navigate to the specific idea
        if (notif.relatedIdeaId) {
          navigate(`/idea/${notif.relatedIdeaId}`);
        } else {
          navigate('/explore');
        }
        break;
      case 'follow':
        // Navigate to profile or explore
        navigate('/explore');
        break;
      case 'favorite':
        // Navigate to the idea that was favorited
        if (notif.relatedIdeaId) {
          navigate(`/idea/${notif.relatedIdeaId}`);
        } else {
          navigate('/my-ideas');
        }
        break;
      case 'message':
        // Navigate to messages
        navigate('/messages');
        break;
      default:
        navigate('/explore');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Dispatch custom event to update Navbar
    window.dispatchEvent(new Event('authChange'));
    
    window.location.href = '/';
  };

  return (
    <nav className="nav-bar">
      <div className="container">
          <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="shrink-0">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="">
                <span className="text-2xl font-bold" style={{color: 'var(--color-text-inverse)'}}>BILLNET</span>&nbsp;
                <span className="text-xs font-semibold tracking-wider" style={{color: 'var(--color-primary)'}}>CAPITAL</span>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {!isLoggedIn && (
              <>
                <Link to="/" className="nav-link">
                  Home
                </Link>
                <Link to="/about" className="nav-link">
                  About
                </Link>
              </>
            )}
            
            {isLoggedIn ? (
              <>
                <Link to="/explore" className="nav-link">
                  Explore
                </Link>
                <Link to="/my-investments" className="nav-link">
                  Portfolio
                </Link>
                <Link to="/my-bids" className="nav-link">
                  Bids
                </Link>
                <Link to="/my-ideas" className="nav-link">
                  Posts
                </Link>
                <Link to="/messages" className="nav-link">
                  Messages
                </Link>
                <Link to="/analytics" className="nav-link">
                  Analytics
                </Link>
                  {/* Notifications Dropdown */}
                  <div className="relative" data-notifications-dropdown>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsNotificationsOpen(!isNotificationsOpen);
                      }}
                      className="nav-link relative">
                      
                      Notifications
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{backgroundColor: 'var(--color-primary)'}}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    {isNotificationsOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded shadow-xl z-50" onClick={(e) => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                          {notifications.length > 0 && (
                            <button
                              onClick={() => setNotifications(notifications.map(n => ({ ...n, isRead: true })))}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        {notifications.length > 0 ? (
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                                  !notif.isRead ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div
                                  onClick={() => handleNotificationClick(notif)}
                                  className="flex gap-3"
                                >
                                  <span className="text-lg shrink-0">
                                    {notif.type === 'bid' && '💰'}
                                    {notif.type === 'follow' && '👤'}
                                    {notif.type === 'comment' && '💬'}
                                    {notif.type === 'favorite' && '❤️'}
                                    {notif.type === 'message' && '📧'}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900">
                                      {notif.title}
                                      {!notif.isRead && (
                                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full ml-2"></span>
                                      )}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {notif.message}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notif.id);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition shrink-0"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-8 text-center">
                            <p className="text-sm text-gray-500">No notifications yet</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="relative" data-profile-dropdown>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileOpen(!isProfileOpen);
                      }}
                      className="nav-link flex items-center gap-1"
                    >
                      Account
                      <span className="text-xs">▼</span>
                    </button>
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded shadow-xl z-50 py-1" style={{border: '1px solid var(--color-border)'}} onClick={(e) => e.stopPropagation()}>
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        >
                          Profile
                        </Link>
                        <Link
                          to="/analytics"
                          onClick={() => setIsProfileOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        >
                          Analytics
                        </Link>
                        <div className="px-4 py-3 text-sm border-t border-gray-200 bg-gray-50">
                          <span className="text-xs font-medium text-gray-600">Wallet Balance</span>
                          <p className="text-lg font-bold text-gray-900 mt-1">${walletBalance.toFixed(2)}</p>
                          <Link
                            to="/add-funds"
                            onClick={() => setIsProfileOpen(false)}
                            className="btn btn-primary w-full mt-2 text-xs"
                          >
                            Add Funds
                          </Link>
                        </div>
                        <div className="border-t border-gray-200">
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              handleLogout();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/signin" className="btn btn-secondary">
                    Sign In
                  </Link>
                  <Link to="/signup" className="btn btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-gray-100 rounded transition"
              style={{color: 'var(--color-text-inverse)'}}
            >
              <svg
                className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
      </div>
      

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-1">
            {!isLoggedIn && (
              <>
                <Link
                  to="/"
                  className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                >
                  About
                </Link>
              </>
            )}
            {isLoggedIn ? (
              <>
                <Link
                  to="/explore"
                  className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                >
                  Explore
                </Link>
                <Link
                  to="/my-investments"
                  className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                >
                  Portfolio
                </Link>
                <Link
                  to="/my-bids"
                  className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                >
                  Bids
                </Link>
                <Link
                  to="/my-ideas"
                  className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                >
                  Posts
                </Link>
                <Link
                  to="/messages"
                  className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                >
                  Messages
                </Link>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="w-full text-left block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition relative"
                >
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute right-3 top-2 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{backgroundColor: 'var(--color-primary)'}}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/analytics"
                    className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                  >
                    Analytics
                  </Link>
                  <div className="px-3 py-3 text-sm bg-gray-50 rounded border border-gray-200 my-2">
                      <span className="text-xs font-medium text-gray-600">Wallet Balance</span>
                      <p className="text-lg font-bold text-gray-900 mt-1">${walletBalance.toFixed(2)}</p>
                      <Link
                        to="/add-funds"
                        className="btn btn-primary w-full mt-2 text-xs"
                      >
                        Add Funds
                      </Link>
                    </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition mt-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="btn btn-secondary w-full text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary w-full text-center mt-2"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
