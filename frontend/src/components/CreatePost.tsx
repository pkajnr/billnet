import { useState, useEffect } from 'react';

interface CreatePostProps {
  userRole: string;
  onPostCreated: () => void;
  openModal?: boolean;
  hideCard?: boolean;
}

interface FileWithType {
  file: File;
  documentType: string;
}

export default function CreatePost({ onPostCreated, openModal = false, hideCard = false }: Omit<CreatePostProps, 'userRole'>) {
  const [showModal, setShowModal] = useState(openModal);
  const [postType, setPostType] = useState<'idea' | 'business' | 'share'>('idea');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('technology');
  const [fundingGoal, setFundingGoal] = useState('');
  const [price, setPrice] = useState('');
  const [equity, setEquity] = useState('');
  
  // Idea-specific fields
  const [marketSize, setMarketSize] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [revenueProjection, setRevenueProjection] = useState('');
  const [breakEvenMonths, setBreakEvenMonths] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [website, setWebsite] = useState('');
  
  // Business-specific fields
  const [businessYearsActive, setBusinessYearsActive] = useState('');
  const [businessRevenue, setBusinessRevenue] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [revenueGrowth, setRevenueGrowth] = useState('');
  
  // Share-specific fields
  const [companyValuation, setCompanyValuation] = useState('');
  const [sharesOffered, setSharesOffered] = useState('');
  
  const [files, setFiles] = useState<FileWithType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const userStr = localStorage.getItem('user') || '{}';
  const user = JSON.parse(userStr);
  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  useEffect(() => {
    setShowModal(openModal);
  }, [openModal]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
          setError(`File ${file.name} is too large (max 10MB)`);
          return;
        }
        setFiles([...files, { file, documentType }]);
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate mandatory documents for business posts
    if (postType === 'business') {
      const requiredDocs = ['businessCertificate', 'registrationNumber', 'financialStatement', 'businessLicense', 'taxReturns'];
      const uploadedDocs = files.map(f => f.documentType);
      const missingDocs = requiredDocs.filter(doc => !uploadedDocs.includes(doc));
      
      if (missingDocs.length > 0) {
        const missingDocNames = missingDocs.map(doc => {
          switch(doc) {
            case 'businessCertificate': return 'Business Certificate';
            case 'registrationNumber': return 'Registration Number';
            case 'financialStatement': return 'Financial Statement';
            case 'businessLicense': return 'Business License';
            case 'taxReturns': return 'Tax Returns';
            default: return doc;
          }
        }).join(', ');
        setError(`Missing required documents for business: ${missingDocNames}`);
        return;
      }
    }
    
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('postType', postType);
      
      if (postType === 'share') {
        formData.append('sharePrice', parseFloat(price).toString());
        formData.append('equity', parseFloat(equity).toString());
        if (companyValuation) formData.append('companyValuation', companyValuation);
        if (sharesOffered) formData.append('sharesOffered', sharesOffered);
      } else if (postType === 'business') {
        formData.append('askingPrice', parseFloat(fundingGoal).toString());
        if (businessYearsActive) formData.append('yearsActive', businessYearsActive);
        if (businessRevenue) formData.append('annualRevenue', businessRevenue);
        if (employeeCount) formData.append('employeeCount', employeeCount);
        if (revenueGrowth) formData.append('growthRate', revenueGrowth);
      } else if (postType === 'idea') {
        formData.append('fundingGoal', parseFloat(fundingGoal).toString());
        if (marketSize) formData.append('marketSize', marketSize);
        if (targetAudience) formData.append('targetAudience', targetAudience);
        if (revenueProjection) formData.append('revenueProjection', revenueProjection);
        if (breakEvenMonths) formData.append('breakEven', breakEvenMonths);
        if (teamSize) formData.append('teamSize', teamSize);
        if (website) formData.append('website', website);
      }
      
      // Append files
      files.forEach((item) => {
        formData.append('files', item.file);
        formData.append(`documentType_${item.file.name}`, item.documentType);
      });

      const response = await fetch('http://localhost:5000/api/ideas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        onPostCreated();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('technology');
    setFundingGoal('');
    setPrice('');
    setEquity('');
    setMarketSize('');
    setTargetAudience('');
    setRevenueProjection('');
    setBreakEvenMonths('');
    setTeamSize('');
    setWebsite('');
    setBusinessYearsActive('');
    setBusinessRevenue('');
    setEmployeeCount('');
    setRevenueGrowth('');
    setCompanyValuation('');
    setSharesOffered('');
    setFiles([]);
    setPostType('idea');
    setError('');
  };

  return (
    <>
      {/* Create Post Card */}
      {!hideCard && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-roboto font-bold">
            {userInitials}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 text-left font-inter px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition"
          >
            What's on your mind, {user.firstName}?
          </button>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => { setPostType('idea'); setShowModal(true); }}
            className="flex-1 flex items-center justify-center gap-2 font-inter text-sm font-semibold text-gray-700 py-2 hover:bg-gray-100 rounded-lg transition"
          >
            <span className="text-xl">💡</span>
            Idea
          </button>
          <button
            onClick={() => { setPostType('business'); setShowModal(true); }}
            className="flex-1 flex items-center justify-center gap-2 font-inter text-sm font-semibold text-gray-700 py-2 hover:bg-gray-100 rounded-lg transition"
          >
            <span className="text-xl">🏢</span>
            Business
          </button>
          <button
            onClick={() => { setPostType('share'); setShowModal(true); }}
            className="flex-1 flex items-center justify-center gap-2 font-inter text-sm font-semibold text-gray-700 py-2 hover:bg-gray-100 rounded-lg transition"
          >
            <span className="text-xl">📈</span>
            Shares
          </button>
        </div>
      </div>
      )}

      {/* Create Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-roboto text-xl font-bold text-gray-900">
                  Create {postType === 'idea' ? 'Idea' : postType === 'business' ? 'Business' : 'Share Offering'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {/* Post Type Selector */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setPostType('idea')}
                  className={`flex-1 font-inter text-sm font-semibold py-2 rounded-lg transition ${
                    postType === 'idea' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  💡 Intellectual Property
                </button>
                <button
                  onClick={() => setPostType('business')}
                  className={`flex-1 font-inter text-sm font-semibold py-2 rounded-lg transition ${
                    postType === 'business' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  🏢 Business
                </button>
                <button
                  onClick={() => setPostType('share')}
                  className={`flex-1 font-inter text-sm font-semibold py-2 rounded-lg transition ${
                    postType === 'share' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  📈 Shares
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm font-inter">
                  {error}
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-inter text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      postType === 'idea' ? 'What\'s your idea?' :
                      postType === 'business' ? 'Business name' :
                      'Share offering title'
                    }
                    className="w-full font-inter px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block font-inter text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      postType === 'idea' ? 'Describe your idea...' :
                      postType === 'business' ? 'What does your business do?' :
                      'Share offering details...'
                    }
                    rows={4}
                    className="w-full font-inter px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-inter text-sm font-semibold text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full font-inter px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                    >
                      <option value="technology">Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="finance">Finance</option>
                      <option value="education">Education</option>
                      <option value="retail">Retail</option>
                      <option value="real-estate">Real Estate</option>
                      <option value="food">Food & Beverage</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {postType === 'share' ? (
                    <div>
                      <label className="block font-inter text-sm font-semibold text-gray-700 mb-2">
                        Price per Share ($) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="100.00"
                        className="w-full font-inter px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-inter text-sm font-semibold text-gray-700 mb-2">
                        {postType === 'idea' ? 'Funding Goal ($)' : 'Asking Price ($)'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={fundingGoal}
                        onChange={(e) => setFundingGoal(e.target.value)}
                        placeholder="50000.00"
                        className="w-full font-inter px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Type-Specific Fields */}
              {postType === 'idea' && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-roboto text-sm font-bold text-gray-900 mb-3">Investment Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                        Market Size
                      </label>
                      <input
                        type="text"
                        value={marketSize}
                        onChange={(e) => setMarketSize(e.target.value)}
                        placeholder="e.g., $1B"
                        className="w-full font-inter px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                        Target Audience
                      </label>
                      <input
                        type="text"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="e.g., 18-35 tech users"
                        className="w-full font-inter px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                        Revenue Projection ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={revenueProjection}
                        onChange={(e) => setRevenueProjection(e.target.value)}
                        placeholder="500000"
                        className="w-full font-inter px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                        Break-Even (months)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={breakEvenMonths}
                        onChange={(e) => setBreakEvenMonths(e.target.value)}
                        placeholder="12"
                        className="w-full font-inter px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                        Team Size
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={teamSize}
                        onChange={(e) => setTeamSize(e.target.value)}
                        placeholder="5"
                        className="w-full font-inter px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full font-inter px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {postType === 'business' && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-roboto text-sm font-bold text-gray-900 mb-3">Business Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                        Years Active
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={businessYearsActive}
                        onChange={(e) => setBusinessYearsActive(e.target.value)}
                        placeholder="5"
                        className="w-full font-inter px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                        Annual Revenue ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={businessRevenue}
                        onChange={(e) => setBusinessRevenue(e.target.value)}
                        placeholder="500000"
                        className="w-full font-inter px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                        Employee Count
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value)}
                        placeholder="10"
                        className="w-full font-inter px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                        Growth Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={revenueGrowth}
                        onChange={(e) => setRevenueGrowth(e.target.value)}
                        placeholder="25"
                        className="w-full font-inter px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {postType === 'share' && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-roboto text-sm font-bold text-gray-900 mb-3">Share Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                        Equity Offering (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={equity}
                        onChange={(e) => setEquity(e.target.value)}
                        placeholder="10.00"
                        className="w-full font-inter px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                        Company Valuation ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={companyValuation}
                        onChange={(e) => setCompanyValuation(e.target.value)}
                        placeholder="1000000"
                        className="w-full font-inter px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                        Total Shares Offered
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={sharesOffered}
                        onChange={(e) => setSharesOffered(e.target.value)}
                        placeholder="10000"
                        className="w-full font-inter px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload Section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-roboto text-sm font-bold text-gray-900 mb-3">Supporting Documents</h3>
                <div className="space-y-3">
                  {postType === 'idea' && (
                    <>
                      <div>
                        <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                          Business Plan (PDF)
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileChange(e, 'business_plan')}
                          className="w-full font-inter text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                          Market Analysis
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.xls,.xlsx,.doc,.docx"
                          onChange={(e) => handleFileChange(e, 'market_analysis')}
                          className="w-full font-inter text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                        />
                      </div>
                    </>
                  )}
                  {postType === 'business' && (
                    <>
                      <div>
                        <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                          Business Certificate <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'businessCertificate')}
                          className="w-full font-inter text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                          Registration Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'registrationNumber')}
                          className="w-full font-inter text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                          Financial Statement <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.xls,.xlsx"
                          onChange={(e) => handleFileChange(e, 'financialStatement')}
                          className="w-full font-inter text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                          Business License <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'businessLicense')}
                          className="w-full font-inter text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                          Tax Returns <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.xls,.xlsx"
                          onChange={(e) => handleFileChange(e, 'taxReturns')}
                          className="w-full font-inter text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                          required
                        />
                      </div>
                    </>
                  )}
                  {postType === 'share' && (
                    <>
                      <div>
                        <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                          Financial Statements
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.xls,.xlsx"
                          onChange={(e) => handleFileChange(e, 'financials')}
                          className="w-full font-inter text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                          Investor Deck
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.pptx"
                          onChange={(e) => handleFileChange(e, 'pitch_deck')}
                          className="w-full font-inter text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block font-inter text-xs font-semibold text-gray-700 mb-1">
                          Cap Table / Legal Docs
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.xls,.xlsx"
                          onChange={(e) => handleFileChange(e, 'legal_docs')}
                          className="w-full font-inter text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Uploaded Files List */}
                {files.length > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-3">
                    <p className="font-inter text-xs font-semibold text-gray-700 mb-2">Uploaded Files ({files.length})</p>
                    <div className="space-y-2">
                      {files.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                          <div className="flex-1 min-w-0">
                            <p className="font-inter text-xs text-gray-900 truncate">{item.file.name}</p>
                            <p className="font-inter text-xs text-gray-500">{(item.file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="ml-2 text-red-600 hover:text-red-700 font-inter text-xs font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-inter font-semibold py-3 rounded-lg transition"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
