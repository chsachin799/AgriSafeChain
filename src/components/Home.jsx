import React from 'react';
import FeedbackForm from './Feedback';

const Home = () => {
  const featuredFeedback = [
    {
      _id: '1',
      email: 'farmer.ravi@example.com',
      role: 'Farmer',
      message: 'AgriSafeChain has made funding so transparent. I finally feel confident applying for support.',
      rating: 5,
      imageUrl: 'https://i.pravatar.cc/150?u=ravi',
    },
    {
      _id: '2',
      email: 'trainer.anita@example.com',
      role: 'Trainer',
      message: 'Training sessions are now backed by verified transactions. It’s a game changer for accountability.',
      rating: 4,
      imageUrl: 'https://i.pravatar.cc/150?u=anita',
    },
    {
      _id: '3',
      email: 'govt.official@example.com',
      role: 'Government Officer',
      message: 'We’ve streamlined fund distribution and reduced fraud. AgriSafeChain is the future.',
      rating: 5,
      imageUrl: 'https://i.pravatar.cc/150?u=official',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen transition-colors duration-500">
      {/* Hero Section */}
      <section className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 max-w-4xl mx-auto rounded-3xl shadow-2xl bg-white bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-90 animate-fadeIn">
          <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-300 dark:to-emerald-400 text-transparent bg-clip-text drop-shadow-lg">
            AgriSafeChain
          </h1>
          <p className="text-2xl text-gray-900 dark:text-white mb-8 leading-relaxed">
            Revolutionizing agricultural funding through{' '}
            <span className="font-semibold text-teal-700 dark:text-emerald-300">blockchain transparency</span>. Empower farmers, trainers, and governments with secure, decentralized fund management.
          </p>
          <a
            href="/register"
            className="py-3 px-8 rounded-full text-white font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:scale-105 transition-transform"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* What People Are Saying */}
      <section className="py-16 px-4 md:px-16">
        <h2 className="text-4xl font-bold text-center mb-10 bg-gradient-to-r from-teal-600 to-emerald-600 text-transparent bg-clip-text">
          What People Are Saying
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {featuredFeedback.map((fb) => (
            <div key={fb._id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={fb.imageUrl}
                  alt={fb.email}
                  className="w-14 h-14 rounded-full object-cover border-2 border-teal-500"
                />
                <div>
                  <p className="font-semibold text-teal-700 dark:text-emerald-300">{fb.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{fb.role}</p>
                </div>
              </div>
              <p className="text-gray-900 dark:text-white leading-relaxed">{fb.message}</p>
              <div className="mt-3 text-yellow-500 text-lg">
                {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Submit Your Feedback */}
      <section className="py-20 px-4 md:px-16 bg-white dark:bg-gray-900 rounded-t-3xl shadow-inner">
        <h2 className="text-4xl font-bold text-center mb-10 bg-gradient-to-r from-teal-600 to-emerald-600 text-transparent bg-clip-text">
          Submit Your Feedback
        </h2>
        <FeedbackForm />
      </section>
    </div>
  );
};

export default Home;
