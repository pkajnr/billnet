import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Verifications from './pages/Verifications';
import Ideas from './pages/Ideas';

// AdminRoute component to protect authenticated routes
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const adminSecret = localStorage.getItem('adminSecret');
    setIsAuthenticated(!!adminSecret);
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
  const adminSecret = localStorage.getItem('adminSecret');
  
  if (adminSecret) {
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
              <Login />
            </LoginRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
        <Route
          path="/verifications"
          element={
            <AdminRoute>
              <Verifications />
            </AdminRoute>
          }
        />
        <Route
          path="/ideas"
          element={
            <AdminRoute>
              <Ideas />
            </AdminRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
