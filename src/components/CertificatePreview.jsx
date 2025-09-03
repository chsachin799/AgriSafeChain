import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { v4 as uuidv4 } from 'uuid';

const CertificatePreview = ({ name, email, title, transactionHash, onGenerate }) => {
  const canvasRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const certificateId = uuidv4();

  useEffect(() => {
    const generateQR = async () => {
      const url = `https://blockchainexplorer.com/tx/${transactionHash || 'pending'}`;
      const qr = await QRCode.toDataURL(url);
      setQrDataUrl(qr);
    };
    generateQR();
  }, [transactionHash]);

  const handleDownload = async () => {
    const canvas = await html2canvas(canvasRef.current);
    const dataUrl = canvas.toDataURL('image/png');
    onGenerate(dataUrl, certificateId);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-2xl mx-auto">
      <div ref={canvasRef} className="relative p-8 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
        <h2 className="text-3xl font-bold text-center mb-4">AgriSafeChain Certificate</h2>
        <p className="text-lg mb-2"><strong>Name:</strong> {name}</p>
        <p className="text-lg mb-2"><strong>Email:</strong> {email}</p>
        <p className="text-lg mb-2"><strong>Certificate:</strong> {title}</p>
        <p className="text-sm mt-4 italic text-gray-500 dark:text-gray-400">Certificate ID: {certificateId}</p>
        <p className="text-sm italic text-gray-500 dark:text-gray-400">Blockchain Verified • {new Date().toLocaleString()}</p>
        {qrDataUrl && (
          <img src={qrDataUrl} alt="QR Code" className="w-24 h-24 absolute bottom-4 right-4" />
        )}
      </div>
      <button
        onClick={handleDownload}
        className="mt-6 w-full py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition"
      >
        Generate Certificate Image
      </button>
    </div>
  );
};

export default CertificatePreview;
