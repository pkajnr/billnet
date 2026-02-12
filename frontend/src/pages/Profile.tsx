import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SkeletonProfile } from '../components/SkeletonLoader';
import { showToast } from '../utils/toast';

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  bio?: string;
  profileImage?: string;
  isEmailVerified: boolean;
  emailVerifiedAt: string | null;
  isCertified?: boolean;
  certificationType?: string | null;
  certificationDate?: string | null;
  createdAt: string;
}

type VerificationState = 'pending' | 'approved' | 'rejected' | 'not_submitted';

interface VerificationStatus {
  status: VerificationState;
  isCertified: boolean;
  certificationType?: string | null;
  certificationDate?: string | null;
  details?: {
    country?: string | null;
    idNumber?: string | null;
    documentType?: string | null;
    documentUrl?: string | null;
    certificationType?: string | null;
    note?: string | null;
    reviewerNote?: string | null;
    reviewedAt?: string | null;
    submittedAt?: string | null;
    companyRegistrationUrl?: string | null;
    positionTitle?: string | null;
    positionProofUrl?: string | null;
    extraDocuments?: any;
    investorStatus?: string | null;
    bankStatementUrl?: string | null;
    sourceOfFunds?: string | null;
    incomeProofUrl?: string | null;
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    profileImage: '',
  });
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    country: '',
    idNumber: '',
    documentType: 'passport',
    documentUrl: '',
    certificationType: 'standard',
    note: '',
    companyRegistrationUrl: '',
    positionTitle: '',
    positionProofUrl: '',
    extraDocuments: '',
    investorStatus: '',
    bankStatementUrl: '',
    sourceOfFunds: '',
    incomeProofUrl: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchWallet();
    fetchVerificationStatus();
  }, []);

  useEffect(() => {
    const details = verificationStatus?.details;
    if (!details) return;

    setVerificationForm((prev) => ({
      ...prev,
      country: details.country ?? prev.country,
      idNumber: details.idNumber ?? prev.idNumber,
      documentType: details.documentType ?? prev.documentType,
      documentUrl: details.documentUrl ?? prev.documentUrl,
      certificationType: details.certificationType ?? prev.certificationType,
      companyRegistrationUrl: details.companyRegistrationUrl ?? prev.companyRegistrationUrl,
      positionTitle: details.positionTitle ?? prev.positionTitle,
      positionProofUrl: details.positionProofUrl ?? prev.positionProofUrl,
      extraDocuments: details.extraDocuments ?? prev.extraDocuments,
      investorStatus: details.investorStatus ?? prev.investorStatus,
      bankStatementUrl: details.bankStatementUrl ?? prev.bankStatementUrl,
      sourceOfFunds: details.sourceOfFunds ?? prev.sourceOfFunds,
      incomeProofUrl: details.incomeProofUrl ?? prev.incomeProofUrl,
      note: details.note ?? prev.note,
    }));
  }, [verificationStatus]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const normalized: UserProfile = {
          ...data,
          isCertified: (data as any).isCertified ?? (data as any).is_certified ?? false,
          certificationType: (data as any).certificationType ?? (data as any).certification_type ?? null,
          certificationDate: (data as any).certificationDate ?? (data as any).certification_date ?? null,
        };

        setProfile(normalized);
        setEditData({
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          bio: normalized.bio || '',
          profileImage: normalized.profileImage || '',
        });
      } else if (response.status === 401) {
        navigate('/signin');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage('Failed to load profile');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/verification/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus({
          status: (data.status || 'not_submitted') as VerificationState,
          isCertified: !!data.isCertified,
          certificationType: data.certificationType,
          certificationDate: data.certificationDate,
          details: data.details || {},
        });
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.walletBalance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        // Update localStorage to reflect name changes
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          localStorage.setItem('user', JSON.stringify({ ...user, firstName: data.firstName, lastName: data.lastName }));
        }
        showToast.success('Your profile has been updated successfully', 'Profile Updated');
        setMessage('');
        setIsEditing(false);
      } else {
        const errorMsg = 'Failed to update profile';
        setMessage(errorMsg);
        setMessageType('error');
        showToast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('An error occurred');
      setMessageType('error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        showToast.success('Your password has been changed successfully', 'Password Changed');
        setMessage('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to change password');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage('An error occurred');
      setMessageType('error');
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationForm.country || !verificationForm.idNumber || !verificationForm.documentType || !verificationForm.documentUrl) {
      showToast.error('Please complete all required fields');
      return;
    }

    const payload = {
      ...verificationForm,
      extraDocuments: verificationForm.extraDocuments
        ? verificationForm.extraDocuments.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
    };

    setIsSubmittingVerification(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/verification/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showToast.success('Verification submitted', 'We will notify you once reviewed');
        await fetchVerificationStatus();
      } else {
        const data = await response.json();
        showToast.error(data.error || 'Unable to submit verification');
      }
    } catch (error) {
      console.error('Verification submit error:', error);
      showToast.error('Unable to submit verification');
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <SkeletonProfile />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 py-12 px-6 flex items-center justify-center">
        <p className="font-inter text-gray-600">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-full bg-linear-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl uppercase">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt="Profile" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              (profile.firstName?.[0] || 'U') + (profile.lastName?.[0] || '')
            )}
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Welcome back, {profile.firstName}</h1>
            <p className="text-gray-600 text-sm">Manage your account, wallet, and verification in one view.</p>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${messageType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px] gap-6 items-start">
          {/* Left rail */}
          <aside className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="h-20 w-20 rounded-full bg-linear-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold uppercase">
                  {profile.profileImage ? (
                    <img src={profile.profileImage} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
                  ) : (
                    (profile.firstName?.[0] || 'U') + (profile.lastName?.[0] || '')
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{profile.firstName} {profile.lastName}</p>
                  <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="flex justify-between"><span>Email</span><span className="text-gray-900">{profile.email}</span></div>
                <div className="flex justify-between"><span>Member since</span><span className="text-gray-900">{new Date(profile.createdAt).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>Status</span><span className="text-gray-900">{profile.isEmailVerified ? 'Email verified' : 'Email pending'}</span></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.isCertified && (
                  <span className="verification-pill text-xs">✅ <span>{profile.role === 'investor' ? 'Certified Investor' : 'Certified Entrepreneur'}</span></span>
                )}
                {!profile.isCertified && (
                  <span className="verification-pill verification-pill-muted text-xs">Pending certification</span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
              <p className="text-sm font-semibold text-gray-900">Shortcuts</p>
              <div className="space-y-2 text-sm text-blue-600">
                <button onClick={() => document.getElementById('wallet')?.scrollIntoView({ behavior: 'smooth' })} className="block w-full text-left hover:text-blue-700">💼 Wallet</button>
                <button onClick={() => document.getElementById('account')?.scrollIntoView({ behavior: 'smooth' })} className="block w-full text-left hover:text-blue-700">👤 Account</button>
                <button onClick={() => document.getElementById('verification')?.scrollIntoView({ behavior: 'smooth' })} className="block w-full text-left hover:text-blue-700">✅ Verification</button>
                <button onClick={() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' })} className="block w-full text-left hover:text-blue-700">🔒 Security</button>
              </div>
            </div>
          </aside>

          {/* Center feed */}
          <main className="space-y-6">
            {profile.role === 'investor' && (
              <section id="wallet" className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Investment Wallet</h2>
                    <p className="text-sm text-gray-600">Balances and bidding eligibility</p>
                  </div>
                  <Link
                    to="/add-funds"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Add Funds
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-linear-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">Current Balance</p>
                    <p className="text-3xl font-bold text-blue-700">${walletBalance.toFixed(2)}</p>
                    <p className="text-xs text-blue-800 mt-1">USD</p>
                  </div>
                  <div className="bg-linear-to-br from-amber-50 to-amber-100/50 p-4 rounded-xl border border-amber-200">
                    <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1">Minimum to Bid</p>
                    <p className="text-3xl font-bold text-amber-700">$10,000</p>
                    <p className={`text-xs mt-1 ${walletBalance >= 10000 ? 'text-green-700' : 'text-red-700'}`}>
                      {walletBalance >= 10000 ? 'Eligible to bid' : 'Add funds to bid'}
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section id="account" className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition"
                  >
                    Edit
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">First Name</p>
                    <p className="text-gray-900">{profile.firstName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Last Name</p>
                    <p className="text-gray-900">{profile.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                    <p className="text-gray-900 break-all">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Account Type</p>
                    <div className="flex items-center gap-2 flex-wrap text-gray-900 capitalize">
                      <span>{profile.role}</span>
                      {profile.isCertified && (
                        <span className="verification-pill text-xs">✅ <span>Certified</span></span>
                      )}
                    </div>
                  </div>
                  {profile.bio && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Bio</p>
                      <p className="text-gray-900 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}
                  {profile.profileImage && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Profile Image</p>
                      <img src={profile.profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover border border-gray-200" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email Verification</p>
                    <div className="flex items-center gap-2">
                      {profile.isEmailVerified ? (
                        <>
                          <span className="h-2 w-2 bg-green-600 rounded-full"></span>
                          <p className="text-gray-900">Verified on {new Date(profile.emailVerifiedAt!).toLocaleDateString()}</p>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 bg-orange-500 rounded-full"></span>
                          <p className="text-gray-900">Pending verification</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Profile Verification</p>
                    {profile.isCertified ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="verification-pill">✅ <span>{profile.role === 'investor' ? 'Certified Investor' : 'Certified Entrepreneur'}</span></span>
                        {profile.certificationDate && (
                          <p className="text-xs text-gray-600">Certified on {new Date(profile.certificationDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    ) : (
                      <span className="verification-pill verification-pill-muted">Pending certification</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Member Since</p>
                    <p className="text-gray-900">{new Date(profile.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={editData.firstName}
                        onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-600 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={editData.lastName}
                        onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-600 focus:outline-none transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Bio</label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      rows={3}
                      placeholder="Tell others about yourself, your experience, and interests..."
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-600 focus:outline-none transition resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Profile Image URL</label>
                    <input
                      type="url"
                      value={editData.profileImage}
                      onChange={(e) => setEditData({ ...editData, profileImage: e.target.value })}
                      placeholder="https://example.com/your-photo.jpg"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-600 focus:outline-none transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter a URL to your profile image</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 font-semibold text-sm transition rounded-lg"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 font-semibold text-sm transition rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section id="verification" className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Account Verification</p>
                  <h2 className="text-xl font-semibold text-gray-900">Get verified</h2>
                  <p className="text-sm text-gray-600">Submit your documents to finalize certification.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`verification-pill ${verificationStatus?.status === 'approved' ? '' : verificationStatus?.status === 'pending' ? '' : 'verification-pill-muted'}`}>
                    {verificationStatus?.status === 'approved' && '✅'}
                    {verificationStatus?.status === 'pending' && '⏳'}
                    {verificationStatus?.status === 'rejected' && '⚠'}
                    {(!verificationStatus || verificationStatus.status === 'not_submitted') && 'ℹ'}
                    <span>
                      {verificationStatus?.status === 'approved' && 'Approved'}
                      {verificationStatus?.status === 'pending' && 'Pending review'}
                      {verificationStatus?.status === 'rejected' && 'Rejected'}
                      {(!verificationStatus || verificationStatus.status === 'not_submitted') && 'Not submitted'}
                    </span>
                  </span>
                </div>
              </div>

              {verificationStatus?.details?.reviewerNote && (
                <div className="mb-4 border border-amber-200 bg-amber-50 text-amber-800 rounded-lg p-4">
                  <p className="text-sm font-semibold">Reviewer note</p>
                  <p className="text-sm mt-1">{verificationStatus.details.reviewerNote}</p>
                </div>
              )}

              <form onSubmit={handleSubmitVerification} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={verificationForm.country}
                    onChange={(e) => setVerificationForm({ ...verificationForm, country: e.target.value })}
                    className="apple-input"
                    placeholder="e.g., United States"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Government ID Number</label>
                  <input
                    type="text"
                    value={verificationForm.idNumber}
                    onChange={(e) => setVerificationForm({ ...verificationForm, idNumber: e.target.value })}
                    className="apple-input"
                    placeholder="Passport / National ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Document Type</label>
                  <select
                    value={verificationForm.documentType}
                    onChange={(e) => setVerificationForm({ ...verificationForm, documentType: e.target.value })}
                    className="apple-input"
                  >
                    <option value="passport">Passport</option>
                    <option value="national_id">National ID</option>
                    <option value="driver_license">Driver License</option>
                    <option value="business_license">Business License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Document URL</label>
                  <input
                    type="url"
                    value={verificationForm.documentUrl}
                    onChange={(e) => setVerificationForm({ ...verificationForm, documentUrl: e.target.value })}
                    className="apple-input"
                    placeholder="Link to your document (PDF or image)"
                    required
                  />
                </div>
                {profile.role === 'entrepreneur' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Company Registration (URL)</label>
                      <input
                        type="url"
                        value={verificationForm.companyRegistrationUrl}
                        onChange={(e) => setVerificationForm({ ...verificationForm, companyRegistrationUrl: e.target.value })}
                        className="apple-input"
                        placeholder="Link to your CAC/Companies House/Registrar document"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Your Position in the Company</label>
                      <input
                        type="text"
                        value={verificationForm.positionTitle}
                        onChange={(e) => setVerificationForm({ ...verificationForm, positionTitle: e.target.value })}
                        className="apple-input"
                        placeholder="e.g., Founder & CEO"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Proof of Position (URL)</label>
                      <input
                        type="url"
                        value={verificationForm.positionProofUrl}
                        onChange={(e) => setVerificationForm({ ...verificationForm, positionProofUrl: e.target.value })}
                        className="apple-input"
                        placeholder="Board resolution / employment letter / equity certificate"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Other Supporting Documents (URLs)</label>
                      <textarea
                        value={verificationForm.extraDocuments}
                        onChange={(e) => setVerificationForm({ ...verificationForm, extraDocuments: e.target.value })}
                        className="apple-input resize-none"
                        rows={3}
                        placeholder="Comma-separated URLs for additional docs (e.g., tax returns, licenses)"
                      />
                    </div>
                  </>
                )}
                {profile.role === 'investor' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Investor Status</label>
                      <input
                        type="text"
                        value={verificationForm.investorStatus}
                        onChange={(e) => setVerificationForm({ ...verificationForm, investorStatus: e.target.value })}
                        className="apple-input"
                        placeholder="e.g., Accredited / Professional / Angel"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Statement (URL)</label>
                      <input
                        type="url"
                        value={verificationForm.bankStatementUrl}
                        onChange={(e) => setVerificationForm({ ...verificationForm, bankStatementUrl: e.target.value })}
                        className="apple-input"
                        placeholder="Recent statement (PDF)"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Source of Funds</label>
                      <textarea
                        value={verificationForm.sourceOfFunds}
                        onChange={(e) => setVerificationForm({ ...verificationForm, sourceOfFunds: e.target.value })}
                        className="apple-input resize-none"
                        rows={3}
                        placeholder="Describe income sources or liquidity"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Income / Wealth Proof (URL)</label>
                      <input
                        type="url"
                        value={verificationForm.incomeProofUrl}
                        onChange={(e) => setVerificationForm({ ...verificationForm, incomeProofUrl: e.target.value })}
                        className="apple-input"
                        placeholder="Employment letter / audited accounts"
                        required
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Certification Type</label>
                  <select
                    value={verificationForm.certificationType}
                    onChange={(e) => setVerificationForm({ ...verificationForm, certificationType: e.target.value })}
                    className="apple-input"
                  >
                    <option value="standard">Standard</option>
                    <option value="investor">Certified Investor</option>
                    <option value="entrepreneur">Certified Entrepreneur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Note (optional)</label>
                  <textarea
                    value={verificationForm.note}
                    onChange={(e) => setVerificationForm({ ...verificationForm, note: e.target.value })}
                    className="apple-input resize-none"
                    rows={3}
                    placeholder="Share any context for the reviewer"
                  />
                </div>
                <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="apple-btn"
                    disabled={isSubmittingVerification}
                  >
                    {isSubmittingVerification ? 'Submitting...' : 'Start verification'}
                  </button>
                  <p className="text-sm text-gray-600">You can update these details anytime until approval.</p>
                </div>
              </form>
            </section>

            <section id="security" className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Security</h2>
                {!showPasswordForm && (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition"
                  >
                    Change password
                  </button>
                )}
              </div>

              {showPasswordForm && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Current password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-600 focus:outline-none transition"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">New password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-600 focus:outline-none transition"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Confirm new password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-600 focus:outline-none transition"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 font-semibold text-sm transition rounded-lg"
                    >
                      Update password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 font-semibold text-sm transition rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>
          </main>

          {/* Right rail */}
          <aside className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-3">Reminders</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Keep your email verified to secure account access.</li>
                <li>• Update your bio to match your latest focus areas.</li>
                <li>• Complete verification to unlock full access.</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-3">Support</p>
              <div className="space-y-2 text-sm text-blue-600">
                <a href="mailto:support@bilnet.com" className="block hover:text-blue-700">Email support</a>
                <a href="tel:+10000000000" className="block hover:text-blue-700">Call concierge</a>
                <Link to="/privacy" className="block hover:text-blue-700">Privacy & security</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
