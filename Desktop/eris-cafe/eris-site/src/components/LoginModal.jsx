import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google'; 
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc'; // <-- We now import the icon

const LoginModal = ({ isOpen, onClose }) => {
  const { login: authLogin } = useAuth();
  const [error, setError] = useState('');

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;
      const result = await authLogin({ credential: accessToken }); 
      
      if (result.success) {
        onClose();
      } else {
        setError('Login failed. Backend rejected the token.');
      }
    },
    onError: () => {
      console.log('Login Failed');
      setError('Login failed. Please try again.');
    },
    flow: 'implicit', 
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-playfair font-bold text-gray-900 mb-2">
            Welcome to Eris Cafe
          </h2>
          <p className="text-gray-600">
            Sign in to access your account
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Custom Google Sign In Button */}
        <div className="flex justify-center">
          <button
            onClick={() => handleGoogleLogin()} // This calls the hook
            className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {/* THIS IS THE NEW, FIXED ICON */}
            <FcGoogle className="w-5 h-5 mr-3" />
            Continue with Google
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>By signing in, you agree to our</p>
          <p>Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;