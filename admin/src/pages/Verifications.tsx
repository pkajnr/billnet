import React, { useEffect, useState } from 'react';
import { ADMIN_API, API_BASE_URL, getAdminHeaders } from '../utils/api';
import { showToast } from '../utils/toast';

interface Verification {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: string;
  country: string;
  idNumber: string;
  documentType: string;
  documentUrl: string;
  certificationType: string;
  note: string;
  submittedAt: string;
  companyRegistrationUrl?: string;
  positionTitle?: string;
  positionProofUrl?: string;
  investorStatus?: string;
  bankStatementUrl?: string;
  sourceOfFunds?: string;
  incomeProofUrl?: string;
}

const Verifications: React.FC = () => {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [reviewerNote, setReviewerNote] = useState('');
  const [certificationType, setCertificationType] = useState('');

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      showToast.error('Admin authentication required');
      return;
    }

    try {
      const response = await fetch(ADMIN_API.VERIFICATIONS, {
        headers: getAdminHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setVerifications(data.verifications);
      } else {
        showToast.error('Failed to fetch verifications');
      }
    } catch (error) {
      showToast.error('Error loading verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (userId: number, decision: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/verification/admin/decision`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          userId,
          decision,
          certificationType: certificationType || 'standard',
          reviewerNote
        })
      });

      if (response.ok) {
        showToast.success(`Verification ${decision}`);
        setSelectedVerification(null);
        setReviewerNote('');
        setCertificationType('');
        fetchVerifications();
      } else {
        showToast.error(`Failed to ${decision} verification`);
      }
    } catch (error) {
      showToast.error(`Error ${decision === 'approved' ? 'approving' : 'rejecting'} verification`);
    }
  };

  const filteredVerifications = verifications.filter(v => 
    statusFilter === 'all' || v.status === statusFilter
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading verifications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Verifications</h1>
          <p className="mt-2 text-gray-600">Review and approve user verification requests</p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pending ({verifications.filter(v => v.status === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Approved ({verifications.filter(v => v.status === 'approved').length})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Rejected ({verifications.filter(v => v.status === 'rejected').length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === 'all'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({verifications.length})
            </button>
          </div>
        </div>

        {/* Verifications List */}
        <div className="space-y-4">
          {filteredVerifications.map((verification) => (
            <div key={verification.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {verification.userName}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      verification.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : verification.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {verification.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{verification.userEmail}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Country</p>
                      <p className="text-sm text-gray-900">{verification.country}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">ID Number</p>
                      <p className="text-sm text-gray-900">{verification.idNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Document Type</p>
                      <p className="text-sm text-gray-900">{verification.documentType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Submitted</p>
                      <p className="text-sm text-gray-900">
                        {new Date(verification.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {verification.note && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">User Note</p>
                      <p className="text-sm text-gray-900">{verification.note}</p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <a
                      href={verification.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Document
                    </a>
                    {verification.companyRegistrationUrl && (
                      <a
                        href={verification.companyRegistrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Company Registration
                      </a>
                    )}
                    {verification.bankStatementUrl && (
                      <a
                        href={verification.bankStatementUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Bank Statement
                      </a>
                    )}
                  </div>
                </div>

                {verification.status === 'pending' && (
                  <div className="ml-6">
                    <button
                      onClick={() => setSelectedVerification(verification)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredVerifications.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              No {statusFilter !== 'all' ? statusFilter : ''} verifications found
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Review Verification Request
            </h2>
            
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                {selectedVerification.userName}
              </h3>
              <p className="text-sm text-gray-600">{selectedVerification.userEmail}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certification Type
              </label>
              <select
                value={certificationType}
                onChange={(e) => setCertificationType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Type</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="verified">Verified</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reviewer Note (optional)
              </label>
              <textarea
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add a note for the user..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedVerification(null);
                  setReviewerNote('');
                  setCertificationType('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecision(selectedVerification.userId, 'rejected')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => handleDecision(selectedVerification.userId, 'approved')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Verifications;
