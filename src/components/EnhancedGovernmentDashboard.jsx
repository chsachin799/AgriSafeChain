import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const API_BASE_URL = 'http://localhost:3001/api';

const EnhancedGovernmentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  
  // State for different sections
  const [kycData, setKycData] = useState({ userAddress: '' });
  const [complianceData, setComplianceData] = useState({ userAddress: '', ruleId: '', description: '' });
  const [validatorData, setValidatorData] = useState({ validatorAddress: '', stake: '' });
  const [fundingData, setFundingData] = useState({ 
    centerAddress: '', 
    amount: '', 
    sourceId: '',
    name: '',
    location: '',
    contactInfo: ''
  });
  const [monitoringData, setMonitoringData] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [fundReports, setFundReports] = useState(null);
  const [trainingMetrics, setTrainingMetrics] = useState(null);
  const [transparencyData, setTransparencyData] = useState(null);

  // Fetch monitoring data
  useEffect(() => {
    fetchMonitoringData();
    fetchAuditTrail();
    fetchFundReports();
    fetchTrainingMetrics();
    fetchTransparencyData();
  }, []);

  const fetchMonitoringData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/monitoring/data`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (data.success) {
        setMonitoringData(data.data);
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    }
  };

  const fetchAuditTrail = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/audit/trail`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (data.success) {
        setAuditTrail(data.auditTrail);
      }
    } catch (error) {
      console.error('Error fetching audit trail:', error);
    }
  };

  const fetchFundReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/dashboard/fund-reports`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (data.success) {
        setFundReports(data.data);
      }
    } catch (error) {
      console.error('Error fetching fund reports:', error);
    }
  };

  const fetchTrainingMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/dashboard/training-metrics`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (data.success) {
        setTrainingMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching training metrics:', error);
    }
  };

  const fetchTransparencyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/dashboard/transparency`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (data.success) {
        setTransparencyData(data.data);
      }
    } catch (error) {
      console.error('Error fetching transparency data:', error);
    }
  };

  const handleKYCVerification = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/kyc/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(kycData)
      });
      const data = await response.json();
      if (data.success) {
        setModalMessage(`KYC verified successfully!\nTransaction: ${data.transactionHash}`);
        setModalTitle('Success');
        setKycData({ userAddress: '' });
      } else {
        throw new Error(data.error || 'Failed to verify KYC');
      }
    } catch (error) {
      setModalMessage(error.message);
      setModalTitle('Error');
    } finally {
      setLoading(false);
    }
  };

  const handleComplianceApproval = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/compliance/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ userAddress: complianceData.userAddress })
      });
      const data = await response.json();
      if (data.success) {
        setModalMessage(`Compliance approved successfully!\nTransaction: ${data.transactionHash}`);
        setModalTitle('Success');
        setComplianceData({ userAddress: '', ruleId: '', description: '' });
      } else {
        throw new Error(data.error || 'Failed to approve compliance');
      }
    } catch (error) {
      setModalMessage(error.message);
      setModalTitle('Error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplianceRule = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/compliance/rules`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          ruleId: complianceData.ruleId,
          description: complianceData.description
        })
      });
      const data = await response.json();
      if (data.success) {
        setModalMessage(`Compliance rule created successfully!\nTransaction: ${data.transactionHash}`);
        setModalTitle('Success');
        setComplianceData({ userAddress: '', ruleId: '', description: '' });
      } else {
        throw new Error(data.error || 'Failed to create compliance rule');
      }
    } catch (error) {
      setModalMessage(error.message);
      setModalTitle('Error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddValidator = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/consensus/validator`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(validatorData)
      });
      const data = await response.json();
      if (data.success) {
        setModalMessage(`Validator added successfully!\nTransaction: ${data.transactionHash}`);
        setModalTitle('Success');
        setValidatorData({ validatorAddress: '', stake: '' });
      } else {
        throw new Error(data.error || 'Failed to add validator');
      }
    } catch (error) {
      setModalMessage(error.message);
      setModalTitle('Error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCenter = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/register/center-enhanced`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          centerAddress: fundingData.centerAddress,
          name: fundingData.name,
          location: fundingData.location,
          contactInfo: fundingData.contactInfo
        })
      });
      const data = await response.json();
      if (data.success) {
        setModalMessage(`Center registered successfully!\nTransaction: ${data.transactionHash}`);
        setModalTitle('Success');
        setFundingData({ 
          centerAddress: '', 
          amount: '', 
          sourceId: '',
          name: '',
          location: '',
          contactInfo: ''
        });
      } else {
        throw new Error(data.error || 'Failed to register center');
      }
    } catch (error) {
      setModalMessage(error.message);
      setModalTitle('Error');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateFunds = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/allocate/funds-enhanced`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          centerAddress: fundingData.centerAddress,
          amount: fundingData.amount,
          sourceId: fundingData.sourceId
        })
      });
      const data = await response.json();
      if (data.success) {
        setModalMessage(`Funds allocated successfully!\nTransaction: ${data.transactionHash}`);
        setModalTitle('Success');
        setFundingData({ 
          centerAddress: '', 
          amount: '', 
          sourceId: '',
          name: '',
          location: '',
          contactInfo: ''
        });
        fetchMonitoringData();
      } else {
        throw new Error(data.error || 'Failed to allocate funds');
      }
    } catch (error) {
      setModalMessage(error.message);
      setModalTitle('Error');
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const fundAllocationData = {
    labels: ['Allocated', 'Used', 'Remaining'],
    datasets: [{
      data: [
        parseFloat(monitoringData?.totalFundsAllocated || 0),
        parseFloat(monitoringData?.totalFundsUsed || 0),
        parseFloat(monitoringData?.totalFundsAllocated || 0) - parseFloat(monitoringData?.totalFundsUsed || 0)
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#6B7280'],
      borderWidth: 0
    }]
  };

  const trainingMetricsData = {
    labels: ['Total Farmers', 'Completed Trainings', 'Active Trainers', 'Training Centers'],
    datasets: [{
      label: 'Count',
      data: [
        trainingMetrics?.totalFarmers || 0,
        trainingMetrics?.completedTrainings || 0,
        trainingMetrics?.activeTrainers || 0,
        trainingMetrics?.trainingCenters || 0
      ],
      backgroundColor: '#10B981',
      borderColor: '#059669',
      borderWidth: 1
    }]
  };

  const Modal = ({ title, message, onClose }) => {
    if (!message) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-80 backdrop-blur-sm" onClick={onClose}></div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden max-w-sm w-full z-10 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">{message}</p>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
      <Modal title={modalTitle} message={modalMessage} onClose={() => setModalMessage('')} />
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Enhanced Government Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Comprehensive blockchain-based agricultural training fund management
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={fetchMonitoringData}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'kyc', name: 'KYC Management', icon: '🔐' },
                { id: 'compliance', name: 'Compliance', icon: '⚖️' },
                { id: 'consensus', name: 'Consensus', icon: '🤝' },
                { id: 'monitoring', name: 'Real-time Monitoring', icon: '📈' },
                { id: 'audit', name: 'Audit Trail', icon: '📋' },
                { id: 'reports', name: 'Reports & Analytics', icon: '📊' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg p-6 text-white">
                    <h3 className="text-lg font-semibold">Total Transactions</h3>
                    <p className="text-3xl font-bold">{monitoringData?.totalTransactions || 0}</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-6 text-white">
                    <h3 className="text-lg font-semibold">Funds Allocated</h3>
                    <p className="text-3xl font-bold">{monitoringData?.totalFundsAllocated || '0'} ETH</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
                    <h3 className="text-lg font-semibold">Active Centers</h3>
                    <p className="text-3xl font-bold">{monitoringData?.activeCenters || 0}</p>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
                    <h3 className="text-lg font-semibold">Active Farmers</h3>
                    <p className="text-3xl font-bold">{monitoringData?.activeFarmers || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">Fund Allocation</h3>
                    <Doughnut data={fundAllocationData} />
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">Training Metrics</h3>
                    <Bar data={trainingMetricsData} />
                  </div>
                </div>
              </div>
            )}

            {/* KYC Management Tab */}
            {activeTab === 'kyc' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">KYC Verification</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={kycData.userAddress}
                      onChange={(e) => setKycData({...kycData, userAddress: e.target.value})}
                      placeholder="User Address (0x...)"
                      className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                    />
                    <button
                      onClick={handleKYCVerification}
                      disabled={loading || !kycData.userAddress}
                      className="w-full py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify KYC'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance Tab */}
            {activeTab === 'compliance' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Compliance Approval</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={complianceData.userAddress}
                      onChange={(e) => setComplianceData({...complianceData, userAddress: e.target.value})}
                      placeholder="User Address (0x...)"
                      className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                    />
                    <button
                      onClick={handleComplianceApproval}
                      disabled={loading || !complianceData.userAddress}
                      className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      {loading ? 'Approving...' : 'Approve Compliance'}
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Create Compliance Rule</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={complianceData.ruleId}
                      onChange={(e) => setComplianceData({...complianceData, ruleId: e.target.value})}
                      placeholder="Rule ID"
                      className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                    />
                    <textarea
                      value={complianceData.description}
                      onChange={(e) => setComplianceData({...complianceData, description: e.target.value})}
                      placeholder="Rule Description"
                      className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                      rows="3"
                    />
                    <button
                      onClick={handleCreateComplianceRule}
                      disabled={loading || !complianceData.ruleId || !complianceData.description}
                      className="w-full py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Rule'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Consensus Tab */}
            {activeTab === 'consensus' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Add Validator</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={validatorData.validatorAddress}
                      onChange={(e) => setValidatorData({...validatorData, validatorAddress: e.target.value})}
                      placeholder="Validator Address (0x...)"
                      className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                    />
                    <input
                      type="number"
                      value={validatorData.stake}
                      onChange={(e) => setValidatorData({...validatorData, stake: e.target.value})}
                      placeholder="Stake Amount (ETH)"
                      className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                    />
                    <button
                      onClick={handleAddValidator}
                      disabled={loading || !validatorData.validatorAddress || !validatorData.stake}
                      className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Validator'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Monitoring Tab */}
            {activeTab === 'monitoring' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">System Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Transactions:</span>
                        <span className="font-bold">{monitoringData?.totalTransactions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Update:</span>
                        <span className="font-bold">
                          {monitoringData?.lastUpdate ? 
                            new Date(monitoringData.lastUpdate).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Fund Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Allocated:</span>
                        <span className="font-bold">{monitoringData?.totalFundsAllocated || '0'} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span className="font-bold">{monitoringData?.totalFundsUsed || '0'} ETH</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Active Entities</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Centers:</span>
                        <span className="font-bold">{monitoringData?.activeCenters || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Farmers:</span>
                        <span className="font-bold">{monitoringData?.activeFarmers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trainers:</span>
                        <span className="font-bold">{monitoringData?.activeTrainers || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Audit Trail Tab */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Audit Trail</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-600">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data Hash</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                        {auditTrail.map((entry, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {entry.actor}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {entry.action}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {new Date(Number(entry.timestamp) * 1000).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                              {entry.dataHash}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Reports & Analytics Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">Fund Reports</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Allocated:</span>
                        <span className="font-bold">{fundReports?.totalAllocated || '0'} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Used:</span>
                        <span className="font-bold">{fundReports?.totalUsed || '0'} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining:</span>
                        <span className="font-bold">{fundReports?.remaining || '0'} ETH</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">Training Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Farmers:</span>
                        <span className="font-bold">{trainingMetrics?.totalFarmers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed Trainings:</span>
                        <span className="font-bold">{trainingMetrics?.completedTrainings || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Trainers:</span>
                        <span className="font-bold">{trainingMetrics?.activeTrainers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Training Centers:</span>
                        <span className="font-bold">{trainingMetrics?.trainingCenters || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedGovernmentDashboard;

