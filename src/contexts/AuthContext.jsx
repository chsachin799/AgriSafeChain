import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        
        // Check KYC status
        await checkKYCStatus(parsedUser.id);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const checkKYCStatus = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3001/api/kyc/status/${userId}`, {
        headers: { 'x-auth-token': token }
      });
      setKycStatus(response.data.status);
    } catch (error) {
      console.error('KYC status check failed:', error);
      setKycStatus(null);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email,
        password
      });

      const { token, role } = response.data;
      const userData = { id: response.data.user?.id, email, role };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Check KYC status after login
      await checkKYCStatus(userData.id);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.msg || 'Login failed' 
      };
    }
  };

  const register = async (email, password, role) => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/register', {
        email,
        password,
        role
      });

      const { token } = response.data;
      const userData = { id: response.data.user?.id, email, role };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.msg || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setKycStatus(null);
  };

  const hasRole = (requiredRole) => {
    if (!user) return false;
    return user.role === requiredRole;
  };

  const hasAnyRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const canAccessDashboard = (dashboardType) => {
    if (!user) return false;
    
    switch (dashboardType) {
      case 'government':
        return user.role === 'government';
      case 'trainer':
        return user.role === 'trainer' || user.role === 'government';
      case 'farmer':
        return user.role === 'farmer' || user.role === 'trainer' || user.role === 'government';
      case 'center':
        return user.role === 'government';
      default:
        return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    kycStatus,
    login,
    register,
    logout,
    hasRole,
    hasAnyRole,
    canAccessDashboard,
    checkKYCStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
