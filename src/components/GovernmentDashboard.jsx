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
        <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">{message}</p>
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

const GovernmentDashboard = () => {
  const [allocateCenterAddress, setAllocateCenterAddress] = useState('');
  const [allocateAmount, setAllocateAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const allocateFunds = async () => {
    setLoading(true);
    setModalMessage('');
    setModalTitle('');

    try {
      const response = await fetch(`${API_BASE_URL}/allocate-funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centerAddress: allocateCenterAddress, amount: allocateAmount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to allocate funds.');
      }

      const data = await response.json();
      setModalMessage(`Funds allocated!\nTransaction hash: ${data.transactionHash}`);
      setModalTitle('Success');
    } catch (err) {
      setModalMessage(err.message);
      setModalTitle('Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen flex flex-col items-center justify-center transition-colors duration-500">
      <Modal title={modalTitle} message={modalMessage} onClose={() => setModalMessage('')} />
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-white to-gray-200 dark:from-gray-700 dark:to-gray-900 shadow-md">
          <svg className="w-12 h-12 text-teal-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l-10 8h20l-10-8zm0 20c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-8-12v12h16v-12h-16z"></path>
          </svg>
        </div>
        <h2 className="text-4xl font-bold text-teal-800 dark:text-emerald-300">Government Dashboard</h2>
      </div>
      <p className="mt-6 mb-8 text-gray-700 dark:text-gray-300 text-center max-w-2xl mx-auto">
        Manage fund allocations to training centers with transparency.
      </p>
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden max-w-lg mx-auto transition-all duration-300 hover:shadow-2xl">
        <div className="p-6">
          <h3 className="text-2xl font-semibold mb-4 text-teal-700 dark:text-emerald-400">Allocate Funds</h3>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); allocateFunds(); }}>
            {/* ✅ Updated input styling */}
            <input
              type="text"
              value={allocateCenterAddress}
              onChange={(e) => setAllocateCenterAddress(e.target.value)}
              placeholder="Center Address (0x...)"
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200"
              required
            />
            <input
              type="number"
              step="0.0001"
              value={allocateAmount}
              onChange={(e) => setAllocateAmount(e.target.value)}
              placeholder="Amount in ETH (e.g., 0.1)"
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200"
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Allocating...' : 'Allocate Funds'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GovernmentDashboard;
