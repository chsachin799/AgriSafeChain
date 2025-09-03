const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Database & Model Setup ---
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agrofuns_db';

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.error('MongoDB connection error:', err));

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

const contractABI = require('../artifacts/contracts/AgriTrainingFundTracker.sol/AgriTrainingFundTracker.json').abi;

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
        jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role });
        });
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
        jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role });
        });
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


// All routes below this line will be protected.
app.get('/api/governor', auth, async (req, res) => {
    try {
        const currentGovernor = await contract.government();
        res.status(200).json({ governor: currentGovernor });
    } catch (error) {
        console.error("Error fetching governor:", error);
        res.status(500).json({ error: 'Failed to fetch governor' });
    }
});

// All other routes are now protected.
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
            privateKey: newCenterPrivateKey
        });
    } catch (error) {
        console.error("Error registering center:", error);
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
            value: amountInWei
        });
        await tx.wait();
        res.status(200).json({
            success: true,
            transactionHash: tx.hash,
            message: `Funds allocated to ${centerAddress}`
        });
    } catch (error) {
        console.error("Error allocating funds:", error);
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
        const amountToReport = "0.0001";
        const tx = await centerContract.reportUsage(ethers.parseEther(amountToReport), description);
        await tx.wait();
        res.status(200).json({
            success: true,
            transactionHash: tx.hash,
            message: `Center ${centerWallet.address} reported usage of ${amountToReport} ETH for: ${description}`
        });
    } catch (error) {
        console.error("Error reporting usage:", error);
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
            usedFunds: ethers.formatEther(centerStatus[3])
        });
    } catch (error) {
        console.error("Error fetching center status:", error);
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
            message: `Trainer ${trainerAddress} registered by center ${centerWallet.address}`
        });
    } catch (error) {
        console.error("Error registering trainer:", error);
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
            message: `Farmer ${farmerAddress} registered by trainer ${trainerWallet.address}`
        });
    } catch (error) {
        console.error("Error registering farmer:", error);
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
            message: `Training for farmer ${farmerAddress} marked as complete by trainer ${trainerWallet.address}`
        });
    } catch (error) {
        console.error("Error marking training as complete:", error);
        res.status(500).json({ error: 'Failed to mark training as complete' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server listening at http://localhost:${PORT}`);
});