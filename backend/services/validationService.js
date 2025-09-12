const crypto = require('crypto');
const Joi = require('joi');

class ValidationService {
  constructor() {
    this.validationRules = new Map();
    this.validationHistory = [];
    this.setupDefaultRules();
  }

  // Setup default validation rules
  setupDefaultRules() {
    // Fund allocation validation
    this.validationRules.set('fundAllocation', {
      amount: Joi.number().positive().max(1000).required(),
      centerAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
      sourceId: Joi.string().min(1).max(50).optional(),
      purpose: Joi.string().min(10).max(500).required()
    });

    // Training center registration validation
    this.validationRules.set('centerRegistration', {
      name: Joi.string().min(2).max(100).required(),
      location: Joi.string().min(5).max(200).required(),
      contactInfo: Joi.string().min(10).max(200).required(),
      centerAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
    });

    // Farmer registration validation
    this.validationRules.set('farmerRegistration', {
      name: Joi.string().min(2).max(100).required(),
      aadharNumber: Joi.string().pattern(/^[2-9]{1}[0-9]{11}$/).required(),
      contactInfo: Joi.string().min(10).max(200).required(),
      centerAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
    });

    // Trainer registration validation
    this.validationRules.set('trainerRegistration', {
      name: Joi.string().min(2).max(100).required(),
      qualifications: Joi.string().min(5).max(500).required(),
      experienceYears: Joi.number().integer().min(0).max(50).required(),
      contactInfo: Joi.string().min(10).max(200).required(),
      centerAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
    });

    // Usage report validation
    this.validationRules.set('usageReport', {
      amount: Joi.number().positive().required(),
      purpose: Joi.string().min(10).max(500).required(),
      attachments: Joi.array().items(Joi.string()).optional(),
      centerAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
    });

    // Compliance rule validation
    this.validationRules.set('complianceRule', {
      ruleId: Joi.string().min(1).max(50).required(),
      description: Joi.string().min(10).max(1000).required(),
      isActive: Joi.boolean().required()
    });

    // Validator registration validation
    this.validationRules.set('validatorRegistration', {
      validatorAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
      stake: Joi.number().positive().required(),
      name: Joi.string().min(2).max(100).optional()
    });
  }

  // Validate data against specific rule
  validateData(ruleName, data) {
    const rule = this.validationRules.get(ruleName);
    if (!rule) {
      throw new Error(`Validation rule '${ruleName}' not found`);
    }

    const schema = Joi.object(rule);
    const { error, value } = schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true 
    });

    const validationResult = {
      isValid: !error,
      data: value,
      errors: error ? error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      })) : [],
      timestamp: new Date(),
      ruleName
    };

    // Log validation attempt
    this.logValidation(ruleName, validationResult);

    return validationResult;
  }

  // Business logic validation
  validateBusinessRules(data, context) {
    const errors = [];

    // Fund allocation business rules
    if (context.type === 'fundAllocation') {
      // Check if center exists and is active
      if (!context.centerExists) {
        errors.push('Training center does not exist');
      }
      if (!context.centerActive) {
        errors.push('Training center is not active');
      }
      if (!context.kycVerified) {
        errors.push('Center KYC verification required');
      }
      if (!context.complianceApproved) {
        errors.push('Center compliance approval required');
      }

      // Check fund limits
      if (data.amount > context.maxAllocation) {
        errors.push(`Amount exceeds maximum allocation limit of ${context.maxAllocation} ETH`);
      }
      if (data.amount < context.minAllocation) {
        errors.push(`Amount below minimum allocation limit of ${context.minAllocation} ETH`);
      }

      // Check available budget
      if (data.amount > context.availableBudget) {
        errors.push('Insufficient budget available');
      }
    }

    // Training center registration business rules
    if (context.type === 'centerRegistration') {
      // Check if center already exists
      if (context.centerExists) {
        errors.push('Training center already registered');
      }

      // Check location uniqueness
      if (context.locationExists) {
        errors.push('Another center already exists at this location');
      }
    }

    // Farmer registration business rules
    if (context.type === 'farmerRegistration') {
      // Check if farmer already registered
      if (context.farmerExists) {
        errors.push('Farmer already registered');
      }

      // Check Aadhar uniqueness
      if (context.aadharExists) {
        errors.push('Aadhar number already registered');
      }

      // Check center capacity
      if (context.centerAtCapacity) {
        errors.push('Training center at maximum capacity');
      }
    }

    // Usage report business rules
    if (context.type === 'usageReport') {
      // Check if amount is within allocated funds
      if (data.amount > context.availableFunds) {
        errors.push('Amount exceeds available funds');
      }

      // Check if purpose is valid
      if (!this.isValidPurpose(data.purpose)) {
        errors.push('Invalid usage purpose');
      }

      // Check if attachments are valid
      if (data.attachments && !this.validateAttachments(data.attachments)) {
        errors.push('Invalid attachment format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      timestamp: new Date()
    };
  }

  // Validate transaction data
  validateTransaction(transactionData) {
    const errors = [];

    // Validate transaction hash
    if (!transactionData.hash || !this.isValidTransactionHash(transactionData.hash)) {
      errors.push('Invalid transaction hash');
    }

    // Validate sender address
    if (!transactionData.from || !this.isValidAddress(transactionData.from)) {
      errors.push('Invalid sender address');
    }

    // Validate receiver address
    if (!transactionData.to || !this.isValidAddress(transactionData.to)) {
      errors.push('Invalid receiver address');
    }

    // Validate amount
    if (!transactionData.value || !this.isValidAmount(transactionData.value)) {
      errors.push('Invalid transaction amount');
    }

    // Validate gas parameters
    if (!transactionData.gasLimit || transactionData.gasLimit < 21000) {
      errors.push('Invalid gas limit');
    }

    if (!transactionData.gasPrice || transactionData.gasPrice <= 0) {
      errors.push('Invalid gas price');
    }

    // Validate nonce
    if (transactionData.nonce === undefined || transactionData.nonce < 0) {
      errors.push('Invalid nonce');
    }

    return {
      isValid: errors.length === 0,
      errors,
      timestamp: new Date()
    };
  }

  // Validate smart contract interaction
  validateContractInteraction(interactionData) {
    const errors = [];

    // Validate contract address
    if (!interactionData.contractAddress || !this.isValidAddress(interactionData.contractAddress)) {
      errors.push('Invalid contract address');
    }

    // Validate function name
    if (!interactionData.functionName || !this.isValidFunctionName(interactionData.functionName)) {
      errors.push('Invalid function name');
    }

    // Validate parameters
    if (interactionData.parameters) {
      const paramValidation = this.validateFunctionParameters(
        interactionData.functionName,
        interactionData.parameters
      );
      if (!paramValidation.isValid) {
        errors.push(...paramValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      timestamp: new Date()
    };
  }

  // Validate data integrity
  validateDataIntegrity(data, expectedHash) {
    const actualHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    
    return {
      isValid: actualHash === expectedHash,
      actualHash,
      expectedHash,
      timestamp: new Date()
    };
  }

  // Validate file upload
  validateFileUpload(fileData) {
    const errors = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    // Check file size
    if (fileData.size > maxSize) {
      errors.push('File size exceeds 10MB limit');
    }

    // Check file type
    if (!allowedTypes.includes(fileData.mimetype)) {
      errors.push('Invalid file type. Only JPEG, PNG, and PDF are allowed');
    }

    // Check file content
    if (!fileData.buffer || fileData.buffer.length === 0) {
      errors.push('Empty file content');
    }

    return {
      isValid: errors.length === 0,
      errors,
      timestamp: new Date()
    };
  }

  // Validate API request
  validateAPIRequest(requestData, requiredFields) {
    const errors = [];

    for (const field of requiredFields) {
      if (!requestData[field]) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    // Validate request headers
    if (!requestData.headers || !requestData.headers['content-type']) {
      errors.push('Content-Type header is required');
    }

    // Validate authentication
    if (!requestData.headers || !requestData.headers['x-auth-token']) {
      errors.push('Authentication token is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      timestamp: new Date()
    };
  }

  // Helper methods
  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  isValidTransactionHash(hash) {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }

  isValidAmount(amount) {
    return typeof amount === 'string' && /^\d+(\.\d+)?$/.test(amount) && parseFloat(amount) > 0;
  }

  isValidFunctionName(functionName) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(functionName);
  }

  isValidPurpose(purpose) {
    const validPurposes = [
      'training_materials',
      'equipment_purchase',
      'facility_maintenance',
      'trainer_salaries',
      'certification_costs',
      'transportation',
      'other'
    ];
    return validPurposes.includes(purpose.toLowerCase());
  }

  validateAttachments(attachments) {
    if (!Array.isArray(attachments)) return false;
    
    return attachments.every(attachment => 
      typeof attachment === 'string' && 
      attachment.length > 0 && 
      attachment.length < 1000
    );
  }

  validateFunctionParameters(functionName, parameters) {
    // This would contain specific validation logic for each function
    // For now, return a basic validation
    return {
      isValid: true,
      errors: []
    };
  }

  // Log validation attempt
  logValidation(ruleName, result) {
    this.validationHistory.push({
      ruleName,
      result,
      timestamp: new Date()
    });

    // Keep only last 1000 validation logs
    if (this.validationHistory.length > 1000) {
      this.validationHistory = this.validationHistory.slice(-1000);
    }
  }

  // Get validation statistics
  getValidationStats() {
    const total = this.validationHistory.length;
    const successful = this.validationHistory.filter(log => log.result.isValid).length;
    const failed = total - successful;

    const ruleStats = {};
    this.validationHistory.forEach(log => {
      if (!ruleStats[log.ruleName]) {
        ruleStats[log.ruleName] = { total: 0, successful: 0, failed: 0 };
      }
      ruleStats[log.ruleName].total++;
      if (log.result.isValid) {
        ruleStats[log.ruleName].successful++;
      } else {
        ruleStats[log.ruleName].failed++;
      }
    });

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      ruleStats
    };
  }

  // Add custom validation rule
  addValidationRule(ruleName, rule) {
    this.validationRules.set(ruleName, rule);
  }

  // Remove validation rule
  removeValidationRule(ruleName) {
    this.validationRules.delete(ruleName);
  }

  // Get all validation rules
  getAllValidationRules() {
    return Array.from(this.validationRules.entries()).map(([name, rule]) => ({
      name,
      rule
    }));
  }
}

module.exports = ValidationService;


