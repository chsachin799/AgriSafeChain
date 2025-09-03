import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

const Modal = ({ title, message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-80 backdrop-blur-sm transition-all duration-300" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl p-6 max-w-md mx-auto shadow-2xl transform transition-all duration-300 scale-95 dark:shadow-xl dark:shadow-teal-900">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-line">{message}</p>
        <button
          onClick={onClose}
          className="py-2 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold hover:from-teal-600 hover:to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 transition-all duration-300 transform hover:scale-105"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const handleSubmit = async (url, data, successMessage, setLoading, setModalMessage) => {
  setLoading(true);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (response.ok) {
      setModalMessage(
        `${successMessage}\nTransaction Hash: ${result.transactionHash}\nAddress: ${
          result.registeredCenterAddress || 'N/A'
        }`
      );
    } else {
      setModalMessage(`Error: ${result.error || 'Failed.'}`);
    }
  } catch (error) {
    setModalMessage(`Network error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

const RegistrationForms = () => {
  const [centerName, setCenterName] = useState('');
  const [trainerPrivateKey, setTrainerPrivateKey] = useState('');
  const [trainerAddress, setTrainerAddress] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  return (
    <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen transition-colors duration-500">
      <Modal
        title="Transaction Status"
        message={modalMessage}
        onClose={() => setModalMessage('')}
      />

      <h2 className="text-4xl font-bold mb-6 text-teal-800 dark:text-emerald-300 text-center">
        Registration
      </h2>
      <p className="mb-6 text-gray-700 dark:text-gray-300 text-center max-w-2xl mx-auto">
        Register training centers or trainers easily.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Register Center */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl">
          <h3 className="text-2xl font-semibold mb-4 text-teal-700 dark:text-emerald-400 text-center">
            Register Center
          </h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(
                `${API_BASE_URL}/register-center`,
                { name: centerName },
                'Center registered!',
                setLoading,
                setModalMessage
              );
            }}
          >
            <input
              type="text"
              value={centerName}
              onChange={(e) => setCenterName(e.target.value)}
              placeholder="Center Name"
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200"
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Center'}
            </button>
          </form>
        </div>

        {/* Register Trainer */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl">
          <h3 className="text-2xl font-semibold mb-4 text-teal-700 dark:text-emerald-400 text-center">
            Register Trainer
          </h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(
                `${API_BASE_URL}/register-trainer`,
                { privateKey: trainerPrivateKey, trainerAddress, name: trainerName },
                'Trainer registered!',
                setLoading,
                setModalMessage
              );
            }}
          >
            <input
              type="text"
              value={trainerPrivateKey}
              onChange={(e) => setTrainerPrivateKey(e.target.value)}
              placeholder="Center Private Key"
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200"
              required
            />
            <input
              type="text"
              value={trainerAddress}
              onChange={(e) => setTrainerAddress(e.target.value)}
              placeholder="Trainer Address (0x...)"
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200"
              required
            />
            <input
              type="text"
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              placeholder="Trainer Name"
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200"
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              disabled={loading || !trainerPrivateKey}
            >
              {loading ? 'Registering...' : 'Register Trainer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForms;
