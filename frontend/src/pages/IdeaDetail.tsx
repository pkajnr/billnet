import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import BiddingModal from '../components/BiddingModal';
import { showToast } from '../utils/toast';

interface Owner {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Details {
  // Intellectual Property fields
  marketSize?: string;
  targetAudience?: string;
  revenueProjection?: number;
  breakEvenMonths?: number;
  teamSize?: number;
  website?: string;
  customerAcquisitionCost?: number;
  useOfFunds?: string;
  // Business fields
  yearsActive?: number;
  annualRevenue?: number;
  employeeCount?: number;
  growthRate?: number;
  // Share fields
  companyValuation?: number;
  sharesOffered?: number;
}

interface Attachment {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  documentType: string;
  createdAt: string;
}

interface Idea {
  id: number;
  userId: number;
  title: string;
  description: string;
  category: string;
  fundingGoal: number;
  currentFunding: number;
  status: string;
  postType: 'idea' | 'business' | 'shares';
  equityPercentage?: number;
  createdAt: string;
  updatedAt: string;
  owner: Owner;
  details?: Details;
  attachments: Attachment[];
  investorCount: number;
}

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBiddingModal, setShowBiddingModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    // Get current user ID
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);
    }
    fetchIdeaDetails();
  }, [id]);

  const fetchIdeaDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/ideas/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Idea details received:', data);
        console.log('Details object:', data.details);
        console.log('Attachments:', data.attachments);
        setIdea(data);
      } else if (response.status === 401) {
        navigate('/signin');
      } else if (response.status === 404) {
        showToast.error('Idea not found');
        navigate('/explore');
      } else {
        showToast.error('Failed to load idea details');
      }
    } catch (error) {
      console.error('Error fetching idea details:', error);
      showToast.error('Error loading idea details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvest = () => {
    if (!idea) return;
    setShowBiddingModal(true);
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'businessCertificate': return '🏢';
      case 'registrationNumber': return '🔢';
      case 'financialStatement': return '💰';
      case 'businessLicense': return '📜';
      case 'taxReturns': return '💼';
      case 'businessPlan': return '📊';
      case 'marketAnalysis': return '📈';
      case 'investorDeck': return '📑';
      case 'capTableDocs': return '📋';
      default: return '📄';
    }
  };

  const getDocumentLabel = (type: string) => {
    switch (type) {
      case 'businessCertificate': return 'Business Certificate';
      case 'registrationNumber': return 'Registration Number';
      case 'financialStatement': return 'Financial Statement';
      case 'businessLicense': return 'Business License';
      case 'taxReturns': return 'Tax Returns';
      case 'businessPlan': return 'Business Plan';
      case 'marketAnalysis': return 'Market Analysis';
      case 'investorDeck': return 'Investor Deck';
      case 'capTableDocs': return 'Cap Table';
      default: return 'Document';
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

  if (!idea) {
    return (
      <div className="min-h-screen bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900">Idea not found</h2>
          <button
            onClick={() => navigate('/explore')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId === idea.userId;
  const progressPercentage = getProgressPercentage(idea.currentFunding, idea.fundingGoal);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-slate-600 hover:text-slate-900 transition"
        >
          <span className="mr-2">←</span> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      {idea.postType === 'idea' ? '💡 Intellectual Property' : idea.postType === 'business' ? '📁 Business' : '✓ Shares'}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      {idea.category}
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      idea.status === 'active' ? 'bg-green-100 text-green-800' :
                      idea.status === 'funded' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {idea.status.toUpperCase()}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{idea.title}</h1>
                  <div className="flex items-center text-sm text-slate-600">
                    <span>Posted by</span>
                    <Link to={`/profile/${idea.userId}`} className="ml-2 font-semibold text-blue-600 hover:text-blue-800">
                      {idea.owner.firstName} {idea.owner.lastName}
                    </Link>
                    <span className="mx-2">•</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                      {idea.owner.role}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => navigate(`/edit-post/${idea.id}`)}
                    className="btn btn-secondary"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {/* Description */}
              <div className="prose max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap">{idea.description}</p>
              </div>
            </div>

            {/* Additional Details */}
            {idea.details && Object.keys(idea.details).some(key => idea.details && idea.details[key as keyof Details]) && (
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Additional Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Intellectual Property specific fields */}
                  {idea.details.marketSize && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Market Size</p>
                      <p className="text-slate-900">{idea.details.marketSize}</p>
                    </div>
                  )}
                  {idea.details.targetAudience && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Target Audience</p>
                      <p className="text-slate-900">{idea.details.targetAudience}</p>
                    </div>
                  )}
                  {idea.details.revenueProjection && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Revenue Projection</p>
                      <p className="text-slate-900">${idea.details.revenueProjection.toLocaleString()}</p>
                    </div>
                  )}
                  {idea.details.breakEvenMonths && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Break Even</p>
                      <p className="text-slate-900">{idea.details.breakEvenMonths} months</p>
                    </div>
                  )}
                  {idea.details.teamSize && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Team Size</p>
                      <p className="text-slate-900">{idea.details.teamSize} members</p>
                    </div>
                  )}
                  {idea.details.website && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Website</p>
                      <a href={idea.details.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {idea.details.website}
                      </a>
                    </div>
                  )}
                  
                  {/* Business specific fields */}
                  {idea.details.yearsActive && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Years Active</p>
                      <p className="text-slate-900">{idea.details.yearsActive} years</p>
                    </div>
                  )}
                  {idea.details.annualRevenue && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Annual Revenue</p>
                      <p className="text-slate-900">${idea.details.annualRevenue.toLocaleString()}</p>
                    </div>
                  )}
                  {idea.details.employeeCount && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Employee Count</p>
                      <p className="text-slate-900">{idea.details.employeeCount} employees</p>
                    </div>
                  )}
                  {idea.details.growthRate && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Growth Rate</p>
                      <p className="text-slate-900">{idea.details.growthRate}%</p>
                    </div>
                  )}
                  
                  {/* Share specific fields */}
                  {idea.details.companyValuation && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Company Valuation</p>
                      <p className="text-slate-900">${idea.details.companyValuation.toLocaleString()}</p>
                    </div>
                  )}
                  {idea.details.sharesOffered && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Shares Offered</p>
                      <p className="text-slate-900">{idea.details.sharesOffered.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                {idea.details.useOfFunds && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-600 font-medium mb-2">Use of Funds</p>
                    <p className="text-slate-900 whitespace-pre-wrap">{idea.details.useOfFunds}</p>
                  </div>
                )}
              </div>
            )}

            {/* Attachments */}
            {idea.attachments && idea.attachments.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4">📎 Attached Documents</h2>
                <div className="space-y-3">
                  {idea.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={`http://localhost:5000${attachment.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getDocumentIcon(attachment.documentType)}</span>
                        <div>
                          <p className="font-medium text-slate-900">{getDocumentLabel(attachment.documentType)}</p>
                          <p className="text-sm text-slate-600">{attachment.fileName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">{formatFileSize(attachment.fileSize)}</p>
                        <p className="text-xs text-slate-500">View →</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Investment Summary */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Investment Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-slate-600 mb-1">
                    {idea.postType === 'business' ? 'Asking Price' : 
                     idea.postType === 'shares' ? 'Share Price' : 'Funding Goal'}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">${idea.fundingGoal.toLocaleString()}</p>
                </div>

                {idea.postType !== 'business' && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Current Funding</p>
                    <p className="text-xl font-semibold text-emerald-600">${idea.currentFunding.toLocaleString()}</p>
                  </div>
                )}

                {/* Progress Bar - only for non-business posts */}
                {idea.postType !== 'business' && (
                  <div>
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span>Progress</span>
                      <span className="font-semibold">{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {idea.postType !== 'business' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Investors</span>
                    <span className="font-semibold text-slate-900">{idea.investorCount}</span>
                  </div>
                )}

                {idea.equityPercentage && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Equity Offered</span>
                    <span className="font-semibold text-slate-900">{idea.equityPercentage}%</span>
                  </div>
                )}
              </div>

              {!isOwner && idea.status === 'active' && (
                <button
                  onClick={handleInvest}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  💰 Invest Now
                </button>
              )}

              {isOwner && (
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/my-ideas`)}
                    className="w-full bg-slate-100 text-slate-700 py-3 px-4 rounded-lg font-semibold hover:bg-slate-200 transition"
                  >
                    Manage Listing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bidding Modal */}
      {showBiddingModal && idea && (
        <BiddingModal
          idea={idea}
          onClose={() => setShowBiddingModal(false)}
          onSuccess={() => {
            setShowBiddingModal(false);
            fetchIdeaDetails();
          }}
        />
      )}
    </div>
  );
}
