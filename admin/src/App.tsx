import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import NewDashboard from './pages/NewDashboard';
import Users from './pages/Users';
import RegisteredUsers from './pages/RegisteredUsers';
import Verifications from './pages/Verifications';
import Ideas from './pages/Ideas';
import Reports from './pages/Reports';
import SiteSettings from './pages/SiteSettings';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import AdminUserManagement from './pages/AdminUserManagement';
import Analytics from './pages/Analytics';
import AdminLayout from './components/AdminLayout';

// AdminRoute component to protect authenticated routes
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    setIsAuthenticated(!!adminToken);
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

// LoginRoute component to redirect if already authenticated
const LoginRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  
  if (adminToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <LoginRoute>
              <AdminLogin />
            </LoginRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <AdminLayout>
                <NewDashboard />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <AdminLayout>
                <Users />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/registered-users"
          element={
            <AdminRoute>
              <AdminLayout>
                <RegisteredUsers />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/verifications"
          element={
            <AdminRoute>
              <AdminLayout>
                <Verifications />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/ideas"
          element={
            <AdminRoute>
              <AdminLayout>
                <Ideas />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <AdminRoute>
              <AdminLayout>
                <Reports />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/site-settings"
          element={
            <AdminRoute>
              <AdminLayout>
                <SiteSettings />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AdminRoute>
              <AdminLayout>
                <Settings />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <AdminRoute>
              <AdminLayout>
                <Profile />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin-users"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminUserManagement />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <AdminRoute>
              <AdminLayout>
                <Analytics />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <AdminRoute>
              <AdminLayout>
                <NewDashboard />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
