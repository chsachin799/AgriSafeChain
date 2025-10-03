// src/components/Navbar.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { isAuthenticated, user, logout, canAccessDashboard } = useAuth();
  const [backendOk, setBackendOk] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const res = await fetch('http://localhost:3001/health');
        if (!cancelled) setBackendOk(res.ok);
      } catch {
        if (!cancelled) setBackendOk(false);
      }
    };
    ping();
    const id = setInterval(ping, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };


  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg p-4 sticky top-0 z-50 transition-colors duration-500">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-teal-800 dark:text-emerald-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300"
        >
          AgriSafeChain
        </Link>

        {/* Backend status */}
        <div className={`hidden md:flex items-center text-xs font-medium ${backendOk ? 'text-green-600' : 'text-red-600'}`}>
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${backendOk ? 'bg-green-600' : 'bg-red-600'}`}></span>
          {backendOk ? 'Online' : 'Offline'}
        </div>

        {/* Links - Role-based navigation */}
        <div className="space-x-4 flex items-center">
          {/* Public links */}
          <Link to="/transparency" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
            Transparency
          </Link>
          
          {/* Government-only links */}
          {canAccessDashboard('government') && (
            <>
              <Link to="/government" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
                Government
              </Link>
              <Link to="/monitoring" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
                Monitoring
              </Link>
              <Link to="/center" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
                Center
              </Link>
            </>
          )}
          
          {/* Trainer and Government links */}
          {canAccessDashboard('trainer') && (
            <Link to="/trainer" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
              Trainer
            </Link>
          )}
          
          {/* Farmer, Trainer, and Government links */}
          {canAccessDashboard('farmer') && (
            <Link to="/farmer" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
              Farmer
            </Link>
          )}
          
          {/* KYC link for authenticated users */}
          {isAuthenticated && (
            <Link to="/kyc" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
              KYC
            </Link>
          )}

          {/* Conditional rendering for Login/Profile menu */}
          {isAuthenticated ? (
            <div className="relative flex items-center space-x-3">
              <button
                onClick={toggleProfileMenu}
                className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-semibold shadow hover:shadow-md transition"
                title={user?.role ? user.role.toUpperCase() : 'USER'}
              >
                {(user?.name || user?.email || 'User').slice(0,1).toUpperCase()}
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={toggleProfileMenu}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300"
            >
              Login
            </Link>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="ml-4 p-2 rounded-full bg-teal-100 dark:bg-gray-700 hover:scale-110 transition-transform duration-300"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;