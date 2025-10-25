import React, { useState, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import ReCAPTCHA from 'react-google-recaptcha'; // Import ReCAPTCHA

const LoginModal = ({ isOpen, onClose }) => {
  const { login: authLogin } = useAuth();
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null); // State for the token
  const recaptchaRef = useRef();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;

      // Send both tokens to the backend
      const result = await authLogin({ 
        credential: accessToken,
        recaptchaToken: recaptchaToken 
      });

      if (result.success) {
        onClose();
      } else {
        setError(result.message || 'Login failed. Backend rejected the token.');
        // Reset reCAPTCHA on failure so the user can try again
        setRecaptchaToken(null);
        recaptchaRef.current.reset();
      }
    },
    onError: () => {
      console.log('Login Failed');
      setError('Login failed. Please try again.');
    },
    flow: 'implicit',
  });

  // This function is called when the user clicks the Google button
  const onLoginClick = () => {
    // Check if reCAPTCHA is completed first
    if (!recaptchaToken) {
      setError('Please complete the "I\'m not a robot" check.');
      return;
    }
    // If it's complete, clear any errors and start the Google login flow
    setError('');
    handleGoogleLogin();
  };

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

        {/* reCAPTCHA Checkbox */}
        <div className="flex justify-center mb-4">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(token) => setRecaptchaToken(token)} // Save the token
            onExpired={() => setRecaptchaToken(null)} // Clear token if it expires
          />
        </div>

        {/* Custom Google Sign In Button */}
        <div className="flex justify-center">
          <button
            onClick={onLoginClick} // Use our new click handler
            className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
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