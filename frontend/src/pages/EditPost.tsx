import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';

interface FileWithType {
  file: File;
  documentType: string;
}

interface ExistingAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  documentType: string;
}

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
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
  const [businessYearsActive] = useState('');
  const [businessRevenue] = useState('');
  const [employeeCount] = useState('');
  const [revenueGrowth] = useState('');
  
  // Share-specific fields
  const [companyValuation] = useState('');
  const [sharesOffered] = useState('');
  
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<FileWithType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPostData();
  }, [id]);

  const fetchPostData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/ideas/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Populate basic fields
        setTitle(data.title);
        setDescription(data.description);
        setCategory(data.category);
        setPostType(data.postType);
        
        // Set funding/price based on type
        if (data.postType === 'share') {
          setPrice(data.fundingGoal?.toString() || '');
          setEquity(data.equityPercentage?.toString() || '');
        } else {
          setFundingGoal(data.fundingGoal?.toString() || '');
        }
        
        // Populate additional details if available
        if (data.details) {
          setMarketSize(data.details.marketSize || '');
          setTargetAudience(data.details.targetAudience || '');
          setRevenueProjection(data.details.revenueProjection?.toString() || '');
          setBreakEvenMonths(data.details.breakEvenMonths?.toString() || '');
          setTeamSize(data.details.teamSize?.toString() || '');
          setWebsite(data.details.website || '');
        }
        
        // Set existing attachments
        if (data.attachments) {
          setExistingAttachments(data.attachments);
        }
        
        setIsLoading(false);
      } else if (response.status === 404) {
        showToast.error('Post not found');
        navigate('/my-ideas');
      } else {
        showToast.error('Failed to load post data');
        navigate('/my-ideas');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      showToast.error('Error loading post');
      navigate('/my-ideas');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
          setError(`File ${file.name} is too large (max 10MB)`);
          return;
        }
        setNewFiles([...newFiles, { file, documentType }]);
      });
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (attachmentId: number) => {
    setExistingAttachments(existingAttachments.filter(a => a.id !== attachmentId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate mandatory documents for business posts
    if (postType === 'business') {
      const requiredDocs = ['businessCertificate', 'registrationNumber', 'financialStatement', 'businessLicense', 'taxReturns'];
      const allDocs = [
        ...existingAttachments.map(a => a.documentType),
        ...newFiles.map(f => f.documentType)
      ];
      const missingDocs = requiredDocs.filter(doc => !allDocs.includes(doc));
      
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
      
      // Keep track of existing attachments to keep
      formData.append('keepAttachments', JSON.stringify(existingAttachments.map(a => a.id)));
      
      // Append new files
      newFiles.forEach((item) => {
        formData.append('files', item.file);
        formData.append(`documentType_${item.file.name}`, item.documentType);
      });

      const response = await fetch(`http://localhost:5000/api/ideas/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        showToast.success('Post updated successfully!', 'Success');
        navigate(`/ideas/${id}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-600 hover:text-slate-900 transition"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Edit Post</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Post Type - Disabled */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Post Type
              </label>
              <select
                value={postType}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
              >
                <option value="idea">💡 Intellectual Property</option>
                <option value="business">📁 Business for Sale</option>
                <option value="share">✓ Shares</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Post type cannot be changed</p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a clear, descriptive title"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed information..."
                rows={6}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition resize-none"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                required
              >
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="education">Education</option>
                <option value="retail">Retail</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="real estate">Real Estate</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Funding/Price */}
            {postType === 'share' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Share Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="100.00"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Equity (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={equity}
                    onChange={(e) => setEquity(e.target.value)}
                    placeholder="10.00"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {postType === 'idea' ? 'Funding Goal ($)' : 'Asking Price ($)'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fundingGoal}
                  onChange={(e) => setFundingGoal(e.target.value)}
                  placeholder="50000.00"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                  required
                />
              </div>
            )}

            {/* Existing Attachments */}
            {existingAttachments.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Existing Documents
                </label>
                <div className="space-y-2">
                  {existingAttachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-700">{attachment.fileName}</span>
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(attachment.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New File Upload */}
            {postType === 'business' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Additional Documents
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Business Certificate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'businessCertificate')}
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Registration Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'registrationNumber')}
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Financial Statement <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.xls,.xlsx"
                      onChange={(e) => handleFileChange(e, 'financialStatement')}
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Business License <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'businessLicense')}
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tax Returns <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.xls,.xlsx"
                      onChange={(e) => handleFileChange(e, 'taxReturns')}
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* New Files List */}
            {newFiles.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Files to Upload
                </label>
                <div className="space-y-2">
                  {newFiles.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-sm text-gray-700">{item.file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeNewFile(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 btn btn-primary"
              >
                {isSubmitting ? 'Updating...' : 'Update Post'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
