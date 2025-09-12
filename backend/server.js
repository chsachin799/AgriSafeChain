const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// New: Import Google Generative AI library
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import crypto for encryption
const crypto = require('crypto');

// Import services
const KYCService = require('./services/kycService');
const ValidationService = require('./services/validationService');
const ConsensusService = require('./services/consensusService');
const EncryptionService = require('./services/encryptionService');
const AuditService = require('./services/auditService');
const MonitoringService = require('./services/monitoringService');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const kycService = new KYCService();
const validationService = new ValidationService();
const consensusService = new ConsensusService();
const encryptionService = new EncryptionService();
const auditService = new AuditService();
const monitoringService = new MonitoringService();

app.use(cors());
app.use(express.json());

// --- Database & Model Setup ---
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agrofuns_db';

mongoose
  .connect(mongoURI)
  .then(() => console.log('MongoDB Connected...'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User Schema and Model
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['farmer', 'government', 'trainer'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
const User = mongoose.model('User', UserSchema);

// New: Feedback Schema and Model
const FeedbackSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
const Feedback = mongoose.model('Feedback', FeedbackSchema);

// --- JWT Middleware for Protected Routes ---
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// --- API Endpoints ---
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const GOVERNMENT_PRIVATE_KEY = process.env.GOVERNMENT_PRIVATE_KEY;

const contractABI =
  require('../artifacts/contracts/AgriTrainingFundTracker.sol/AgriTrainingFundTracker.json').abi;

const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_API_KEY}`);
const governorWallet = new ethers.Wallet(GOVERNMENT_PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, governorWallet);

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// New: Register endpoint
app.post('/api/auth/register', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    user = new User({ email, password, role });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, role: user.role });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// New: Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, role: user.role });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// New: Feedback submission endpoint (protected)
app.post('/api/feedback', auth, async (req, res) => {
  const { message } = req.body;
  const { id, role } = req.user;

  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const newFeedback = new Feedback({
      email: user.email,
      role: role,
      message: message,
    });

    await newFeedback.save();
    res.status(201).json({ msg: 'Feedback submitted successfully!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// New: Get all feedback endpoint (protected)
app.get('/api/feedback', auth, async (req, res) => {
  try {
    const allFeedback = await Feedback.find().sort({ date: -1 });
    res.status(200).json(allFeedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- AI Bot API Endpoint ---
// Initialize the Google Generative AI model outside of the endpoint for efficiency
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// New: API endpoint for the AI bot
app.post('/api/chatbot', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Generate content from the model
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});
// End of AI Bot API Endpoint

// ========== ENHANCED ARCHITECTURAL COMPONENTS ==========

// KYC and Compliance APIs
app.post('/api/kyc/verify', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to verify KYC' });
  }
  const { userAddress } = req.body;
  if (!userAddress) {
    return res.status(400).json({ error: 'userAddress is required' });
  }
  try {
    const tx = await contract.verifyKYC(userAddress);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `KYC verified for ${userAddress}`,
    });
  } catch (error) {
    console.error('Error verifying KYC:', error);
    res.status(500).json({ error: 'Failed to verify KYC' });
  }
});

app.post('/api/compliance/approve', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to approve compliance' });
  }
  const { userAddress } = req.body;
  if (!userAddress) {
    return res.status(400).json({ error: 'userAddress is required' });
  }
  try {
    const tx = await contract.approveCompliance(userAddress);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `Compliance approved for ${userAddress}`,
    });
  } catch (error) {
    console.error('Error approving compliance:', error);
    res.status(500).json({ error: 'Failed to approve compliance' });
  }
});

app.post('/api/compliance/rules', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to create compliance rules' });
  }
  const { ruleId, description } = req.body;
  if (!ruleId || !description) {
    return res.status(400).json({ error: 'ruleId and description are required' });
  }
  try {
    const tx = await contract.createComplianceRule(ruleId, description);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `Compliance rule created: ${ruleId}`,
    });
  } catch (error) {
    console.error('Error creating compliance rule:', error);
    res.status(500).json({ error: 'Failed to create compliance rule' });
  }
});

// Consensus and Validation APIs
app.post('/api/consensus/validator', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to add validators' });
  }
  const { validatorAddress, stake } = req.body;
  if (!validatorAddress || !stake) {
    return res.status(400).json({ error: 'validatorAddress and stake are required' });
  }
  try {
    const stakeInWei = ethers.parseEther(stake);
    const tx = await contract.addValidator(validatorAddress, stakeInWei);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `Validator added: ${validatorAddress}`,
    });
  } catch (error) {
    console.error('Error adding validator:', error);
    res.status(500).json({ error: 'Failed to add validator' });
  }
});

app.post('/api/consensus/validate', auth, async (req, res) => {
  const { transactionHash } = req.body;
  if (!transactionHash) {
    return res.status(400).json({ error: 'transactionHash is required' });
  }
  try {
    const tx = await contract.validateTransaction(transactionHash);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `Transaction validated: ${transactionHash}`,
    });
  } catch (error) {
    console.error('Error validating transaction:', error);
    res.status(500).json({ error: 'Failed to validate transaction' });
  }
});

// Audit Trail APIs
app.get('/api/audit/trail', auth, async (req, res) => {
  const { startIndex = 0, count = 50 } = req.query;
  try {
    const auditTrail = await contract.getAuditTrail(parseInt(startIndex), parseInt(count));
    res.status(200).json({
      success: true,
      auditTrail: auditTrail,
      totalCount: auditTrail.length,
    });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

app.post('/api/audit/encrypted', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to add encrypted audit entries' });
  }
  const { actor, action, dataHash, encryptionKey } = req.body;
  if (!actor || !action || !dataHash || !encryptionKey) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const tx = await contract.addEncryptedAuditEntry(actor, action, dataHash, encryptionKey);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: 'Encrypted audit entry added',
    });
  } catch (error) {
    console.error('Error adding encrypted audit entry:', error);
    res.status(500).json({ error: 'Failed to add encrypted audit entry' });
  }
});

// Real-time Monitoring APIs
app.get('/api/monitoring/data', auth, async (req, res) => {
  try {
    const monitoringData = await contract.monitoringData();
    res.status(200).json({
      success: true,
      data: {
        totalTransactions: monitoringData.totalTransactions.toString(),
        totalFundsAllocated: ethers.formatEther(monitoringData.totalFundsAllocated),
        totalFundsUsed: ethers.formatEther(monitoringData.totalFundsUsed),
        activeCenters: monitoringData.activeCenters.toString(),
        activeFarmers: monitoringData.activeFarmers.toString(),
        activeTrainers: monitoringData.activeTrainers.toString(),
        lastUpdate: new Date(Number(monitoringData.lastUpdate) * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring data' });
  }
});

app.post('/api/monitoring/update', auth, async (req, res) => {
  try {
    const tx = await contract.updateMonitoringData();
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: 'Monitoring data updated',
    });
  } catch (error) {
    console.error('Error updating monitoring data:', error);
    res.status(500).json({ error: 'Failed to update monitoring data' });
  }
});

app.post('/api/monitoring/anomaly', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to report anomalies' });
  }
  const { description, severity } = req.body;
  if (!description || severity === undefined) {
    return res.status(400).json({ error: 'description and severity are required' });
  }
  try {
    const tx = await contract.detectAnomaly(description, severity);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: 'Anomaly reported',
    });
  } catch (error) {
    console.error('Error reporting anomaly:', error);
    res.status(500).json({ error: 'Failed to report anomaly' });
  }
});

// Data Validation APIs
app.post('/api/validation/validate', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to validate data' });
  }
  const { dataHash, reason } = req.body;
  if (!dataHash || !reason) {
    return res.status(400).json({ error: 'dataHash and reason are required' });
  }
  try {
    const isValid = await contract.validateData(dataHash, reason);
    res.status(200).json({
      success: true,
      isValid: isValid,
      message: `Data validation result: ${isValid ? 'Valid' : 'Invalid'}`,
    });
  } catch (error) {
    console.error('Error validating data:', error);
    res.status(500).json({ error: 'Failed to validate data' });
  }
});

// Funding Source Management APIs
app.post('/api/funding/source', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to add funding sources' });
  }
  const { sourceId, name, amount, sourceAddress } = req.body;
  if (!sourceId || !name || !amount || !sourceAddress) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const amountInWei = ethers.parseEther(amount);
    const tx = await contract.addFundingSource(sourceId, name, amountInWei, sourceAddress);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `Funding source added: ${sourceId}`,
    });
  } catch (error) {
    console.error('Error adding funding source:', error);
    res.status(500).json({ error: 'Failed to add funding source' });
  }
});

// Enhanced Registration APIs
app.post('/api/register/center-enhanced', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to register centers' });
  }
  const { centerAddress, name, location, contactInfo } = req.body;
  if (!centerAddress || !name || !location || !contactInfo) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const tx = await contract.registerCenterEnhanced(centerAddress, name, location, contactInfo);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `Center registered: ${name}`,
    });
  } catch (error) {
    console.error('Error registering center:', error);
    res.status(500).json({ error: 'Failed to register center' });
  }
});

app.post('/api/allocate/funds-enhanced', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to allocate funds' });
  }
  const { centerAddress, amount, sourceId } = req.body;
  if (!centerAddress || !amount) {
    return res.status(400).json({ error: 'centerAddress and amount are required' });
  }
  try {
    const amountInWei = ethers.parseEther(amount);
    const tx = await contract.allocateFundsEnhanced(centerAddress, amountInWei, sourceId || "", {
      value: amountInWei,
    });
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `Funds allocated to ${centerAddress}`,
    });
  } catch (error) {
    console.error('Error allocating funds:', error);
    res.status(500).json({ error: 'Failed to allocate funds' });
  }
});

app.post('/api/report/usage-enhanced', auth, async (req, res) => {
  if (req.user.role !== 'trainer') {
    return res.status(403).json({ msg: 'Not authorized to report usage' });
  }
  const { privateKey, amount, purpose, attachments } = req.body;
  if (!privateKey || !amount || !purpose) {
    return res.status(400).json({ error: 'privateKey, amount, and purpose are required' });
  }
  try {
    const centerWallet = new ethers.Wallet(privateKey, provider);
    const centerContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, centerWallet);
    const amountInWei = ethers.parseEther(amount);
    const tx = await centerContract.reportUsageEnhanced(amountInWei, purpose, attachments || []);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `Usage reported: ${amount} ETH for ${purpose}`,
    });
  } catch (error) {
    console.error('Error reporting usage:', error);
    res.status(500).json({ error: 'Failed to report usage' });
  }
});

// Encryption APIs
app.post('/api/encryption/encrypt', auth, async (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: 'data is required' });
  }
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const dataHash = crypto.createHash('sha256').update(data).digest('hex');
    
    res.status(200).json({
      success: true,
      encryptedData: encrypted,
      dataHash: dataHash,
      encryptionKey: key.toString('hex'),
      iv: iv.toString('hex'),
    });
  } catch (error) {
    console.error('Error encrypting data:', error);
    res.status(500).json({ error: 'Failed to encrypt data' });
  }
});

app.post('/api/encryption/decrypt', auth, async (req, res) => {
  const { encryptedData, encryptionKey, iv } = req.body;
  if (!encryptedData || !encryptionKey || !iv) {
    return res.status(400).json({ error: 'encryptedData, encryptionKey, and iv are required' });
  }
  try {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(encryptionKey, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    res.status(200).json({
      success: true,
      decryptedData: decrypted,
    });
  } catch (error) {
    console.error('Error decrypting data:', error);
    res.status(500).json({ error: 'Failed to decrypt data' });
  }
});

// Dashboard Data APIs
app.get('/api/dashboard/fund-reports', auth, async (req, res) => {
  try {
    // This would typically aggregate data from multiple sources
    const fundReports = {
      totalAllocated: "0",
      totalUsed: "0",
      remaining: "0",
      centers: [],
      recentTransactions: []
    };
    
    res.status(200).json({
      success: true,
      data: fundReports,
    });
  } catch (error) {
    console.error('Error fetching fund reports:', error);
    res.status(500).json({ error: 'Failed to fetch fund reports' });
  }
});

app.get('/api/dashboard/training-metrics', auth, async (req, res) => {
  try {
    const trainingMetrics = {
      totalFarmers: 0,
      completedTrainings: 0,
      activeTrainers: 0,
      trainingCenters: 0,
      averageAttendance: 0,
      certificatesIssued: 0
    };
    
    res.status(200).json({
      success: true,
      data: trainingMetrics,
    });
  } catch (error) {
    console.error('Error fetching training metrics:', error);
    res.status(500).json({ error: 'Failed to fetch training metrics' });
  }
});

app.get('/api/dashboard/transparency', auth, async (req, res) => {
  try {
    const transparencyData = {
      publicTransactions: [],
      complianceStatus: {},
      auditSummary: {},
      validatorStatus: {}
    };
    
    res.status(200).json({
      success: true,
      data: transparencyData,
    });
  } catch (error) {
    console.error('Error fetching transparency data:', error);
    res.status(500).json({ error: 'Failed to fetch transparency data' });
  }
});

// ========== COMPREHENSIVE SERVICE INTEGRATION ==========

// KYC Service APIs
app.post('/api/kyc/submit', auth, async (req, res) => {
  try {
    const { personalInfo, identityDocument, addressDocument, documents } = req.body;
    const userId = req.user.id;
    
    const result = kycService.submitKYCApplication(userId, {
      personalInfo,
      identityDocument,
      addressDocument,
      documents
    });
    
    // Log KYC submission
    auditService.logUserAction(userId, 'kyc_submission', 'kyc', {
      applicationId: result.applicationId,
      status: result.status
    });
    
    res.status(200).json({
      success: true,
      applicationId: result.applicationId,
      status: result.status,
      errors: result.errors,
      verificationLevel: result.verificationLevel,
      riskScore: result.riskScore
    });
  } catch (error) {
    console.error('Error submitting KYC:', error);
    res.status(500).json({ error: 'Failed to submit KYC application' });
  }
});

app.get('/api/kyc/status/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const status = kycService.getKYCStatus(userId);
    
    res.status(200).json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Error fetching KYC status:', error);
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

app.get('/api/kyc/applications', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized' });
  }
  
  try {
    const applications = kycService.getAllKYCApplications();
    res.status(200).json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Error fetching KYC applications:', error);
    res.status(500).json({ error: 'Failed to fetch KYC applications' });
  }
});

// Data Validation APIs
app.post('/api/validation/validate', auth, async (req, res) => {
  try {
    const { ruleName, data, context } = req.body;
    
    // Validate data structure
    const validationResult = validationService.validateData(ruleName, data);
    
    // Validate business rules
    const businessValidation = validationService.validateBusinessRules(data, context);
    
    // Log validation attempt
    auditService.logUserAction(req.user.id, 'data_validation', 'validation', {
      ruleName,
      isValid: validationResult.isValid && businessValidation.isValid,
      errors: [...validationResult.errors, ...businessValidation.errors]
    });
    
    res.status(200).json({
      success: true,
      isValid: validationResult.isValid && businessValidation.isValid,
      errors: [...validationResult.errors, ...businessValidation.errors],
      data: validationResult.data
    });
  } catch (error) {
    console.error('Error validating data:', error);
    res.status(500).json({ error: 'Failed to validate data' });
  }
});

app.post('/api/validation/transaction', auth, async (req, res) => {
  try {
    const { transactionData } = req.body;
    
    const validationResult = validationService.validateTransaction(transactionData);
    
    // Log transaction validation
    auditService.logTransaction(transactionData.hash, 'validation', {
      isValid: validationResult.isValid,
      errors: validationResult.errors
    });
    
    res.status(200).json({
      success: true,
      ...validationResult
    });
  } catch (error) {
    console.error('Error validating transaction:', error);
    res.status(500).json({ error: 'Failed to validate transaction' });
  }
});

// Consensus Service APIs
app.post('/api/consensus/register-validator', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to register validators' });
  }
  
  try {
    const { validatorAddress, stake, metadata } = req.body;
    
    const validator = consensusService.registerValidator(validatorAddress, stake, metadata);
    
    // Log validator registration
    auditService.logUserAction(req.user.id, 'validator_registration', 'consensus', {
      validatorAddress,
      stake
    });
    
    res.status(200).json({
      success: true,
      validator
    });
  } catch (error) {
    console.error('Error registering validator:', error);
    res.status(500).json({ error: 'Failed to register validator' });
  }
});

app.post('/api/consensus/submit-transaction', auth, async (req, res) => {
  try {
    const { transactionData } = req.body;
    const submitterAddress = req.user.id;
    
    const transactionId = consensusService.submitTransaction(transactionData, submitterAddress);
    
    // Log transaction submission
    auditService.logTransaction(transactionId, 'submission', {
      submitter: submitterAddress
    });
    
    res.status(200).json({
      success: true,
      transactionId
    });
  } catch (error) {
    console.error('Error submitting transaction:', error);
    res.status(500).json({ error: 'Failed to submit transaction' });
  }
});

app.post('/api/consensus/validate-transaction', auth, async (req, res) => {
  try {
    const { transactionId, validationResult } = req.body;
    const validatorAddress = req.user.id;
    
    const validation = consensusService.validateTransaction(transactionId, validatorAddress, validationResult);
    
    // Log validation
    auditService.logUserAction(req.user.id, 'consensus_validation', 'consensus', {
      transactionId,
      result: validationResult.isValid
    });
    
    res.status(200).json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('Error validating transaction:', error);
    res.status(500).json({ error: 'Failed to validate transaction' });
  }
});

// Encryption Service APIs
app.post('/api/encryption/encrypt', auth, async (req, res) => {
  try {
    const { data, password } = req.body;
    
    let result;
    if (password) {
      result = encryptionService.encryptWithPassword(data, password);
    } else {
      const key = encryptionService.generateKey();
      result = encryptionService.encrypt(data, key);
      result.key = key.toString('hex');
    }
    
    // Log encryption
    auditService.logUserAction(req.user.id, 'data_encryption', 'encryption', {
      hasPassword: !!password
    });
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error encrypting data:', error);
    res.status(500).json({ error: 'Failed to encrypt data' });
  }
});

app.post('/api/encryption/decrypt', auth, async (req, res) => {
  try {
    const { encryptedData, key, password, salt, iv, tag } = req.body;
    
    let result;
    if (password) {
      result = encryptionService.decryptWithPassword(encryptedData, password, salt, iv, tag);
    } else {
      const keyBuffer = Buffer.from(key, 'hex');
      result = encryptionService.decrypt(encryptedData, keyBuffer, iv, tag);
    }
    
    // Log decryption
    auditService.logUserAction(req.user.id, 'data_decryption', 'encryption', {
      hasPassword: !!password
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error decrypting data:', error);
    res.status(500).json({ error: 'Failed to decrypt data' });
  }
});

// Audit Service APIs
app.get('/api/audit/search', auth, async (req, res) => {
  try {
    const filters = req.query;
    const logs = auditService.searchAuditLogs(filters);
    
    // Log audit access
    auditService.logAuditAccess(req.user.id, 'search', {
      filters,
      resultCount: logs.length
    });
    
    res.status(200).json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Error searching audit logs:', error);
    res.status(500).json({ error: 'Failed to search audit logs' });
  }
});

app.get('/api/audit/statistics', auth, async (req, res) => {
  try {
    const filters = req.query;
    const stats = auditService.getAuditStatistics(filters);
    
    res.status(200).json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

app.get('/api/audit/export', auth, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const filters = req.query;
    
    const data = auditService.exportAuditLogs(filters, format);
    
    // Log audit export
    auditService.logAuditAccess(req.user.id, 'export', {
      format,
      filters
    });
    
    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit_logs.${format}"`);
    res.send(data);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

// Monitoring Service APIs
app.get('/api/monitoring/start', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to start monitoring' });
  }
  
  try {
    const { interval = 5000 } = req.body;
    monitoringService.startMonitoring(interval);
    
    // Log monitoring start
    auditService.logUserAction(req.user.id, 'monitoring_start', 'monitoring', {
      interval
    });
    
    res.status(200).json({
      success: true,
      message: 'Monitoring started'
    });
  } catch (error) {
    console.error('Error starting monitoring:', error);
    res.status(500).json({ error: 'Failed to start monitoring' });
  }
});

app.get('/api/monitoring/stop', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to stop monitoring' });
  }
  
  try {
    monitoringService.stopMonitoring();
    
    // Log monitoring stop
    auditService.logUserAction(req.user.id, 'monitoring_stop', 'monitoring');
    
    res.status(200).json({
      success: true,
      message: 'Monitoring stopped'
    });
  } catch (error) {
    console.error('Error stopping monitoring:', error);
    res.status(500).json({ error: 'Failed to stop monitoring' });
  }
});

app.get('/api/monitoring/metrics', auth, async (req, res) => {
  try {
    const metrics = monitoringService.getCurrentMetrics();
    const stats = monitoringService.getMonitoringStats();
    
    res.status(200).json({
      success: true,
      metrics,
      stats
    });
  } catch (error) {
    console.error('Error fetching monitoring metrics:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring metrics' });
  }
});

app.get('/api/monitoring/alerts', auth, async (req, res) => {
  try {
    const filters = req.query;
    const alerts = monitoringService.getAlerts(filters);
    
    res.status(200).json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.get('/api/monitoring/anomalies', auth, async (req, res) => {
  try {
    const filters = req.query;
    const anomalies = monitoringService.getAnomalies(filters);
    
    res.status(200).json({
      success: true,
      anomalies
    });
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
});

app.get('/api/monitoring/health', auth, async (req, res) => {
  try {
    const health = monitoringService.getSystemHealth();
    
    res.status(200).json({
      success: true,
      health
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

// Start monitoring on server start
monitoringService.startMonitoring();

// All routes below this line will be protected.
app.get('/api/governor', auth, async (req, res) => {
  try {
    const currentGovernor = await contract.government();
    res.status(200).json({ governor: currentGovernor });
  } catch (error) {
    console.error('Error fetching governor:', error);
    res.status(500).json({ error: 'Failed to fetch governor' });
  }
});

app.post('/api/register-center', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to register a center' });
  }
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  try {
    const newCenterWallet = ethers.Wallet.createRandom();
    const newCenterAddress = newCenterWallet.address;
    const newCenterPrivateKey = newCenterWallet.privateKey;
    const tx = await contract.registerCenter(newCenterAddress, name);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      registeredCenterAddress: newCenterAddress,
      privateKey: newCenterPrivateKey,
    });
  } catch (error) {
    console.error('Error registering center:', error);
    res.status(500).json({ error: 'Failed to register center' });
  }
});

app.post('/api/allocate-funds', auth, async (req, res) => {
  if (req.user.role !== 'government') {
    return res.status(403).json({ msg: 'Not authorized to allocate funds' });
  }
  const { centerAddress, amount } = req.body;
  if (!centerAddress || !amount) {
    return res.status(400).json({ error: 'centerAddress and amount are required' });
  }
  try {
    const amountInWei = ethers.parseEther(amount);
    const tx = await contract.allocateFunds(centerAddress, amountInWei, {
      value: amountInWei,
    });
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `Funds allocated to ${centerAddress}`,
    });
  } catch (error) {
    console.error('Error allocating funds:', error);
    res.status(500).json({ error: 'Failed to allocate funds' });
  }
});

app.post('/api/report-usage', auth, async (req, res) => {
  if (req.user.role !== 'trainer') {
    return res.status(403).json({ msg: 'Not authorized to report usage' });
  }
  const { privateKey, description } = req.body;
  if (!privateKey || !description) {
    return res.status(400).json({ error: 'privateKey and description are required' });
  }
  try {
    const centerWallet = new ethers.Wallet(privateKey, provider);
    const centerContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, centerWallet);
    const amountToReport = '0.0001';
    const tx = await centerContract.reportUsage(ethers.parseEther(amountToReport), description);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `Center ${centerWallet.address} reported usage of ${amountToReport} ETH for: ${description}`,
    });
  } catch (error) {
    console.error('Error reporting usage:', error);
    res.status(500).json({ error: 'Failed to report usage' });
  }
});

app.get('/api/center-status/:centerAddress', auth, async (req, res) => {
  const { centerAddress } = req.params;
  try {
    const centerStatus = await contract.centers(centerAddress);
    res.status(200).json({
      name: centerStatus[0],
      isRegistered: centerStatus[1],
      balance: ethers.formatEther(centerStatus[2]),
      usedFunds: ethers.formatEther(centerStatus[3]),
    });
  } catch (error) {
    console.error('Error fetching center status:', error);
    res.status(500).json({ error: 'Failed to fetch center status' });
  }
});

app.post('/api/register-trainer', auth, async (req, res) => {
  if (req.user.role !== 'trainer') {
    return res.status(403).json({ msg: 'Not authorized to register a trainer' });
  }
  const { privateKey, trainerAddress, name } = req.body;
  if (!privateKey || !trainerAddress || !name) {
    return res.status(400).json({ error: 'privateKey, trainerAddress, and name are required' });
  }
  try {
    const centerWallet = new ethers.Wallet(privateKey, provider);
    const centerContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, centerWallet);
    const tx = await centerContract.registerTrainer(trainerAddress, name);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `Trainer ${trainerAddress} registered by center ${centerWallet.address}`,
    });
  } catch (error) {
    console.error('Error registering trainer:', error);
    res.status(500).json({ error: 'Failed to register trainer' });
  }
});

app.post('/api/register-farmer', auth, async (req, res) => {
  if (req.user.role !== 'trainer') {
    return res.status(403).json({ msg: 'Not authorized to register a farmer' });
  }
  const { privateKey, farmerAddress, name } = req.body;
  if (!privateKey || !farmerAddress || !name) {
    return res.status(400).json({ error: 'privateKey, farmerAddress, and name are required' });
  }
  try {
    const trainerWallet = new ethers.Wallet(privateKey, provider);
    const trainerContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, trainerWallet);
    const tx = await trainerContract.registerFarmer(farmerAddress, name);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `Farmer ${farmerAddress} registered by trainer ${trainerWallet.address}`,
    });
  } catch (error) {
    console.error('Error registering farmer:', error);
    res.status(500).json({ error: 'Failed to register farmer' });
  }
});

app.post('/api/mark-training-completed', auth, async (req, res) => {
  if (req.user.role !== 'trainer') {
    return res.status(403).json({ msg: 'Not authorized to mark training as complete' });
  }
  const { privateKey, farmerAddress } = req.body;
  if (!privateKey || !farmerAddress) {
    return res.status(400).json({ error: 'privateKey and farmerAddress are required' });
  }
  try {
    const trainerWallet = new ethers.Wallet(privateKey, provider);
    const trainerContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, trainerWallet);
    const tx = await trainerContract.markTrainingCompleted(farmerAddress);
    await tx.wait();
    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      message: `Training for farmer ${farmerAddress} marked as complete by trainer ${trainerWallet.address}`,
    });
  } catch (error) {
    console.error('Error marking training as complete:', error);
    res.status(500).json({ error: 'Failed to mark training as complete' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server listening at http://localhost:${PORT}`);
});
