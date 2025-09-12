import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

const KYCVerification = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [kycData, setKycData] = useState({
    personalInfo: {
      fullName: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      address: ''
    },
    identityDocument: {
      idType: '',
      idNumber: '',
      issueDate: '',
      expiryDate: ''
    },
    addressDocument: {
      addressType: '',
      issueDate: ''
    },
    documents: []
  });
  const [errors, setErrors] = useState({});
  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/kyc/status/${localStorage.getItem('userId')}`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (data.success) {
        setKycStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    }
  };

  const handleInputChange = (section, field, value) => {
    setKycData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors[`${section}.${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`${section}.${field}`]: null
      }));
    }
  };

  const handleFileUpload = (file, type) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const document = {
        type,
        content: e.target.result,
        mimeType: file.type,
        size: file.size,
        name: file.name
      };
      
      setKycData(prev => ({
        ...prev,
        documents: [...prev.documents, document]
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!kycData.personalInfo.fullName) newErrors['personalInfo.fullName'] = 'Full name is required';
        if (!kycData.personalInfo.dateOfBirth) newErrors['personalInfo.dateOfBirth'] = 'Date of birth is required';
        if (!kycData.personalInfo.email) newErrors['personalInfo.email'] = 'Email is required';
        if (!kycData.personalInfo.phone) newErrors['personalInfo.phone'] = 'Phone is required';
        if (!kycData.personalInfo.address) newErrors['personalInfo.address'] = 'Address is required';
        break;
      case 2:
        if (!kycData.identityDocument.idType) newErrors['identityDocument.idType'] = 'ID type is required';
        if (!kycData.identityDocument.idNumber) newErrors['identityDocument.idNumber'] = 'ID number is required';
        if (!kycData.identityDocument.issueDate) newErrors['identityDocument.issueDate'] = 'Issue date is required';
        if (!kycData.identityDocument.expiryDate) newErrors['identityDocument.expiryDate'] = 'Expiry date is required';
        break;
      case 3:
        if (!kycData.addressDocument.addressType) newErrors['addressDocument.addressType'] = 'Address document type is required';
        if (!kycData.addressDocument.issueDate) newErrors['addressDocument.issueDate'] = 'Issue date is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const submitKYC = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/kyc/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(kycData)
      });
      
      const data = await response.json();
      if (data.success) {
        setKycStatus({
          status: data.status,
          applicationId: data.applicationId,
          verificationLevel: data.verificationLevel,
          riskScore: data.riskScore
        });
        setCurrentStep(4); // Success step
      } else {
        setErrors({ submit: 'Failed to submit KYC application' });
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      setErrors({ submit: 'Error submitting KYC application' });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={kycData.personalInfo.fullName}
            onChange={(e) => handleInputChange('personalInfo', 'fullName', e.target.value)}
            className={`w-full p-3 rounded-lg border ${
              errors['personalInfo.fullName'] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white`}
            placeholder="Enter your full name"
          />
          {errors['personalInfo.fullName'] && (
            <p className="text-red-500 text-sm mt-1">{errors['personalInfo.fullName']}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            value={kycData.personalInfo.dateOfBirth}
            onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
            className={`w-full p-3 rounded-lg border ${
              errors['personalInfo.dateOfBirth'] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white`}
          />
          {errors['personalInfo.dateOfBirth'] && (
            <p className="text-red-500 text-sm mt-1">{errors['personalInfo.dateOfBirth']}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={kycData.personalInfo.email}
            onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
            className={`w-full p-3 rounded-lg border ${
              errors['personalInfo.email'] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white`}
            placeholder="Enter your email address"
          />
          {errors['personalInfo.email'] && (
            <p className="text-red-500 text-sm mt-1">{errors['personalInfo.email']}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={kycData.personalInfo.phone}
            onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
            className={`w-full p-3 rounded-lg border ${
              errors['personalInfo.phone'] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white`}
            placeholder="Enter your phone number"
          />
          {errors['personalInfo.phone'] && (
            <p className="text-red-500 text-sm mt-1">{errors['personalInfo.phone']}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Address *
        </label>
        <textarea
          value={kycData.personalInfo.address}
          onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value)}
          className={`w-full p-3 rounded-lg border ${
            errors['personalInfo.address'] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-700 dark:text-white`}
          rows="3"
          placeholder="Enter your complete address"
        />
        {errors['personalInfo.address'] && (
          <p className="text-red-500 text-sm mt-1">{errors['personalInfo.address']}</p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Identity Document</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ID Type *
        </label>
        <select
          value={kycData.identityDocument.idType}
          onChange={(e) => handleInputChange('identityDocument', 'idType', e.target.value)}
          className={`w-full p-3 rounded-lg border ${
            errors['identityDocument.idType'] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-700 dark:text-white`}
        >
          <option value="">Select ID Type</option>
          <option value="aadhar">Aadhar Card</option>
          <option value="pan">PAN Card</option>
          <option value="passport">Passport</option>
          <option value="driving_license">Driving License</option>
        </select>
        {errors['identityDocument.idType'] && (
          <p className="text-red-500 text-sm mt-1">{errors['identityDocument.idType']}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ID Number *
        </label>
        <input
          type="text"
          value={kycData.identityDocument.idNumber}
          onChange={(e) => handleInputChange('identityDocument', 'idNumber', e.target.value)}
          className={`w-full p-3 rounded-lg border ${
            errors['identityDocument.idNumber'] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-700 dark:text-white`}
          placeholder="Enter your ID number"
        />
        {errors['identityDocument.idNumber'] && (
          <p className="text-red-500 text-sm mt-1">{errors['identityDocument.idNumber']}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Issue Date *
          </label>
          <input
            type="date"
            value={kycData.identityDocument.issueDate}
            onChange={(e) => handleInputChange('identityDocument', 'issueDate', e.target.value)}
            className={`w-full p-3 rounded-lg border ${
              errors['identityDocument.issueDate'] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white`}
          />
          {errors['identityDocument.issueDate'] && (
            <p className="text-red-500 text-sm mt-1">{errors['identityDocument.issueDate']}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expiry Date *
          </label>
          <input
            type="date"
            value={kycData.identityDocument.expiryDate}
            onChange={(e) => handleInputChange('identityDocument', 'expiryDate', e.target.value)}
            className={`w-full p-3 rounded-lg border ${
              errors['identityDocument.expiryDate'] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white`}
          />
          {errors['identityDocument.expiryDate'] && (
            <p className="text-red-500 text-sm mt-1">{errors['identityDocument.expiryDate']}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Address Document</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Address Document Type *
        </label>
        <select
          value={kycData.addressDocument.addressType}
          onChange={(e) => handleInputChange('addressDocument', 'addressType', e.target.value)}
          className={`w-full p-3 rounded-lg border ${
            errors['addressDocument.addressType'] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-700 dark:text-white`}
        >
          <option value="">Select Document Type</option>
          <option value="utility_bill">Utility Bill</option>
          <option value="bank_statement">Bank Statement</option>
          <option value="rental_agreement">Rental Agreement</option>
        </select>
        {errors['addressDocument.addressType'] && (
          <p className="text-red-500 text-sm mt-1">{errors['addressDocument.addressType']}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Issue Date *
        </label>
        <input
          type="date"
          value={kycData.addressDocument.issueDate}
          onChange={(e) => handleInputChange('addressDocument', 'issueDate', e.target.value)}
          className={`w-full p-3 rounded-lg border ${
            errors['addressDocument.issueDate'] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-700 dark:text-white`}
        />
        {errors['addressDocument.issueDate'] && (
          <p className="text-red-500 text-sm mt-1">{errors['addressDocument.issueDate']}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Upload Documents
        </label>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Identity Document (JPEG, PNG, PDF - Max 10MB)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'id_proof')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Address Document (JPEG, PNG, PDF - Max 10MB)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'address_proof')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Photo (JPEG, PNG - Max 10MB)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'photo')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          KYC Application Submitted Successfully!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Your application has been submitted and is under review.
        </p>
      </div>
      
      {kycStatus && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Application ID:</span>
              <p className="text-gray-600 dark:text-gray-400">{kycStatus.applicationId}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
              <p className="text-gray-600 dark:text-gray-400 capitalize">{kycStatus.status}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Verification Level:</span>
              <p className="text-gray-600 dark:text-gray-400">{kycStatus.verificationLevel}/5</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Risk Score:</span>
              <p className="text-gray-600 dark:text-gray-400">{kycStatus.riskScore}/100</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (kycStatus && kycStatus.status === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            KYC Verified!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your identity has been successfully verified. You can now access all platform features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">KYC Verification</h1>
            <p className="text-blue-100 mt-2">
              Complete your identity verification to access all platform features
            </p>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Personal Info</span>
              <span>Identity</span>
              <span>Address</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {errors.submit && (
              <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded-lg">
                {errors.submit}
              </div>
            )}

            {/* Navigation */}
            {currentStep < 4 && (
              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {currentStep < 3 ? (
                  <button
                    onClick={nextStep}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={submitKYC}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit KYC'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCVerification;


