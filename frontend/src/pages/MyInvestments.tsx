import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import { showToast } from '../utils/toast';

interface Investment {
  id: number | string;
  ideaId?: number | string;
  ideaTitle: string;
  amount: number;
  status: string;
  entrepreneurName: string;
  createdAt: string;
}

export default function MyInvestments() {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const toNumber = (value: unknown, fallback = 0) => {
    const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
    return Number.isFinite(n) ? n : fallback;
  };

  const normalizeInvestments = (payload: any): Investment[] => {
    const source = Array.isArray(payload?.investments)
      ? payload.investments
      : Array.isArray(payload?.data?.investments)
        ? payload.data.investments
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    if (!Array.isArray(source)) return [];

    return source.map((item: any, idx: number) => {
      const amount = toNumber(item?.amount ?? item?.investment_amount);
      const status = String(item?.status ?? item?.state ?? 'pending').toLowerCase();
      const createdAt = item?.createdAt || item?.created_at || item?.date || item?.created_on || new Date().toISOString();
      const name = item?.entrepreneurName || item?.ownerName || [item?.first_name, item?.last_name].filter(Boolean).join(' ');

      return {
        id: item?.id ?? item?.investment_id ?? idx,
        ideaId: item?.ideaId || item?.idea_id || item?.postId || item?.post_id,
        ideaTitle: item?.ideaTitle || item?.title || item?.idea_title || 'Untitled Idea',
        amount,
        status,
        entrepreneurName: name || 'Unknown founder',
        createdAt,
      };
    });
  };

  useEffect(() => {
    fetchMyInvestments();
  }, []);

  const fetchMyInvestments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
        return;
      }

      const response = await fetch('http://localhost:5000/api/investments/my-investments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Investments data received:', data);
        setInvestments(normalizeInvestments(data));
      } else if (response.status === 401) {
        showToast.error('Please sign in to view your investments');
        navigate('/signin');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load investments:', errorData);
        showToast.error('Failed to load your investments');
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
      showToast.error('Error loading investments');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInvestments = investments.filter(inv =>
    filter === 'all' || inv.status === filter
  );

  const totalInvested = investments.reduce((sum, inv) => sum + toNumber(inv.amount), 0);
  const activeInvestments = investments.filter(inv => inv.status !== 'cancelled').length;

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
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2" style={{color: 'var(--color-text)'}}>💰 My Investments</h1>
          <p className="text-base" style={{color: 'var(--color-text-secondary)'}}>Track and manage your investment portfolio</p>
        </div>

        {/* Stats */}
        {investments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card p-6">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Total Invested</p>
              <p className="text-3xl font-bold text-blue-600 mb-1">${totalInvested.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Across all investments</p>
            </div>
            <div className="card p-6">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Active Investments</p>
              <p className="text-3xl font-bold text-emerald-600 mb-1">{activeInvestments}</p>
              <p className="text-xs text-slate-500">Currently active</p>
            </div>
            <div className="card p-6">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Portfolio Value</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">${totalInvested.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Current valuation</p>
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
            <option value="all">All Investments</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Investments List */}
        {filteredInvestments.length > 0 ? (
          <div className="space-y-4">
            {filteredInvestments.map((investment) => (
              <div key={investment.id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 
                      className="text-xl font-semibold text-slate-900 mb-1 cursor-pointer hover:text-blue-600 transition"
                      onClick={() => navigate(`/ideas/${investment.ideaId}`)}
                    >{investment.ideaTitle}</h2>
                    <p className="text-sm text-slate-600">Investor: {investment.entrepreneurName}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ml-4 ${
                    investment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    investment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Amount</p>
                    <p className="text-2xl font-bold text-blue-600">${investment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Date</p>
                    <p className="text-slate-900 font-medium">{new Date(investment.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Return</p>
                    <p className="text-slate-900 font-medium">Pending evaluation</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 flex-wrap">
                  <button className="btn btn-primary">
                    View Details
                  </button>
                  <button className="btn btn-secondary">
                    Contact
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16 p-8">
            <p className="mb-6 text-base" style={{color: 'var(--color-text-secondary)'}}>You haven't made any investments yet</p>
            <Link to="/explore" className="btn btn-primary inline-block">
              Explore Opportunities
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
