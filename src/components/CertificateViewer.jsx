import React from "react";
import { useSearchParams } from "react-router-dom";

const CertificateViewer = () => {
  const [params] = useSearchParams();
  const image = params.get("img");
  const id = params.get("id");

  if (!image || !id) {
    return <div>Invalid certificate link</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-4 text-teal-700 dark:text-emerald-300">Certificate Preview</h2>
      <img src={image} alt="Certificate" className="max-w-xl rounded shadow-lg mb-4" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Certificate ID: {id}</p>
      <a
        href={image}
        download={`AgriSafeChain_Certificate_${id}.png`}
        className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
      >
        Download Certificate
      </a>
    </div>
  );
};

export default CertificateViewer;
