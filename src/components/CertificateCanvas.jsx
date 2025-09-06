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
        className="relative p-6 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white transform scale-95"
        style={{ width: '800px', height: '600px', position: 'relative' }} // Fixed size for consistent canvas capture
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-5xl font-extrabold text-teal-600 dark:text-emerald-400 mb-4">Certificate of Completion</h2>
          <p className="text-2xl mb-2">This certificate is proudly presented to</p>
          <p className="text-4xl font-bold text-blue-800 dark:text-blue-300 mb-4">{studentAddress}</p>
          <p className="text-xl italic mb-6">for successfully completing the course</p>
          <p className="text-3xl font-semibold mb-6 text-emerald-700 dark:text-teal-200">{certificateName}</p>
          <p className="text-sm mt-auto italic text-gray-500 dark:text-gray-400">Certificate ID: {certificateId}</p>
          <p className="text-sm italic text-gray-500 dark:text-gray-400">Blockchain Verified • {new Date().toLocaleDateString()}</p>
        </div>
        {showQr && qrCodeUrl && (
          <div className="absolute bottom-4 right-4 p-2 bg-white rounded-lg shadow-md">
            <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
          </div>
        )}
      </div>

      <button
        onClick={handleDownload}
        className="mt-6 w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 focus:outline-none shadow-lg transition-all duration-300 transform hover:scale-105"
      >
        Download Certificate
      </button>
    </div>
  );
};

export default CertificateCanvas;
