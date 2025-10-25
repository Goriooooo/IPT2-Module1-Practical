import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// 1. Create the AuthContext
const AuthContext = createContext();

// 2. Create the API instance
const api = axios.create({
  baseURL: 'http://localhost:4000/api', // Your backend URL
});

// 3. Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);

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
          console.log('Token expired, user logged out.');
        } else {
          // Token is valid
          setAuthUser(token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        // Invalid token
        console.error("Invalid token found in localStorage", error);
        localStorage.removeItem('appToken');
        setAuthUser(null);
      }
    }
  }, []);

  // 5. THIS IS THE NEW, UPDATED LOGIN FUNCTION
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
      setAuthUser(data.appToken);
      localStorage.setItem('appToken', data.appToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.appToken}`;
      console.log('Login successful, token stored');
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      // Send the specific error message from the backend
      const message = err.response?.data?.message || 'Login failed';
      console.error('Backend Error:', message);
      return { success: false, message: message };
    }
  };

  // 6. The logout function
  const logout = () => {
    setAuthUser(null);
    localStorage.removeItem('appToken');
    delete api.defaults.headers.common['Authorization'];
    console.log('Logout successful');
  };

  // 7. Provide the context value
  return (
    <AuthContext.Provider value={{ authUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 8. Create and export the useAuth hook
export const useAuth = () => {
  return useContext(AuthContext);
};