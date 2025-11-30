import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// 1. Create the AuthContext
const AuthContext = createContext();

// 2. Create the API instance
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`,
});

// 3. Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 4. useEffect to load token on app start
  useEffect(() => {
    const token = localStorage.getItem('appToken');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const expiresAt = decodedToken.exp * 1000;

        if (Date.now() >= expiresAt) {
          // Token is expired, log them out
          localStorage.removeItem('appToken');
          setAuthUser(null);
          setUserData(null);
          console.log('Token expired, user logged out.');
        } else {
          // Token is valid
          setAuthUser(token);
          setUserData(decodedToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        // Invalid token
        console.error("Invalid token found in localStorage", error);
        localStorage.removeItem('appToken');
        setAuthUser(null);
        setUserData(null);
      }
    }
    setLoading(false);
  }, []);

  // 5. THIS IS THE NEW, UPDATED LOGIN FUNCTION FOR GOOGLE OAUTH
  const login = async (credentialResponse) => {
    // credentialResponse is now an object { credential, recaptchaToken }
    const { credential, recaptchaToken } = credentialResponse;

    try {
      // Send both tokens to the backend
      const { data } = await api.post('/auth/google', { 
        token: credential, // This is the access token
        recaptchaToken: recaptchaToken // This is the new recaptcha token
      });

      // Set user and token in state and local storage
      const decodedToken = jwtDecode(data.appToken);
      setAuthUser(data.appToken);
      setUserData(decodedToken);
      localStorage.setItem('appToken', data.appToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.appToken}`;
      console.log('Login successful, token stored');
      return { success: true, user: data.user || decodedToken, userData: decodedToken };
    } catch (err) {
      console.error('Login error:', err);
      // Send the specific error message from the backend
      const message = err.response?.data?.message || 'Login failed';
      console.error('Backend Error:', message);
      return { success: false, message: message };
    }
  };

  // Manual email/password login
  const manualLogin = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      // Set user and token in state and local storage
      const decodedToken = jwtDecode(data.appToken);
      setAuthUser(data.appToken);
      setUserData(decodedToken);
      localStorage.setItem('appToken', data.appToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.appToken}`;
      console.log('Manual login successful');
      return { success: true, user: data.user || decodedToken, userData: decodedToken };
    } catch (err) {
      console.error('Manual login error:', err);
      const message = err.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  // Manual registration
  const register = async (name, email, password) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      
      // Automatically log in after registration
      setAuthUser(data.appToken);
      setUserData(jwtDecode(data.appToken));
      localStorage.setItem('appToken', data.appToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.appToken}`;
      console.log('Registration successful');
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Registration error:', err);
      const message = err.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  // 6. The logout function
  const logout = () => {
    setAuthUser(null);
    setUserData(null);
    localStorage.removeItem('appToken');
    delete api.defaults.headers.common['Authorization'];
    console.log('Logout successful');
  };

  // 7. Provide the context value
  return (
    <AuthContext.Provider value={{ 
      authUser, 
      userData, 
      user: userData, // Add alias for backward compatibility
      isAuthenticated: !!authUser, // Add isAuthenticated helper
      isAdmin: ['admin', 'staff', 'owner'].includes(userData?.role), // Add isAdmin helper - includes staff and owner
      loading,
      login, 
      manualLogin,
      register,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// 8. Create and export the useAuth hook
export const useAuth = () => {
  return useContext(AuthContext);
};
