import React, { useEffect, useState } from 'react';
import { ADMIN_API, getAdminHeaders } from '../utils/api';
import { showToast } from '../utils/toast';

interface AnalyticsData {
  users: {
    total: number;
    verified: number;
    certified: number;
    newThisMonth: number;
    newToday: number;
    byRole: Array<{ role: string; count: string }>;
  };
  ideas: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    newThisMonth: number;
    byCategory: Array<{ category: string; count: string }>;
  };
  investments: {
    total: number;
    completed: number;
    totalAmount: number;
    avgAmount: number;
    newThisMonth: number;
    topInvestors: Array<{
      first_name: string;
      last_name: string;
      email: string;
      investment_count: string;
      total_invested: string;
    }>;
  };
  verifications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  growth: {
    users: Array<{ date: string; count: string }>;
    ideas: Array<{ date: string; count: string }>;
    revenue: Array<{ date: string; total: string }>;
  };
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      showToast.error('Admin authentication required');
      return;
    }

    try {
      const response = await fetch(ADMIN_API.ANALYTICS, {
        headers: getAdminHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        showToast.error('Failed to fetch analytics');
      }
    } catch (error) {
      showToast.error('Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#232F3E]">
        <div className="text-lg text-white">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#232F3E]">
        <div className="text-lg text-white">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#232F3E] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Site Analytics & Metrics</h1>

        {/* User Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-[#FF9900]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            User Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-[#37475A] rounded-lg p-4 border border-[#FF9900]/20">
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-[#FF9900] mt-2">{analytics.users.total}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-green-500/20">
              <p className="text-gray-400 text-sm">Verified Users</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{analytics.users.verified}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-blue-500/20">
              <p className="text-gray-400 text-sm">Certified Users</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">{analytics.users.certified}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-purple-500/20">
              <p className="text-gray-400 text-sm">New This Month</p>
              <p className="text-3xl font-bold text-purple-400 mt-2">{analytics.users.newThisMonth}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-yellow-500/20">
              <p className="text-gray-400 text-sm">New Today</p>
              <p className="text-3xl font-bold text-yellow-400 mt-2">{analytics.users.newToday}</p>
            </div>
          </div>

          {/* Users by Role */}
          {analytics.users.byRole.length > 0 && (
            <div className="mt-4 bg-[#37475A] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Users by Role</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {analytics.users.byRole.map((role) => (
                  <div key={role.role} className="bg-[#232F3E] rounded p-3 border border-[#FF9900]/10">
                    <p className="text-gray-400 text-xs uppercase">{role.role}</p>
                    <p className="text-xl font-bold text-white">{role.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Idea Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-[#FF9900]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Idea Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-[#37475A] rounded-lg p-4 border border-[#FF9900]/20">
              <p className="text-gray-400 text-sm">Total Ideas</p>
              <p className="text-3xl font-bold text-[#FF9900] mt-2">{analytics.ideas.total}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-green-500/20">
              <p className="text-gray-400 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{analytics.ideas.approved}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-yellow-500/20">
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-400 mt-2">{analytics.ideas.pending}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-red-500/20">
              <p className="text-gray-400 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{analytics.ideas.rejected}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-purple-500/20">
              <p className="text-gray-400 text-sm">New This Month</p>
              <p className="text-3xl font-bold text-purple-400 mt-2">{analytics.ideas.newThisMonth}</p>
            </div>
          </div>

          {/* Ideas by Category */}
          {analytics.ideas.byCategory.length > 0 && (
            <div className="mt-4 bg-[#37475A] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Ideas by Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {analytics.ideas.byCategory.map((cat) => (
                  <div key={cat.category} className="bg-[#232F3E] rounded p-3 border border-[#FF9900]/10">
                    <p className="text-gray-400 text-xs truncate">{cat.category || 'Uncategorized'}</p>
                    <p className="text-xl font-bold text-white">{cat.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Investment Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-[#FF9900]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Investment Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-[#37475A] rounded-lg p-4 border border-[#FF9900]/20">
              <p className="text-gray-400 text-sm">Total Investments</p>
              <p className="text-3xl font-bold text-[#FF9900] mt-2">{analytics.investments.total}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-green-500/20">
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{analytics.investments.completed}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-blue-500/20">
              <p className="text-gray-400 text-sm">Total Amount</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">${analytics.investments.totalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-purple-500/20">
              <p className="text-gray-400 text-sm">Avg Amount</p>
              <p className="text-3xl font-bold text-purple-400 mt-2">${analytics.investments.avgAmount.toFixed(2)}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-yellow-500/20">
              <p className="text-gray-400 text-sm">New This Month</p>
              <p className="text-3xl font-bold text-yellow-400 mt-2">{analytics.investments.newThisMonth}</p>
            </div>
          </div>

          {/* Top Investors */}
          {analytics.investments.topInvestors.length > 0 && (
            <div className="mt-4 bg-[#37475A] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Top Investors</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left text-gray-400 text-sm py-2 px-3">Investor</th>
                      <th className="text-left text-gray-400 text-sm py-2 px-3">Email</th>
                      <th className="text-right text-gray-400 text-sm py-2 px-3">Investments</th>
                      <th className="text-right text-gray-400 text-sm py-2 px-3">Total Invested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.investments.topInvestors.map((investor, idx) => (
                      <tr key={idx} className="border-b border-gray-700">
                        <td className="text-white py-3 px-3">
                          {investor.first_name || ''} {investor.last_name || ''}
                        </td>
                        <td className="text-gray-300 py-3 px-3">{investor.email}</td>
                        <td className="text-white text-right py-3 px-3">{investor.investment_count}</td>
                        <td className="text-[#FF9900] text-right py-3 px-3 font-semibold">
                          ${parseFloat(investor.total_invested).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Verification Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-[#FF9900]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verification Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#37475A] rounded-lg p-4 border border-[#FF9900]/20">
              <p className="text-gray-400 text-sm">Total Verifications</p>
              <p className="text-3xl font-bold text-[#FF9900] mt-2">{analytics.verifications.total}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-yellow-500/20">
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-400 mt-2">{analytics.verifications.pending}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-green-500/20">
              <p className="text-gray-400 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{analytics.verifications.approved}</p>
            </div>
            <div className="bg-[#37475A] rounded-lg p-4 border border-red-500/20">
              <p className="text-gray-400 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{analytics.verifications.rejected}</p>
            </div>
          </div>
        </div>

        {/* Growth Charts - Last 30 Days */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-[#FF9900]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Growth Trends (Last 30 Days)
          </h2>
          
          {/* User Growth */}
          <div className="bg-[#37475A] rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-white mb-3">User Registration Trend</h3>
            {analytics.growth.users.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="flex items-end space-x-1 h-40">
                  {analytics.growth.users.map((day, idx) => {
                    const maxCount = Math.max(...analytics.growth.users.map(d => parseInt(d.count)));
                    const height = maxCount > 0 ? (parseInt(day.count) / maxCount) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative">
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded">
                          {new Date(day.date).toLocaleDateString()}: {day.count} users
                        </div>
                        <div 
                          className="w-full bg-gradient-to-t from-[#FF9900] to-yellow-500 rounded-t transition-all hover:opacity-80"
                          style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0px' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No data available</p>
            )}
          </div>

          {/* Ideas Growth */}
          <div className="bg-[#37475A] rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-white mb-3">Ideas Submission Trend</h3>
            {analytics.growth.ideas.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="flex items-end space-x-1 h-40">
                  {analytics.growth.ideas.map((day, idx) => {
                    const maxCount = Math.max(...analytics.growth.ideas.map(d => parseInt(d.count)));
                    const height = maxCount > 0 ? (parseInt(day.count) / maxCount) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative">
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded">
                          {new Date(day.date).toLocaleDateString()}: {day.count} ideas
                        </div>
                        <div 
                          className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t transition-all hover:opacity-80"
                          style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0px' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No data available</p>
            )}
          </div>

          {/* Revenue Growth */}
          <div className="bg-[#37475A] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Revenue Trend</h3>
            {analytics.growth.revenue.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="flex items-end space-x-1 h-40">
                  {analytics.growth.revenue.map((day, idx) => {
                    const maxAmount = Math.max(...analytics.growth.revenue.map(d => parseFloat(d.total)));
                    const height = maxAmount > 0 ? (parseFloat(day.total) / maxAmount) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative">
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {new Date(day.date).toLocaleDateString()}: ${parseFloat(day.total).toLocaleString()}
                        </div>
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all hover:opacity-80"
                          style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0px' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
