import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import BidManagementModal from '../components/BidManagementModal';
import { formatCurrencyShort } from '../utils/formatCurrency';

interface Idea {
  id: number;
  title: string;
  description: string;
  category: string;
  fundingGoal: number;
  currentFunding: number;
  status: string;
  createdAt: string;
}

export default function MyIdeas() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedIdeaForBids, setSelectedIdeaForBids] = useState<number | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);

  useEffect(() => {
    fetchMyIdeas();
  }, []);

  const fetchMyIdeas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/ideas/my-ideas', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.ideas)
            ? (data as any).ideas
            : Array.isArray((data as any)?.data)
              ? (data as any).data
              : [];
        const safeIdeas: Idea[] = normalized.map((item: Partial<Idea>) => {
          const fundingGoal = Number(item.fundingGoal);
          const currentFunding = Number(item.currentFunding);

          return {
            id: Number(item.id),
            title: item.title || 'Untitled',
            description: item.description || '',
            category: item.category || 'other',
            fundingGoal: Number.isFinite(fundingGoal) ? fundingGoal : 0,
            currentFunding: Number.isFinite(currentFunding) ? currentFunding : 0,
            status: item.status || 'active',
            createdAt: item.createdAt || new Date().toISOString(),
          };
        });
        setIdeas(safeIdeas);
      } else if (response.status === 401) {
        navigate('/signin');
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredIdeas = Array.isArray(ideas)
    ? ideas.filter(idea => filter === 'all' || idea.status === filter)
    : [];

  const getProgressPercentage = (current: number, goal: number) => {
    const safeCurrent = Number.isFinite(current) ? current : 0;
    const safeGoal = Number.isFinite(goal) ? goal : 0;

    if (safeGoal <= 0 || safeCurrent <= 0) {
      return 0;
    }

    return Math.min((safeCurrent / safeGoal) * 100, 100);
  };

  const handleDelete = async (ideaId: number) => {
    if (!window.confirm('Are you sure you want to delete this idea?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/ideas/${ideaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIdeas(ideas.filter(idea => idea.id !== ideaId));
      }
    } catch (error) {
      console.error('Error deleting idea:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-6" style={{backgroundColor: 'var(--color-background)'}}>
      <div className="container">
        {/* Header */}
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{color: 'var(--color-text)'}}>💡 My Listings</h1>
            <p className="text-base" style={{color: 'var(--color-text-secondary)'}}>Manage your listed assets and track performance</p>
          </div>
          <Link to="/post-idea" className="btn btn-primary">
            + List New Asset
          </Link>
        </div>

        {/* Stats */}
        {filteredIdeas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color: 'var(--color-text-secondary)'}}>Total Ideas</p>
              <p className="text-3xl font-bold" style={{color: 'var(--color-text)'}}>{ideas.length}</p>
            </div>
            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color: 'var(--color-text-secondary)'}}>Active Ideas</p>
              <p className="text-3xl font-bold" style={{color: 'var(--color-accent)'}}>{ideas.filter(i => i.status === 'active').length}</p>
            </div>
            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color: 'var(--color-text-secondary)'}}>Total Raised</p>
              <p className="text-3xl font-bold" style={{color: 'var(--color-primary)'}}>{formatCurrencyShort(ideas.reduce((sum, i) => sum + i.currentFunding, 0))}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mb-8">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Ideas</option>
            <option value="active">Active</option>
            <option value="funded">Fully Funded</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Ideas List */}
        {filteredIdeas.length > 0 ? (
          <div className="space-y-4">
            {filteredIdeas.map((idea) => {
              const progress = getProgressPercentage(idea.currentFunding, idea.fundingGoal);

              return (
              <div key={idea.id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/ideas/${idea.id}`)}
                  >
                    <h2 className="text-xl font-semibold text-slate-900 mb-1 hover:text-blue-600 transition">{idea.title}</h2>
                    <p className="text-sm text-slate-600">{idea.description.substring(0, 120)}...</p>
                  </div>
                  <span className={`badge ${
                    idea.status === 'active' ? 'badge-success' :
                    idea.status === 'funded' ? 'badge-info' :
                    'badge-secondary'
                  } ml-4`}>
                    {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-200">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Category</p>
                    <p className="text-slate-900 font-medium capitalize">{idea.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Goal</p>
                    <p className="text-slate-900 font-medium">{formatCurrencyShort(idea.fundingGoal)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Raised</p>
                    <p className="text-blue-600 font-semibold">{formatCurrencyShort(idea.currentFunding)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Posted</p>
                    <p className="text-slate-900 font-medium">{new Date(idea.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-700">Funding Progress</span>
                    <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                  <button 
                    onClick={() => {
                      setSelectedIdeaForBids(idea.id);
                      setShowBidModal(true);
                    }}
                    className="btn btn-primary">
                    Manage Bids
                  </button>
                  <button 
                    onClick={() => navigate(`/edit-post/${idea.id}`)}
                    className="btn btn-secondary">
                    Edit
                  </button>
                  <button 
                    onClick={() => navigate(`/ideas/${idea.id}`)}
                    className="btn btn-secondary">
                    View Details
                  </button>
                  <button
                    onClick={() => handleDelete(idea.id)}
                    className="btn" style={{backgroundColor: '#fee', color: '#c00'}} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fcc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fee'}
                  >
                    Delete
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-16 p-8">
            <p className="mb-6 text-base" style={{color: 'var(--color-text-secondary)'}}>You haven't listed any assets yet</p>
            <Link to="/post-idea" className="btn btn-primary inline-block">
              List Your First Asset
            </Link>
          </div>
        )}

        {/* Bid Management Modal */}
        {selectedIdeaForBids && (
          <BidManagementModal
            ideaId={selectedIdeaForBids}
            isOpen={showBidModal}
            onClose={() => setShowBidModal(false)}
          />
        )}
      </div>
    </div>
  );
}
