import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import { Notification } from '../components/NotificationToast';
import { formatCurrencyShort } from '../utils/formatCurrency';

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  bio: string;
  profile_image: string;
  wallet_balance: number;
  created_at: string;
  is_certified?: boolean;
  certification_type?: string | null;
  certification_date?: string | null;
}

interface Idea {
  id: number;
  title: string;
  description: string;
  category: string;
  funding_goal: number;
  current_funding: number;
  status: string;
  post_type: string;
  created_at: string;
}

interface Investment {
  id: number;
  idea_id: number;
  amount: number;
  status: string;
  created_at: string;
  title: string;
  category: string;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id;
  const [user, setUser] = useState<UserData | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ideas' | 'investments'>('ideas');
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileImageFailed, setProfileImageFailed] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserIdeas();
      fetchUserInvestments();
      checkFollowing();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const normalized: UserData = {
          ...data,
          is_certified: (data as any).is_certified ?? (data as any).isCertified ?? false,
          certification_type: (data as any).certification_type ?? (data as any).certificationType ?? null,
          certification_date: (data as any).certification_date ?? (data as any).certificationDate ?? null,
        };

        setUser(normalized);
        setProfileImageFailed(false);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserIdeas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/ideas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIdeas(data);
      }
    } catch (error) {
      console.error('Error fetching user ideas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserInvestments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/investments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvestments(data);
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
    }
  };

  const checkFollowing = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/follows', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing((data.followingIds || []).includes(parseInt(userId || '0')));
      }
    } catch (error) {
      console.error('Error checking following status:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/follows/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        if (!isFollowing) {
          Notification.success('Followed', `You are now following this user`);
        } else {
          Notification.info('Unfollowed', `You are no longer following this user`);
        }
      } else {
        Notification.error('Error', 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Notification.error('Error', 'Failed to update follow status');
    }
  };

  const handleMessage = () => {
    if (!user) return;
    navigate('/messages', {
      state: {
        startConversationUserId: user.id,
        startConversationUserName: `${user.first_name} ${user.last_name}`,
      },
    });
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center text-gray-700 font-roboto font-bold text-2xl">
                {user.profile_image && !profileImageFailed ? (
                  <img
                    src={user.profile_image}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-full h-full object-cover"
                    onError={() => setProfileImageFailed(true)}
                  />
                ) : (
                  <span>{user.first_name?.[0]}{user.last_name?.[0]}</span>
                )}
              </div>
              <div>
                <h1 className="font-roboto text-3xl font-bold text-gray-900 mb-2">
                  {user.first_name} {user.last_name}
                </h1>
                <p className="font-inter text-sm text-gray-600 mb-2">{user.email}</p>
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="inline-block bg-gray-100 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold capitalize">
                    {user.role}
                  </span>
                  {user.is_certified && (
                    <span className="verification-pill text-xs">
                      ✅ <span>{user.role === 'investor' ? 'Certified Investor' : 'Certified Entrepreneur'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentUserId !== user.id && (
                <button
                  onClick={handleMessage}
                  className="px-5 py-2 rounded-lg font-inter font-semibold transition bg-blue-600 text-white hover:bg-blue-700"
                >
                  💬 Message
                </button>
              )}
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-lg font-inter font-semibold transition ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isFollowing ? '✓ Following' : '+ Follow'}
              </button>
            </div>
          </div>

          {user.bio && (
            <p className="font-inter text-gray-700 mb-4">{user.bio}</p>
          )}

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="font-inter text-xs text-gray-500 uppercase">Posts</p>
              <p className="font-roboto text-2xl font-bold text-gray-900">{ideas.length}</p>
            </div>
            <div>
              <p className="font-inter text-xs text-gray-500 uppercase">Investments</p>
              <p className="font-roboto text-2xl font-bold text-gray-900">{investments.length}</p>
            </div>
            <div>
              <p className="font-inter text-xs text-gray-500 uppercase">Member Since</p>
              <p className="font-inter text-sm text-gray-900">
                {new Date(user.created_at).getFullYear()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('ideas')}
              className={`flex-1 font-inter font-semibold py-4 px-6 text-center border-b-2 transition ${
                activeTab === 'ideas'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Posted Ideas ({ideas.length})
            </button>
            {user.role === 'investor' && (
              <button
                onClick={() => setActiveTab('investments')}
                className={`flex-1 font-inter font-semibold py-4 px-6 text-center border-b-2 transition ${
                  activeTab === 'investments'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Investments ({investments.length})
              </button>
            )}
          </div>

          {/* Ideas Content */}
          {activeTab === 'ideas' && (
            <div className="p-6">
              {ideas.length > 0 ? (
                <div className="space-y-4">
                  {ideas.map((idea) => (
                    <div key={idea.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition cursor-pointer"
                      onClick={() => window.scrollTo(0, 0)}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">
                              {idea.post_type === 'idea' && '💡'}
                              {idea.post_type === 'business' && '🏢'}
                              {idea.post_type === 'share' && '📈'}
                            </span>
                            <span className="font-inter text-xs font-semibold text-gray-500 uppercase">
                              {idea.category}
                            </span>
                          </div>
                          <h3 className="font-roboto text-lg font-bold text-gray-900 mb-1">{idea.title}</h3>
                          <p className="font-inter text-sm text-gray-600 line-clamp-2">{idea.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-roboto font-bold text-gray-900">{formatCurrencyShort(idea.funding_goal)}</p>
                          <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mt-2 ${
                            idea.status === 'funded' ? 'bg-green-100 text-green-700' :
                            idea.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {idea.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8 font-inter">No posts yet</p>
              )}
            </div>
          )}

          {/* Investments Content */}
          {activeTab === 'investments' && (
            <div className="p-6">
              {investments.length > 0 ? (
                <div className="space-y-4">
                  {investments.map((investment) => (
                    <div key={investment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 
                            className="font-roboto font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition"
                            onClick={() => navigate(`/ideas/${investment.idea_id}`)}
                          >{investment.title}</h3>
                          <p className="font-inter text-sm text-gray-600">{investment.category}</p>
                          <p className="font-inter text-xs text-gray-500 mt-1">
                            {new Date(investment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-roboto font-bold text-gray-900">{formatCurrencyShort(investment.amount)}</p>
                          <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mt-2 ${
                            investment.status === 'completed' ? 'bg-green-100 text-green-700' :
                            investment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {investment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8 font-inter">No investments yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
