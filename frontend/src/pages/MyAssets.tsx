import { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';

interface Asset {
  id: number;
  assetType: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  purchasePrice: number;
  currentValue: number;
  images: string[];
  acquiredAt: string;
}

interface Listing {
  id: number;
  assetType: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  status: string;
  views: number;
  watchers: number;
  pendingOffers: number;
  createdAt: string;
}

export default function MyAssets() {
  const [activeTab, setActiveTab] = useState<'owned' | 'listings'>('owned');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListing, setNewListing] = useState({
    assetType: 'business',
    title: '',
    description: '',
    category: '',
    price: '',
    quantity: '1',
    images: [] as string[],
    metadata: {}
  });

  useEffect(() => {
    if (activeTab === 'owned') {
      fetchAssets();
    } else {
      fetchListings();
    }
  }, [activeTab]);

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/marketplace/my-assets', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      } else {
        showToast.error('Failed to load assets');
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      showToast.error('Error loading assets');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/marketplace/my-listings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      } else {
        showToast.error('Failed to load listings');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      showToast.error('Error loading listings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newListing.title || !newListing.description || !newListing.price) {
      showToast.error('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/marketplace/listings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newListing,
          price: parseFloat(newListing.price),
          quantity: parseFloat(newListing.quantity)
        }),
      });

      if (response.ok) {
        showToast.success('Listing created successfully!');
        setShowCreateModal(false);
        setNewListing({
          assetType: 'business',
          title: '',
          description: '',
          category: '',
          price: '',
          quantity: '1',
          images: [],
          metadata: {}
        });
        setActiveTab('listings');
        fetchListings();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Failed to create listing');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      showToast.error('Error creating listing');
    }
  };

  const handleCancelListing = async (id: number) => {
    if (!confirm('Cancel this listing?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/marketplace/listings/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        showToast.success('Listing cancelled');
        fetchListings();
      } else {
        showToast.error('Failed to cancel listing');
      }
    } catch (error) {
      console.error('Error cancelling listing:', error);
      showToast.error('Error cancelling listing');
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (!confirm('Delete this listing permanently?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/marketplace/listings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showToast.success('Listing deleted');
        fetchListings();
      } else {
        showToast.error('Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      showToast.error('Error deleting listing');
    }
  };

  const assetTypeIcons: Record<string, string> = {
    business: '🏢',
    idea: '💡',
    shares: '📈',
    equity: '💼',
    project: '🚀',
    other: '📦'
  };

  const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalInvested = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900 mb-2">My Assets</h1>
            <p className="text-slate-600">Manage your owned assets and active listings</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-medium transition"
          >
            + Create Listing
          </button>
        </div>

        {/* Stats */}
        {assets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Total Assets</p>
              <p className="text-3xl font-bold text-slate-900">{assets.length}</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Invested</p>
              <p className="text-3xl font-bold text-gray-900">${totalInvested.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Current Value</p>
              <p className="text-3xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('owned')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'owned'
                ? 'text-black border-b-2 border-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Owned Assets ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'listings'
                ? 'text-black border-b-2 border-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Listings ({listings.length})
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          </div>
        ) : activeTab === 'owned' ? (
          /* Owned Assets */
          assets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => (
                <div key={asset.id} className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{assetTypeIcons[asset.assetType] || '📦'}</span>
                    <span className="text-xs bg-gray-200 text-gray-900 px-2 py-1 rounded capitalize font-semibold">
                      {asset.assetType}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{asset.title}</h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{asset.description}</p>
                  
                  {asset.category && (
                    <p className="text-xs text-slate-500 mb-3">Category: {asset.category}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Purchase Price</p>
                      <p className="font-semibold text-slate-900">${asset.purchasePrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Current Value</p>
                      <p className="font-semibold text-gray-900">${asset.currentValue.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {asset.quantity > 1 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500">Quantity: {asset.quantity}</p>
                    </div>
                  )}
                  
                  <p className="text-xs text-slate-400 mt-3">
                    Acquired {new Date(asset.acquiredAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
              <p className="text-slate-600 mb-4">You don't own any assets yet</p>
              <a href="/marketplace" className="text-black hover:text-gray-800 font-medium">
                Browse Marketplace →
              </a>
            </div>
          )
        ) : (
          /* Active Listings */
          listings.length > 0 ? (
            <div className="space-y-4">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:border-slate-300 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{assetTypeIcons[listing.assetType] || '📦'}</span>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900">{listing.title}</h3>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            listing.status === 'active' ? 'bg-gray-200 text-gray-900' :
                            listing.status === 'sold' ? 'bg-gray-100 text-gray-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {listing.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">{listing.description}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">${listing.price.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Qty: {listing.quantity}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mb-4 text-sm text-slate-600">
                    <span>👁️ {listing.views} views</span>
                    <span>❤️ {listing.watchers} watching</span>
                    {listing.pendingOffers > 0 && (
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-semibold">
                        {listing.pendingOffers} pending offer{listing.pendingOffers !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    {listing.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleCancelListing(listing.id)}
                          className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="bg-gray-300 text-gray-900 hover:bg-gray-400 px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    <p className="text-xs text-slate-400 ml-auto self-center">
                      Listed {new Date(listing.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
              <p className="text-slate-600 mb-4">You don't have any active listings</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first listing →
              </button>
            </div>
          )
        )}

        {/* Create Listing Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Listing</h2>
              
              <form onSubmit={handleCreateListing} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Asset Type *</label>
                  <select
                    value={newListing.assetType}
                    onChange={(e) => setNewListing({ ...newListing, assetType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    required
                  >
                    <option value="business">Business</option>
                    <option value="idea">Idea</option>
                    <option value="shares">Shares</option>
                    <option value="equity">Equity</option>
                    <option value="project">Project</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={newListing.title}
                    onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="E.g., E-commerce Business with 10K Monthly Revenue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
                  <textarea
                    value={newListing.description}
                    onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    rows={4}
                    placeholder="Detailed description of the asset..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <input
                      type="text"
                      value={newListing.category}
                      onChange={(e) => setNewListing({ ...newListing, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="E.g., Technology, Retail"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={newListing.quantity}
                      onChange={(e) => setNewListing({ ...newListing, quantity: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                      min="0.0001"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newListing.price}
                    onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="0.00"
                    min="0.01"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                  >
                    Create Listing
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
