/* eslint-disable no-unused-vars */
// In src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Import the REAL pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import BookingStatusPage from './pages/BookingStatusPage';
import AdminDashboard from './pages/AdminDashboard';
import NotAuthorized from './pages/NotAuthorized';
import BookingHistory from './pages/BookingHistory';
import UserProfile from './pages/UserProfile';
import ProviderProfile from './pages/ProviderProfile';
import ManageUsers from './pages/admin/ManageUsers';



const DashboardRedirect = () => {
    const { user } = useAuth();
    // Route users to appropriate dashboards based on their user type
    if (user?.user_type === 'ADMIN' || user?.is_staff === true) {
        return <Navigate to="/admin/dashboard" />;
    }
    if (user?.user_type === 'PROVIDER') {
        return <ProviderDashboard />;
    }
    return <CustomerDashboard />;
};

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        // Show a loading spinner while checking auth status
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

// Admin route protector - checks for authentication AND admin user type
const AdminRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        // Show a loading spinner while checking auth status
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // Check if user is admin (adjust the field name as needed based on your backend)
    if (user?.user_type !== 'ADMIN' && user?.is_staff !== true) {
        // Show not authorized page if not admin
        return <NotAuthorized />;
    }

    return children;
};

// Create a route for users who are already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" /> : children;
};

function App() {
  return (
    <Routes>
      {/* Public routes wrapped in PublicRoute to redirect if logged in */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        {/* Protected routes */}
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <DashboardRedirect />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/dashboard/provider" 
        element={
          <PrivateRoute>
            <ProviderDashboard />
          </PrivateRoute>
        } 
      />      <Route 
        path="/booking/:bookingId" 
        element={
          <PrivateRoute>
            <BookingStatusPage />
          </PrivateRoute>
        } 
      />      {/* Admin routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <AdminRoute>
            <ManageUsers />
          </AdminRoute>
        } 
      />{/* User routes */}
      <Route 
        path="/history" 
        element={
          <PrivateRoute>
            <BookingHistory />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <PrivateRoute>
            <UserProfile />
          </PrivateRoute>
        } 
      />

      {/* Provider routes */}
      <Route 
        path="/provider/profile" 
        element={
          <PrivateRoute>
            <ProviderProfile />
          </PrivateRoute>
        } 
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;