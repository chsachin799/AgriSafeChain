// src/components/Navbar.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';


const Navbar = ({ isLoggedIn, user, onLogout, darkMode, setDarkMode, language, setLanguage, translations }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

 const t = (key) => translations?.[key] || key;


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

        {/* Links */}
        <div className="space-x-4 flex items-center">
          <Link to="/government" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
            {t("government")}
          </Link>
          <Link to="/government-enhanced" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
            Enhanced Gov
          </Link>
          <Link to="/transparency" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
            Transparency
          </Link>
          <Link to="/monitoring" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
            Monitoring
          </Link>
          <Link to="/kyc" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
            KYC
          </Link>
          <Link to="/center" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
            {t("center")}
          </Link>
          <Link to="/trainer" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
            {t("trainer")}
          </Link>
          <Link to="/farmer" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
            {t("farmer")}
          </Link>
          <Link to="/register" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300">
            {t("register")}
          </Link>

          {/* Conditional rendering for Login/Profile menu */}
          {isLoggedIn ? (
            <div className="relative flex items-center space-x-4">
              <div className="text-gray-700 dark:text-gray-300">
                Hello, {user?.name || "User"}!
              </div>
              <button
                onClick={toggleProfileMenu}
                className="p-2 rounded-full bg-teal-100 dark:bg-gray-700 hover:scale-110 transition-transform duration-300 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6 text-gray-700 dark:text-gray-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
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

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="ml-4 px-2 py-1 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="en">English 🇬🇧</option>
            <option value="hi">हिंदी 🇮🇳</option>
            <option value="ne">नेपाली 🇳🇵</option>
          </select>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;