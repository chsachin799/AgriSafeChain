import React from "react";

const CertificatePreview = React.forwardRef(({ recipientName, courseName, issueDate, certificateId }, ref) => {
  return (
    <div
      ref={ref}
      className="w-[800px] h-[600px] bg-white dark:bg-gray-900 border-4 border-teal-600 dark:border-emerald-400 rounded-xl shadow-2xl p-10 flex flex-col justify-between text-center"
    >
      <div>
        <h1 className="text-4xl font-bold text-teal-700 dark:text-emerald-300 mb-4">AgriSafeChain Certificate</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300">This certifies that</p>
        <h2 className="text-3xl font-semibold text-teal-800 dark:text-emerald-200 mt-2">{recipientName}</h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mt-4">has successfully completed the</p>
        <h3 className="text-2xl font-medium text-teal-700 dark:text-emerald-300">{courseName}</h3>
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Issued on: {issueDate}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Certificate ID: {certificateId}</p>
      </div>
    </div>
  );
});

export default CertificatePreview;
