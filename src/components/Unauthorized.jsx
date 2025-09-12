import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Access Denied
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You don't have permission to access this page. Your current role is: <span className="font-semibold text-teal-600 dark:text-emerald-400">{user?.role}</span>
        </p>
        
        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors duration-300"
          >
            Go to Home
          </Link>
          
          {user?.role === 'government' && (
            <Link
              to="/government"
              className="block w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors duration-300"
            >
              Government Dashboard
            </Link>
          )}
          
          {user?.role === 'trainer' && (
            <Link
              to="/trainer"
              className="block w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors duration-300"
            >
              Trainer Dashboard
            </Link>
          )}
          
          {user?.role === 'farmer' && (
            <Link
              to="/farmer"
              className="block w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors duration-300"
            >
              Farmer Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
