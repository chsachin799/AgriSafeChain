# 🚀 AgriSafeChain - Quick Start Guide

## ✅ Environment Setup Complete!

Your environment files have been created with your configuration:

- **MongoDB**: `mongodb://localhost:27017/agrofuns_db`
- **JWT Secret**: Generated secure key
- **Infura API**: `3108b80d349444398c75f0a223df6470`
- **Contract Address**: `0x586067af12ad3c0bC84d43ddB9d471162718f357`
- **Government Wallet**: Configured
- **Center Wallet**: Configured

## 🏃‍♂️ How to Start Your Project

### Step 1: Start MongoDB (Required)
```bash
# If you have MongoDB installed locally:
mongod

# Or if using MongoDB Atlas, make sure your connection string is correct
```

### Step 2: Start the Application

#### Option A: Quick Start (Recommended)
```bash
# Double-click this file in your project folder:
start-dev.bat
```

#### Option B: Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend (in new terminal)
npm start
```

#### Option C: Using npm scripts
```bash
# Start both together
npm run dev
```

## 🌐 Access Your Application

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## 🧪 Test the Features

### 1. Register Test Users
- Go to http://localhost:3000/register-user
- Create users with different roles:
  - **Government**: Full access
  - **Trainer**: Farmer dashboard access
  - **Farmer**: Personal dashboard access

### 2. Test KYC Verification
- Login with any user
- Navigate to KYC section
- Complete the 4-step verification process
- Upload documents (Passport/Aadhaar)

### 3. Test Secure Funding (Government Only)
- Login as government user
- Navigate to funding section
- Verify recipient (KYC, compliance, legal trainer)
- Process funding through wallet integration

### 4. Test Wallet Integration
- Install MetaMask browser extension
- Connect wallet to the application
- Test blockchain transactions

## 🔧 Troubleshooting

### Backend Won't Start?
1. **Check MongoDB**: Make sure MongoDB is running
   ```bash
   # Start MongoDB
   mongod
   ```

2. **Check Environment**: Verify .env files exist in both root and backend directories

3. **Check Dependencies**: Make sure all packages are installed
   ```bash
   npm run install-all
   ```

### Frontend Won't Start?
1. **Check Dependencies**: 
   ```bash
   npm install
   ```

2. **Check Environment**: Verify .env file exists in root directory

### Common Issues:
- **MongoDB Connection Error**: Start MongoDB service
- **Port Already in Use**: Kill processes using ports 3000/3001
- **Missing Dependencies**: Run `npm run install-all`

## 📱 Features Available

### ✅ Implemented Security Features:
1. **Role-Based Authentication**: Government, Trainer, Farmer roles
2. **KYC Verification**: Multi-step verification with document upload
3. **Secure Funding**: Blockchain-based funding with verification
4. **Wallet Integration**: MetaMask and RazorPay (when configured)
5. **Audit Trail**: Complete blockchain-based transaction history

### 🔐 Security Measures:
- JWT-based authentication
- Role-based access control
- Document validation and secure storage
- Blockchain-based transaction verification
- Multi-layer funding verification

## 📞 Need Help?

1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure MongoDB is running
4. Check the SECURITY_FEATURES.md for detailed documentation

## 🎉 You're Ready!

Your AgriSafeChain project is now fully configured and ready to run with all the enhanced security features!

**Next Steps:**
1. Start MongoDB
2. Run `start-dev.bat` or `npm run dev`
3. Open http://localhost:3000
4. Start testing the features!

---

**Note**: Remember to add your RazorPay keys to the .env files when you get them for full payment integration.
