# 🚀 AgriSafeChain - Startup Instructions

## ✅ **Current Status:**
- ✅ Environment files created with your configuration
- ✅ Smart contracts compiled successfully
- ✅ All dependencies installed
- ✅ Code pushed to GitHub

## 🏃‍♂️ **How to Start Your Project:**

### **Step 1: Start MongoDB (REQUIRED)**
The backend needs MongoDB to be running. You have two options:

#### Option A: Local MongoDB
```bash
# If you have MongoDB installed locally, start it:
mongod

# Or if MongoDB is installed as a service:
net start MongoDB
```

#### Option B: MongoDB Atlas (Cloud)
If you're using MongoDB Atlas, make sure your connection string in `.env` is correct:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/agrofuns_db
```

### **Step 2: Start the Application**

#### **Method 1: Quick Start (Recommended)**
```bash
# Double-click this file in your project folder:
start-dev.bat
```

#### **Method 2: Manual Start**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend (open new terminal)
cd C:\Users\saham\AgriSafeChain
npm start
```

#### **Method 3: Using npm scripts**
```bash
# Start both together
npm run dev
```

### **Step 3: Access Your Application**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## 🔧 **Troubleshooting:**

### **Backend Won't Start?**
1. **Check MongoDB**: Make sure MongoDB is running
   ```bash
   # Test MongoDB connection
   mongosh
   ```

2. **Check Environment**: Verify `.env` files exist in both root and backend directories

3. **Check Dependencies**: Make sure all packages are installed
   ```bash
   npm run install-all
   ```

### **Frontend Won't Start?**
1. **Check Dependencies**: 
   ```bash
   npm install
   ```

2. **Check Environment**: Verify `.env` file exists in root directory

### **Common Issues:**
- **MongoDB Connection Error**: Start MongoDB service
- **Port Already in Use**: Kill processes using ports 3000/3001
- **Missing Dependencies**: Run `npm run install-all`

## 📱 **Test the Features:**

### 1. **Register Test Users**
- Go to http://localhost:3000/register-user
- Create users with different roles:
  - **Government**: Full access to all dashboards
  - **Trainer**: Access to farmer dashboard and training scenarios
  - **Farmer**: Personal dashboard access

### 2. **Test KYC Verification**
- Login with any user
- Navigate to KYC section
- Complete the 4-step verification process:
  - Personal Information
  - Identity Documents (Passport/Aadhaar)
  - Address Documents
  - Selfie with ID

### 3. **Test Secure Funding (Government Only)**
- Login as government user
- Navigate to funding section
- Verify recipient (KYC, compliance, legal trainer)
- Process funding through wallet integration

### 4. **Test Wallet Integration**
- Install MetaMask browser extension
- Connect wallet to the application
- Test blockchain transactions

## 🔐 **Security Features Available:**

### ✅ **Implemented:**
1. **Role-Based Authentication**: Government, Trainer, Farmer roles
2. **KYC Verification**: Multi-step verification with document upload
3. **Secure Funding**: Blockchain-based funding with verification
4. **Wallet Integration**: MetaMask ready, RazorPay when configured
5. **Audit Trail**: Complete blockchain-based transaction history

### 🛡️ **Security Measures:**
- JWT-based authentication
- Role-based access control
- Document validation and secure storage
- Blockchain-based transaction verification
- Multi-layer funding verification

## 📚 **Documentation:**
- **`QUICK_START.md`** - Step-by-step startup guide
- **`SETUP_GUIDE.md`** - Complete setup instructions  
- **`SECURITY_FEATURES.md`** - Detailed security documentation

## 🎯 **Your Configuration:**
- **MongoDB**: `mongodb://localhost:27017/agrofuns_db`
- **JWT Secret**: Generated secure key
- **Infura API**: `3108b80d349444398c75f0a223df6470`
- **Contract Address**: `0x586067af12ad3c0bC84d43ddB9d471162718f357`
- **Government Wallet**: Configured
- **Center Wallet**: Configured

## ⚠️ **Important Notes:**
1. **MongoDB Required**: The backend won't start without MongoDB
2. **RazorPay**: Add your RazorPay keys to the `.env` files when you get them
3. **MetaMask**: Install MetaMask browser extension for wallet integration

## 🎉 **You're Ready!**

Your AgriSafeChain project is now fully configured and ready to run with all the enhanced security features!

**Next Steps:**
1. Start MongoDB
2. Run `start-dev.bat` or `npm run dev`
3. Open http://localhost:3000
4. Start testing the features!

---

**Need Help?** Check the console for error messages and verify all environment variables are set correctly.
