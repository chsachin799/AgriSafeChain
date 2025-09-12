const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class KYCService {
  constructor() {
    this.kycData = new Map();
    this.documentStorage = new Map();
    this.verificationQueue = [];
    this.kycRules = {
      minAge: 18,
      requiredDocuments: ['id_proof', 'address_proof', 'photo'],
      supportedIdTypes: ['aadhar', 'pan', 'passport', 'driving_license'],
      supportedAddressTypes: ['utility_bill', 'bank_statement', 'rental_agreement']
    };
  }

  // Document validation
  validateDocument(document) {
    const errors = [];
    
    if (!document.type) {
      errors.push('Document type is required');
    }
    
    if (!document.content) {
      errors.push('Document content is required');
    }
    
    if (!document.mimeType) {
      errors.push('Document MIME type is required');
    }
    
    // Validate file size (max 10MB)
    if (document.size && document.size > 10 * 1024 * 1024) {
      errors.push('Document size exceeds 10MB limit');
    }
    
    // Validate MIME types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf'
    ];
    
    if (!allowedMimeTypes.includes(document.mimeType)) {
      errors.push('Invalid document format. Only JPEG, PNG, and PDF are allowed');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Personal information validation
  validatePersonalInfo(personalInfo) {
    const errors = [];
    
    // Name validation
    if (!personalInfo.fullName || personalInfo.fullName.length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }
    
    // Age validation
    if (!personalInfo.dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const age = this.calculateAge(personalInfo.dateOfBirth);
      if (age < this.kycRules.minAge) {
        errors.push(`Age must be at least ${this.kycRules.minAge} years`);
      }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!personalInfo.email || !emailRegex.test(personalInfo.email)) {
      errors.push('Valid email address is required');
    }
    
    // Phone validation
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
    if (!personalInfo.phone || !phoneRegex.test(personalInfo.phone)) {
      errors.push('Valid phone number is required');
    }
    
    // Address validation
    if (!personalInfo.address || personalInfo.address.length < 10) {
      errors.push('Complete address is required (minimum 10 characters)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Identity document validation
  validateIdentityDocument(identityDoc) {
    const errors = [];
    
    if (!identityDoc.idType) {
      errors.push('ID type is required');
    } else if (!this.kycRules.supportedIdTypes.includes(identityDoc.idType)) {
      errors.push(`Unsupported ID type. Supported types: ${this.kycRules.supportedIdTypes.join(', ')}`);
    }
    
    if (!identityDoc.idNumber) {
      errors.push('ID number is required');
    } else {
      // Validate ID number format based on type
      const validation = this.validateIdNumber(identityDoc.idType, identityDoc.idNumber);
      if (!validation.isValid) {
        errors.push(validation.error);
      }
    }
    
    if (!identityDoc.issueDate) {
      errors.push('Issue date is required');
    }
    
    if (!identityDoc.expiryDate) {
      errors.push('Expiry date is required');
    } else if (new Date(identityDoc.expiryDate) <= new Date()) {
      errors.push('ID document has expired');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Address document validation
  validateAddressDocument(addressDoc) {
    const errors = [];
    
    if (!addressDoc.addressType) {
      errors.push('Address document type is required');
    } else if (!this.kycRules.supportedAddressTypes.includes(addressDoc.addressType)) {
      errors.push(`Unsupported address document type. Supported types: ${this.kycRules.supportedAddressTypes.join(', ')}`);
    }
    
    if (!addressDoc.issueDate) {
      errors.push('Issue date is required');
    } else {
      // Address document should not be older than 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      if (new Date(addressDoc.issueDate) < threeMonthsAgo) {
        errors.push('Address document should not be older than 3 months');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ID number validation based on type
  validateIdNumber(idType, idNumber) {
    switch (idType) {
      case 'aadhar':
        return this.validateAadharNumber(idNumber);
      case 'pan':
        return this.validatePANNumber(idNumber);
      case 'passport':
        return this.validatePassportNumber(idNumber);
      case 'driving_license':
        return this.validateDrivingLicenseNumber(idNumber);
      default:
        return { isValid: false, error: 'Unknown ID type' };
    }
  }

  validateAadharNumber(aadhar) {
    const aadharRegex = /^[2-9]{1}[0-9]{11}$/;
    if (!aadharRegex.test(aadhar)) {
      return { isValid: false, error: 'Invalid Aadhar number format' };
    }
    
    // Verhoeff algorithm for Aadhar validation
    if (!this.verhoeffCheck(aadhar)) {
      return { isValid: false, error: 'Invalid Aadhar number checksum' };
    }
    
    return { isValid: true };
  }

  validatePANNumber(pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan)) {
      return { isValid: false, error: 'Invalid PAN number format' };
    }
    return { isValid: true };
  }

  validatePassportNumber(passport) {
    const passportRegex = /^[A-Z]{1}[0-9]{7}$/;
    if (!passportRegex.test(passport)) {
      return { isValid: false, error: 'Invalid passport number format' };
    }
    return { isValid: true };
  }

  validateDrivingLicenseNumber(dl) {
    const dlRegex = /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/;
    if (!dlRegex.test(dl)) {
      return { isValid: false, error: 'Invalid driving license number format' };
    }
    return { isValid: true };
  }

  // Verhoeff algorithm for Aadhar validation
  verhoeffCheck(number) {
    const multiplication = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];
    
    const permutation = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];
    
    let checksum = 0;
    const digits = number.split('').reverse();
    
    for (let i = 0; i < digits.length; i++) {
      checksum = multiplication[checksum][permutation[((i + 1) % 8)][parseInt(digits[i])]];
    }
    
    return checksum === 0;
  }

  // Calculate age from date of birth
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Store document securely
  storeDocument(userId, documentType, document) {
    const documentId = crypto.randomUUID();
    const documentData = {
      id: documentId,
      userId,
      type: documentType,
      content: document.content,
      mimeType: document.mimeType,
      size: document.size,
      uploadedAt: new Date(),
      hash: crypto.createHash('sha256').update(document.content).digest('hex')
    };
    
    this.documentStorage.set(documentId, documentData);
    return documentId;
  }

  // Submit KYC application
  submitKYCApplication(userId, kycData) {
    const applicationId = crypto.randomUUID();
    const timestamp = new Date();
    
    // Validate all components
    const personalValidation = this.validatePersonalInfo(kycData.personalInfo);
    const identityValidation = this.validateIdentityDocument(kycData.identityDocument);
    const addressValidation = this.validateAddressDocument(kycData.addressDocument);
    
    const allValidations = [
      ...personalValidation.errors,
      ...identityValidation.errors,
      ...addressValidation.errors
    ];
    
    // Validate documents
    const documentValidations = [];
    for (const doc of kycData.documents) {
      const validation = this.validateDocument(doc);
      if (!validation.isValid) {
        documentValidations.push(...validation.errors);
      }
    }
    
    const allErrors = [...allValidations, ...documentValidations];
    
    const application = {
      id: applicationId,
      userId,
      status: allErrors.length === 0 ? 'pending' : 'rejected',
      submittedAt: timestamp,
      personalInfo: kycData.personalInfo,
      identityDocument: kycData.identityDocument,
      addressDocument: kycData.addressDocument,
      documents: kycData.documents.map(doc => this.storeDocument(userId, doc.type, doc)),
      validationErrors: allErrors,
      verificationLevel: this.calculateVerificationLevel(kycData),
      riskScore: this.calculateRiskScore(kycData)
    };
    
    this.kycData.set(applicationId, application);
    
    if (application.status === 'pending') {
      this.verificationQueue.push(applicationId);
    }
    
    return {
      applicationId,
      status: application.status,
      errors: allErrors,
      verificationLevel: application.verificationLevel,
      riskScore: application.riskScore
    };
  }

  // Calculate verification level
  calculateVerificationLevel(kycData) {
    let level = 0;
    
    // Basic personal info
    if (kycData.personalInfo) level += 1;
    
    // Identity document
    if (kycData.identityDocument) level += 2;
    
    // Address document
    if (kycData.addressDocument) level += 1;
    
    // Additional documents
    if (kycData.documents && kycData.documents.length > 0) {
      level += Math.min(kycData.documents.length, 2);
    }
    
    return Math.min(level, 5); // Max level 5
  }

  // Calculate risk score
  calculateRiskScore(kycData) {
    let score = 0;
    
    // Age factor
    const age = this.calculateAge(kycData.personalInfo.dateOfBirth);
    if (age < 25 || age > 65) score += 10;
    
    // Document age
    if (kycData.identityDocument.issueDate) {
      const docAge = (new Date() - new Date(kycData.identityDocument.issueDate)) / (1000 * 60 * 60 * 24 * 365);
      if (docAge > 10) score += 15;
    }
    
    // Multiple ID types (positive)
    if (kycData.documents && kycData.documents.length > 2) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }

  // Process verification queue
  processVerificationQueue() {
    const processed = [];
    
    for (const applicationId of this.verificationQueue) {
      const application = this.kycData.get(applicationId);
      if (!application) continue;
      
      // Simulate verification process
      const verificationResult = this.performVerification(application);
      
      application.status = verificationResult.status;
      application.verifiedAt = new Date();
      application.verificationNotes = verificationResult.notes;
      
      this.kycData.set(applicationId, application);
      processed.push(applicationId);
    }
    
    // Remove processed applications from queue
    this.verificationQueue = this.verificationQueue.filter(id => !processed.includes(id));
    
    return processed;
  }

  // Perform verification
  performVerification(application) {
    // Simulate verification logic
    const riskScore = application.riskScore;
    const verificationLevel = application.verificationLevel;
    
    if (riskScore > 70) {
      return {
        status: 'rejected',
        notes: 'High risk score detected'
      };
    }
    
    if (verificationLevel < 3) {
      return {
        status: 'rejected',
        notes: 'Insufficient verification level'
      };
    }
    
    if (riskScore > 40) {
      return {
        status: 'pending_manual_review',
        notes: 'Requires manual review due to moderate risk score'
      };
    }
    
    return {
      status: 'approved',
      notes: 'Automated verification successful'
    };
  }

  // Get KYC status
  getKYCStatus(userId) {
    const applications = Array.from(this.kycData.values())
      .filter(app => app.userId === userId)
      .sort((a, b) => b.submittedAt - a.submittedAt);
    
    return applications[0] || null;
  }

  // Get all KYC applications (admin)
  getAllKYCApplications() {
    return Array.from(this.kycData.values());
  }

  // Update KYC status (admin)
  updateKYCStatus(applicationId, status, notes) {
    const application = this.kycData.get(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }
    
    application.status = status;
    application.updatedAt = new Date();
    application.adminNotes = notes;
    
    this.kycData.set(applicationId, application);
    return application;
  }
}

module.exports = KYCService;


