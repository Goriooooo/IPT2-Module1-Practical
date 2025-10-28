import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLoginModal from './AdminLoginModal';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, userData } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Show login modal for admin routes if not authenticated
    if (requireAdmin && !isAuthenticated) {
      setShowLoginModal(true);
    }
  }, [requireAdmin, isAuthenticated]);

  // For admin routes, show login modal if not authenticated
  if (requireAdmin && !isAuthenticated) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md p-8">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Login Required</h2>
            <p className="text-gray-600 mb-6">Please sign in with your admin credentials to continue.</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
            >
              Sign In as Admin
            </button>
          </div>
        </div>
        <AdminLoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            window.history.back();
          }}
        />
      </>
    );
  }

  // For regular protected routes, redirect to home
  if (!requireAdmin && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if authenticated user has admin role for admin routes
  if (requireAdmin && isAuthenticated && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need admin privileges to access this page.</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
