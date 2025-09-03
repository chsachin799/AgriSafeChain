import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home.jsx";
import GovernmentDashboard from "./components/GovernmentDashboard.jsx";
import CenterDashboard from "./components/CenterDashboard.jsx";
import TrainerDashboard from "./components/TrainerDashboard.jsx";
import FarmerDashboard from "./components/FarmerDashboard.jsx";
import RegistrationForms from "./components/RegistrationForms.jsx";
import Login from "./components/Login.jsx"; // 👈 ADDED
import Register from "./components/Register.jsx"; // 👈 ADDED

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en"); // 🌐 default language
  const [translations, setTranslations] = useState({});

  // Load language + dark mode from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("appLanguage");
    if (savedLang) setLanguage(savedLang);

    const savedDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDark);
  }, []);

  // Apply dark class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  // Simple mock translations (replace later with API or i18n JSON)
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

  // helper function for translations
  const t = (key) => translations[key] || key;

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
        {/* Navbar */}
        <nav className="bg-white dark:bg-gray-900 shadow-lg p-4 sticky top-0 z-50 transition-colors duration-500">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            {/* Logo */}
            <Link
              to="/"
              className="text-2xl font-bold text-teal-800 dark:text-emerald-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300"
            >
              AgriSafeChain
            </Link>

            {/* Links */}
            <div className="space-x-4 flex items-center">
              <Link
                to="/government"
                className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300"
              >
                {t("government")}
              </Link>
              <Link
                to="/center"
                className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300"
              >
                {t("center")}
              </Link>
              <Link
                to="/trainer"
                className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300"
              >
                {t("trainer")}
              </Link>
              <Link
                to="/farmer"
                className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300"
              >
                {t("farmer")}
              </Link>
              <Link
                to="/register"
                className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300"
              >
                {t("register")}
              </Link>

              {/* Combined Login and Register link */}
              <Link
                to="/login"
                className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-emerald-400 transition-colors duration-300"
              >
                Login / Register
              </Link>

              {/* 🌙 Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="ml-4 p-2 rounded-full bg-teal-100 dark:bg-gray-700 hover:scale-110 transition-transform duration-300"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>

              {/* 🌐 Language Selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="ml-4 px-2 py-1 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="en">English 🇬🇧</option>
                <option value="hi">हिंदी 🇮🇳</option>
                <option value="ne">नेपाली 🇳🇵</option>
              </select>
            </div>
          </div>
        </nav>

        {/* Pages */}
        <div className="max-w-7xl mx-auto py-6 text-gray-900 dark:text-gray-100 transition-colors duration-500">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/government" element={<GovernmentDashboard />} />
            <Route path="/center" element={<CenterDashboard />} />
            <Route path="/trainer" element={<TrainerDashboard />} />
            <Route path="/farmer" element={<FarmerDashboard />} />
            <Route path="/register" element={<RegistrationForms />} />
            {/* ADDED LOGIN AND REGISTER ROUTES */}
            <Route path="/login" element={<Login />} />
            <Route path="/register-user" element={<Register />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
