const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

// Google Generative AI library removed as AI bot functionality was removed

// RazorPay configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

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

// Security middleware
app.use(helmet());
app.use(cors({ origin: ['http://localhost:3000'], methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','x-auth-token'] }));
app.use(express.json({ limit: '1mb' }));

// Basic rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use(limiter);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/kyc';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

// --- Database & Model Setup ---
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agrofuns_db';

mongoose
  .connect(mongoURI)
  .then(() => console.log('MongoDB Connected...'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Simple in-memory stores used when MongoDB isn't available
const memoryStore = {
  users: new Map(), // id -> { id, email, role, passwordHash, date }
  feedback: []
};
const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// --- Simple in-memory geofence registry and reputation scoring (extend with DB later) ---
const centerRegistry = new Map(); // centerAddress -> { name, lat, lng, radiusMeters, kycVerified, complianceApproved }
const centerReputation = new Map(); // centerAddress -> number

function isWithinGeofence(lat, lng, fence) {
  if (!fence || typeof lat !== 'number' || typeof lng !== 'number') return false;
  const R = 6371000; // meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat - fence.lat);
  const dLon = toRad(lng - fence.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(fence.lat)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance <= (fence.radiusMeters || 200);
}

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

// --- Role-based Access Control ---
const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ msg: 'Forbidden: insufficient role' });
  }
  next();
};

// --- Government Registration Guard (invite code + domain allowlist) ---
const GOVERNMENT_INVITE_CODE = process.env.GOV_INVITE_CODE || 'GOV-INVITE-ONLY';
const GOVERNMENT_EMAIL_DOMAIN = process.env.GOV_EMAIL_DOMAIN || '';

function isGovernmentEmailAllowed(email) {
  if (!GOVERNMENT_EMAIL_DOMAIN) return true;
  return typeof email === 'string' && email.toLowerCase().endsWith(`@${GOVERNMENT_EMAIL_DOMAIN.toLowerCase()}`);
}

// --- API Endpoints ---
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const GOVERNMENT_PRIVATE_KEY = process.env.GOVERNMENT_PRIVATE_KEY;

// Graceful blockchain contract loading with a local mock fallback so the server can run
let contract;
let provider;
let contractABI;
let usingMock = false;
try {
  contractABI = require('../artifacts/contracts/AgriTrainingFundTracker.sol/AgriTrainingFundTracker.json').abi;
  if (!INFURA_API_KEY || !GOVERNMENT_PRIVATE_KEY || !CONTRACT_ADDRESS) {
    throw new Error('Missing blockchain ENV. Switching to mock.');
  }
  provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_API_KEY}`);
  const governorWallet = new ethers.Wallet(GOVERNMENT_PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, governorWallet);
  console.log('Blockchain contract loaded using live provider');
} catch (err) {
  console.warn('[AgriSafeChain] Falling back to in-memory mock contract:', err.message);
  usingMock = true;
  const randomTxHash = () => '0x' + crypto.randomBytes(32).toString('hex');
  const mockWait = async () => ({ status: 1 });
  const mockTx = () => ({ hash: randomTxHash(), wait: mockWait });

  let monitoringState = {
    totalTransactions: 0n,
    totalFundsAllocated: ethers.parseEther('0'),
    totalFundsUsed: ethers.parseEther('0'),
    activeCenters: 0n,
    activeFarmers: 0n,
    activeTrainers: 0n,
    lastUpdate: BigInt(Math.floor(Date.now() / 1000))
  };
  const centers = new Map();
  const auditTrail = [];
  const pushAudit = (actor, action, dataHash = randomTxHash()) => {
    auditTrail.unshift({ actor, action, timestamp: BigInt(Math.floor(Date.now() / 1000)), dataHash });
  };

  contract = {
    government: async () => '0x000000000000000000000000000000000000dEaD',
    verifyKYC: async () => { pushAudit('gov', 'verifyKYC'); return mockTx(); },
    approveCompliance: async () => { pushAudit('gov', 'approveCompliance'); return mockTx(); },
    createComplianceRule: async () => { pushAudit('gov', 'createComplianceRule'); return mockTx(); },
    addValidator: async () => { pushAudit('gov', 'addValidator'); return mockTx(); },
    validateTransaction: async () => { pushAudit('validator', 'validateTransaction'); return mockTx(); },
    getAuditTrail: async (startIndex = 0, count = 50) => auditTrail.slice(Number(startIndex), Number(startIndex) + Number(count)),
    addEncryptedAuditEntry: async (actor, action, dataHash) => { pushAudit(actor, action, dataHash); return mockTx(); },
    monitoringData: async () => monitoringState,
    updateMonitoringData: async () => {
      monitoringState = {
        ...monitoringState,
        totalTransactions: monitoringState.totalTransactions + 1n,
        lastUpdate: BigInt(Math.floor(Date.now() / 1000))
      };
      return mockTx();
    },
    detectAnomaly: async () => { pushAudit('system', 'anomaly'); return mockTx(); },
    validateData: async () => true,
    addFundingSource: async () => { pushAudit('gov', 'addFundingSource'); return mockTx(); },
    registerCenterEnhanced: async (addr, name) => { centers.set(addr, { name, isRegistered: true, balance: ethers.parseEther('0'), used: ethers.parseEther('0') }); pushAudit('gov', 'registerCenterEnhanced'); return mockTx(); },
    allocateFundsEnhanced: async (addr, amountWei) => {
      const c = centers.get(addr) || { name: 'Center', isRegistered: true, balance: ethers.parseEther('0'), used: ethers.parseEther('0') };
      c.balance = (c.balance || ethers.parseEther('0')) + amountWei;
      centers.set(addr, c);
      monitoringState.totalFundsAllocated = monitoringState.totalFundsAllocated + amountWei;
      pushAudit('gov', 'allocateFundsEnhanced');
      return mockTx();
    },
    reportUsageEnhanced: async (amountWei) => { monitoringState.totalFundsUsed = monitoringState.totalFundsUsed + amountWei; pushAudit('center', 'reportUsageEnhanced'); return mockTx(); },
    registerCenter: async (addr, name) => { centers.set(addr, { name, isRegistered: true, balance: ethers.parseEther('0'), used: ethers.parseEther('0') }); pushAudit('gov', 'registerCenter'); return mockTx(); },
    allocateFunds: async (addr, amountWei) => { const c = centers.get(addr) || { name: 'Center', isRegistered: true, balance: ethers.parseEther('0'), used: ethers.parseEther('0') }; c.balance = (c.balance || ethers.parseEther('0')) + amountWei; centers.set(addr, c); monitoringState.totalFundsAllocated = monitoringState.totalFundsAllocated + amountWei; pushAudit('gov', 'allocateFunds'); return mockTx(); },
    reportUsage: async (amountWei) => { monitoringState.totalFundsUsed = monitoringState.totalFundsUsed + amountWei; pushAudit('center', 'reportUsage'); return mockTx(); },
    centers: async (addr) => {
      const c = centers.get(addr) || { name: '', isRegistered: false, balance: ethers.parseEther('0'), used: ethers.parseEther('0') };
      return [c.name, c.isRegistered, c.balance, c.used];
    }
  };
}

// Public health endpoint
app.get('/health', async (_req, res) => {
  const health = {
    ok: true,
    timestamp: new Date().toISOString(),
    db: isDbConnected() ? 'connected' : 'memory',
    blockchain: contract && contract.getAuditTrail ? 'ready' : 'mock'
  };
  res.status(200).json(health);
});

// Blockchain connectivity status
app.get('/api/blockchain/status', (_req, res) => {
  const status = {
    hasEnv: !!(process.env.INFURA_API_KEY && process.env.GOVERNMENT_PRIVATE_KEY && process.env.CONTRACT_ADDRESS),
    provider: process.env.INFURA_API_KEY ? 'infura' : 'none',
    usingMock,
    contractReady: !!(contract && contract.getAuditTrail)
  };
  res.status(200).json({ success: true, status });
});

// Admin: update center geofence (government-only)
app.post('/api/admin/center/geofence', auth, requireRole('government'), (req, res) => {
  const { centerAddress, lat, lng, radiusMeters } = req.body;
  if (!centerAddress) return res.status(400).json({ error: 'centerAddress is required' });
  const current = centerRegistry.get(centerAddress) || { name: 'Center', lat: 0, lng: 0, radiusMeters: 200 };
  const updated = { ...current, lat: Number(lat) || 0, lng: Number(lng) || 0, radiusMeters: Number(radiusMeters) || 200 };
  centerRegistry.set(centerAddress, updated);
  res.status(200).json({ success: true, geofence: updated });
});

// Public: center reputation (read-only)
app.get('/api/center/:address/reputation', (req, res) => {
  const addr = req.params.address;
  const score = centerReputation.get(addr) || 0;
  res.status(200).json({ success: true, address: addr, reputation: score });
});

// Encrypted whistleblower reports (anonymous)
app.post('/api/whistleblower/report', async (req, res) => {
  try {
    const { report, publicKey } = req.body;
    if (!report || !publicKey) return res.status(400).json({ error: 'report and publicKey are required' });
    // Encrypt report with provided public key (RSA-OAEP assumed). Placeholder: hash only.
    const reportHash = crypto.createHash('sha256').update(report).digest('hex');
    // Log minimal data to audit trail; store details off-chain in secure store in real impl.
    auditService.logUserAction('anonymous', 'whistleblower_report', 'whistleblower', { reportHash });
    res.status(200).json({ success: true, reference: reportHash });
  } catch (e) {
    console.error('Whistleblower error:', e);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

app.get('/', (req, res) => res.send('Hello from the backend!'));

// New: Register endpoint
app.post('/api/auth/register', async (req, res) => {
  const { email, password, role, inviteCode } = req.body;
  try {
    if (role === 'government') {
      if (inviteCode !== GOVERNMENT_INVITE_CODE) {
        return res.status(403).json({ msg: 'Invalid invite code for government registration' });
      }
      if (!isGovernmentEmailAllowed(email)) {
        return res.status(403).json({ msg: 'Email domain not allowed for government registration' });
      }
    }
    if (isDbConnected()) {
      let existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ msg: 'User already exists' });
      let user = new User({ email, password, role });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      const payload = { user: { id: user.id, role: user.role } };
      jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' }, (err, token) => {
        if (err) throw err;
        res.json({ token, role: user.role, user: { id: user.id, email: user.email, role: user.role } });
      });
    } else {
      // Memory fallback
      if ([...memoryStore.users.values()].some(u => u.email === email)) {
        return res.status(400).json({ msg: 'User already exists' });
      }
      const id = crypto.randomUUID();
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const user = { id, email, role, passwordHash, date: new Date() };
      memoryStore.users.set(id, user);
      const payload = { user: { id, role } };
      jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' }, (err, token) => {
        if (err) throw err;
        res.json({ token, role, user: { id, email, role } });
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// New: Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (isDbConnected()) {
      let user = await User.findOne({ email });
      if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });
      const payload = { user: { id: user.id, role: user.role } };
      jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' }, (err, token) => {
        if (err) throw err;
        res.json({ token, role: user.role, user: { id: user.id, email: user.email, role: user.role } });
      });
    } else {
      // Memory fallback
      const user = [...memoryStore.users.values()].find(u => u.email === email);
      if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });
      const payload = { user: { id: user.id, role: user.role } };
      jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' }, (err, token) => {
        if (err) throw err;
        res.json({ token, role: user.role, user: { id: user.id, email: user.email, role: user.role } });
      });
    }
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
    if (isDbConnected()) {
      const user = await User.findById(id).select('-password');
      if (!user) return res.status(404).json({ msg: 'User not found' });
      const newFeedback = new Feedback({ email: user.email, role, message });
      await newFeedback.save();
    } else {
      const user = memoryStore.users.get(id);
      if (!user) return res.status(404).json({ msg: 'User not found' });
      memoryStore.feedback.push({ id: crypto.randomUUID(), email: user.email, role, message, date: new Date() });
    }
    res.status(201).json({ msg: 'Feedback submitted successfully!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// New: Get all feedback endpoint (protected)
app.get('/api/feedback', auth, async (req, res) => {
  try {
    if (isDbConnected()) {
      const allFeedback = await Feedback.find().sort({ date: -1 });
      return res.status(200).json(allFeedback);
    }
    const allFeedback = memoryStore.feedback.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(200).json(allFeedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// AI Bot functionality removed as requested

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
    // Persist verification flag for the center wallet locally (off-chain guardrail)
    const current = centerRegistry.get(userAddress) || { name: 'Center', lat: 0, lng: 0, radiusMeters: 200, kycVerified: false, complianceApproved: false };
    centerRegistry.set(userAddress, { ...current, kycVerified: true });
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

app.post('/api/compliance/approve', auth, requireRole('government'), async (req, res) => {
  const { userAddress } = req.body;
  if (!userAddress) {
    return res.status(400).json({ error: 'userAddress is required' });
  }
  try {
    const tx = await contract.approveCompliance(userAddress);
    await tx.wait();
    // Persist compliance flag locally
    const current = centerRegistry.get(userAddress) || { name: 'Center', lat: 0, lng: 0, radiusMeters: 200, kycVerified: false, complianceApproved: false };
    centerRegistry.set(userAddress, { ...current, complianceApproved: true });
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

app.post('/api/compliance/rules', auth, requireRole('government'), async (req, res) => {
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
app.post('/api/consensus/validator', auth, requireRole('government'), async (req, res) => {
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
    // Reward centers that update on time (placeholder heuristic)
    // In a real system, link tx sender; here we accrue to a dummy address
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
app.post('/api/register/center-enhanced', auth, requireRole('government'), async (req, res) => {
  const { centerAddress, name, location, contactInfo } = req.body;
  if (!centerAddress || !name || !location || !contactInfo) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const tx = await contract.registerCenterEnhanced(centerAddress, name, location, contactInfo);
    await tx.wait();
    // Initialize registry entry with default guard flags
    const existing = centerRegistry.get(centerAddress) || {};
    centerRegistry.set(centerAddress, { ...existing, name, lat: 0, lng: 0, radiusMeters: 200, kycVerified: false, complianceApproved: false });
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

app.post('/api/allocate/funds-enhanced', auth, requireRole('government'), async (req, res) => {
  const { centerAddress, amount, sourceId } = req.body;
  if (!centerAddress || !amount) {
    return res.status(400).json({ error: 'centerAddress and amount are required' });
  }
  try {
    // Verify center is registered before allocating funds
    const centerStatus = await contract.centers(centerAddress);
    const isRegistered = Array.isArray(centerStatus) ? centerStatus[1] : !!centerStatus?.isRegistered;
    if (!isRegistered) {
      return res.status(400).json({ error: 'Target center is not registered/authorized' });
    }
    // Enforce KYC and compliance before allocation
    const registry = centerRegistry.get(centerAddress);
    if (!registry || !registry.kycVerified) {
      auditService.logSecurityEvent('allocation_blocked_kyc', { centerAddress, amount, sourceId });
      return res.status(403).json({ error: 'Allocation blocked: center KYC is not verified' });
    }
    if (!registry.complianceApproved) {
      auditService.logSecurityEvent('allocation_blocked_compliance', { centerAddress, amount, sourceId });
      return res.status(403).json({ error: 'Allocation blocked: center compliance is not approved' });
    }
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
  const { privateKey, amount, purpose, attachments, latitude, longitude } = req.body;
  if (!privateKey || !amount || !purpose) {
    return res.status(400).json({ error: 'privateKey, amount, and purpose are required' });
  }
  try {
    // Verify caller's center is registered
    const centerWalletTmp = new ethers.Wallet(privateKey);
    const centerStatus = await contract.centers(centerWalletTmp.address);
    const isRegistered = Array.isArray(centerStatus) ? centerStatus[1] : !!centerStatus?.isRegistered;
    if (!isRegistered) {
      return res.status(403).json({ error: 'Center wallet is not authorized/registered' });
    }
    // Geofence validation (PoLT)
    const fence = centerRegistry.get(centerWalletTmp.address);
    if (fence) {
      const latNum = Number(latitude);
      const lngNum = Number(longitude);
      if (!isWithinGeofence(latNum, lngNum, fence)) {
        return res.status(400).json({ error: 'Submission location is outside authorized geofence' });
      }
    }
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

// KYC Document Upload API
app.post('/api/kyc/upload-document', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { type, userId } = req.body;
    const fileUrl = `/uploads/kyc/${req.file.filename}`;

    // Store document information in database
    // This would typically be stored in a KYC documents collection
    const documentInfo = {
      userId: userId || req.user.id,
      type: type,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
      uploadedAt: new Date()
    };

    // Log document upload
    auditService.logUserAction(req.user.id, 'document_upload', 'kyc', {
      documentType: type,
      filename: req.file.filename
    });

    res.status(200).json({
      success: true,
      url: fileUrl,
      documentInfo: documentInfo
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

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
app.post('/api/consensus/register-validator', auth, requireRole('government'), async (req, res) => {
  
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

app.post('/api/register-center', auth, requireRole('government'), async (req, res) => {
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
    // Initialize a default geofence and guard flags (can be updated later via admin UI)
    centerRegistry.set(newCenterAddress, { name, lat: 0, lng: 0, radiusMeters: 200, kycVerified: false, complianceApproved: false });
    centerReputation.set(newCenterAddress, 0);
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

app.post('/api/allocate-funds', auth, requireRole('government'), async (req, res) => {
  const { centerAddress, amount } = req.body;
  if (!centerAddress || !amount) {
    return res.status(400).json({ error: 'centerAddress and amount are required' });
  }
  try {
    const centerStatus = await contract.centers(centerAddress);
    const isRegistered = Array.isArray(centerStatus) ? centerStatus[1] : !!centerStatus?.isRegistered;
    if (!isRegistered) {
      return res.status(400).json({ error: 'Target center is not registered/authorized' });
    }
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
    const tmpWallet = new ethers.Wallet(privateKey);
    const centerStatus = await contract.centers(tmpWallet.address);
    const isRegistered = Array.isArray(centerStatus) ? centerStatus[1] : !!centerStatus?.isRegistered;
    if (!isRegistered) {
      return res.status(403).json({ error: 'Center wallet is not authorized/registered' });
    }
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

// ========== PAYMENT INTEGRATION APIs ==========

// RazorPay Order Creation
app.post('/api/payment/create-razorpay-order', auth, async (req, res) => {
  try {
    const { amount, currency, purpose, userId } = req.body;
    
    const orderData = {
      amount: amount,
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        purpose: purpose,
        userId: userId
      }
    };

    // In a real implementation, you would call RazorPay API here
    // For now, we'll simulate the order creation
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.status(200).json({
      success: true,
      orderId: orderId,
      amount: amount,
      currency: currency
    });
  } catch (error) {
    console.error('Error creating RazorPay order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// RazorPay Payment Verification
app.post('/api/payment/verify-razorpay', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // In a real implementation, you would verify the signature with RazorPay
    // For now, we'll simulate successful verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");
    
    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (isAuthentic) {
      res.status(200).json({
        success: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Error verifying RazorPay payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Record Payment
app.post('/api/payment/record', auth, async (req, res) => {
  try {
    const { transactionId, method, amount, purpose, userId, timestamp } = req.body;
    
    // Log payment record
    auditService.logUserAction(userId, 'payment_made', 'payment', {
      transactionId,
      method,
      amount,
      purpose,
      timestamp
    });
    
    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Get Payment History
app.get('/api/payment/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // In a real implementation, you would fetch from a payments collection
    const paymentHistory = [];
    
    res.status(200).json({
      success: true,
      payments: paymentHistory
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server listening at http://localhost:${PORT}`);
});
