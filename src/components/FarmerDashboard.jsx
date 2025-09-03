import React, { useState } from 'react';

// API endpoint
const API_BASE_URL = 'http://localhost:3001/api';

const Modal = ({ title, message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden max-w-sm w-full z-10 p-6 transform transition-all duration-300 scale-100">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 focus:outline-none shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const FarmerDashboard = () => {
  const [farmerAddress, setFarmerAddress] = useState('');
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const getFarmerStatus = async () => {
    if (!farmerAddress) {
      setModalMessage('Enter your wallet address.');
      return;
    }

    setLoading(true);
    setModalMessage('');
    setTrainingStatus(null);

    try {
      const response = await fetch(`${API_BASE_URL}/farmer-status?farmerAddress=${farmerAddress}`);
      const data = await response.json();

      if (response.ok) {
        setTrainingStatus(data.isTrainingCompleted);
      } else {
        setModalMessage(`Error: ${data.error || 'Failed.'}`);
      }
    } catch (error) {
      setModalMessage(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen flex flex-col items-center justify-center transition-colors duration-500">
      <Modal
        title="Status"
        message={modalMessage}
        onClose={() => setModalMessage('')}
      />

      <div className="text-center relative">
        <h2 className="text-4xl font-bold mb-6 text-teal-800 dark:text-emerald-300">
          Farmer Dashboard
        </h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300 text-center max-w-2xl mx-auto">
          Check your training status and fund eligibility.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 max-w-lg mx-auto transition-all duration-300 hover:shadow-2xl">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-white to-gray-200 dark:from-gray-700 dark:to-gray-900 shadow-md">
          <svg className="w-12 h-12 text-teal-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM21 21h-1v-1c0-3.314-2.686-6-6-6h-2c-3.314 0-6 2.686-6 6v1H3c-1.104 0-2 .896-2 2v2c0 1.104.896 2 2 2h18c1.104 0 2-.896 2-2v-2c0-1.104-.896-2-2-2zM9 13.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z"></path>
          </svg>
        </div>
        <h3 className="text-2xl font-semibold mb-4 text-teal-700 dark:text-emerald-400 text-center">
          Check Status
        </h3>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            getFarmerStatus();
          }}
        >
          {/* ✅ Updated input styling for visibility in both themes */}
          <input
            type="text"
            value={farmerAddress}
            onChange={(e) => setFarmerAddress(e.target.value)}
            placeholder="Wallet Address (0x...)"
            className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200"
            required
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 dark:from-green-600 dark:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-800 focus:outline-none shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </form>

        {trainingStatus !== null && (
          <div
            className={`mt-6 p-4 rounded-xl text-center transition-all duration-300 ${
              trainingStatus
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900 dark:to-emerald-900 dark:text-green-300'
                : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 dark:from-red-900 dark:to-rose-900 dark:text-red-300'
            }`}
          >
            <p className="font-bold">Training Status:</p>
            <p>{trainingStatus ? 'Completed! Eligible for funds.' : 'Not completed yet.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;
