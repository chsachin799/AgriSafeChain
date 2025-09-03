import React from 'react';

// Modal component with fade-in and scale animations
const Modal = ({ title, message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-80 backdrop-blur-sm transition-all duration-300 opacity-0 animate-fadeInModal"
        onClick={onClose}
      ></div>
      <div className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl p-6 max-w-md mx-auto shadow-2xl transform transition-all duration-300 scale-95 animate-scaleIn dark:shadow-xl dark:shadow-teal-900">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h3>
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

export default Modal;
