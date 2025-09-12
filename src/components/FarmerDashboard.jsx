import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [farmerData, setFarmerData] = useState({
    name: '',
    center: '',
    trainingCompleted: false,
    attendanceCount: 0,
    kycVerified: false,
    certificates: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (user) {
      loadFarmerData();
    }
  }, [user]);

  const loadFarmerData = async () => {
    setLoading(true);
    try {
      // Simulate loading farmer data
      const mockData = {
        name: user.email.split('@')[0],
        center: 'Agricultural Training Center - Delhi',
        trainingCompleted: false,
        attendanceCount: 3,
        kycVerified: false,
        certificates: []
      };
      setFarmerData(mockData);
      setTrainingProgress((mockData.attendanceCount / 10) * 100);
      
      // Mock recent activities
      setRecentActivities([
        { id: 1, action: 'Attended training session', date: '2024-01-15', status: 'completed' },
        { id: 2, action: 'Submitted KYC documents', date: '2024-01-14', status: 'pending' },
        { id: 3, action: 'Registered for training program', date: '2024-01-10', status: 'completed' }
      ]);
    } catch (error) {
      showMessage('Error loading farmer data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  const handleKYCSubmission = async () => {
    setLoading(true);
    try {
      // Simulate KYC submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFarmerData(prev => ({ ...prev, kycVerified: true }));
      showMessage('KYC documents submitted successfully!');
    } catch (error) {
      showMessage('Error submitting KYC documents');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainingEnrollment = async () => {
    setLoading(true);
    try {
      // Simulate training enrollment
      await new Promise(resolve => setTimeout(resolve, 1000));
      showMessage('Successfully enrolled in training program!');
    } catch (error) {
      showMessage('Error enrolling in training program');
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateDownload = (certificateId) => {
    showMessage(`Downloading certificate ${certificateId}...`);
  };

  if (loading && !farmerData.name) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading farmer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome, {farmerData.name || 'Farmer'}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your training progress and agricultural activities
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                farmerData.kycVerified 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {farmerData.kycVerified ? 'KYC Verified' : 'KYC Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Training Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Training Progress
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Attendance: {farmerData.attendanceCount}/10 sessions
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.round(trainingProgress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${trainingProgress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Training Center: {farmerData.center}
                  </span>
                  <span className={`text-sm font-medium ${
                    farmerData.trainingCompleted 
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {farmerData.trainingCompleted ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!farmerData.kycVerified && (
                  <button
                    onClick={handleKYCSubmission}
                    disabled={loading}
                    className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-teal-500 dark:hover:border-teal-400 transition-colors duration-200 text-left"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Submit KYC Documents
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Complete your identity verification
                        </p>
                      </div>
                    </div>
                  </button>
                )}
                
                <button
                  onClick={handleTrainingEnrollment}
                  disabled={loading}
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-teal-500 dark:hover:border-teal-400 transition-colors duration-200 text-left"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Enroll in Training
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Join agricultural training programs
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activities
              </h2>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        activity.status === 'completed' 
                          ? 'bg-green-500' 
                          : activity.status === 'pending'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.action}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.date}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : activity.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profile Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-sm text-gray-900 dark:text-white">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
                  <p className="text-sm text-gray-900 dark:text-white capitalize">{user?.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Training Center</label>
                  <p className="text-sm text-gray-900 dark:text-white">{farmerData.center}</p>
                </div>
              </div>
            </div>

            {/* Certificates */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Certificates
              </h3>
              {farmerData.certificates.length > 0 ? (
                <div className="space-y-2">
                  {farmerData.certificates.map((cert, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-900 dark:text-white">Certificate {index + 1}</span>
                      <button
                        onClick={() => handleCertificateDownload(cert)}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No certificates available yet. Complete your training to earn certificates.
                </p>
              )}
            </div>

            {/* Support */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Need Help?
              </h3>
              <div className="space-y-3">
                <a href="https://wa.me/1234567890" className="flex items-center text-sm text-green-600 dark:text-green-400 hover:underline">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  WhatsApp Support
                </a>
                <a href="mailto:support@agrisafechain.com" className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Support
                </a>
                <a href="tel:+1234567890" className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:underline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Toast */}
      {showMessage && (
        <div className="fixed bottom-4 right-4 bg-teal-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {message}
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;