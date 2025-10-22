import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

const LoginModal = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [error, setError] = useState('');

  const handleSuccess = async (credentialResponse) => {
    const result = await login(credentialResponse.credential);
    
    if (result.success) {
      onClose();
    } else {
      setError('Login failed. Please try again.');
    }
  };

  const handleError = () => {
    setError('Login failed. Please try again.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-playfair font-bold text-gray-900 mb-2">
            Welcome to Eris Cafe
          </h2>
          <p className="text-gray-600">
            Sign in to access your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
          />
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>By signing in, you agree to our</p>
          <p>Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
