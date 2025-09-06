import React, { useEffect, useState } from 'react';

const CertificateViewer = () => {
    const [imageUrl, setImageUrl] = useState('');
    const [certificateId, setCertificateId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const img = urlParams.get('img');
        const id = urlParams.get('id');

        if (img) {
            setImageUrl(img);
        } else {
            console.error("Image URL not found in query parameters.");
        }

        if (id) {
            setCertificateId(id);
        } else {
            console.error("Certificate ID not found in query parameters.");
        }
        
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <p className="text-gray-600 dark:text-gray-300">Loading certificate...</p>
            </div>
        );
    }

    if (!imageUrl) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                    <h2 className="text-2xl font-bold text-red-500 mb-2">Certificate Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400">Please ensure you have a valid certificate URL.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
            <h1 className="text-4xl md:text-5xl font-extrabold text-teal-800 dark:text-emerald-300 mb-8 text-center">
                Certificate Verification
            </h1>
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full">
                <img 
                    src={imageUrl} 
                    alt="Certificate of Completion" 
                    className="w-full h-auto object-cover"
                />
            </div>
            <div className="mt-8 text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full">
                <p className="text-lg text-gray-700 dark:text-gray-300 font-semibold">
                    This certificate has been issued and can be verified on the blockchain.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Certificate ID: {certificateId}
                </p>
            </div>
        </div>
    );
};

export default CertificateViewer;
