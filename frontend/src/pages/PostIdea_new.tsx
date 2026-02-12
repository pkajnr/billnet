import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type PostType = 'idea' | 'business' | 'shares';

interface FormData {
  title: string;
  description: string;
  category: string;
  // Idea specific
  fundingGoal?: string;
  marketSize?: string;
  targetAudience?: string;
  revenueProjection?: string;
  breakEven?: string;
  teamSize?: string;
  website?: string;
  // Business specific
  askingPrice?: string;
  yearsActive?: string;
  annualRevenue?: string;
  employeeCount?: string;
  growthRate?: string;
  // Shares specific
  sharePrice?: string;
  equity?: string;
  companyValuation?: string;
  sharesOffered?: string;
}

export default function PostIdea() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PostType>('idea');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'technology',
  });
  const [uploadedFiles, setUploadedFiles] = useState<{
    businessPlan?: { name: string };
    marketAnalysis?: { name: string };
    taxReturns?: { name: string };
    businessLicense?: { name: string };
    financialStatements?: { name: string };
    investorDeck?: { name: string };
    capTableDocs?: { name: string };
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, documentType: 'businessPlan' | 'marketAnalysis' | 'taxReturns' | 'businessLicense' | 'financialStatements' | 'investorDeck' | 'capTableDocs') => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setMessage(`File ${file.name} is too large (max 10MB)`);
      setMessageType('error');
      return;
    }

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    if (!validTypes.includes(file.type)) {
      setMessage(`File type not supported for ${file.name}`);
      setMessageType('error');
      return;
    }

    setUploadedFiles(prev => ({
      ...prev,
      [documentType]: { name: file.name }
    }));
  };

  const removeFile = (documentType: 'businessPlan' | 'marketAnalysis' | 'taxReturns' | 'businessLicense' | 'financialStatements' | 'investorDeck' | 'capTableDocs') => {
    setUploadedFiles(prev => ({
      ...prev,
      [documentType]: undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');

      const payload: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        postType: activeTab,
      };

      // Add type-specific fields
      if (activeTab === 'idea') {
        payload.fundingGoal = parseFloat(formData.fundingGoal || '0');
        payload.marketSize = formData.marketSize;
        payload.targetAudience = formData.targetAudience;
        payload.revenueProjection = parseFloat(formData.revenueProjection || '0');
        payload.breakEven = formData.breakEven;
        payload.teamSize = formData.teamSize;
        payload.website = formData.website;
      } else if (activeTab === 'business') {
        payload.askingPrice = parseFloat(formData.askingPrice || '0');
        payload.yearsActive = formData.yearsActive;
        payload.annualRevenue = parseFloat(formData.annualRevenue || '0');
        payload.employeeCount = formData.employeeCount;
        payload.growthRate = parseFloat(formData.growthRate || '0');
      } else if (activeTab === 'shares') {
        payload.sharePrice = parseFloat(formData.sharePrice || '0');
        payload.equity = parseFloat(formData.equity || '0');
        payload.companyValuation = parseFloat(formData.companyValuation || '0');
        payload.sharesOffered = parseFloat(formData.sharesOffered || '0');
      }

      const response = await fetch('http://localhost:5000/api/ideas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} posted successfully!`);
        setMessageType('success');
        setFormData({
          title: '',
          description: '',
          category: 'technology',
        });
        setUploadedFiles({});
        setTimeout(() => {
          navigate('/my-ideas');
        }, 2000);
      } else if (response.status === 401) {
        navigate('/signin');
      } else {
        const data = await response.json();
        setMessage(data.error || `Failed to post ${activeTab}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage(`An error occurred while posting your ${activeTab}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: PostType; label: string; icon: string }[] = [
    { id: 'idea', label: 'Idea', icon: '⚡' },
    { id: 'business', label: 'Business', icon: '📁' },
    { id: 'shares', label: 'Shares', icon: '✓' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg p-8">
        {/* Close button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === 'idea' && 'Create Idea'}
            {activeTab === 'business' && 'Create Business Listing'}
            {activeTab === 'shares' && 'Create Share Offering'}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 mb-8 pb-4 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${messageType === 'success' ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {activeTab === 'idea' && 'Title *'}
              {activeTab === 'business' && 'Title *'}
              {activeTab === 'shares' && 'Title *'}
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter title"
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition duration-200 font-light"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Enter description"
              rows={4}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition duration-200 font-light resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition duration-200 font-light"
            >
              <option value="technology">Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="finance">Finance</option>
              <option value="real-estate">Real Estate</option>
              <option value="energy">Energy & Sustainability</option>
              <option value="consumer">Consumer Products</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* IDEA POSTING */}
          {activeTab === 'idea' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Funding Goal ($) *</label>
                <input
                  type="number"
                  name="fundingGoal"
                  value={formData.fundingGoal || ''}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1000"
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Investment Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Market Size</label>
                    <input
                      type="text"
                      name="marketSize"
                      value={formData.marketSize || ''}
                      onChange={handleChange}
                      placeholder="e.g., $10B TAM"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Target Audience</label>
                    <input
                      type="text"
                      name="targetAudience"
                      value={formData.targetAudience || ''}
                      onChange={handleChange}
                      placeholder="Who is your target customer?"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Revenue Projection ($)</label>
                    <input
                      type="number"
                      name="revenueProjection"
                      value={formData.revenueProjection || ''}
                      onChange={handleChange}
                      min="0"
                      step="1000"
                      placeholder="0.00"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Break-Even (months)</label>
                    <input
                      type="number"
                      name="breakEven"
                      value={formData.breakEven || ''}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Team Size</label>
                    <input
                      type="number"
                      name="teamSize"
                      value={formData.teamSize || ''}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website || ''}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Supporting Documents</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Business Plan (PDF)</label>
                    {uploadedFiles.businessPlan ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-300">
                        <span className="text-sm text-gray-700">{uploadedFiles.businessPlan.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('businessPlan')}
                          className="text-sm text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="block relative">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, 'businessPlan')}
                          accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        <div className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 cursor-pointer text-sm">
                          Browse... No file selected.
                        </div>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Market Analysis</label>
                    {uploadedFiles.marketAnalysis ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-300">
                        <span className="text-sm text-gray-700">{uploadedFiles.marketAnalysis.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('marketAnalysis')}
                          className="text-sm text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="block relative">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, 'marketAnalysis')}
                          accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        <div className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 cursor-pointer text-sm">
                          Browse... No file selected.
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* BUSINESS POSTING */}
          {activeTab === 'business' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Asking Price ($) *</label>
                <input
                  type="number"
                  name="askingPrice"
                  value={formData.askingPrice || ''}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1000"
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Business Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Years Active</label>
                    <input
                      type="number"
                      name="yearsActive"
                      value={formData.yearsActive || ''}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Annual Revenue ($)</label>
                    <input
                      type="number"
                      name="annualRevenue"
                      value={formData.annualRevenue || ''}
                      onChange={handleChange}
                      min="0"
                      step="1000"
                      placeholder="0.00"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Employee Count</label>
                    <input
                      type="number"
                      name="employeeCount"
                      value={formData.employeeCount || ''}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Growth Rate (%)</label>
                    <input
                      type="number"
                      name="growthRate"
                      value={formData.growthRate || ''}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Supporting Documents</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Tax Returns</label>
                    {uploadedFiles.taxReturns ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-300">
                        <span className="text-sm text-gray-700">{uploadedFiles.taxReturns.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('taxReturns')}
                          className="text-sm text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="block relative">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, 'taxReturns')}
                          accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        <div className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 cursor-pointer text-sm">
                          Browse... No file selected.
                        </div>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Business License</label>
                    {uploadedFiles.businessLicense ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-300">
                        <span className="text-sm text-gray-700">{uploadedFiles.businessLicense.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('businessLicense')}
                          className="text-sm text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="block relative">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, 'businessLicense')}
                          accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        <div className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 cursor-pointer text-sm">
                          Browse... No file selected.
                        </div>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Financial Statements</label>
                    {uploadedFiles.financialStatements ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-300">
                        <span className="text-sm text-gray-700">{uploadedFiles.financialStatements.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('financialStatements')}
                          className="text-sm text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="block relative">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, 'financialStatements')}
                          accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        <div className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 cursor-pointer text-sm">
                          Browse... No file selected.
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SHARES POSTING */}
          {activeTab === 'shares' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Price per Share ($) *</label>
                <input
                  type="number"
                  name="sharePrice"
                  value={formData.sharePrice || ''}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="100.00"
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Share Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Equity Offering (%) *</label>
                    <input
                      type="number"
                      name="equity"
                      value={formData.equity || ''}
                      onChange={handleChange}
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="10.00"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Company Valuation ($)</label>
                    <input
                      type="number"
                      name="companyValuation"
                      value={formData.companyValuation || ''}
                      onChange={handleChange}
                      min="0"
                      step="1000"
                      placeholder="1000000"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Total Shares Offered</label>
                    <input
                      type="number"
                      name="sharesOffered"
                      value={formData.sharesOffered || ''}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      placeholder="10000"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 font-light"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Supporting Documents</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Financial Statements</label>
                    {uploadedFiles.financialStatements ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-300">
                        <span className="text-sm text-gray-700">{uploadedFiles.financialStatements.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('financialStatements')}
                          className="text-sm text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="block relative">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, 'financialStatements')}
                          accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        <div className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 cursor-pointer text-sm">
                          Browse... No file selected.
                        </div>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Investor Deck</label>
                    {uploadedFiles.investorDeck ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-300">
                        <span className="text-sm text-gray-700">{uploadedFiles.investorDeck.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('investorDeck')}
                          className="text-sm text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="block relative">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, 'investorDeck')}
                          accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        <div className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 cursor-pointer text-sm">
                          Browse... No file selected.
                        </div>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Cap Table / Legal Docs</label>
                    {uploadedFiles.capTableDocs ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-300">
                        <span className="text-sm text-gray-700">{uploadedFiles.capTableDocs.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('capTableDocs')}
                          className="text-sm text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="block relative">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, 'capTableDocs')}
                          accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        <div className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 cursor-pointer text-sm">
                          Browse... No file selected.
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-3 rounded-lg text-sm font-semibold transition duration-300"
          >
            {isLoading ? 'POSTING...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
