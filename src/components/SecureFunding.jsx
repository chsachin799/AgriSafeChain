import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import WalletIntegration from './WalletIntegration';
import axios from 'axios';

const SecureFunding = ({ centerAddress, trainerAddress, onFundingSuccess }) => {
  const { user, hasRole } = useAuth();
  const [fundingData, setFundingData] = useState({
    amount: '',
    purpose: '',
    sourceId: '',
    recipientType: 'center', // 'center' or 'trainer'
    recipientAddress: centerAddress || trainerAddress || ''
  });
  const [verificationStatus, setVerificationStatus] = useState({
    kycVerified: false,
    complianceApproved: false,
    legalTrainer: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (fundingData.recipientAddress) {
      verifyRecipient();
    }
  }, [fundingData.recipientAddress]);

  const verifyRecipient = async () => {
    try {
      setLoading(true);
      
      // Check KYC status
      const kycResponse = await axios.get(
        `http://localhost:3001/api/kyc/status/${fundingData.recipientAddress}`,
        {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }
      );

      // Check compliance status
      const complianceResponse = await axios.get(
        `http://localhost:3001/api/compliance/status/${fundingData.recipientAddress}`,
        {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }
      );

      // Check if trainer is legal/verified
      const trainerResponse = await axios.get(
        `http://localhost:3001/api/trainer/verify/${fundingData.recipientAddress}`,
        {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }
      );

      setVerificationStatus({
        kycVerified: kycResponse.data.status === 'verified',
        complianceApproved: complianceResponse.data.approved,
        legalTrainer: trainerResponse.data.isLegal
      });

    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify recipient. Please check the address.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFundingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateFunding = () => {
    if (!fundingData.amount || parseFloat(fundingData.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (!fundingData.purpose) {
      setError('Please specify the purpose of funding');
      return false;
    }

    if (!fundingData.recipientAddress) {
      setError('Please specify recipient address');
      return false;
    }

    if (!verificationStatus.kycVerified) {
      setError('Recipient must be KYC verified');
      return false;
    }

    if (!verificationStatus.complianceApproved) {
      setError('Recipient must be compliance approved');
      return false;
    }

    if (fundingData.recipientType === 'trainer' && !verificationStatus.legalTrainer) {
      setError('Trainer must be legally verified');
      return false;
    }

    return true;
  };

  const processFunding = async (transactionId, paymentMethod) => {
    try {
      setLoading(true);
      setError('');

      // Create blockchain transaction
      const fundingResponse = await axios.post(
        'http://localhost:3001/api/allocate/funds-enhanced',
        {
          centerAddress: fundingData.recipientType === 'center' ? fundingData.recipientAddress : null,
          trainerAddress: fundingData.recipientType === 'trainer' ? fundingData.recipientAddress : null,
          amount: fundingData.amount,
          sourceId: fundingData.sourceId,
          purpose: fundingData.purpose,
          paymentMethod: paymentMethod,
          transactionId: transactionId
        },
        {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }
      );

      if (fundingResponse.data.success) {
        setStep(3); // Success step
        onFundingSuccess?.(fundingResponse.data);
      } else {
        throw new Error(fundingResponse.data.error || 'Funding failed');
      }
    } catch (error) {
      console.error('Funding error:', error);
      setError(error.response?.data?.error || 'Failed to process funding');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (transactionId, receipt) => {
    processFunding(transactionId, 'blockchain');
  };

  const handlePaymentError = (error) => {
    setError('Payment failed. Please try again.');
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Funding Details
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recipient Type *
          </label>
          <select
            value={fundingData.recipientType}
            onChange={(e) => handleInputChange('recipientType', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="center">Training Center</option>
            <option value="trainer">Trainer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recipient Address *
          </label>
          <input
            type="text"
            value={fundingData.recipientAddress}
            onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter wallet address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount (ETH) *
          </label>
          <input
            type="number"
            step="0.001"
            value={fundingData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="0.0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Source ID
          </label>
          <input
            type="text"
            value={fundingData.sourceId}
            onChange={(e) => handleInputChange('sourceId', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Optional funding source identifier"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Purpose *
        </label>
        <textarea
          value={fundingData.purpose}
          onChange={(e) => handleInputChange('purpose', e.target.value)}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Describe the purpose of this funding"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Security Verification
      </h3>
      
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Recipient Verification Status
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">KYC Verification</span>
            <div className="flex items-center">
              {verificationStatus.kycVerified ? (
                <span className="text-green-600 dark:text-green-400 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Not Verified
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Compliance Approval</span>
            <div className="flex items-center">
              {verificationStatus.complianceApproved ? (
                <span className="text-green-600 dark:text-green-400 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Approved
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Not Approved
                </span>
              )}
            </div>
          </div>

          {fundingData.recipientType === 'trainer' && (
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Legal Trainer</span>
              <div className="flex items-center">
                {verificationStatus.legalTrainer ? (
                  <span className="text-green-600 dark:text-green-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Not Verified
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!verificationStatus.kycVerified || !verificationStatus.complianceApproved || 
       (fundingData.recipientType === 'trainer' && !verificationStatus.legalTrainer) ? (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 text-sm">
            Cannot proceed with funding. Recipient must meet all verification requirements.
          </p>
        </div>
      ) : (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-200 text-sm">
            All verification checks passed. You can proceed with funding.
          </p>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900">
        <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
        Funding Successful!
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300">
        Your funding of {fundingData.amount} ETH has been successfully transferred to {fundingData.recipientAddress}.
      </p>
      
      <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          The transaction has been recorded on the blockchain and is now part of the immutable audit trail.
        </p>
      </div>
    </div>
  );

  if (!hasRole('government')) {
    return (
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Access Denied
        </h3>
        <p className="text-red-700 dark:text-red-300">
          Only government users can access the secure funding system.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Secure Funding System
        </h2>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {step} of 3
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round((step / 3) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 3 && (
          <div className="flex justify-between">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                disabled={loading}
                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify Recipient
              </button>
            ) : step === 2 ? (
              <div className="space-y-4">
                {verificationStatus.kycVerified && verificationStatus.complianceApproved && 
                 (fundingData.recipientType !== 'trainer' || verificationStatus.legalTrainer) ? (
                  <WalletIntegration
                    amount={parseFloat(fundingData.amount)}
                    purpose={fundingData.purpose}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                ) : (
                  <button
                    onClick={() => verifyRecipient()}
                    disabled={loading}
                    className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Re-verify Recipient'}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecureFunding;
