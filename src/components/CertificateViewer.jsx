import React from "react";
import { useSearchParams } from "react-router-dom";

const CertificateViewer = () => {
  const [params] = useSearchParams();
  const image = params.get("img");
  const id = params.get("id");

  if (!image || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-6 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">Invalid Certificate Link</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            The certificate preview could not be loaded. Please check the QR code or link.
          </p>
          <a
            href="/"
            className="inline-block py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition"
          >
            Go Back Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-6">
      <h2 className="text-3xl font-bold mb-4 text-teal-700 dark:text-emerald-300">Certificate Preview</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-2xl w-full text-center">
        <img
          src={image}
          alt="Certificate"
          className="w-full max-w-xl mx-auto rounded-lg shadow-md mb-6"
        />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Certificate ID: <span className="font-mono">{id}</span>
        </p>
        <a
          href={image}
          download={`AgriSafeChain_Certificate_${id}.png`}
          className="py-2 px-6 bg-teal-600 text-white rounded-lg hover:bg-teal-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition"
        >
          Download Certificate
        </a>
      </div>
    </div>
  );
};

export default CertificateViewer;
