import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { initWalletDetection } from './utils/walletDetection';
import Layout from './components/Layout';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CompleteProfile from './pages/CompleteProfile';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import CookieSettings from './pages/CookieSettings';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import VerifyEmail from './pages/VerifyEmail';
import ExploreIdeas from './pages/ExploreIdeas';
import IdeaDetail from './pages/IdeaDetail';
import PostIdea from './pages/PostIdea';
import EditPost from './pages/EditPost';
import MyIdeas from './pages/MyIdeas';
import MyInvestments from './pages/MyInvestments';
import MyBids from './pages/MyBids';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Analytics from './pages/Analytics';
import AddFunds from './pages/AddFunds';

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthorized(!!token);
    };

    checkAuth();

    // Listen for storage changes (logout from other tabs)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : <Navigate to="/signin" replace />;
}

// Public route (redirect if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthorized(!!token);
    };

    checkAuth();

    // Listen for storage changes
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? <Navigate to="/explore" replace /> : children;
}

function App() {
  // Initialize wallet detection to prevent auto-connect errors
  useEffect(() => {
    initWalletDetection();
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
          <Route path="/about" element={<PublicRoute><About /></PublicRoute>} />
          <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Profile completion (semi-protected - requires auth but not full profile) */}
          <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
          
          {/* General pages */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<CookieSettings />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><ExploreIdeas /></ProtectedRoute>} />
          <Route path="/explore-ideas" element={<ProtectedRoute><ExploreIdeas /></ProtectedRoute>} />
          <Route path="/ideas/:id" element={<ProtectedRoute><IdeaDetail /></ProtectedRoute>} />
          <Route path="/post-idea" element={<ProtectedRoute><PostIdea /></ProtectedRoute>} />
          <Route path="/edit-post/:id" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
          <Route path="/my-ideas" element={<ProtectedRoute><MyIdeas /></ProtectedRoute>} />
          <Route path="/my-investments" element={<ProtectedRoute><MyInvestments /></ProtectedRoute>} />
          <Route path="/my-bids" element={<ProtectedRoute><MyBids /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/add-funds" element={<ProtectedRoute><AddFunds /></ProtectedRoute>} />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App
