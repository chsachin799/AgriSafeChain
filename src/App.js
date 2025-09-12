import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./components/Home.jsx";
import GovernmentDashboard from "./components/GovernmentDashboard.jsx";
import EnhancedGovernmentDashboard from "./components/EnhancedGovernmentDashboard.jsx";
import TransparencyDashboard from "./components/TransparencyDashboard.jsx";
import RealTimeMonitoring from "./components/RealTimeMonitoring.jsx";
import KYCVerification from "./components/EnhancedKYCVerification.jsx";
import CenterDashboard from "./components/CenterDashboard.jsx";
import TrainerDashboard from "./components/TrainerDashboard.jsx";
import FarmerDashboard from "./components/FarmerDashboard.jsx";
import RegistrationForms from "./components/RegistrationForms.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import CertificateViewer from "./components/CertificateViewer.jsx";
import Navbar from "./components/Navbar.jsx";
import Profile from "./components/Profile.jsx";
import Help from "./components/Help.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Unauthorized from "./components/Unauthorized.jsx";
import KYCRequired from "./components/KYCRequired.jsx";
import app from "./firebase";

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
          <Navbar
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />

          <div className="max-w-7xl mx-auto py-6 text-gray-900 dark:text-gray-100 transition-colors duration-500">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/transparency" element={<TransparencyDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register-user" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/government" element={
                <ProtectedRoute requiredRole="government">
                  <GovernmentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/government-enhanced" element={
                <ProtectedRoute requiredRole="government">
                  <EnhancedGovernmentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/monitoring" element={
                <ProtectedRoute requiredRole="government">
                  <RealTimeMonitoring />
                </ProtectedRoute>
              } />
              <Route path="/center" element={
                <ProtectedRoute requiredRole="government">
                  <CenterDashboard />
                </ProtectedRoute>
              } />
              <Route path="/trainer" element={
                <ProtectedRoute allowedRoles={['trainer', 'government']}>
                  <TrainerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/farmer" element={
                <ProtectedRoute allowedRoles={['farmer', 'trainer', 'government']}>
                  <FarmerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/kyc" element={
                <ProtectedRoute>
                  <KYCVerification />
                </ProtectedRoute>
              } />
              <Route path="/register" element={
                <ProtectedRoute>
                  <RegistrationForms />
                </ProtectedRoute>
              } />
              <Route path="/viewer" element={
                <ProtectedRoute>
                  <CertificateViewer />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              {/* Error pages */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/kyc-required" element={<KYCRequired />} />
            </Routes>
          </div>
          
          <Help />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;