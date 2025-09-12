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
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';

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

const TransparencyDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [publicTransactions, setPublicTransactions] = useState([]);
  const [complianceStatus, setComplianceStatus] = useState({});
  const [auditSummary, setAuditSummary] = useState({});
  const [validatorStatus, setValidatorStatus] = useState({});
  const [fundFlow, setFundFlow] = useState([]);
  const [trainingProgress, setTrainingProgress] = useState([]);

  useEffect(() => {
    fetchTransparencyData();
    fetchPublicTransactions();
    fetchComplianceStatus();
    fetchAuditSummary();
    fetchValidatorStatus();
    fetchFundFlow();
    fetchTrainingProgress();
  }, []);

  const fetchTransparencyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/dashboard/transparency`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (data.success) {
        setPublicTransactions(data.data.publicTransactions || []);
        setComplianceStatus(data.data.complianceStatus || {});
        setAuditSummary(data.data.auditSummary || {});
        setValidatorStatus(data.data.validatorStatus || {});
      }
    } catch (error) {
      console.error('Error fetching transparency data:', error);
    }
  };

  const fetchPublicTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/audit/trail?count=100`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (data.success) {
        setPublicTransactions(data.auditTrail || []);
      }
    } catch (error) {
      console.error('Error fetching public transactions:', error);
    }
  };

  const fetchComplianceStatus = async () => {
    // Mock data for compliance status
    setComplianceStatus({
      totalRules: 15,
      activeRules: 12,
      violations: 3,
      complianceRate: 85.5
    });
  };

  const fetchAuditSummary = async () => {
    // Mock data for audit summary
    setAuditSummary({
      totalEntries: 1250,
      encryptedEntries: 450,
      lastAudit: new Date().toISOString(),
      anomalies: 2
    });
  };

  const fetchValidatorStatus = async () => {
    // Mock data for validator status
    setValidatorStatus({
      totalValidators: 5,
      activeValidators: 4,
      totalStake: 1000,
      consensusRate: 98.5
    });
  };

  const fetchFundFlow = async () => {
    // Mock data for fund flow
    setFundFlow([
      { month: 'Jan', allocated: 100, used: 75 },
      { month: 'Feb', allocated: 150, used: 120 },
      { month: 'Mar', allocated: 200, used: 180 },
      { month: 'Apr', allocated: 180, used: 160 },
      { month: 'May', allocated: 220, used: 200 },
      { month: 'Jun', allocated: 250, used: 230 }
    ]);
  };

  const fetchTrainingProgress = async () => {
    // Mock data for training progress
    setTrainingProgress([
      { center: 'Center A', farmers: 50, completed: 45, progress: 90 },
      { center: 'Center B', farmers: 75, completed: 60, progress: 80 },
      { center: 'Center C', farmers: 40, completed: 35, progress: 87.5 },
      { center: 'Center D', farmers: 60, completed: 50, progress: 83.3 }
    ]);
  };

  // Chart data
  const fundFlowData = {
    labels: fundFlow.map(item => item.month),
    datasets: [
      {
        label: 'Allocated (ETH)',
        data: fundFlow.map(item => item.allocated),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 2
      },
      {
        label: 'Used (ETH)',
        data: fundFlow.map(item => item.used),
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 2
      }
    ]
  };

  const complianceData = {
    labels: ['Compliant', 'Non-Compliant'],
    datasets: [{
      data: [complianceStatus.complianceRate || 0, 100 - (complianceStatus.complianceRate || 0)],
      backgroundColor: ['#10B981', '#EF4444'],
      borderWidth: 0
    }]
  };

  const trainingProgressData = {
    labels: trainingProgress.map(item => item.center),
    datasets: [{
      label: 'Completion Rate (%)',
      data: trainingProgress.map(item => item.progress),
      backgroundColor: '#3B82F6',
      borderColor: '#1D4ED8',
      borderWidth: 1
    }]
  };

  const validatorStakeData = {
    labels: ['Staked', 'Available'],
    datasets: [{
      data: [validatorStatus.totalStake || 0, 2000 - (validatorStatus.totalStake || 0)],
      backgroundColor: ['#8B5CF6', '#E5E7EB'],
      borderWidth: 0
    }]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Transparency Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Public transparency and accountability for agricultural training funds
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={fetchTransparencyData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                { id: 'transactions', name: 'Public Transactions', icon: '🔍' },
                { id: 'compliance', name: 'Compliance Status', icon: '⚖️' },
                { id: 'audit', name: 'Audit Summary', icon: '📋' },
                { id: 'validators', name: 'Validator Network', icon: '🌐' },
                { id: 'funds', name: 'Fund Flow', icon: '💰' },
                { id: 'training', name: 'Training Progress', icon: '🎓' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
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
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-6 text-white">
                    <h3 className="text-lg font-semibold">Public Transactions</h3>
                    <p className="text-3xl font-bold">{publicTransactions.length}</p>
                    <p className="text-sm opacity-90">Total recorded</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-6 text-white">
                    <h3 className="text-lg font-semibold">Compliance Rate</h3>
                    <p className="text-3xl font-bold">{complianceStatus.complianceRate || 0}%</p>
                    <p className="text-sm opacity-90">System compliance</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
                    <h3 className="text-lg font-semibold">Active Validators</h3>
                    <p className="text-3xl font-bold">{validatorStatus.activeValidators || 0}</p>
                    <p className="text-sm opacity-90">Of {validatorStatus.totalValidators || 0} total</p>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
                    <h3 className="text-lg font-semibold">Audit Entries</h3>
                    <p className="text-3xl font-bold">{auditSummary.totalEntries || 0}</p>
                    <p className="text-sm opacity-90">Total logged</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">Compliance Status</h3>
                    <Doughnut data={complianceData} />
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">Validator Stake Distribution</h3>
                    <Pie data={validatorStakeData} />
                  </div>
                </div>
              </div>
            )}

            {/* Public Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Public Transaction Log</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-600">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                        {publicTransactions.slice(0, 20).map((transaction, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                              {transaction.actor}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {transaction.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {new Date(Number(transaction.timestamp) * 1000).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                transaction.isEncrypted 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                              }`}>
                                {transaction.isEncrypted ? 'Encrypted' : 'Public'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance Status Tab */}
            {activeTab === 'compliance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Total Rules</h3>
                    <p className="text-3xl font-bold text-blue-600">{complianceStatus.totalRules || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Active Rules</h3>
                    <p className="text-3xl font-bold text-green-600">{complianceStatus.activeRules || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Violations</h3>
                    <p className="text-3xl font-bold text-red-600">{complianceStatus.violations || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Compliance Rate</h3>
                    <p className="text-3xl font-bold text-purple-600">{complianceStatus.complianceRate || 0}%</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Compliance Overview</h3>
                  <Doughnut data={complianceData} />
                </div>
              </div>
            )}

            {/* Audit Summary Tab */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Total Entries</h3>
                    <p className="text-3xl font-bold text-blue-600">{auditSummary.totalEntries || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Encrypted Entries</h3>
                    <p className="text-3xl font-bold text-green-600">{auditSummary.encryptedEntries || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Anomalies</h3>
                    <p className="text-3xl font-bold text-red-600">{auditSummary.anomalies || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Last Audit</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {auditSummary.lastAudit ? 
                        new Date(auditSummary.lastAudit).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Validator Network Tab */}
            {activeTab === 'validators' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Total Validators</h3>
                    <p className="text-3xl font-bold text-blue-600">{validatorStatus.totalValidators || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Active Validators</h3>
                    <p className="text-3xl font-bold text-green-600">{validatorStatus.activeValidators || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Total Stake</h3>
                    <p className="text-3xl font-bold text-purple-600">{validatorStatus.totalStake || 0} ETH</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Consensus Rate</h3>
                    <p className="text-3xl font-bold text-orange-600">{validatorStatus.consensusRate || 0}%</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Validator Stake Distribution</h3>
                  <Pie data={validatorStakeData} />
                </div>
              </div>
            )}

            {/* Fund Flow Tab */}
            {activeTab === 'funds' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Monthly Fund Flow</h3>
                  <Bar data={fundFlowData} />
                </div>
              </div>
            )}

            {/* Training Progress Tab */}
            {activeTab === 'training' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Training Center Progress</h3>
                  <Bar data={trainingProgressData} />
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Detailed Progress</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-600">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Center</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Farmers</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Completed</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                        {trainingProgress.map((center, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {center.center}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {center.farmers}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {center.completed}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${center.progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{center.progress}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default TransparencyDashboard;

