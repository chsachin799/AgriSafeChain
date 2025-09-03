import React, { useState, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { v4 as uuidv4 } from 'uuid';

const Modal = ({ title, message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-80 backdrop-blur-sm" onClick={onClose}></div>
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

const API_BASE_URL = 'http://localhost:3001/api';

const TrainerDashboard = () => {
  const [studentAddress, setStudentAddress] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [trainerPrivateKey, setTrainerPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [certificateId, setCertificateId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const previewRef = useRef(null);

  const generatePreview = async () => {
    const id = uuidv4();
    setCertificateId(id);
    const qr = await QRCode.toDataURL(`https://agrisafechain.com/certificate/${id}`);
    setQrCodeUrl(qr);
    setPreviewMode(true);
  };

  const generateImage = async () => {
    const canvas = await html2canvas(previewRef.current);
    return canvas.toDataURL('image/png');
  };

  const handleIssue = async () => {
    setLoading(true);
    setModalMessage('');
    const image = await generateImage();

    try {
      const response = await fetch(`${API_BASE_URL}/issue-certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentAddress,
          certificateName,
          privateKey: trainerPrivateKey,
          certificateId,
          image,
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
              type="text"
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
          <div ref={previewRef} className="relative p-6 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <h2 className="text-3xl font-bold text-center mb-4">AgriSafeChain Certificate</h2>
            <p className="text-lg mb-2"><strong>Student Address:</strong> {studentAddress}</p>
            <p className="text-lg mb-2"><strong>Certificate:</strong> {certificateName}</p>
            <p className="text-sm mt-4 italic text-gray-500 dark:text-gray-400">Certificate ID: {certificateId}</p>
            <p className="text-sm italic text-gray-500 dark:text-gray-400">Blockchain Verified • {new Date().toLocaleString()}</p>
            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 absolute bottom-4 right-4" />}
          </div>
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
