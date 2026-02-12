import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { showToast } from '../utils/toast';

interface Listing {
  id: number;
  sellerId: number;
  sellerName: string;
  sellerRating: number;
  totalSales: number;
  assetType: string;
  title: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  status: string;
  images: string[];
  views: number;
  watchers: number;
  createdAt: string;
}

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    sort: 'created_at',
    order: 'DESC'
  });

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      params.append('sort', filters.sort);
      params.append('order', filters.order);

      const response = await fetch(`http://localhost:5000/api/marketplace/listings?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      } else {
        showToast.error('Failed to load marketplace');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      showToast.error('Error loading marketplace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async (listingId: number) => {
    if (!confirm('Confirm purchase?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/marketplace/buy/${listingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: 1 }),
      });

      if (response.ok) {
        showToast.success('Purchase successful!');
        fetchListings();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Error purchasing:', error);
      showToast.error('Purchase failed');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-slate-900 mb-2">Marketplace</h1>
          <p className="text-slate-600">Buy and sell businesses, ideas, shares, and more</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-8 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 outline-none"
            />

            {/* Asset Type */}
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 outline-none"
            >
              <option value="">All Types</option>
              <option value="business">Business</option>
              <option value="idea">Idea</option>
              <option value="shares">Shares</option>
              <option value="equity">Equity</option>
              <option value="project">Project</option>
              <option value="other">Other</option>
            </select>

            {/* Price Range */}
            <input
              type="number"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 outline-none"
            />

            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 outline-none"
            />

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 outline-none"
            >
              <option value="created_at">Newest</option>
              <option value="price">Price</option>
              <option value="views">Most Viewed</option>
              <option value="title">Name</option>
            </select>

            <select
              value={filters.order}
              onChange={(e) => setFilters({ ...filters, order: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 outline-none"
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition duration-300 overflow-hidden">
                {/* Image */}
                <div className="h-48 bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">{assetTypeIcons[listing.assetType] || '📦'}</span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Type Badge */}
                  <span className="inline-block px-2 py-1 bg-gray-200 text-gray-900 text-xs font-semibold rounded mb-3 capitalize">
                    {listing.assetType}
                  </span>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                    {listing.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {listing.description}
                  </p>

                  {/* Seller Info */}
                  <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                    <span>{listing.sellerName}</span>
                    {listing.sellerRating > 0 && (
                      <>
                        <span>•</span>
                        <span>⭐ {listing.sellerRating.toFixed(1)}</span>
                      </>
                    )}
                    {listing.totalSales > 0 && (
                      <>
                        <span>•</span>
                        <span>{listing.totalSales} sales</span>
                      </>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
                    <span>👁️ {listing.views}</span>
                    <span>❤️ {listing.watchers}</span>
                    {listing.quantity > 1 && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded">Qty: {listing.quantity}</span>
                    )}
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Price</p>
                      <p className="text-2xl font-bold text-gray-900">${listing.price.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => handleBuy(listing.id)}
                      className="bg-black text-white hover:bg-gray-800 px-6 py-2.5 text-sm font-medium rounded-lg transition"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border border-slate-200 p-8">
            <p className="text-slate-600 mb-4">No listings found</p>
            <Link to="/my-assets" className="text-black hover:text-gray-800 font-medium">
              List your first asset →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
