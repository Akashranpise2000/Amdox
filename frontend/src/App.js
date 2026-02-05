import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import JobSearch from './pages/JobSearch';
import JobDetail from './pages/JobDetail';
import SeekerDashboard from './pages/SeekerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import Profile from './pages/Profile';
import MyApplications from './pages/MyApplications';
import SavedJobs from './pages/SavedJobs';
import MyJobs from './pages/MyJobs';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import CertificateSearch from './pages/CertificateSearch';
import CertificatePreview from './pages/CertificatePreview';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === 'employer') {
      return <Navigate to="/employer/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const Layout = ({ children, showNavbar = true }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && <Navbar />}
      <main>{children}</main>
    </div>
  );
};

function AppContent() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/login" element={<PublicRoute><Layout><Login /></Layout></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Layout><Register /></Layout></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><Layout><ForgotPassword /></Layout></PublicRoute>} />
        <Route path="/reset-password/:token" element={<PublicRoute><Layout><ResetPassword /></Layout></PublicRoute>} />
        <Route path="/jobs" element={<Layout><JobSearch /></Layout>} />
        <Route path="/jobs/:id" element={<Layout><JobDetail /></Layout>} />
        
        <Route path="/certificates/search" element={<Layout showNavbar={false}><CertificateSearch /></Layout>} />
        <Route path="/certificates/preview/:id" element={<Layout showNavbar={false}><CertificatePreview /></Layout>} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['seeker']}>
            <Layout><SeekerDashboard /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/applications" element={
          <ProtectedRoute roles={['seeker']}>
            <Layout><MyApplications /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/saved-jobs" element={
          <ProtectedRoute roles={['seeker']}>
            <Layout><SavedJobs /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/employer/dashboard" element={
          <ProtectedRoute roles={['employer']}>
            <Layout><EmployerDashboard /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/my-jobs" element={
          <ProtectedRoute roles={['employer']}>
            <Layout><MyJobs /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout><Profile /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Layout><Notifications /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
