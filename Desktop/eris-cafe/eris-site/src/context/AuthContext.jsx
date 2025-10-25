import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // You need to install this

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On page load, check for our appToken
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Decode our appToken to get the user data
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
      } catch (error) {
        console.error("Invalid auth token:", error);
        localStorage.removeItem('authToken'); // Clear invalid token
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentialResponse) => {
    try {
      // 1. Send Google's token to our backend for verification
      const res = await axios.post(
        'http://localhost:4000/api/auth/google',
        {
          token: credentialResponse.credential, // This is the fix
        }
      );

      // 2. Get our *own* appToken back from the backend
      const { appToken } = res.data;

      // 3. Store our appToken in localStorage
      localStorage.setItem('authToken', appToken);

      // 4. Decode our appToken to set the user state
      const decodedUser = jwtDecode(appToken);
      setUser(decodedUser);

      return { success: true, user: decodedUser };
    } catch (error) {
      console.error('Login error:', error);
      // Log the full backend error message
      if (error.response) {
        console.error("Backend Error:", error.response.data.message);
      }
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};