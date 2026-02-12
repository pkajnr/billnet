import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import BiddingModal from '../components/BiddingModal';
import CreatePost from '../components/CreatePost';
import { showToast } from '../utils/toast';

// Format number to shortened format (e.g., 4200 -> 4.2k, 1500000 -> 1.5M)
const formatCount = (count: number | undefined): string => {
  if (!count) return '0';
  
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return count.toString();
};

interface Idea {
  id: number;
  title: string;
  description: string;
  category: string;
  fundingGoal: number;
  currentFunding: number;
  status: string;
  createdAt: string;
  userId: number;
  firstName: string;
  lastName: string;
  postType: 'idea' | 'business' | 'share' | 'shares';
  equityPercentage?: number;
  commentCount?: number;
  saveCount?: number;
  shareCount?: number;
  reportCount?: number;
  files?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}

interface Comment {
  id: number;
  ideaId: number;
  userId: number;
  content: string;
  createdAt: string;
  userName: string;
  userRole: string;
}

export default function ExploreIdeas() {
  const navigate = useNavigate();
  const PAGE_SIZE = 10;
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedIdeaForBid, setSelectedIdeaForBid] = useState<Idea | null>(null);
  const [showBiddingModal, setShowBiddingModal] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [followingIds, setFollowingIds] = useState<number[]>([]);
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const [userRole, setUserRole] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  
  // Search & Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPostType, setSelectedPostType] = useState('');
  const [minFunding, setMinFunding] = useState('');
  const [maxFunding, setMaxFunding] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'trending' | 'funded'>('latest');
  const [isSearching, setIsSearching] = useState(false);

  // Suggested users state
  interface SuggestedUser {
    id: number;
    firstName: string;
    lastName: string;
    name: string;
    role: string;
    profileImage?: string;
    bio?: string;
  }
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [isLoadingSuggested, setIsLoadingSuggested] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
      setCurrentUserId(user.id);
    }
    if (!userStr) {
      fetchUserRole();
    }
    loadIdeas(0, true);
    fetchWalletBalance();
    fetchFavorites();
    fetchFollows();
    fetchSuggestedUsers();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !isFetchingMore && !isLoading) {
        loadIdeas(page + 1);
      }
    }, { rootMargin: '200px' });

    const current = sentinelRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasMore, isFetchingMore, isLoading, page]);

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('http://localhost:5000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.role) {
          setUserRole(data.role);
          // cache for next load
          const cached = localStorage.getItem('user');
          if (cached) {
            const parsed = JSON.parse(cached);
            localStorage.setItem('user', JSON.stringify({ ...parsed, role: data.role }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
    }
  };

  const loadIdeas = async (pageToLoad = 0, isFirst = false) => {
    if (isFirst) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const token = localStorage.getItem('token');
      const offset = pageToLoad * PAGE_SIZE;
      
      // Build query string for search/filter if active
      let url = `http://localhost:5000/api/ideas?limit=${PAGE_SIZE}&offset=${offset}`;
      if (isSearching) {
        const params = new URLSearchParams();
        params.append('limit', PAGE_SIZE.toString());
        params.append('offset', offset.toString());
        if (searchInput) params.append('q', searchInput);
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedPostType) params.append('postType', selectedPostType);
        if (minFunding) params.append('minFunding', minFunding);
        if (maxFunding) params.append('maxFunding', maxFunding);
        if (sortBy) params.append('sortBy', sortBy);
        url = `http://localhost:5000/api/ideas/search?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: Idea[] = await response.json();
        setIdeas(prev => {
          if (pageToLoad === 0) return data;
          const existingIds = new Set(prev.map(i => i.id));
          const newOnes = data.filter(i => !existingIds.has(i.id));
          return [...prev, ...newOnes];
        });
        setHasMore(data.length === PAGE_SIZE);
        setPage(pageToLoad);
      } else if (response.status === 401) {
        navigate('/signin');
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setIdeas([]);
    setIsSearching(true);
    loadIdeas(0, true);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSelectedCategory('');
    setSelectedPostType('');
    setMinFunding('');
    setMaxFunding('');
    setSortBy('latest');
    setIsSearching(false);
    setPage(0);
    setIdeas([]);
    loadIdeas(0, true);
  };

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

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavoriteIds(data.favoriteIds);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchFollows = async () => {
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
        setFollowingIds(data.followingIds);
      }
    } catch (error) {
      console.error('Error fetching follows:', error);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      setIsLoadingSuggested(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/suggested?limit=3', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setIsLoadingSuggested(false);
    }
  };

  const fetchComments = async (ideaId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/comments/${ideaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => ({ ...prev, [ideaId]: data.comments }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const toggleFavorite = async (ideaId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/favorites/${ideaId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.favorited) {
          setFavoriteIds(prev => [...prev, ideaId]);
          showToast.success('Added to your favorites', 'Favorited');
        } else {
          setFavoriteIds(prev => prev.filter(id => id !== ideaId));
          showToast.info('Removed from favorites', 'Unfavorited');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast.error('Failed to update favorite status');
    }
  };

  const handleShare = async (idea: Idea) => {
    const url = `${window.location.origin}/ideas/${idea.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: idea.title, text: idea.description, url });
        showToast.success('Shared successfully', 'Shared');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        showToast.success('Link copied to clipboard', 'Copied');
      }
    } catch (err) {
      console.error('Error sharing link:', err);
      showToast.error('Failed to share');
    }
  };

  const handleReport = (idea: Idea) => {
    showToast.warning('Thanks for your report. Our team will review this post.', 'Report Submitted');
    console.log('Reported idea', idea.id);
  };

  const toggleFollow = async (userId: number) => {
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
        const data = await response.json();
        if (data.following) {
          setFollowingIds(prev => [...prev, userId]);
          showToast.success('You are now following this user', 'Following');
        } else {
          setFollowingIds(prev => prev.filter(id => id !== userId));
          showToast.info('You unfollowed this user', 'Unfollowed');
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      showToast.error('Failed to update follow status');
    }
  };

  const addComment = async (ideaId: number) => {
    const content = newComment[ideaId]?.trim();
    if (!content) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/comments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ideaId, content }),
      });

      if (response.ok) {
        setNewComment(prev => ({ ...prev, [ideaId]: '' }));
        fetchComments(ideaId);
        showToast.success('Your comment has been posted', 'Comment Added');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast.error('Failed to post comment');
    }
  };

  const toggleComments = (ideaId: number) => {
    if (expandedComments.includes(ideaId)) {
      setExpandedComments(prev => prev.filter(id => id !== ideaId));
    } else {
      setExpandedComments(prev => [...prev, ideaId]);
      if (!comments[ideaId]) {
        fetchComments(ideaId);
      }
    }
  };

  const handleBidClick = (idea: Idea) => {
    if (idea.userId === currentUserId) {
      showToast.error('You cannot place a bid on your own post', 'Invalid Action');
      return;
    }
    setSelectedIdeaForBid(idea);
    setShowBiddingModal(true);
  };

  const handleBidPlaced = () => {
    fetchWalletBalance();
    loadIdeas(0, true);
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesFilter = filter === 'all' || idea.status === filter;
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px] gap-6 items-start">
          {/* Left Sidebar */}
          <aside className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-3">Quick Filters</p>
              <div className="space-y-2 text-sm">
                <button
                  onClick={() => {
                    setSelectedPostType('');
                    setIsSearching(false);
                    setIdeas([]);
                    loadIdeas(0, true);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                    !selectedPostType ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                  }`}
                >
                  All Posts
                </button>
                <button
                  onClick={() => {
                    setSelectedPostType('idea');
                    setIsSearching(true);
                    setIdeas([]);
                    loadIdeas(0, true);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedPostType === 'idea' ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                  }`}
                >
                  💡 Intellectual Property
                </button>
                <button
                  onClick={() => {
                    setSelectedPostType('business');
                    setIsSearching(true);
                    setIdeas([]);
                    loadIdeas(0, true);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedPostType === 'business' ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                  }`}
                >
                  🏢 Businesses
                </button>
                <button
                  onClick={() => {
                    setSelectedPostType('share');
                    setIsSearching(true);
                    setIdeas([]);
                    loadIdeas(0, true);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedPostType === 'share' ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                  }`}
                >
                  📈 Shares
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-2">Your Wallet</p>
              <p className="text-2xl font-bold text-gray-900">${walletBalance.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-1">
                {walletBalance >= 10000 ? '✓ Ready to invest' : 'Add funds to invest'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-3">Categories</p>
              <div className="space-y-1 text-xs">
                {['tech', 'finance', 'healthcare', 'retail', 'other'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsSearching(true);
                      setIdeas([]);
                      loadIdeas(0, true);
                    }}
                    className={`block w-full text-left px-2 py-1 rounded hover:bg-gray-50 transition capitalize ${
                      selectedCategory === cat ? 'font-semibold bg-gray-100' : ''
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Center Feed */}
          <main className="space-y-4">
            {/* Create Post */}
            <CreatePost onPostCreated={handleBidPlaced} />

            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Input and Sort */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Search ideas, businesses, deals..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-inter"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-inter font-semibold transition"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-inter transition"
              >
                ⚙️ Filters
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  >
                    <option value="">All Categories</option>
                    <option value="tech">Tech</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="retail">Retail</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Post Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={selectedPostType}
                    onChange={(e) => setSelectedPostType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="idea">💡 Intellectual Property</option>
                    <option value="business">🏢 Business</option>
                    <option value="share">📈 Share</option>
                  </select>
                </div>

                {/* Min Funding */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Min Funding ($)</label>
                  <input
                    type="number"
                    placeholder="e.g., 10000"
                    value={minFunding}
                    onChange={(e) => setMinFunding(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  />
                </div>

                {/* Max Funding */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Max Funding ($)</label>
                  <input
                    type="number"
                    placeholder="e.g., 500000"
                    value={maxFunding}
                    onChange={(e) => setMaxFunding(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  />
                </div>

                {/* Sort By */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Sort By</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSortBy('latest')}
                      className={`flex-1 py-2 rounded-lg font-inter text-sm font-semibold transition ${
                        sortBy === 'latest'
                          ? 'bg-black text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Latest
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy('trending')}
                      className={`flex-1 py-2 rounded-lg font-inter text-sm font-semibold transition ${
                        sortBy === 'trending'
                          ? 'bg-black text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      🔥 Trending
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy('funded')}
                      className={`flex-1 py-2 rounded-lg font-inter text-sm font-semibold transition ${
                        sortBy === 'funded'
                          ? 'bg-black text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      💰 Most Funded
                    </button>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-inter text-sm transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Active Filters Display */}
          {isSearching && (
            <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
              <p className="font-inter text-sm text-gray-900">
                Searching for {searchInput && `"${searchInput}"`} 
                {selectedCategory && ` · Category: ${selectedCategory}`}
                {sortBy !== 'latest' && ` · Sort: ${sortBy}`}
              </p>
            </div>
          )}
        </div>

            {/* Feed */}
            {filteredIdeas.length > 0 ? (
              <div className="space-y-4">
                {filteredIdeas.map((idea) => {
                  console.log('Idea:', idea.id, 'PostType:', idea.postType, 'Equity:', idea.equityPercentage);
                  return (
                  <div key={idea.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => navigate(`/profile/${idea.userId}`)}>
                    <div className="w-10 h-10 bg-linear-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-roboto font-bold">
                      {idea.firstName?.[0]}{idea.lastName?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-inter font-semibold text-gray-900 text-sm hover:text-black">{idea.firstName} {idea.lastName}</span>
                        {idea.userId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFollow(idea.userId);
                            }}
                            className={`font-inter text-xs font-semibold transition ${
                              followingIds.includes(idea.userId)
                                ? 'text-gray-500'
                                : 'text-black hover:text-gray-700'
                            }`}
                          >
                            · {followingIds.includes(idea.userId) ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                      <p className="font-inter text-xs text-gray-500">
                        {new Date(idea.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · 
                        <span className="ml-1">🌎</span>
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-500 hover:bg-gray-100 rounded-full p-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>

                {/* Post Content - Different designs based on type */}
                <div className="px-4 pb-3">
                  {idea.postType === 'idea' && (
                    <div>
                      <div className="rounded-xl p-4 mb-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg">
                            <span className="text-2xl">💡</span>
                          </div>
                          <div className="flex-1">
                            <span className="font-inter text-xs font-bold text-purple-700 uppercase tracking-wider block">Intellectual Property</span>
                            <span className="font-inter text-xs text-purple-600">{idea.category}</span>
                          </div>
                        </div>
                        <h3 
                          className="font-roboto text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-purple-600 transition line-clamp-2"
                          onClick={() => navigate(`/ideas/${idea.id}`)}
                        >{idea.title}</h3>
                        <p className="font-inter text-sm text-gray-700 mb-4 line-clamp-2">{idea.description}</p>
                        
                        {/* Funding Progress */}
                        <div className="bg-white/80 rounded-lg p-3 backdrop-blur-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-inter text-xs font-semibold text-purple-900">Funding Goal</span>
                            <span className="font-roboto text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">${idea.fundingGoal.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-purple-100 h-3 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 transition-all duration-500 rounded-full"
                              style={{ width: `${getProgressPercentage(idea.currentFunding, idea.fundingGoal)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <p className="font-inter text-xs text-purple-700 font-medium">
                              ${idea.currentFunding.toLocaleString()} raised
                            </p>
                            <span className="font-inter text-xs font-bold text-purple-600">
                              {Math.round(getProgressPercentage(idea.currentFunding, idea.fundingGoal))}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {idea.postType === 'business' && (
                    <div>
                      <div className="rounded-xl p-4 mb-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2 rounded-lg shadow-md">
                            <span className="text-2xl">🏢</span>
                          </div>
                          <div className="flex-1">
                            <span className="font-inter text-xs font-bold text-orange-700 uppercase tracking-wider block">Business for Sale</span>
                            <span className="font-inter text-xs text-orange-600">{idea.category}</span>
                          </div>
                          <div className="bg-orange-500 px-2 py-1 rounded-full">
                            <span className="font-inter text-xs font-bold text-white">FOR SALE</span>
                          </div>
                        </div>
                        <h3 
                          className="font-roboto text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-orange-600 transition line-clamp-2"
                          onClick={() => navigate(`/ideas/${idea.id}`)}
                        >{idea.title}</h3>
                        <p className="font-inter text-sm text-gray-700 mb-4 line-clamp-2">{idea.description}</p>
                        
                        {/* Asking Price */}
                        <div className="bg-white/90 rounded-lg p-4 backdrop-blur-sm border border-orange-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <span className="font-inter text-xs font-semibold text-orange-700 block mb-1">💰 Asking Price</span>
                              <span className="font-roboto text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">${idea.fundingGoal.toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                              <div className="bg-orange-100 px-3 py-1 rounded-full mb-1">
                                <span className="font-inter text-xs text-orange-800 font-semibold">⭐ Established</span>
                              </div>
                              <span className="font-inter text-xs text-orange-700">Ready to Transfer</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-orange-700">
                            <span className="flex items-center gap-1">
                              <span>📊</span> Active Business
                            </span>
                            <span className="text-orange-400">•</span>
                            <span className="flex items-center gap-1">
                              <span>✅</span> Verified Assets
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {(idea.postType === 'share' || idea.postType === 'shares') && (
                    <div>
                      <div className="rounded-xl p-4 mb-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-2 rounded-lg shadow-md">
                            <span className="text-2xl">📈</span>
                          </div>
                          <div className="flex-1">
                            <span className="font-inter text-xs font-bold text-emerald-700 uppercase tracking-wider block">Shares Available</span>
                            <span className="font-inter text-xs text-emerald-600">{idea.category}</span>
                          </div>
                          <div className="bg-emerald-500 px-2 py-1 rounded-full animate-pulse">
                            <span className="font-inter text-xs font-bold text-white">INVEST</span>
                          </div>
                        </div>
                        <h3 
                          className="font-roboto text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-emerald-600 transition line-clamp-2"
                          onClick={() => navigate(`/ideas/${idea.id}`)}
                        >{idea.title}</h3>
                        <p className="font-inter text-sm text-gray-700 mb-4 line-clamp-2">{idea.description}</p>
                        
                        {/* Share Details */}
                        <div className="bg-white/90 rounded-lg p-4 backdrop-blur-sm border border-emerald-200">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-emerald-50 p-3 rounded-lg">
                              <span className="font-inter text-xs font-semibold text-emerald-900 block mb-1">💵 Price per Share</span>
                              <span className="font-roboto text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">${idea.fundingGoal.toLocaleString()}</span>
                            </div>
                            <div className="bg-teal-50 p-3 rounded-lg">
                              <span className="font-inter text-xs font-semibold text-teal-900 block mb-1">📊 Equity Offered</span>
                              <span className="font-roboto text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                                {idea.equityPercentage ? `${idea.equityPercentage}%` : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="bg-emerald-100 rounded-lg p-2 flex items-center justify-center gap-2">
                            <span className="text-sm">✨</span>
                            <span className="font-inter text-xs text-emerald-800 font-semibold">Available for Immediate Purchase</span>
                            <span className="text-sm">🚀</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Badge (if not active) */}
                {idea.status !== 'active' && (
                  <div className="px-4 pb-2">
                    <span className={`inline-block font-inter text-xs font-semibold px-3 py-1 rounded-full ${
                      idea.status === 'funded' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {idea.status === 'funded' ? '✓ Fully Funded' : 'Closed'}
                    </span>
                  </div>
                )}

                {/* Files Section */}
                {idea.files && idea.files.length > 0 && (
                  <div className="border-t border-gray-200 px-4 py-3">
                    <p className="font-inter text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      📎 Supporting Documents ({idea.files.length})
                    </p>
                    <div className="space-y-2">
                      {idea.files.map((file, idx) => (
                        <a
                          key={idx}
                          href={`http://localhost:5000${file.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                        >
                          <span className="text-lg">
                            {file.type === 'businessCertificate' && '🏢'}
                            {file.type === 'registrationNumber' && '🔢'}
                            {file.type === 'financialStatement' && '💰'}
                            {file.type === 'businessLicense' && '📜'}
                            {file.type === 'taxReturns' && '💼'}
                            {file.type === 'businessPlan' && '📋'}
                            {file.type === 'marketAnalysis' && '📊'}
                            {file.type === 'investorDeck' && '📑'}
                            {file.type === 'capTableDocs' && '📄'}
                            {!['businessCertificate', 'registrationNumber', 'financialStatement', 'businessLicense', 'taxReturns', 'businessPlan', 'marketAnalysis', 'investorDeck', 'capTableDocs'].includes(file.type) && '📄'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-inter text-xs font-semibold text-gray-900 truncate group-hover:text-gray-700">
                              {file.name}
                            </p>
                            <p className="font-inter text-xs text-gray-500">
                              {file.type === 'businessCertificate' ? 'Business Certificate' :
                               file.type === 'registrationNumber' ? 'Registration Number' :
                               file.type === 'financialStatement' ? 'Financial Statement' :
                               file.type === 'businessLicense' ? 'Business License' :
                               file.type === 'taxReturns' ? 'Tax Returns' :
                               file.type === 'businessPlan' ? 'Business Plan' :
                               file.type === 'marketAnalysis' ? 'Market Analysis' :
                               file.type === 'investorDeck' ? 'Investor Deck' :
                               file.type === 'capTableDocs' ? 'Cap Table' : 'Document'} · {(file.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                          <span className="text-gray-400 group-hover:text-gray-600">↓</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement Stats */}
                {(idea.commentCount || idea.saveCount || idea.shareCount || idea.reportCount) ? (
                  <div className="border-t border-gray-200 px-4 py-2 flex items-center gap-4 text-xs text-gray-600">
                    {idea.commentCount ? (
                      <span className="flex items-center gap-1">
                        <span>💬</span>
                        <span className="font-semibold">{formatCount(idea.commentCount)}</span>
                        <span>{idea.commentCount === 1 ? 'Comment' : 'Comments'}</span>
                      </span>
                    ) : null}
                    {idea.saveCount ? (
                      <span className="flex items-center gap-1">
                        <span>❤️</span>
                        <span className="font-semibold">{formatCount(idea.saveCount)}</span>
                        <span>{idea.saveCount === 1 ? 'Save' : 'Saves'}</span>
                      </span>
                    ) : null}
                    {idea.shareCount ? (
                      <span className="flex items-center gap-1">
                        <span>🔗</span>
                        <span className="font-semibold">{formatCount(idea.shareCount)}</span>
                        <span>{idea.shareCount === 1 ? 'Share' : 'Shares'}</span>
                      </span>
                    ) : null}
                    {idea.reportCount && idea.reportCount > 0 ? (
                      <span className="flex items-center gap-1 text-orange-600">
                        <span>🚩</span>
                        <span className="font-semibold">{formatCount(idea.reportCount)}</span>
                        <span>{idea.reportCount === 1 ? 'Report' : 'Reports'}</span>
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {/* Action Buttons */}
                <div className="border-t border-gray-200 px-4 py-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleFavorite(idea.id)}
                    className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 font-inter text-sm font-semibold py-2 rounded-lg hover:bg-gray-100 transition ${
                      favoriteIds.includes(idea.id) ? 'text-red-600' : 'text-gray-600'
                    }`}
                  >
                    {favoriteIds.includes(idea.id) ? '❤️' : '🤍'} Save
                  </button>
                  <button
                    onClick={() => toggleComments(idea.id)}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 font-inter text-sm font-semibold text-gray-600 py-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    💬 Comment
                  </button>
                  <button
                    onClick={() => handleBidClick(idea)}
                    disabled={walletBalance < 10000 || idea.userId === currentUserId}
                    className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 font-inter text-sm font-semibold py-2 rounded-lg transition ${
                      walletBalance >= 10000 && idea.userId !== currentUserId
                        ? 'text-gray-800 hover:bg-gray-100'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    title={idea.userId === currentUserId ? 'You cannot bid on your own post' : walletBalance < 10000 ? 'Minimum balance of $10,000 required' : 'Place a bid'}
                  >
                    💰 Invest
                  </button>
                  <button
                    onClick={() => handleShare(idea)}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 font-inter text-sm font-semibold text-gray-600 py-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    🔗 Share
                  </button>
                  <button
                    onClick={() => handleReport(idea)}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 font-inter text-sm font-semibold text-gray-600 py-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    🚩 Report
                  </button>
                </div>

                {/* Comments count */}
                {comments[idea.id]?.length > 0 && !expandedComments.includes(idea.id) && (
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button
                      onClick={() => toggleComments(idea.id)}
                      className="font-inter text-sm text-gray-600 hover:text-gray-900"
                    >
                      View {comments[idea.id].length} {comments[idea.id].length === 1 ? 'comment' : 'comments'}
                    </button>
                  </div>
                )}

                {/* Comments Section */}
                {expandedComments.includes(idea.id) && (
                  <div className="border-t border-gray-200">
                    <div className="px-4 py-3 space-y-3 max-h-96 overflow-y-auto">
                      {comments[idea.id]?.map((comment) => (
                        <div key={comment.id} className="flex gap-2">
                          <div className="w-8 h-8 bg-linear-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-roboto font-bold text-xs shrink-0">
                            {comment.userName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-100 rounded-2xl px-3 py-2">
                              <span className="font-inter text-sm font-semibold text-gray-900 block">{comment.userName}</span>
                              <p className="font-inter text-sm text-gray-800">{comment.content}</p>
                            </div>
                            <div className="flex gap-3 ml-3 mt-1">
                              <button className="font-inter text-xs font-semibold text-gray-600 hover:text-gray-900">Like</button>
                              <button className="font-inter text-xs font-semibold text-gray-600 hover:text-gray-900">Reply</button>
                              <span className="font-inter text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Comment Input */}
                    <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
                      <div className="w-8 h-8 bg-linear-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-white font-roboto font-bold text-xs shrink-0">
                        {JSON.parse(localStorage.getItem('user') || '{}').firstName?.[0]}
                        {JSON.parse(localStorage.getItem('user') || '{}').lastName?.[0]}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={newComment[idea.id] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [idea.id]: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && addComment(idea.id)}
                          className="flex-1 font-inter text-sm px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                    </div>
                  </div>
                )}
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
                <p className="font-inter text-gray-600 mb-4">No posts to show</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('all');
                  }}
                  className="font-inter text-black hover:text-gray-800 font-semibold"
                >
                  Clear filters
                </button>
              </div>
            )}

            <div ref={sentinelRef} className="h-8"></div>
            {isFetchingMore && hasMore && (
              <div className="text-center py-4 text-sm text-gray-500 font-inter">Loading more posts...</div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-3">🔥 Trending</p>
              <div className="space-y-3 text-sm">
                {['#CleanTech', '#AI', '#Fintech', '#B2B', '#Healthcare'].map((tag, idx) => (
                  <div key={tag}>
                    <p className="font-semibold text-gray-900">{tag}</p>
                    <p className="text-xs text-gray-600">{12 - idx * 2}k posts</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-3">Who to follow</p>
              <div className="space-y-3">
                {isLoadingSuggested ? (
                  <div className="py-4 text-center text-sm text-gray-500">Loading...</div>
                ) : suggestedUsers.length === 0 ? (
                  <div className="py-4 text-center text-sm text-gray-500">No suggestions available</div>
                ) : (
                  suggestedUsers.map((person) => (
                    <div key={person.id} className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-linear-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {person.firstName[0]}{person.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{person.firstName} {person.lastName}</p>
                        <p className="text-xs text-gray-600 truncate">{person.role}</p>
                      </div>
                      <button 
                        onClick={() => toggleFollow(person.id)}
                        className={`text-xs font-semibold transition ${
                          followingIds.includes(person.id)
                            ? 'text-gray-500 hover:text-red-600'
                            : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        {followingIds.includes(person.id) ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-2">Footer</p>
              <div className="space-y-1 text-xs text-gray-600">
                <a href="/about" className="block hover:text-gray-900">About</a>
                <a href="/privacy" className="block hover:text-gray-900">Privacy</a>
                <a href="/terms" className="block hover:text-gray-900">Terms</a>
                <p className="text-gray-500 mt-2">© 2026 Bilnet</p>
              </div>
            </div>
          </aside>
        </div>

        {/* Bidding Modal */}
        {showBiddingModal && selectedIdeaForBid && (
          <BiddingModal
            ideaId={selectedIdeaForBid.id}
            ideaTitle={selectedIdeaForBid.title}
            currentBalance={walletBalance}
            onBidPlaced={handleBidPlaced}
            onClose={() => {
              setShowBiddingModal(false);
              setSelectedIdeaForBid(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
