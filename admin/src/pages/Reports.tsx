import { useState, useEffect } from 'react';
import { ADMIN_API, getAdminHeaders } from '../utils/api';
import { showToast } from '../utils/toast';

interface ReportStats {
  totalUsers: number;
  totalIdeas: number;
  totalInvestments: number;
  totalRevenue: number;
  activeUsers: number;
  pendingVerifications: number;
  monthlyGrowth: number;
}

interface ActivityData {
  date: string;
  users: number;
  ideas: number;
  investments: number;
}

export default function Reports() {
  const [stats, setStats] = useState<ReportStats>({
    totalUsers: 0,
    totalIdeas: 0,
    totalInvestments: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingVerifications: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [activityData] = useState<ActivityData[]>([
    { date: '2024-01-01', users: 45, ideas: 12, investments: 8 },
    { date: '2024-01-02', users: 52, ideas: 15, investments: 10 },
    { date: '2024-01-03', users: 48, ideas: 18, investments: 12 },
    { date: '2024-01-04', users: 61, ideas: 20, investments: 15 },
    { date: '2024-01-05', users: 58, ideas: 22, investments: 18 },
    { date: '2024-01-06', users: 67, ideas: 25, investments: 20 },
    { date: '2024-01-07', users: 73, ideas: 28, investments: 22 },
  ]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(ADMIN_API.STATS, {
        headers: getAdminHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.totalUsers || 0,
          totalIdeas: data.totalIdeas || 0,
          totalInvestments: data.totalInvestments || 0,
          totalRevenue: data.totalRevenue || 0,
          activeUsers: data.activeUsers || 0,
          pendingVerifications: data.pendingVerifications || 0,
          monthlyGrowth: 12.5
        });
      }
    } catch (error) {
      showToast.error('Error loading stats');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: string) => {
    showToast.success(`Exporting report as ${format.toUpperCase()}...`);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const maxValue = Math.max(...activityData.map(d => Math.max(d.users, d.ideas, d.investments)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-600">Platform performance and insights</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportReport('csv')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Export CSV
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <p className="text-blue-100 text-sm mb-2">Total Users</p>
          <p className="text-3xl font-bold mb-2">{stats.totalUsers}</p>
          <p className="text-blue-100 text-sm">↑ {stats.monthlyGrowth}% this month</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <p className="text-green-100 text-sm mb-2">Total Ideas</p>
          <p className="text-3xl font-bold mb-2">{stats.totalIdeas}</p>
          <p className="text-green-100 text-sm">Active projects</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <p className="text-purple-100 text-sm mb-2">Active Users</p>
          <p className="text-3xl font-bold mb-2">{stats.activeUsers}</p>
          <p className="text-purple-100 text-sm">Last 30 days</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm p-6 text-white">
          <p className="text-orange-100 text-sm mb-2">Pending Verifications</p>
          <p className="text-3xl font-bold mb-2">{stats.pendingVerifications}</p>
          <p className="text-orange-100 text-sm">Requires attention</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Period:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Platform Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600">Ideas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-gray-600">Investments</span>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="grid grid-cols-7 gap-2 h-64">
            {activityData.map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="flex-1 w-full flex items-end justify-center gap-1">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${(day.users / maxValue) * 100}%` }}
                    title={`Users: ${day.users}`}
                  ></div>
                  <div
                    className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                    style={{ height: `${(day.ideas / maxValue) * 100}%` }}
                    title={`Ideas: ${day.ideas}`}
                  ></div>
                  <div
                    className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                    style={{ height: `${(day.investments / maxValue) * 100}%` }}
                    title={`Investments: ${day.investments}`}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">User Statistics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">Total Registered</span>
              <span className="font-semibold text-gray-800">{stats.totalUsers}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">Active Users</span>
              <span className="font-semibold text-gray-800">{stats.activeUsers}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">Entrepreneurs</span>
              <span className="font-semibold text-gray-800">{Math.floor(stats.totalUsers * 0.6)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Investors</span>
              <span className="font-semibold text-gray-800">{Math.floor(stats.totalUsers * 0.4)}</span>
            </div>
          </div>
        </div>

        {/* Idea Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Idea Statistics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">Total Ideas</span>
              <span className="font-semibold text-gray-800">{stats.totalIdeas}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">Active Ideas</span>
              <span className="font-semibold text-gray-800">{Math.floor(stats.totalIdeas * 0.7)}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">Funded Ideas</span>
              <span className="font-semibold text-gray-800">{Math.floor(stats.totalIdeas * 0.3)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-semibold text-green-600">78%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Report */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-800">${stats.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">↑ 15.3% vs last period</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Platform Fees</p>
            <p className="text-2xl font-bold text-gray-800">${(stats.totalRevenue * 0.05).toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">5% commission rate</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg. Transaction</p>
            <p className="text-2xl font-bold text-gray-800">
              ${stats.totalInvestments > 0 ? (stats.totalRevenue / stats.totalInvestments).toFixed(0) : '0'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Per investment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
