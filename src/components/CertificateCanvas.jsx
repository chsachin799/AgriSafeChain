import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

// This function handles the upload of the certificate image to Cloudinary.
const uploadToCloudinary = async (base64Image) => {
  const formData = new FormData();
  formData.append("file", base64Image);
  formData.append("upload_preset", "AgriSafeChain");
  
  try {
    const response = await fetch("https://api.cloudinary.com/v1_1/dxjg9j9gh/image/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return null;
  }
};

const CertificateCanvas = ({ studentAddress, certificateName, certificateId, onImageGenerated }) => {
  const previewRef = useRef(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    // We only generate the image and QR code once the component mounts
    // and all the props are available.
    if (studentAddress && certificateName && certificateId) {
      setTimeout(async () => {
        const image = await generateImage();
        const uploadedUrl = await uploadToCloudinary(image);
        if (uploadedUrl) {
          setImageUrl(uploadedUrl);
          onImageGenerated(uploadedUrl);
          const qr = await QRCode.toDataURL(`https://agrisafechain.vercel.app/viewer?img=${uploadedUrl}&id=${certificateId}`);
          setQrCodeUrl(qr);
          setShowQr(true);
        }
      }, 500); // 500ms delay to ensure DOM is ready
    }
  }, [studentAddress, certificateName, certificateId, onImageGenerated]);

  const generateImage = async () => {
    if (!previewRef.current) {
      throw new Error("Preview element not found. Make sure it's rendered before capturing.");
    }
    const canvas = await html2canvas(previewRef.current, {
      scale: 2 // Use a higher scale for better resolution
    });
    return canvas.toDataURL("image/png");
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `certificate-${certificateId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        ref={previewRef} 
        className="relative p-12 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-4 border-teal-500 dark:border-emerald-600 text-gray-900 dark:text-white"
        style={{ width: '800px', height: '600px', fontFamily: 'Playfair Display, serif' }}
      >
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <p className="text-xl font-medium text-gray-600 dark:text-gray-400">AGROFUNDS</p>
          <h2 className="text-6xl font-extrabold text-teal-800 dark:text-emerald-300 tracking-wider">CERTIFICATE</h2>
          <p className="text-2xl mt-4 font-normal italic text-gray-700 dark:text-gray-300">of Completion</p>
          
          <div className="mt-8">
            <p className="text-xl text-gray-700 dark:text-gray-300">This certifies that</p>
            <h1 className="text-2.5xl font-bold mt-2 text-blue-800 dark:text-blue-300 break-words max-w-full">{studentAddress}</h1>
            <p className="text-xl italic mt-4 text-gray-700 dark:text-gray-300">has successfully completed the training in</p>
            <h2 className="text-4xl font-semibold mt-2 text-emerald-700 dark:text-teal-200 break-words max-w-full">{certificateName}</h2>
          </div>
          
          <div className="flex justify-between w-full mt-auto pt-8 border-t border-gray-300 dark:border-gray-600">
            <div className="text-left space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Certificate ID: {certificateId}</p>
            </div>
            {showQr && qrCodeUrl && (
              <div className="p-1 bg-white dark:bg-gray-700 rounded shadow">
                <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="mt-6 py-3 px-8 rounded-xl text-white font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 focus:outline-none shadow-lg transition-all duration-300 transform hover:scale-105"
      >
        Download Certificate
      </button>
    </div>
  );
};

export default CertificateCanvas;
