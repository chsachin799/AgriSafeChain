import React, { useState, useEffect, useRef } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  PointElement,
  LineElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const API_BASE_URL = 'http://localhost:3001/api';

const RealTimeMonitoring = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringData, setMonitoringData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [systemHealth, setSystemHealth] = useState('healthy');
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/monitoring/data`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (data.success) {
        setMonitoringData(data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    intervalRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/monitoring/data`, {
          headers: { 'x-auth-token': token }
        });
        const data = await response.json();
        if (data.success) {
          setMonitoringData(data.data);
          setLastUpdate(new Date());
          
          // Add to historical data
          setHistoricalData(prev => {
            const newData = {
              timestamp: new Date(),
              totalTransactions: parseInt(data.data.totalTransactions),
              totalFundsAllocated: parseFloat(data.data.totalFundsAllocated),
              totalFundsUsed: parseFloat(data.data.totalFundsUsed),
              activeCenters: parseInt(data.data.activeCenters),
              activeFarmers: parseInt(data.data.activeFarmers),
              activeTrainers: parseInt(data.data.activeTrainers)
            };
            
            const updated = [...prev, newData];
            // Keep only last 50 data points
            return updated.slice(-50);
          });

          // Check for anomalies
          checkForAnomalies(data.data);
        }
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
        addAlert('error', 'Failed to fetch monitoring data');
      }
    }, 5000); // Update every 5 seconds
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const checkForAnomalies = (data) => {
    const anomalies = [];
    
    // Check for unusual transaction patterns
    if (parseInt(data.totalTransactions) > 1000) {
      anomalies.push({
        type: 'warning',
        message: 'High transaction volume detected',
        timestamp: new Date(),
        severity: 'medium'
      });
    }
    
    // Check for fund allocation anomalies
    const allocated = parseFloat(data.totalFundsAllocated);
    const used = parseFloat(data.totalFundsUsed);
    const usageRate = allocated > 0 ? (used / allocated) * 100 : 0;
    
    if (usageRate > 90) {
      anomalies.push({
        type: 'warning',
        message: 'High fund usage rate detected',
        timestamp: new Date(),
        severity: 'high'
      });
    }
    
    // Check for inactive centers
    if (parseInt(data.activeCenters) < 5) {
      anomalies.push({
        type: 'info',
        message: 'Low number of active centers',
        timestamp: new Date(),
        severity: 'low'
      });
    }
    
    if (anomalies.length > 0) {
      setAnomalies(prev => [...prev, ...anomalies]);
      anomalies.forEach(anomaly => {
        addAlert(anomaly.type, anomaly.message);
      });
    }
  };

  const addAlert = (type, message) => {
    const alert = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    };
    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep only last 10 alerts
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const reportAnomaly = async (description, severity) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/monitoring/anomaly`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ description, severity })
      });
      const data = await response.json();
      if (data.success) {
        addAlert('success', 'Anomaly reported successfully');
      }
    } catch (error) {
      console.error('Error reporting anomaly:', error);
      addAlert('error', 'Failed to report anomaly');
    }
  };

  // Chart data
  const transactionTrendData = {
    labels: historicalData.map(item => item.timestamp.toLocaleTimeString()),
    datasets: [
      {
        label: 'Total Transactions',
        data: historicalData.map(item => item.totalTransactions),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const fundUsageData = {
    labels: historicalData.map(item => item.timestamp.toLocaleTimeString()),
    datasets: [
      {
        label: 'Funds Allocated (ETH)',
        data: historicalData.map(item => item.totalFundsAllocated),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1
      },
      {
        label: 'Funds Used (ETH)',
        data: historicalData.map(item => item.totalFundsUsed),
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1
      }
    ]
  };

  const activeEntitiesData = {
    labels: historicalData.map(item => item.timestamp.toLocaleTimeString()),
    datasets: [
      {
        label: 'Active Centers',
        data: historicalData.map(item => item.activeCenters),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Active Farmers',
        data: historicalData.map(item => item.activeFarmers),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      },
      {
        label: 'Active Trainers',
        data: historicalData.map(item => item.activeTrainers),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4
      }
    ]
  };

  const getHealthColor = () => {
    switch (systemHealth) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = () => {
    switch (systemHealth) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Real-Time Monitoring
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Live monitoring of agricultural training fund system
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">System Status:</span>
                <span className={`text-lg font-semibold ${getHealthColor()}`}>
                  {getHealthIcon()} {systemHealth.toUpperCase()}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={isMonitoring ? stopMonitoring : startMonitoring}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isMonitoring
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                </button>
                <button
                  onClick={fetchInitialData}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Monitoring Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Real-time Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Real-Time Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {monitoringData?.totalTransactions || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {monitoringData?.totalFundsAllocated || '0'} ETH
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Funds Allocated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {monitoringData?.activeCenters || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Centers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {monitoringData?.activeFarmers || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Farmers</div>
                </div>
              </div>
              {lastUpdate && (
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Last updated: {lastUpdate.toLocaleString()}
                </div>
              )}
            </div>

            {/* Transaction Trend Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Transaction Trend</h3>
              <Line data={transactionTrendData} />
            </div>

            {/* Fund Usage Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Fund Usage</h3>
              <Bar data={fundUsageData} />
            </div>

            {/* Active Entities Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Active Entities</h3>
              <Line data={activeEntitiesData} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Alerts</h3>
                <button
                  onClick={clearAlerts}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg text-sm ${
                        alert.type === 'error'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : alert.type === 'warning'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : alert.type === 'success'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}
                    >
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-xs opacity-75">
                        {alert.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Anomalies */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Detected Anomalies</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {anomalies.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No anomalies detected</p>
                ) : (
                  anomalies.slice(0, 5).map((anomaly, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg text-sm ${
                        anomaly.severity === 'high'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : anomaly.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}
                    >
                      <div className="font-medium">{anomaly.message}</div>
                      <div className="text-xs opacity-75">
                        {anomaly.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* System Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">System Controls</h3>
              <div className="space-y-4">
                <button
                  onClick={() => reportAnomaly('Manual anomaly report', 1)}
                  className="w-full py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Report Anomaly
                </button>
                <button
                  onClick={() => {
                    setSystemHealth(systemHealth === 'healthy' ? 'warning' : 'healthy');
                    addAlert('info', `System health changed to ${systemHealth === 'healthy' ? 'warning' : 'healthy'}`);
                  }}
                  className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Toggle System Health
                </button>
                <button
                  onClick={() => {
                    addAlert('info', 'Test alert generated');
                  }}
                  className="w-full py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Test Alert
                </button>
              </div>
            </div>

            {/* Monitoring Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Monitoring Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${
                    isMonitoring ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isMonitoring ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Data Points:</span>
                  <span className="font-medium">{historicalData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Alerts:</span>
                  <span className="font-medium">{alerts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Anomalies:</span>
                  <span className="font-medium">{anomalies.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMonitoring;

