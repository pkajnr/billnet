import { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';

interface AnalyticsData {
  role: 'entrepreneur' | 'investor';
  // Entrepreneur metrics
  totalIdeas?: number;
  totalRaised?: number;
  avgFunding?: number;
  totalBids?: number;
  totalBidValue?: number;
  totalFavorites?: number;
  totalComments?: number;
  fundingTrend?: Array<{ date: string; amount: number }>;
  // Investor metrics
  totalInvestments?: number;
  totalInvested?: number;
  avgInvestment?: number;
  totalEquity?: number;
  portfolioDiversity?: number;
  uniqueIdeas?: number;
  walletBalance?: number;
  investmentTrend?: Array<{ date: string; amount: number }>;
  categoryBreakdown?: Array<{ category: string; count: number; total_amount: number }>;
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Normalize to number to avoid runtime errors when API returns strings/null
  const toNumber = (value: unknown, fallback = 0) => {
    const n = typeof value === 'number' ? value : parseFloat(String(value));
    return Number.isFinite(n) ? n : fallback;
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        showToast.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast.error('Error loading analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 py-12 px-6 flex items-center justify-center">
        <p className="font-inter text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-roboto text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="font-inter text-gray-600">Track your performance and growth metrics</p>
        </div>

        {analytics.role === 'entrepreneur' ? (
          <>
            {/* Entrepreneur Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">TOTAL IDEAS</p>
                <p className="font-roboto text-3xl font-bold text-gray-900">{analytics.totalIdeas}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">TOTAL RAISED</p>
                <p className="font-roboto text-3xl font-bold text-gray-900">${toNumber(analytics.totalRaised).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">TOTAL BIDS</p>
                <p className="font-roboto text-3xl font-bold text-gray-900">{analytics.totalBids}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">AVG FUNDING</p>
                <p className="font-roboto text-3xl font-bold text-gray-900">${toNumber(analytics.avgFunding).toFixed(2)}</p>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">TOTAL BID VALUE</p>
                <p className="font-roboto text-2xl font-bold text-gray-900">${toNumber(analytics.totalBidValue).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">FAVORITES</p>
                <p className="font-roboto text-2xl font-bold text-gray-900">{analytics.totalFavorites} ❤️</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">COMMENTS</p>
                <p className="font-roboto text-2xl font-bold text-gray-700">{analytics.totalComments} 💬</p>
              </div>
            </div>

            {/* Funding Trend Chart */}
            {analytics.fundingTrend && analytics.fundingTrend.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="font-roboto text-xl font-bold text-gray-900 mb-4">Funding Trend (Last 30 Days)</h2>
                <div className="space-y-2">
                  {analytics.fundingTrend.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="font-inter text-sm text-gray-600 w-24">{new Date(item.date).toLocaleDateString()}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                        <div
                          className="bg-gray-600 h-8 rounded-full flex items-center justify-end pr-3"
                          style={{ width: `${Math.min((toNumber(item.amount) / (toNumber(analytics.totalRaised) || 1)) * 100, 100)}%` }}
                        >
                          <span className="font-inter text-xs font-semibold text-white">${toNumber(item.amount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Investor Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">INVESTMENTS</p>
                <p className="font-roboto text-3xl font-bold text-gray-900">{analytics.totalInvestments}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">TOTAL INVESTED</p>
                <p className="font-roboto text-3xl font-bold text-gray-900">${toNumber(analytics.totalInvested).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">AVG INVESTMENT</p>
                <p className="font-roboto text-3xl font-bold text-gray-900">${toNumber(analytics.avgInvestment).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">WALLET</p>
                <p className="font-roboto text-3xl font-bold text-gray-900">${toNumber(analytics.walletBalance).toFixed(2)}</p>
              </div>
            </div>

            {/* Portfolio Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">TOTAL EQUITY</p>
                <p className="font-roboto text-2xl font-bold text-gray-900">{toNumber(analytics.totalEquity).toFixed(2)}%</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">UNIQUE IDEAS</p>
                <p className="font-roboto text-2xl font-bold text-gray-900">{analytics.uniqueIdeas}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-inter text-xs font-semibold text-gray-500 tracking-wider mb-2">CATEGORIES</p>
                <p className="font-roboto text-2xl font-bold text-gray-900">{analytics.portfolioDiversity}</p>
              </div>
            </div>

            {/* Investment Trend Chart */}
            {analytics.investmentTrend && analytics.investmentTrend.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
                <h2 className="font-roboto text-xl font-bold text-gray-900 mb-4">Investment Trend (Last 30 Days)</h2>
                <div className="space-y-2">
                  {analytics.investmentTrend.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="font-inter text-sm text-gray-600 w-24">{new Date(item.date).toLocaleDateString()}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                        <div
                          className="bg-black h-8 rounded-full flex items-center justify-end pr-3"
                          style={{ width: `${Math.min((toNumber(item.amount) / (toNumber(analytics.totalInvested) || 1)) * 100, 100)}%` }}
                        >
                          <span className="font-inter text-xs font-semibold text-white">${toNumber(item.amount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Breakdown */}
            {analytics.categoryBreakdown && analytics.categoryBreakdown.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="font-roboto text-xl font-bold text-gray-900 mb-4">Portfolio by Category</h2>
                <div className="space-y-4">
                  {analytics.categoryBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-inter font-semibold text-gray-900 capitalize">{item.category}</p>
                        <p className="font-inter text-sm text-gray-500">{item.count} {item.count === 1 ? 'investment' : 'investments'}</p>
                      </div>
                      <p className="font-roboto text-lg font-bold text-gray-900">${toNumber(item.total_amount).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
