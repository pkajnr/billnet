import React, { useEffect, useState } from 'react';
import { ADMIN_API, getAdminHeaders } from '../utils/api';
import { showToast } from '../utils/toast';

interface Idea {
  id: number;
  title: string;
  description: string;
  category: string;
  fundingGoal: number;
  currentFunding: number;
  status: string;
  postType: string;
  equityPercentage: number | null;
  createdAt: string;
  userId: number;
  userName: string;
  userEmail: string;
}

const Ideas: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      showToast.error('Admin authentication required');
      return;
    }

    try {
      const response = await fetch(ADMIN_API.IDEAS, {
        headers: getAdminHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setIdeas(data.ideas);
      } else {
        showToast.error('Failed to fetch ideas');
      }
    } catch (error) {
      showToast.error('Error loading ideas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIdea = async (ideaId: number) => {
    if (!confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${ADMIN_API.IDEAS}/${ideaId}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });

      if (response.ok) {
        showToast.success('Idea deleted successfully');
        fetchIdeas();
      } else {
        showToast.error('Failed to delete idea');
      }
    } catch (error) {
      showToast.error('Error deleting idea');
    }
  };

  const handleUpdateStatus = async (ideaId: number, newStatus: string) => {
    try {
      const response = await fetch(`${ADMIN_API.IDEAS}/${ideaId}/status`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        showToast.success('Status updated successfully');
        fetchIdeas();
      } else {
        showToast.error('Failed to update status');
      }
    } catch (error) {
      showToast.error('Error updating status');
    }
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = 
      idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter;
    const matchesType = typeFilter === 'all' || idea.postType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading ideas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ideas Management</h1>
          <p className="mt-2 text-gray-600">Manage all posted ideas and investments</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Ideas
              </label>
              <input
                type="text"
                placeholder="Search by title or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="funded">Funded</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="idea">Ideas</option>
                <option value="business">Businesses</option>
                <option value="shares">Shares</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ideas List */}
        <div className="space-y-4">
          {filteredIdeas.map((idea) => (
            <div key={idea.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{idea.title}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      idea.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : idea.status === 'funded'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {idea.status}
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      {idea.postType}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{idea.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Category</p>
                      <p className="text-sm text-gray-900">{idea.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Funding Goal</p>
                      <p className="text-sm text-gray-900">${idea.fundingGoal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Current Funding</p>
                      <p className="text-sm text-gray-900">${idea.currentFunding.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Posted By</p>
                      <p className="text-sm text-gray-900">{idea.userName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Posted: {new Date(idea.createdAt).toLocaleDateString()}</span>
                    {idea.equityPercentage && (
                      <span>Equity: {idea.equityPercentage}%</span>
                    )}
                    <span>Progress: {((idea.currentFunding / idea.fundingGoal) * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  <select
                    value={idea.status}
                    onChange={(e) => handleUpdateStatus(idea.id, e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="funded">Funded</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    onClick={() => handleDeleteIdea(idea.id)}
                    className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredIdeas.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              No ideas found
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Ideas</p>
              <p className="text-2xl font-bold text-gray-900">{ideas.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {ideas.filter(i => i.status === 'active').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Funded</p>
              <p className="text-2xl font-bold text-blue-600">
                {ideas.filter(i => i.status === 'funded').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Raised</p>
              <p className="text-2xl font-bold text-purple-600">
                ${ideas.reduce((sum, i) => sum + i.currentFunding, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ideas;
