import React, { useState } from 'react';
import centericon from '../assests/training_center.png';

// API endpoint
const API_BASE_URL = 'http://localhost:3001/api';

const CenterDashboard = ({ handleSubmit, loading }) => {
  const [activeTab, setActiveTab] = useState('report');
  const [reportDescription, setReportDescription] = useState('');
  const [trainerAddress, setTrainerAddress] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  return (
    <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen flex flex-col items-center justify-center transition-colors duration-500">
      <div className="text-center relative">
        <img
          src={centericon}
          alt="Training Center"
          className="w-20 h-20 mx-auto mb-4 transition-all duration-300 filter drop-shadow-lg"
          style={{
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(0, 128, 128, 0.2))',
            borderRadius: '10%',
            padding: '5px',
          }}
        />
        <h2 className="text-4xl font-bold text-teal-800 dark:text-emerald-300 mt-2">Training Center Dashboard</h2>
      </div>
      <p className="mt-6 mb-8 text-gray-700 dark:text-gray-300 text-center max-w-2xl mx-auto">
        Manage credentials, report fund usage, and register trainers securely.
      </p>
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden max-w-2xl mx-auto transition-all duration-300 hover:shadow-2xl">
        <div className="p-6">
          {/* Tab Navigation */}
          <div className="flex justify-around mb-6">
            <button
              className={`px-4 py-2 rounded-lg ${activeTab === 'report' ? 'bg-teal-500 dark:bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} hover:bg-teal-600 dark:hover:bg-emerald-700 hover:text-white transition-colors`}
              onClick={() => setActiveTab('report')}
            >
              Report Fund Usage
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${activeTab === 'register' ? 'bg-teal-500 dark:bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} hover:bg-teal-600 dark:hover:bg-emerald-700 hover:text-white transition-colors`}
              onClick={() => setActiveTab('register')}
            >
              Register Trainer
            </button>
          </div>

          {/* Form Content */}
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (activeTab === 'report') {
              handleSubmit(`${API_BASE_URL}/report-usage`, { privateKey, description: reportDescription }, 'Usage reported!');
            } else {
              handleSubmit(`${API_BASE_URL}/register-trainer`, { privateKey, trainerAddress, name: trainerName }, 'Trainer registered!');
            }
          }}>
            {/* ✅ Updated input styling */}
            <input
              type="text"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="Private Key"
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200"
              required
            />

            {activeTab === 'report' && (
              <input
                type="text"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Fund Usage Description"
                className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200"
                required
              />
            )}

            {activeTab === 'register' && (
              <>
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
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 focus:outline-none shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              disabled={loading || !privateKey || (activeTab === 'report' && !reportDescription) || (activeTab === 'register' && (!trainerAddress || !trainerName))}
            >
              {loading ? (activeTab === 'report' ? 'Reporting...' : 'Registering...') : (activeTab === 'report' ? 'Report Usage' : 'Register Trainer')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CenterDashboard;
