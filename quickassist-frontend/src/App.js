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
import BookingStatusPage from './pages/BookingStatusPage'; 



const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        // Show a loading spinner while checking auth status
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
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
            <CustomerDashboard /> {/* Use the real dashboard */}
          </PrivateRoute>
        } 
      />
      <Route 
        path="/booking/:bookingId" 
        element={
          <PrivateRoute>
            <BookingStatusPage />
          </PrivateRoute>
        } 
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;