import React, { useState, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import ReCAPTCHA from 'react-google-recaptcha';
import erislogo from '../assets/ERISPNG.png';
import loginBanner from '../assets/LOGO_LOGIN.png';

const Login = () => {
  const { login: authLogin, manualLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [isManualLogin, setIsManualLogin] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef();

  // Check if this is admin login route
  const isAdminRoute = location.pathname === '/admin/login';
  const from = location.state?.from?.pathname || (isAdminRoute ? '/admin' : '/home');

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;

      const result = await authLogin({ 
        credential: accessToken,
        recaptchaToken: recaptchaToken 
      });

      if (result.success) {
        const userRole = result.user?.role || result.userData?.role || 'customer';
        const allowedAdminRoles = ['admin', 'staff', 'owner'];
        
        // Redirect based on role
        if (allowedAdminRoles.includes(userRole)) {
          navigate('/admin', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setError(result.message || 'Login failed. Backend rejected the token.');
        setRecaptchaToken(null);
        recaptchaRef.current?.reset();
      }
    },
    onError: () => {
      console.log('Login Failed');
      setError('Login failed. Please try again.');
    },
    flow: 'implicit',
  });

  const onLoginClick = () => {
    if (!recaptchaToken) {
      setError('Please complete the "I\'m not a robot" check.');
      return;
    }
    setError('');
    handleGoogleLogin();
  };

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
      const userRole = result.user?.role || result.userData?.role || 'customer';
      const allowedAdminRoles = ['admin', 'staff', 'owner'];
      
      // If this is admin route, require admin/staff/owner role
      if (isAdminRoute && !allowedAdminRoles.includes(userRole)) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      setFormData({ email: '', password: '' });
      
      // Role-based redirect - admin, staff, and owner go to admin panel
      if (allowedAdminRoles.includes(userRole)) {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
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

  return (
    <div className="min-h-screen bg-[#EDEDE6] flex flex-col lg:flex-row">
      {/* Left Side - Image Banner (Hidden on mobile, full height on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative ">
        <div className="w-full h-full flex items-center justify-center p-12">
          <img 
            src={loginBanner} 
            alt="Eris Cafe" 
            className="max-w-full max-h-full object-contain drop-shadow-2xl animate-spin-slow"
          />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 lg:p-12 min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <Link to="/home" className="inline-block mb-6">
              <img src={erislogo} alt="Eris Cafe" className="h-16 lg:h-20 mx-auto" />
            </Link>
            <h2 className="text-3xl lg:text-4xl font-playfair font-bold text-gray-900 mb-3">
              {isAdminRoute ? 'Admin Portal' : 'Welcome Back'}
            </h2>
            <p className="text-base lg:text-lg text-gray-600">
              {isAdminRoute ? 'Sign in to access the admin dashboard' : 'Sign in to your Eris Cafe account'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
          

          {/* Login Form Content */}
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-stone-400">
            {!isManualLogin ? (
              <>
                {/* Google OAuth - Only for customer login */}
                {!isAdminRoute && (
                  <>
                    <div className="flex justify-center mb-5">
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                        onChange={(token) => setRecaptchaToken(token)}
                        onExpired={() => setRecaptchaToken(null)}
                      />
                    </div>

                    <button
                      onClick={onLoginClick}
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-700 font-semibold hover:border-amber-500 hover:bg-amber-50 transition-all duration-200"
                    >
                      <FcGoogle className="w-6 h-6 mr-3" />
                      Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-stone-500"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-[#EDEDE6] text-gray-500 font-medium">Or</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Switch to Email/Password Login */}
                <button
                  onClick={() => setIsManualLogin(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#5E4B43] to-[#2E1F1B] text-white rounded-xl font-semibold
                   hover:from-[#5E4B43] hover:to-amber-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Sign in with Email
                </button>
              </>
            ) : (
              <>
                {/* Manual Login Form */}
                <form onSubmit={handleManualLogin} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-amber-600 hover:text-amber-700 font-semibold transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-amber-800 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {/* Back to Google login - Only for customers */}
                {!isAdminRoute && (
                  <button
                    onClick={() => {
                      setIsManualLogin(false);
                      setFormData({ email: '', password: '' });
                      setError('');
                    }}
                    className="mt-5 w-full text-amber-600 hover:text-amber-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Google Sign In
                  </button>
                )}
              </>
            )}
          </div>

          {/* Sign Up Link - Only for customer login */}
          {!isAdminRoute && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-amber-600 hover:text-amber-700 font-bold transition-colors"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          )}

          {/* Demo Credentials - For admin only */}
          {isAdminRoute && (
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <p className="text-xs text-blue-800 text-center font-semibold">
                  Not an admin? <a><Link to='/Login'><strong>Login as Customer</strong></Link></a>
              </p>
            </div>
          )}

          {/* Terms and Privacy */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>By signing in, you agree to our</p>
            <p className="mt-1">
              <Link to="/terms" className="hover:text-amber-600 transition-colors font-medium">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="hover:text-amber-600 transition-colors font-medium">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
