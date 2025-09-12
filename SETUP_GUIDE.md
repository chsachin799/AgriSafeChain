# AgriSafeChain - Local Setup Guide

## 🚀 Quick Start

Your AgriSafeChain project is now ready to run locally! All the security enhancements have been implemented and pushed to your GitHub repository.

## 📋 Prerequisites

Before running the project, make sure you have:

1. **Node.js** (version 16 or higher)
2. **MongoDB** (running locally or MongoDB Atlas)
3. **Git** (for version control)
4. **MetaMask** browser extension (for wallet integration)
5. **RazorPay account** (for payment integration)

## 🔧 Environment Setup

### 1. Create Environment Files

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/agrofuns_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Blockchain Configuration
INFURA_API_KEY=your_infura_api_key_here
CONTRACT_ADDRESS=your_deployed_contract_address_here
GOVERNMENT_PRIVATE_KEY=your_government_wallet_private_key_here

# RazorPay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend Configuration
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id_here
REACT_APP_CONTRACT_ADDRESS=your_deployed_contract_address_here
REACT_APP_INFURA_API_KEY=your_infura_api_key_here
```

### 2. Backend Environment Setup

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/agrofuns_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Blockchain Configuration
INFURA_API_KEY=your_infura_api_key_here
CONTRACT_ADDRESS=your_deployed_contract_address_here
GOVERNMENT_PRIVATE_KEY=your_government_wallet_private_key_here

# RazorPay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

## 🏃‍♂️ Running the Application

### 1. Start the Backend Server

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Start the server
npm start
```

The backend server will start on `http://localhost:3001`

### 2. Start the Frontend Application

```bash
# Navigate to root directory
cd ..

# Install dependencies (if not already done)
npm install

# Start the React application
npm start
```

The frontend application will start on `http://localhost:3000`

## 🔐 Security Features Available

### 1. Role-Based Authentication
- **Government**: Full access to all dashboards
- **Trainer**: Access to farmer dashboard only
- **Farmer**: Access to personal dashboard only

### 2. KYC Verification System
- Multi-step verification process
- Document upload (Passport, Aadhaar, etc.)
- Blockchain-based verification status

### 3. Secure Funding System
- Blockchain-based fund allocation
- Multi-layer verification (KYC, compliance, legal trainer)
- Immutable audit trail

### 4. Wallet Integration
- MetaMask integration for blockchain transactions
- RazorPay integration for traditional payments
- Secure payment processing

## 🧪 Testing the Application

### 1. Create Test Users

You can create test users by registering with different roles:

1. **Government User**: Register with role "government"
2. **Trainer User**: Register with role "trainer"
3. **Farmer User**: Register with role "farmer"

### 2. Test KYC Verification

1. Login with any user account
2. Navigate to KYC section
3. Complete the 4-step verification process
4. Upload required documents

### 3. Test Secure Funding

1. Login as government user
2. Navigate to funding section
3. Verify recipient (KYC, compliance, legal trainer)
4. Process funding through wallet integration

### 4. Test Wallet Integration

1. Install MetaMask browser extension
2. Connect wallet to the application
3. Test blockchain transactions
4. Test RazorPay payments

## 📁 Project Structure

```
AgriSafeChain/
├── src/
│   ├── components/
│   │   ├── EnhancedKYCVerification.jsx
│   │   ├── SecureFunding.jsx
│   │   ├── WalletIntegration.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── AuthContext.jsx
│   │   └── ... (other components)
│   ├── contexts/
│   │   └── AuthContext.jsx
│   └── App.js
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ... (other backend files)
├── contracts/
│   └── AgriTrainingFundTracker.sol
├── SECURITY_FEATURES.md
└── SETUP_GUIDE.md
```

## 🔧 Configuration Steps

### 1. MongoDB Setup

If using local MongoDB:
```bash
# Start MongoDB service
mongod
```

If using MongoDB Atlas:
- Create a cluster on MongoDB Atlas
- Get connection string
- Update MONGO_URI in .env file

### 2. Blockchain Setup

1. **Get Infura API Key**:
   - Sign up at https://infura.io
   - Create a new project
   - Get API key

2. **Deploy Smart Contracts**:
   - Use Hardhat to deploy contracts
   - Get contract address
   - Update CONTRACT_ADDRESS in .env

3. **Setup Government Wallet**:
   - Create a new wallet
   - Get private key
   - Update GOVERNMENT_PRIVATE_KEY in .env

### 3. RazorPay Setup

1. **Create RazorPay Account**:
   - Sign up at https://razorpay.com
   - Get API keys from dashboard
   - Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET

### 4. AI Setup (Optional)

1. **Get Gemini API Key**:
   - Sign up at https://ai.google.dev
   - Get API key
   - Update GEMINI_API_KEY in .env

## 🚨 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check MONGO_URI in .env file

2. **Blockchain Connection Error**:
   - Verify INFURA_API_KEY
   - Check CONTRACT_ADDRESS
   - Ensure GOVERNMENT_PRIVATE_KEY is correct

3. **Payment Integration Error**:
   - Verify RazorPay credentials
   - Check MetaMask connection
   - Ensure wallet has sufficient funds

4. **File Upload Error**:
   - Check uploads directory permissions
   - Verify file size limits
   - Ensure multer is installed

## 📞 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check the SECURITY_FEATURES.md for detailed documentation

## 🎉 You're All Set!

Your AgriSafeChain project is now ready with all the enhanced security features:

- ✅ Role-based authentication
- ✅ KYC verification system
- ✅ Secure funding mechanism
- ✅ Wallet integration
- ✅ Blockchain-based audit trail
- ✅ Real-time monitoring

Start the application and begin testing the new features!
