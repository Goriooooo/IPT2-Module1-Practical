import React, { useState, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import ReCAPTCHA from 'react-google-recaptcha'; // Import ReCAPTCHA

const LoginModal = ({ isOpen, onClose, onSwitchToSignup, onSwitchToForgotPassword, requireAdmin = false }) => {
  const { login: authLogin, manualLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null); // State for the token
  const [isManualLogin, setIsManualLogin] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
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

  // Handle manual login form submission
  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    const result = await manualLogin(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      const userRole = result.user.role;
      
      // If this modal requires admin access
      if (requireAdmin && userRole !== 'admin') {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      // Clear form and close modal
      setFormData({ email: '', password: '' });
      onClose();

      // Role-based redirect
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        // Customer stays on current page or goes to home
        // navigate('/') if you want to redirect customers
      }
    } else {
      setError(result.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
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
            {requireAdmin ? 'Admin Login' : 'Welcome to Eris Cafe'}
          </h2>
          <p className="text-gray-600">
            {requireAdmin ? 'Sign in to access the admin dashboard' : 'Sign in to access your account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {!isManualLogin ? (
          <>
            {/* Only show Google OAuth for customers */}
            {!requireAdmin && (
              <>
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
                <div className="flex justify-center mb-4">
                  <button
                    onClick={onLoginClick} // Use our new click handler
                    className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <FcGoogle className="w-5 h-5 mr-3" />
                    Continue with Google
                  </button>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>
              </>
            )}

            {/* Switch to email/password login */}
            <button
              onClick={() => setIsManualLogin(true)}
              className="w-full px-4 py-3 border-2 border-amber-600 text-amber-600 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
            >
              Sign in with Email
            </button>
          </>
        ) : (
          <>
            {/* Manual Login Form */}
            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              {/* Forgot Password Link */}
              {onSwitchToForgotPassword && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={onSwitchToForgotPassword}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Back to Google login */}
            {!requireAdmin && (
              <button
                onClick={() => {
                  setIsManualLogin(false);
                  setFormData({ email: '', password: '' });
                  setError('');
                }}
                className="mt-4 w-full text-amber-600 hover:text-amber-700 font-medium text-sm"
              >
                ← Back to Google Sign In
              </button>
            )}
          </>
        )}

        {/* Sign up link - Only show for customer login */}
        {!requireAdmin && onSwitchToSignup && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-amber-600 hover:text-amber-700 font-semibold"
              >
                Sign Up
              </button>
            </p>
          </div>
        )}

        {/* Demo credentials hint for admin */}
        {requireAdmin && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 text-center font-medium">
              Demo: admin@eriscafe.com / admin123
            </p>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>By signing in, you agree to our</p>
          <p>Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;