import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home.jsx";
import GovernmentDashboard from "./components/GovernmentDashboard.jsx";
import CenterDashboard from "./components/CenterDashboard.jsx";
import TrainerDashboard from "./components/TrainerDashboard.jsx";
import FarmerDashboard from "./components/FarmerDashboard.jsx";
import RegistrationForms from "./components/RegistrationForms.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import CertificateViewer from "./components/CertificateViewer.jsx";
import Navbar from "./components/Navbar.jsx";
import Profile from "./components/Profile.jsx";
import app from "./firebase";

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const [translations, setTranslations] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedLang = localStorage.getItem("appLanguage");
    if (savedLang) setLanguage(savedLang);

    const savedDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDark);

    const savedUser = (() => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();


    if (savedUser) {
      setUser(savedUser);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    const dict = {
      en: {
        government: "Government",
        center: "Training Center",
        trainer: "Trainer",
        farmer: "Farmer",
        register: "Registration",
      },
      hi: {
        government: "सरकार",
        center: "प्रशिक्षण केंद्र",
        trainer: "प्रशिक्षक",
        farmer: "किसान",
        register: "पंजीकरण",
      },
      ne: {
        government: "सरकार",
        center: "तालिम केन्द्र",
        trainer: "प्रशिक्षक",
        farmer: "किसान",
        register: "दर्ता",
      },
    };
    setTranslations(dict[language]);
    localStorage.setItem("appLanguage", language);
  }, [language]);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
        <Navbar
          isLoggedIn={isLoggedIn}
          user={user}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          language={language}
          setLanguage={setLanguage}
          translations={translations}
        />

        <div className="max-w-7xl mx-auto py-6 text-gray-900 dark:text-gray-100 transition-colors duration-500">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/government" element={<GovernmentDashboard />} />
            <Route path="/center" element={<CenterDashboard />} />
            <Route path="/trainer" element={<TrainerDashboard />} />
            <Route path="/farmer" element={<FarmerDashboard />} />
            <Route path="/register" element={<RegistrationForms />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register-user" element={<Register />} />
            <Route path="/viewer" element={<CertificateViewer />} />
            <Route path="/profile" element={<Profile user={user} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
