import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const EnhancedKYCVerification = () => {
  const { user, kycStatus, checkKYCStatus } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [kycData, setKycData] = useState({
    personalInfo: {
      fullName: '',
      dateOfBirth: '',
      email: user?.email || '',
      phone: '',
      address: '',
      gender: '',
      nationality: ''
    },
    identityDocument: {
      idType: '',
      idNumber: '',
      issueDate: '',
      expiryDate: '',
      issuingAuthority: ''
    },
    addressDocument: {
      addressType: '',
      issueDate: '',
      documentNumber: ''
    },
    documents: {
      identityFront: null,
      identityBack: null,
      addressProof: null,
      selfie: null
    }
  });
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    if (kycStatus === 'verified') {
      setCurrentStep(5); // Show success step
    }
  }, [kycStatus]);

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

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [`documents.${type}`]: 'Only JPEG, PNG, and PDF files are allowed'
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [`documents.${type}`]: 'File size must be less than 5MB'
      }));
      return;
    }

    setUploading(true);
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('userId', user.id);

      const response = await axios.post('http://localhost:3001/api/kyc/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': localStorage.getItem('token')
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [type]: percentCompleted }));
        }
      });

      if (response.data.success) {
        setKycData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [type]: {
              file: file,
              url: response.data.url,
              uploaded: true
            }
          }
        }));

        setErrors(prev => ({
          ...prev,
          [`documents.${type}`]: null
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors(prev => ({
        ...prev,
        [`documents.${type}`]: 'Upload failed. Please try again.'
      }));
    } finally {
      setUploading(false);
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!kycData.personalInfo.fullName) newErrors['personalInfo.fullName'] = 'Full name is required';
        if (!kycData.personalInfo.dateOfBirth) newErrors['personalInfo.dateOfBirth'] = 'Date of birth is required';
        if (!kycData.personalInfo.phone) newErrors['personalInfo.phone'] = 'Phone number is required';
        if (!kycData.personalInfo.address) newErrors['personalInfo.address'] = 'Address is required';
        if (!kycData.personalInfo.gender) newErrors['personalInfo.gender'] = 'Gender is required';
        if (!kycData.personalInfo.nationality) newErrors['personalInfo.nationality'] = 'Nationality is required';
        break;
      case 2:
        if (!kycData.identityDocument.idType) newErrors['identityDocument.idType'] = 'ID type is required';
        if (!kycData.identityDocument.idNumber) newErrors['identityDocument.idNumber'] = 'ID number is required';
        if (!kycData.identityDocument.issueDate) newErrors['identityDocument.issueDate'] = 'Issue date is required';
        if (!kycData.identityDocument.expiryDate) newErrors['identityDocument.expiryDate'] = 'Expiry date is required';
        if (!kycData.identityDocument.issuingAuthority) newErrors['identityDocument.issuingAuthority'] = 'Issuing authority is required';
        break;
      case 3:
        if (!kycData.addressDocument.addressType) newErrors['addressDocument.addressType'] = 'Address document type is required';
        if (!kycData.addressDocument.issueDate) newErrors['addressDocument.issueDate'] = 'Issue date is required';
        break;
      case 4:
        if (!kycData.documents.identityFront) newErrors['documents.identityFront'] = 'Identity document front is required';
        if (!kycData.documents.identityBack) newErrors['documents.identityBack'] = 'Identity document back is required';
        if (!kycData.documents.addressProof) newErrors['documents.addressProof'] = 'Address proof document is required';
        if (!kycData.documents.selfie) newErrors['documents.selfie'] = 'Selfie with document is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/kyc/submit', {
        personalInfo: kycData.personalInfo,
        identityDocument: kycData.identityDocument,
        addressDocument: kycData.addressDocument,
        documents: kycData.documents
      }, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });

      if (response.data.success) {
        setCurrentStep(5);
        await checkKYCStatus();
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      setErrors({ submit: 'Failed to submit KYC application. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={kycData.personalInfo.fullName}
            onChange={(e) => handleInputChange('personalInfo', 'fullName', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {errors['personalInfo.dateOfBirth'] && (
            <p className="text-red-500 text-sm mt-1">{errors['personalInfo.dateOfBirth']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={kycData.personalInfo.email}
            disabled
            className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={kycData.personalInfo.phone}
            onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="+91 9876543210"
          />
          {errors['personalInfo.phone'] && (
            <p className="text-red-500 text-sm mt-1">{errors['personalInfo.phone']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Gender *
          </label>
          <select
            value={kycData.personalInfo.gender}
            onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors['personalInfo.gender'] && (
            <p className="text-red-500 text-sm mt-1">{errors['personalInfo.gender']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nationality *
          </label>
          <input
            type="text"
            value={kycData.personalInfo.nationality}
            onChange={(e) => handleInputChange('personalInfo', 'nationality', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., Indian"
          />
          {errors['personalInfo.nationality'] && (
            <p className="text-red-500 text-sm mt-1">{errors['personalInfo.nationality']}</p>
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
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Identity Document</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Document Type *
          </label>
          <select
            value={kycData.identityDocument.idType}
            onChange={(e) => handleInputChange('identityDocument', 'idType', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select Document Type</option>
            <option value="aadhaar">Aadhaar Card</option>
            <option value="passport">Passport</option>
            <option value="driving_license">Driving License</option>
            <option value="voter_id">Voter ID</option>
            <option value="pan_card">PAN Card</option>
          </select>
          {errors['identityDocument.idType'] && (
            <p className="text-red-500 text-sm mt-1">{errors['identityDocument.idType']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Document Number *
          </label>
          <input
            type="text"
            value={kycData.identityDocument.idNumber}
            onChange={(e) => handleInputChange('identityDocument', 'idNumber', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter document number"
          />
          {errors['identityDocument.idNumber'] && (
            <p className="text-red-500 text-sm mt-1">{errors['identityDocument.idNumber']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Issue Date *
          </label>
          <input
            type="date"
            value={kycData.identityDocument.issueDate}
            onChange={(e) => handleInputChange('identityDocument', 'issueDate', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {errors['identityDocument.expiryDate'] && (
            <p className="text-red-500 text-sm mt-1">{errors['identityDocument.expiryDate']}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Issuing Authority *
          </label>
          <input
            type="text"
            value={kycData.identityDocument.issuingAuthority}
            onChange={(e) => handleInputChange('identityDocument', 'issuingAuthority', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., Government of India"
          />
          {errors['identityDocument.issuingAuthority'] && (
            <p className="text-red-500 text-sm mt-1">{errors['identityDocument.issuingAuthority']}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Address Proof</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Document Type *
          </label>
          <select
            value={kycData.addressDocument.addressType}
            onChange={(e) => handleInputChange('addressDocument', 'addressType', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select Document Type</option>
            <option value="utility_bill">Utility Bill (Electricity/Water/Gas)</option>
            <option value="bank_statement">Bank Statement</option>
            <option value="rent_agreement">Rent Agreement</option>
            <option value="property_document">Property Document</option>
            <option value="aadhaar_card">Aadhaar Card (Address)</option>
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
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {errors['addressDocument.issueDate'] && (
            <p className="text-red-500 text-sm mt-1">{errors['addressDocument.issueDate']}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Upload</h3>
      <p className="text-gray-600 dark:text-gray-300">
        Please upload clear, high-quality images of your documents. All documents should be in JPEG, PNG, or PDF format and less than 5MB.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { key: 'identityFront', label: 'Identity Document Front', required: true },
          { key: 'identityBack', label: 'Identity Document Back', required: true },
          { key: 'addressProof', label: 'Address Proof Document', required: true },
          { key: 'selfie', label: 'Selfie with Document', required: true }
        ].map(({ key, label, required }) => (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label} {required && '*'}
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e.target.files[0], key)}
                className="hidden"
                id={`file-${key}`}
              />
              <label htmlFor={`file-${key}`} className="cursor-pointer">
                {kycData.documents[key] ? (
                  <div className="space-y-2">
                    <div className="text-green-600 dark:text-green-400">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {kycData.documents[key].file?.name}
                    </p>
                    {uploadProgress[key] > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[key]}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      JPEG, PNG, PDF up to 5MB
                    </p>
                  </div>
                )}
              </label>
            </div>
            
            {errors[`documents.${key}`] && (
              <p className="text-red-500 text-sm">{errors[`documents.${key}`]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900">
        <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
        KYC Verification Complete!
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300">
        Your KYC verification has been submitted successfully. Our team will review your documents and you will be notified once the verification is complete.
      </p>
      
      <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Status:</strong> {kycStatus === 'verified' ? 'Verified' : 'Under Review'}
        </p>
      </div>
    </div>
  );

  if (kycStatus === 'verified') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {renderStep5()}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {currentStep} of 4
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round((currentStep / 4) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        {/* Error Messages */}
        {errors.submit && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 5 && (
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={uploading}
                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || uploading}
                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit KYC'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedKYCVerification;
