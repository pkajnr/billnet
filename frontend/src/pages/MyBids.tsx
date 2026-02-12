import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import { showToast } from '../utils/toast';

interface Bid {
  id: number;
  ideaId: number;
  ideaTitle: string;
  ideaCategory: string;
  bidAmount: number;
  equityPercentage: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  entrepreneurName: string;
}

export default function MyBids() {
  const navigate = useNavigate();
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    fetchMyBids();
  }, []);

  const fetchMyBids = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
        return;
      }

      const response = await fetch('http://localhost:5000/api/bids/my-bids', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Bids data received:', data);
        setBids(data.bids || []);
      } else if (response.status === 401) {
        showToast.error('Please sign in to view your bids');
        navigate('/signin');
      } else {
        showToast.error('Failed to load your bids');
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
      showToast.error('Error loading bids');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBids = bids.filter(bid => 
    filter === 'all' || bid.status === filter
  );

  const totalBidAmount = bids
    .filter(b => b.status === 'pending' || b.status === 'accepted')
    .reduce((sum, bid) => sum + bid.bidAmount, 0);
  const pendingBids = bids.filter(b => b.status === 'pending').length;
  const acceptedBids = bids.filter(b => b.status === 'accepted').length;

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-6" style={{backgroundColor: 'var(--color-background)'}}>
        <div className="container">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-6" style={{backgroundColor: 'var(--color-background)'}}>
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2" style={{color: 'var(--color-text)'}}>
            💰 My Bids
          </h1>
          <p className="text-base" style={{color: 'var(--color-text-secondary)'}}>
            Track and manage your investment bids
          </p>
        </div>

        {/* Stats */}
        {bids.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color: 'var(--color-text-secondary)'}}>
                Total Bid Amount
              </p>
              <p className="text-3xl font-bold mb-1" style={{color: 'var(--color-primary)'}}>
                ${totalBidAmount.toLocaleString()}
              </p>
              <p className="text-xs" style={{color: 'var(--color-text-secondary)'}}>
                Active & pending bids
              </p>
            </div>
            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color: 'var(--color-text-secondary)'}}>
                Pending Bids
              </p>
              <p className="text-3xl font-bold mb-1" style={{color: 'var(--color-accent)'}}>
                {pendingBids}
              </p>
              <p className="text-xs" style={{color: 'var(--color-text-secondary)'}}>
                Awaiting response
              </p>
            </div>
            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color: 'var(--color-text-secondary)'}}>
                Accepted Bids
              </p>
              <p className="text-3xl font-bold mb-1" style={{color: '#10b981'}}>
                {acceptedBids}
              </p>
              <p className="text-xs" style={{color: 'var(--color-text-secondary)'}}>
                Successfully accepted
              </p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mb-8">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="form-select"
          >
            <option value="all">All Bids</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Bids List */}
        {filteredBids.length > 0 ? (
          <div className="space-y-4">
            {filteredBids.map((bid) => (
              <div key={bid.id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 
                      className="text-xl font-semibold mb-1 cursor-pointer hover:text-blue-600 transition"
                      style={{color: 'var(--color-text)'}}
                      onClick={() => navigate(`/ideas/${bid.ideaId}`)}
                    >
                      {bid.ideaTitle}
                    </h2>
                    <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>
                      Entrepreneur: {bid.entrepreneurName}
                    </p>
                  </div>
                  <span className={`badge ${
                    bid.status === 'accepted' ? 'badge-success' :
                    bid.status === 'pending' ? 'badge-warning' :
                    'badge-error'
                  }`}>
                    {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4" style={{borderBottom: '1px solid var(--color-border)'}}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{color: 'var(--color-text-secondary)'}}>
                      Bid Amount
                    </p>
                    <p className="text-2xl font-bold" style={{color: 'var(--color-primary)'}}>
                      ${bid.bidAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{color: 'var(--color-text-secondary)'}}>
                      Equity Offered
                    </p>
                    <p className="text-2xl font-bold" style={{color: 'var(--color-accent)'}}>
                      {bid.equityPercentage}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{color: 'var(--color-text-secondary)'}}>
                      Date Placed
                    </p>
                    <p className="font-medium" style={{color: 'var(--color-text)'}}>
                      {new Date(bid.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Status Info */}
                <div className="mt-4">
                  {bid.status === 'pending' && (
                    <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>
                      ⏳ Your bid is pending review by the entrepreneur. Funds are reserved in your wallet.
                    </p>
                  )}
                  {bid.status === 'accepted' && (
                    <p className="text-sm text-green-600">
                      ✅ Congratulations! Your bid was accepted. Check your Portfolio for details.
                    </p>
                  )}
                  {bid.status === 'rejected' && (
                    <p className="text-sm text-red-600">
                      ❌ Your bid was rejected. Funds have been returned to your wallet.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 flex-wrap">
                  <button 
                    onClick={() => navigate(`/ideas/${bid.ideaId}`)}
                    className="btn btn-primary"
                  >
                    View Idea
                  </button>
                  {bid.status === 'accepted' && (
                    <button 
                      onClick={() => navigate('/my-investments')}
                      className="btn btn-secondary"
                    >
                      View Portfolio
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16 p-8">
            <p className="mb-6 text-base" style={{color: 'var(--color-text-secondary)'}}>
              You haven't placed any bids yet
            </p>
            <Link to="/explore" className="btn btn-primary inline-block">
              Explore Opportunities
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
