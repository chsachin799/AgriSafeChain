const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
    this.keyStorage = new Map();
    this.encryptionHistory = [];
    this.maxHistorySize = 1000;
  }

  // Generate a new encryption key
  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  // Generate a new IV (Initialization Vector)
  generateIV() {
    return crypto.randomBytes(this.ivLength);
  }

  // Derive key from password using PBKDF2
  deriveKeyFromPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha512');
  }

  // Encrypt data
  encrypt(data, key, iv = null) {
    try {
      // Generate IV if not provided
      if (!iv) {
        iv = this.generateIV();
      }

      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, key);
      
      // Encrypt data
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();

      const result = {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: this.algorithm,
        timestamp: new Date()
      };

      // Log encryption
      this.logEncryption('encrypt', result);

      return result;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  // Decrypt data
  decrypt(encryptedData, key, iv, tag) {
    try {
      // Convert hex strings back to buffers
      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');

      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAuthTag(tagBuffer);

      // Decrypt data
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // Parse JSON
      const result = JSON.parse(decrypted);

      // Log decryption
      this.logEncryption('decrypt', { timestamp: new Date() });

      return result;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  // Encrypt file
  encryptFile(filePath, outputPath, key) {
    try {
      const data = fs.readFileSync(filePath);
      const iv = this.generateIV();
      
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from(filePath, 'utf8')); // Use file path as additional authenticated data
      
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const tag = cipher.getAuthTag();
      
      // Write encrypted file with metadata
      const encryptedFile = {
        data: encrypted,
        iv: iv,
        tag: tag,
        originalPath: filePath,
        algorithm: this.algorithm,
        timestamp: new Date()
      };
      
      fs.writeFileSync(outputPath, JSON.stringify(encryptedFile, null, 2));
      
      this.logEncryption('encrypt_file', { 
        filePath, 
        outputPath, 
        timestamp: new Date() 
      });
      
      return outputPath;
    } catch (error) {
      throw new Error(`File encryption failed: ${error.message}`);
    }
  }

  // Decrypt file
  decryptFile(encryptedFilePath, outputPath, key) {
    try {
      const encryptedFileData = JSON.parse(fs.readFileSync(encryptedFilePath, 'utf8'));
      
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAuthTag(encryptedFileData.tag);
      decipher.setAAD(Buffer.from(encryptedFileData.originalPath, 'utf8'));
      
      let decrypted = decipher.update(encryptedFileData.data);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      fs.writeFileSync(outputPath, decrypted);
      
      this.logEncryption('decrypt_file', { 
        encryptedFilePath, 
        outputPath, 
        timestamp: new Date() 
      });
      
      return outputPath;
    } catch (error) {
      throw new Error(`File decryption failed: ${error.message}`);
    }
  }

  // Encrypt sensitive fields in object
  encryptSensitiveFields(obj, sensitiveFields, key) {
    const encrypted = { ...obj };
    
    for (const field of sensitiveFields) {
      if (obj[field] !== undefined) {
        const encryptedField = this.encrypt(obj[field], key);
        encrypted[field] = encryptedField.encryptedData;
        encrypted[`${field}_iv`] = encryptedField.iv;
        encrypted[`${field}_tag`] = encryptedField.tag;
      }
    }
    
    return encrypted;
  }

  // Decrypt sensitive fields in object
  decryptSensitiveFields(obj, sensitiveFields, key) {
    const decrypted = { ...obj };
    
    for (const field of sensitiveFields) {
      if (obj[field] && obj[`${field}_iv`] && obj[`${field}_tag`]) {
        try {
          decrypted[field] = this.decrypt(
            obj[field], 
            key, 
            obj[`${field}_iv`], 
            obj[`${field}_tag`]
          );
          
          // Remove encryption metadata
          delete decrypted[`${field}_iv`];
          delete decrypted[`${field}_tag`];
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error.message);
          decrypted[field] = '[DECRYPTION_FAILED]';
        }
      }
    }
    
    return decrypted;
  }

  // Generate hash for data integrity
  generateHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  // Verify data integrity
  verifyIntegrity(data, expectedHash) {
    const actualHash = this.generateHash(data);
    return actualHash === expectedHash;
  }

  // Encrypt with password
  encryptWithPassword(data, password) {
    const salt = crypto.randomBytes(16);
    const key = this.deriveKeyFromPassword(password, salt);
    const iv = this.generateIV();
    
    const cipher = crypto.createCipher(this.algorithm, key);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      algorithm: this.algorithm,
      timestamp: new Date()
    };
  }

  // Decrypt with password
  decryptWithPassword(encryptedData, password, salt, iv, tag) {
    const saltBuffer = Buffer.from(salt, 'hex');
    const key = this.deriveKeyFromPassword(password, saltBuffer);
    const ivBuffer = Buffer.from(iv, 'hex');
    const tagBuffer = Buffer.from(tag, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAuthTag(tagBuffer);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Store key securely
  storeKey(keyId, key, metadata = {}) {
    const keyData = {
      id: keyId,
      key: key.toString('hex'),
      createdAt: new Date(),
      metadata
    };
    
    this.keyStorage.set(keyId, keyData);
    
    this.logEncryption('store_key', { keyId, timestamp: new Date() });
    
    return keyId;
  }

  // Retrieve key
  getKey(keyId) {
    const keyData = this.keyStorage.get(keyId);
    if (!keyData) {
      throw new Error('Key not found');
    }
    
    return Buffer.from(keyData.key, 'hex');
  }

  // Delete key
  deleteKey(keyId) {
    if (!this.keyStorage.has(keyId)) {
      throw new Error('Key not found');
    }
    
    this.keyStorage.delete(keyId);
    
    this.logEncryption('delete_key', { keyId, timestamp: new Date() });
    
    return true;
  }

  // List all keys
  listKeys() {
    return Array.from(this.keyStorage.values()).map(keyData => ({
      id: keyData.id,
      createdAt: keyData.createdAt,
      metadata: keyData.metadata
    }));
  }

  // Encrypt database field
  encryptDatabaseField(value, key) {
    if (value === null || value === undefined) {
      return value;
    }
    
    const encrypted = this.encrypt(value, key);
    return JSON.stringify(encrypted);
  }

  // Decrypt database field
  decryptDatabaseField(encryptedValue, key) {
    if (!encryptedValue) {
      return encryptedValue;
    }
    
    try {
      const encryptedData = JSON.parse(encryptedValue);
      return this.decrypt(
        encryptedData.encryptedData,
        key,
        encryptedData.iv,
        encryptedData.tag
      );
    } catch (error) {
      console.error('Database field decryption failed:', error.message);
      return '[DECRYPTION_FAILED]';
    }
  }

  // Generate secure random string
  generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate secure token
  generateSecureToken() {
    return crypto.randomBytes(32).toString('base64url');
  }

  // Log encryption operation
  logEncryption(operation, data) {
    this.encryptionHistory.push({
      operation,
      data,
      timestamp: new Date()
    });
    
    // Keep only last N entries
    if (this.encryptionHistory.length > this.maxHistorySize) {
      this.encryptionHistory = this.encryptionHistory.slice(-this.maxHistorySize);
    }
  }

  // Get encryption statistics
  getEncryptionStats() {
    const total = this.encryptionHistory.length;
    const operations = {};
    
    this.encryptionHistory.forEach(entry => {
      operations[entry.operation] = (operations[entry.operation] || 0) + 1;
    });
    
    return {
      totalOperations: total,
      operations,
      storedKeys: this.keyStorage.size,
      algorithm: this.algorithm
    };
  }

  // Get encryption history
  getEncryptionHistory(limit = 100) {
    return this.encryptionHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Validate encryption parameters
  validateEncryptionParams(data, key) {
    if (!data) {
      throw new Error('Data is required for encryption');
    }
    
    if (!key || key.length !== this.keyLength) {
      throw new Error(`Key must be ${this.keyLength} bytes long`);
    }
    
    return true;
  }

  // Clean up old encryption history
  cleanupHistory() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep last 30 days
    
    this.encryptionHistory = this.encryptionHistory.filter(
      entry => entry.timestamp > cutoffDate
    );
  }
}

module.exports = EncryptionService;


