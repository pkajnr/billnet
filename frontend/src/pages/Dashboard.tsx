import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SkeletonDashboard } from '../components/SkeletonLoader';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'entrepreneur' | 'investor';
  createdAt: string;
  isEmailVerified: boolean;
  isCertified?: boolean;
  certificationDate?: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const normalized: UserProfile = {
            ...data,
            isCertified: (data as any).isCertified ?? (data as any).is_certified ?? false,
            certificationDate: (data as any).certificationDate ?? (data as any).certification_date ?? null,
          };
          setUser(normalized);
        } else if (response.status === 401) {
      navigate('/signin');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    
    // Dispatch custom event to update Navbar
    window.dispatchEvent(new Event('authChange'));
    
    navigate('/');
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/60 mb-6">Unable to load your dashboard. Please sign in again.</p>
          <Link to="/signin" className="btn-primary">Back to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 pb-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <h1 className="text-5xl font-bold gradient-text mb-3">Welcome, {user.firstName}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-white/60 text-lg">Your investment dashboard</p>
              {user.isCertified && (
                <span className="badge badge-success">
                  ✅ <span>{user.role === 'investor' ? 'Certified Investor' : 'Certified Entrepreneur'}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <Link to="/profile" className="btn-secondary">
              My Account
            </Link>
            <button
              onClick={handleLogout}
              className="btn-secondary hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400"
            >
              Logout
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="mb-12 glass-card p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{user.firstName} {user.lastName}</h2>
              <p className="text-white/60">{user.email}</p>
              {!user.isEmailVerified && (
                <p className="text-sm text-amber-400 mt-2 flex items-center gap-2">
                  <span>⚠️</span> Email verification pending
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-white/50 tracking-widest mb-2">ACCOUNT TYPE</p>
              <p className="text-2xl font-bold gradient-text capitalize">{user.role}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/10">
            <div>
              <p className="text-xs font-semibold text-white/50 tracking-widest mb-3">MEMBER SINCE</p>
              <p className="text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/50 tracking-widest mb-3">STATUS</p>
              <p className="badge badge-success">ACTIVE</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/50 tracking-widest mb-3">VERIFICATION</p>
              <p className={user.isEmailVerified ? 'badge badge-success' : 'badge badge-warning'}>{user.isEmailVerified ? 'VERIFIED' : 'PENDING'}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/profile#verification" className="glass-card p-8 card-hover group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
                ✅
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition">Get Verified</h3>
              <p className="text-white/60 mb-4">Upload your ID once and earn the certified badge.</p>
              <span className="text-emerald-400 font-semibold text-sm inline-flex items-center gap-2">
                Start Verification
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>

            {user.role === 'entrepreneur' ? (
              <>
                <Link to="/post-idea" className="glass-card p-8 card-hover group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    💡
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition">Post an Idea</h3>
                  <p className="text-white/60 mb-4">Share your business idea with investors</p>
                  <span className="text-indigo-400 font-semibold text-sm inline-flex items-center gap-2">
                    Get Started
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>

                <Link to="/my-ideas" className="glass-card p-8 card-hover group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    📄
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition">My Ideas</h3>
                  <p className="text-white/60 mb-4">Manage and track your posted ideas</p>
                  <span className="text-cyan-400 font-semibold text-sm inline-flex items-center gap-2">
                    View Ideas
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>

                <a href="/messages" className="glass-card p-8 card-hover group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    💬
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-400 transition">Messages</h3>
                  <p className="text-white/60 mb-4">Connect with interested investors</p>
                  <span className="text-amber-400 font-semibold text-sm inline-flex items-center gap-2">
                    Check Messages
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </a>
              </>
            ) : (
              <>
                <Link to="/explore" className="glass-card p-8 card-hover group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    🔍
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition">Browse Ideas</h3>
                  <p className="text-white/60 mb-4">Discover promising investment opportunities</p>
                  <span className="text-indigo-400 font-semibold text-sm inline-flex items-center gap-2">
                    Explore
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>

                <Link to="/my-investments" className="glass-card p-8 card-hover group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    💼
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition">My Portfolio</h3>
                  <p className="text-white/60 mb-4">Track your investments and returns</p>
                  <span className="text-cyan-400 font-semibold text-sm inline-flex items-center gap-2">
                    View Portfolio
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>

                <a href="/messages" className="glass-card p-8 card-hover group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    💬
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-400 transition">Messages</h3>
                  <p className="text-white/60 mb-4">Communicate with entrepreneurs</p>
                  <span className="text-amber-400 font-semibold text-sm inline-flex items-center gap-2">
                    Check Messages
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Opportunities Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8">Featured Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Tech Startup Series A',
                amount: '$2.5M',
                description: 'Revolutionary AI platform seeking expansion capital',
                color: 'from-indigo-500 to-purple-600'
              },
              {
                title: 'Real Estate Fund',
                amount: '$5M',
                description: 'Premium commercial properties in major cities',
                color: 'from-cyan-500 to-blue-600'
              },
              {
                title: 'Green Energy Project',
                amount: '$3.8M',
                description: 'Sustainable solar and wind initiatives',
                color: 'from-emerald-500 to-green-600'
              },
            ].map((opp, i) => (
              <div key={i} className="glass-card p-8 card-hover group">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition">{opp.title}</h3>
                <p className={`text-3xl font-bold bg-gradient-to-r ${opp.color} bg-clip-text text-transparent mb-4`}>{opp.amount}</p>
                <p className="text-white/60 mb-6 text-sm">{opp.description}</p>
                <Link to="/explore" className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm transition inline-flex items-center gap-2">
                  Learn More
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-white mb-8">Your Portfolio Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: 'Total Investments', value: '$0', color: 'from-indigo-500 to-purple-600' },
              { label: 'Active Deals', value: '0', color: 'from-cyan-500 to-blue-600' },
              { label: 'Portfolio Value', value: '$0', color: 'from-emerald-500 to-green-600' },
              { label: 'YTD Returns', value: '0%', color: 'from-amber-500 to-orange-600' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>{stat.value}</p>
                <p className="text-xs font-semibold text-white/50 tracking-widest uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
