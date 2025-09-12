const crypto = require('crypto');
const EventEmitter = require('events');

class ConsensusService extends EventEmitter {
  constructor() {
    super();
    this.validators = new Map();
    this.pendingTransactions = new Map();
    this.consensusThreshold = 3;
    this.consensusTimeout = 30000; // 30 seconds
    this.validatorStakes = new Map();
    this.consensusHistory = [];
    this.isConsensusActive = false;
  }

  // Register a validator
  registerValidator(validatorAddress, stake, metadata = {}) {
    if (this.validators.has(validatorAddress)) {
      throw new Error('Validator already registered');
    }

    const validator = {
      address: validatorAddress,
      stake: stake,
      isActive: true,
      registeredAt: new Date(),
      totalValidations: 0,
      successfulValidations: 0,
      reputation: 100,
      metadata: {
        name: metadata.name || '',
        location: metadata.location || '',
        ...metadata
      }
    };

    this.validators.set(validatorAddress, validator);
    this.validatorStakes.set(validatorAddress, stake);
    
    this.emit('validatorRegistered', validator);
    
    return validator;
  }

  // Remove a validator
  removeValidator(validatorAddress) {
    if (!this.validators.has(validatorAddress)) {
      throw new Error('Validator not found');
    }

    const validator = this.validators.get(validatorAddress);
    this.validators.delete(validatorAddress);
    this.validatorStakes.delete(validatorAddress);
    
    this.emit('validatorRemoved', validator);
    
    return validator;
  }

  // Update validator stake
  updateValidatorStake(validatorAddress, newStake) {
    if (!this.validators.has(validatorAddress)) {
      throw new Error('Validator not found');
    }

    const validator = this.validators.get(validatorAddress);
    const oldStake = validator.stake;
    
    validator.stake = newStake;
    this.validatorStakes.set(validatorAddress, newStake);
    
    this.emit('validatorStakeUpdated', { validator, oldStake, newStake });
    
    return validator;
  }

  // Submit transaction for consensus
  submitTransaction(transactionData, submitterAddress) {
    const transactionId = crypto.randomUUID();
    const timestamp = new Date();

    const transaction = {
      id: transactionId,
      data: transactionData,
      submitter: submitterAddress,
      submittedAt: timestamp,
      status: 'pending',
      validations: new Map(),
      consensusReached: false,
      consensusTimestamp: null,
      timeout: new Date(timestamp.getTime() + this.consensusTimeout)
    };

    this.pendingTransactions.set(transactionId, transaction);
    
    this.emit('transactionSubmitted', transaction);
    
    // Start consensus process
    this.startConsensusProcess(transactionId);
    
    return transactionId;
  }

  // Start consensus process
  startConsensusProcess(transactionId) {
    const transaction = this.pendingTransactions.get(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    this.isConsensusActive = true;
    
    // Notify all active validators
    this.notifyValidators(transactionId);
    
    // Set timeout for consensus
    setTimeout(() => {
      this.handleConsensusTimeout(transactionId);
    }, this.consensusTimeout);
  }

  // Notify validators about new transaction
  notifyValidators(transactionId) {
    const transaction = this.pendingTransactions.get(transactionId);
    if (!transaction) return;

    const activeValidators = Array.from(this.validators.values())
      .filter(v => v.isActive)
      .sort((a, b) => b.stake - a.stake); // Sort by stake

    this.emit('consensusStarted', {
      transactionId,
      validators: activeValidators,
      threshold: this.consensusThreshold
    });
  }

  // Validate transaction
  validateTransaction(transactionId, validatorAddress, validationResult) {
    if (!this.validators.has(validatorAddress)) {
      throw new Error('Validator not registered');
    }

    if (!this.pendingTransactions.has(transactionId)) {
      throw new Error('Transaction not found');
    }

    const transaction = this.pendingTransactions.get(transactionId);
    const validator = this.validators.get(validatorAddress);

    // Check if validator already validated this transaction
    if (transaction.validations.has(validatorAddress)) {
      throw new Error('Validator already validated this transaction');
    }

    // Check if consensus already reached
    if (transaction.consensusReached) {
      throw new Error('Consensus already reached for this transaction');
    }

    // Check if transaction has timed out
    if (new Date() > transaction.timeout) {
      throw new Error('Transaction validation timeout');
    }

    // Record validation
    const validation = {
      validatorAddress,
      result: validationResult.isValid,
      timestamp: new Date(),
      reason: validationResult.reason || '',
      stake: validator.stake
    };

    transaction.validations.set(validatorAddress, validation);
    
    // Update validator stats
    validator.totalValidations++;
    if (validationResult.isValid) {
      validator.successfulValidations++;
    }

    this.emit('transactionValidated', {
      transactionId,
      validatorAddress,
      validation
    });

    // Check if consensus reached
    this.checkConsensus(transactionId);

    return validation;
  }

  // Check if consensus is reached
  checkConsensus(transactionId) {
    const transaction = this.pendingTransactions.get(transactionId);
    if (!transaction) return;

    const validations = Array.from(transaction.validations.values());
    const validValidations = validations.filter(v => v.result);
    const invalidValidations = validations.filter(v => !v.result);

    // Check if we have enough validations
    if (validations.length >= this.consensusThreshold) {
      // Check if majority is valid
      if (validValidations.length > invalidValidations.length) {
        this.reachConsensus(transactionId, 'approved', validValidations);
      } else {
        this.reachConsensus(transactionId, 'rejected', invalidValidations);
      }
    }
  }

  // Reach consensus
  reachConsensus(transactionId, decision, validations) {
    const transaction = this.pendingTransactions.get(transactionId);
    if (!transaction) return;

    transaction.status = decision;
    transaction.consensusReached = true;
    transaction.consensusTimestamp = new Date();
    transaction.consensusValidations = validations;

    // Calculate consensus score
    const totalStake = validations.reduce((sum, v) => sum + v.stake, 0);
    const consensusScore = (totalStake / this.getTotalStake()) * 100;

    const consensusResult = {
      transactionId,
      decision,
      validations,
      consensusScore,
      timestamp: new Date()
    };

    this.consensusHistory.push(consensusResult);
    
    this.emit('consensusReached', consensusResult);

    // Update validator reputations
    this.updateValidatorReputations(validations, decision === 'approved');

    // Remove from pending transactions
    this.pendingTransactions.delete(transactionId);
  }

  // Handle consensus timeout
  handleConsensusTimeout(transactionId) {
    const transaction = this.pendingTransactions.get(transactionId);
    if (!transaction || transaction.consensusReached) return;

    transaction.status = 'timeout';
    transaction.consensusReached = true;
    transaction.consensusTimestamp = new Date();

    this.emit('consensusTimeout', {
      transactionId,
      transaction
    });

    // Remove from pending transactions
    this.pendingTransactions.delete(transactionId);
  }

  // Update validator reputations
  updateValidatorReputations(validations, wasApproved) {
    validations.forEach(validation => {
      const validator = this.validators.get(validation.validatorAddress);
      if (!validator) return;

      // Increase reputation for correct validations
      if ((validation.result && wasApproved) || (!validation.result && !wasApproved)) {
        validator.reputation = Math.min(100, validator.reputation + 1);
      } else {
        // Decrease reputation for incorrect validations
        validator.reputation = Math.max(0, validator.reputation - 2);
      }
    });
  }

  // Get total stake
  getTotalStake() {
    return Array.from(this.validatorStakes.values())
      .reduce((sum, stake) => sum + stake, 0);
  }

  // Get consensus statistics
  getConsensusStats() {
    const totalTransactions = this.consensusHistory.length;
    const approvedTransactions = this.consensusHistory.filter(c => c.decision === 'approved').length;
    const rejectedTransactions = this.consensusHistory.filter(c => c.decision === 'rejected').length;
    const timeoutTransactions = this.consensusHistory.filter(c => c.decision === 'timeout').length;

    const averageConsensusTime = this.consensusHistory.length > 0 
      ? this.consensusHistory.reduce((sum, c) => {
          const timeDiff = c.timestamp - this.consensusHistory[0].timestamp;
          return sum + timeDiff;
        }, 0) / this.consensusHistory.length
      : 0;

    return {
      totalTransactions,
      approvedTransactions,
      rejectedTransactions,
      timeoutTransactions,
      approvalRate: totalTransactions > 0 ? (approvedTransactions / totalTransactions) * 100 : 0,
      averageConsensusTime,
      activeValidators: Array.from(this.validators.values()).filter(v => v.isActive).length,
      totalStake: this.getTotalStake()
    };
  }

  // Get validator performance
  getValidatorPerformance(validatorAddress) {
    const validator = this.validators.get(validatorAddress);
    if (!validator) {
      throw new Error('Validator not found');
    }

    const successRate = validator.totalValidations > 0 
      ? (validator.successfulValidations / validator.totalValidations) * 100 
      : 0;

    return {
      address: validatorAddress,
      stake: validator.stake,
      reputation: validator.reputation,
      totalValidations: validator.totalValidations,
      successfulValidations: validator.successfulValidations,
      successRate,
      registeredAt: validator.registeredAt
    };
  }

  // Get all validators
  getAllValidators() {
    return Array.from(this.validators.values());
  }

  // Get pending transactions
  getPendingTransactions() {
    return Array.from(this.pendingTransactions.values());
  }

  // Get consensus history
  getConsensusHistory(limit = 100) {
    return this.consensusHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Update consensus threshold
  updateConsensusThreshold(newThreshold) {
    if (newThreshold < 1) {
      throw new Error('Consensus threshold must be at least 1');
    }

    const oldThreshold = this.consensusThreshold;
    this.consensusThreshold = newThreshold;

    this.emit('consensusThresholdUpdated', {
      oldThreshold,
      newThreshold
    });

    return newThreshold;
  }

  // Update consensus timeout
  updateConsensusTimeout(newTimeout) {
    if (newTimeout < 1000) {
      throw new Error('Consensus timeout must be at least 1000ms');
    }

    const oldTimeout = this.consensusTimeout;
    this.consensusTimeout = newTimeout;

    this.emit('consensusTimeoutUpdated', {
      oldTimeout,
      newTimeout
    });

    return newTimeout;
  }

  // Force consensus (admin only)
  forceConsensus(transactionId, decision, reason = '') {
    const transaction = this.pendingTransactions.get(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = decision;
    transaction.consensusReached = true;
    transaction.consensusTimestamp = new Date();
    transaction.forcedConsensus = true;
    transaction.forceReason = reason;

    this.emit('consensusForced', {
      transactionId,
      decision,
      reason
    });

    // Remove from pending transactions
    this.pendingTransactions.delete(transactionId);

    return transaction;
  }

  // Pause consensus
  pauseConsensus() {
    this.isConsensusActive = false;
    this.emit('consensusPaused');
  }

  // Resume consensus
  resumeConsensus() {
    this.isConsensusActive = true;
    this.emit('consensusResumed');
  }

  // Get consensus status
  getConsensusStatus() {
    return {
      isActive: this.isConsensusActive,
      threshold: this.consensusThreshold,
      timeout: this.consensusTimeout,
      activeValidators: Array.from(this.validators.values()).filter(v => v.isActive).length,
      pendingTransactions: this.pendingTransactions.size,
      totalStake: this.getTotalStake()
    };
  }
}

module.exports = ConsensusService;


