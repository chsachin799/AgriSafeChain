import React, { useState} from 'react';
import { v4 as uuidv4 } from 'uuid';
import Modal from './Modal.jsx';
import CertificateCanvas from './CertificateCanvas.jsx';

const API_BASE_URL = 'http://localhost:3001/api';

const TrainerDashboard = () => {
  const [studentAddress, setStudentAddress] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [trainerPrivateKey, setTrainerPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [certificateId, setCertificateId] = useState('');
  const [certificateImageUrl, setCertificateImageUrl] = useState('');

  // This function simply triggers the preview mode and generates a new unique ID.
  const generatePreview = () => {
    setCertificateId(uuidv4());
    setPreviewMode(true);
  };

  const handleIssue = async () => {
    // Ensure the image has been generated and uploaded before proceeding.
    if (!certificateImageUrl) {
        setModalMessage("Error: Please generate a certificate preview first.");
        return;
    }

    setLoading(true);
    setModalMessage('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/issue-certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentAddress,
          certificateName,
          privateKey: trainerPrivateKey,
          certificateId,
          image: certificateImageUrl,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setModalMessage(`Certificate issued!\nTransaction Hash: ${result.transactionHash}`);
      } else {
        setModalMessage(`Error: ${result.error || 'Failed.'}`);
      }
    } catch (error) {
      setModalMessage(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
      setPreviewMode(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen transition-colors duration-500">
      <Modal title="Issuance Status" message={modalMessage} onClose={() => setModalMessage('')} />

      <h2 className="text-4xl font-bold mb-6 text-teal-800 dark:text-emerald-300 text-center">Trainer Dashboard</h2>
      <p className="mb-6 text-gray-700 dark:text-gray-300 text-center max-w-2xl mx-auto">
        Issue certificates to students after training.
      </p>

      {!previewMode ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 max-w-lg mx-auto transition-all duration-300 hover:shadow-2xl">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); generatePreview(); }}>
            <input
              type="text"
              value={studentAddress}
              onChange={(e) => setStudentAddress(e.target.value)}
              placeholder="Student Wallet Address"
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200"
              required
            />
            <input
              type="text"
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              placeholder="Certificate Name"
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200"
              required
            />
            <input
              type="password"
              value={trainerPrivateKey}
              onChange={(e) => setTrainerPrivateKey(e.target.value)}
              placeholder="Your Private Key"
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200"
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 focus:outline-none shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Preview Certificate
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 max-w-2xl mx-auto">
          {/* We pass the props and the callback function to the child component */}
          <CertificateCanvas
            studentAddress={studentAddress}
            certificateName={certificateName}
            certificateId={certificateId}
            onImageGenerated={setCertificateImageUrl}
          />
          <button
            onClick={handleIssue}
            className="mt-6 w-full py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition"
            disabled={loading}
          >
            {loading ? 'Issuing...' : 'Confirm & Issue Certificate'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TrainerDashboard;
