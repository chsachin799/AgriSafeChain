import React, { useState } from 'react';
import axios from 'axios';

const FeedbackForm = () => {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setStatus('You must be logged in to submit feedback.');
      return;
    }

    try {
      await axios.post(
        'http://localhost:3001/api/feedback',
        { message, rating },
        { headers: { 'x-auth-token': token } }
      );
      setStatus('Feedback submitted successfully!');
      setMessage('');
      setRating(0);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setStatus('Failed to submit feedback.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* ✅ Updated textarea styling for visibility in both themes */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your thoughts on AgriSafeChain..."
        rows="5"
        className="p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-teal-500"
        required
      />
      <div className="flex items-center gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-3xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      <button
        type="submit"
        className="py-3 px-8 rounded-full text-white font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:scale-105 transition-transform"
      >
        Submit Feedback
      </button>
      {status && (
        <p className={`text-center font-medium ${status.includes('successfully') ? 'text-teal-600' : 'text-red-600'}`}>
          {status}
        </p>
      )}
    </form>
  );
};

export default FeedbackForm;
