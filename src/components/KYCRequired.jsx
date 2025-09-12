import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const KYCRequired = () => {
  const { user, kycStatus } = useAuth();

  const getKYCStatusMessage = () => {
    switch (kycStatus) {
      case 'pending':
        return 'Your KYC verification is pending approval.';
      case 'rejected':
        return 'Your KYC verification was rejected. Please resubmit your documents.';
      case 'expired':
        return 'Your KYC verification has expired. Please renew your verification.';
      default:
        return 'KYC verification is required to access this feature.';
    }
  };

  const getKYCStatusColor = () => {
    switch (kycStatus) {
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'rejected':
        return 'text-red-600 dark:text-red-400';
      case 'expired':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900">
            <svg
              className="h-8 w-8 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          KYC Verification Required
        </h1>
        
        <p className={`mb-6 ${getKYCStatusColor()}`}>
          {getKYCStatusMessage()}
        </p>
        
        <div className="space-y-3">
          <Link
            to="/kyc"
            className="block w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors duration-300"
          >
            {kycStatus === 'rejected' || kycStatus === 'expired' ? 'Resubmit KYC' : 'Complete KYC Verification'}
          </Link>
          
          <Link
            to="/"
            className="block w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300"
          >
            Go to Home
          </Link>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-md">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            What is KYC?
          </h3>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Know Your Customer (KYC) verification helps us ensure the security and legitimacy of all participants in the AgriSafeChain platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KYCRequired;
