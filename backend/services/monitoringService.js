const EventEmitter = require('events');
const os = require('os');
const fs = require('fs');
const path = require('path');

class MonitoringService extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      system: {},
      application: {},
      blockchain: {},
      database: {},
      api: {}
    };
    this.alerts = [];
    this.anomalies = [];
    this.thresholds = {
      cpu: 80,
      memory: 85,
      disk: 90,
      responseTime: 5000,
      errorRate: 5,
      transactionVolume: 1000
    };
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.metricsHistory = [];
    this.maxHistorySize = 1000;
  }

  // Start monitoring
  startMonitoring(intervalMs = 5000) {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzeMetrics();
      this.checkThresholds();
    }, intervalMs);

    this.emit('monitoringStarted', { interval: intervalMs });
  }

  // Stop monitoring
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitoringStopped');
  }

  // Collect system metrics
  collectSystemMetrics() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // CPU usage calculation
    let cpuUsage = 0;
    if (this.lastCpuTimes) {
      const currentCpuTimes = cpus.map(cpu => cpu.times);
      const currentIdle = currentCpuTimes.reduce((sum, cpu) => sum + cpu.idle, 0);
      const currentTotal = currentCpuTimes.reduce((sum, cpu) => sum + Object.values(cpu).reduce((a, b) => a + b, 0), 0);
      
      const idle = currentIdle - this.lastCpuTimes.idle;
      const total = currentTotal - this.lastCpuTimes.total;
      
      cpuUsage = total > 0 ? (1 - idle / total) * 100 : 0;
    }

    this.lastCpuTimes = {
      idle: cpus.reduce((sum, cpu) => sum + cpu.times.idle, 0),
      total: cpus.reduce((sum, cpu) => sum + Object.values(cpu.times).reduce((a, b) => a + b, 0), 0)
    };

    // Disk usage
    let diskUsage = 0;
    try {
      const stats = fs.statSync(process.cwd());
      diskUsage = 50; // Placeholder - would need actual disk usage calculation
    } catch (error) {
      diskUsage = 0;
    }

    return {
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        model: cpus[0].model
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usage: (usedMem / totalMem) * 100
      },
      disk: {
        usage: diskUsage
      },
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      platform: os.platform(),
      arch: os.arch()
    };
  }

  // Collect application metrics
  collectApplicationMetrics() {
    const memUsage = process.memoryUsage();
    
    return {
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      },
      uptime: process.uptime(),
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch
    };
  }

  // Collect blockchain metrics
  collectBlockchainMetrics() {
    // This would integrate with your blockchain service
    return {
      networkId: 1,
      blockNumber: 0,
      gasPrice: 0,
      peerCount: 0,
      isConnected: true,
      lastBlockTime: new Date(),
      pendingTransactions: 0,
      totalTransactions: 0
    };
  }

  // Collect database metrics
  collectDatabaseMetrics() {
    // This would integrate with your database
    return {
      connections: 0,
      queries: 0,
      slowQueries: 0,
      errors: 0,
      responseTime: 0,
      isConnected: true
    };
  }

  // Collect API metrics
  collectAPIMetrics() {
    return {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        rate: 0
      },
      responseTime: {
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0
      },
      errors: {
        total: 0,
        rate: 0,
        byType: {}
      }
    };
  }

  // Collect all metrics
  collectMetrics() {
    const timestamp = new Date();
    
    this.metrics = {
      system: this.collectSystemMetrics(),
      application: this.collectApplicationMetrics(),
      blockchain: this.collectBlockchainMetrics(),
      database: this.collectDatabaseMetrics(),
      api: this.collectAPIMetrics(),
      timestamp
    };

    // Store in history
    this.metricsHistory.push({ ...this.metrics });
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }

    this.emit('metricsCollected', this.metrics);
  }

  // Analyze metrics for anomalies
  analyzeMetrics() {
    if (this.metricsHistory.length < 2) return;

    const current = this.metrics;
    const previous = this.metricsHistory[this.metricsHistory.length - 2];

    // CPU spike detection
    if (current.system.cpu.usage - previous.system.cpu.usage > 20) {
      this.detectAnomaly('cpu_spike', {
        current: current.system.cpu.usage,
        previous: previous.system.cpu.usage,
        severity: 'medium'
      });
    }

    // Memory spike detection
    if (current.system.memory.usage - previous.system.memory.usage > 15) {
      this.detectAnomaly('memory_spike', {
        current: current.system.memory.usage,
        previous: previous.system.memory.usage,
        severity: 'medium'
      });
    }

    // High error rate detection
    if (current.api.errors.rate > 10) {
      this.detectAnomaly('high_error_rate', {
        errorRate: current.api.errors.rate,
        severity: 'high'
      });
    }

    // Response time spike detection
    if (current.api.responseTime.average > 10000) {
      this.detectAnomaly('response_time_spike', {
        responseTime: current.api.responseTime.average,
        severity: 'high'
      });
    }
  }

  // Detect anomaly
  detectAnomaly(type, data) {
    const anomaly = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: new Date(),
      severity: data.severity || 'medium',
      status: 'active'
    };

    this.anomalies.push(anomaly);
    this.emit('anomalyDetected', anomaly);

    // Create alert if severity is high
    if (data.severity === 'high') {
      this.createAlert('anomaly', `Anomaly detected: ${type}`, data, 'high');
    }
  }

  // Check thresholds
  checkThresholds() {
    const current = this.metrics;

    // CPU threshold
    if (current.system.cpu.usage > this.thresholds.cpu) {
      this.createAlert('cpu', 'High CPU usage', {
        usage: current.system.cpu.usage,
        threshold: this.thresholds.cpu
      }, 'warning');
    }

    // Memory threshold
    if (current.system.memory.usage > this.thresholds.memory) {
      this.createAlert('memory', 'High memory usage', {
        usage: current.system.memory.usage,
        threshold: this.thresholds.memory
      }, 'warning');
    }

    // Disk threshold
    if (current.system.disk.usage > this.thresholds.disk) {
      this.createAlert('disk', 'High disk usage', {
        usage: current.system.disk.usage,
        threshold: this.thresholds.disk
      }, 'warning');
    }

    // Response time threshold
    if (current.api.responseTime.average > this.thresholds.responseTime) {
      this.createAlert('response_time', 'High response time', {
        responseTime: current.api.responseTime.average,
        threshold: this.thresholds.responseTime
      }, 'warning');
    }

    // Error rate threshold
    if (current.api.errors.rate > this.thresholds.errorRate) {
      this.createAlert('error_rate', 'High error rate', {
        errorRate: current.api.errors.rate,
        threshold: this.thresholds.errorRate
      }, 'critical');
    }
  }

  // Create alert
  createAlert(type, message, data, severity = 'info') {
    const alert = {
      id: Date.now().toString(),
      type,
      message,
      data,
      severity,
      timestamp: new Date(),
      status: 'active',
      acknowledged: false
    };

    this.alerts.push(alert);
    this.emit('alertCreated', alert);

    return alert;
  }

  // Acknowledge alert
  acknowledgeAlert(alertId, userId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();
      this.emit('alertAcknowledged', alert);
    }
    return alert;
  }

  // Resolve alert
  resolveAlert(alertId, userId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedBy = userId;
      alert.resolvedAt = new Date();
      this.emit('alertResolved', alert);
    }
    return alert;
  }

  // Get current metrics
  getCurrentMetrics() {
    return this.metrics;
  }

  // Get metrics history
  getMetricsHistory(limit = 100) {
    return this.metricsHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Get alerts
  getAlerts(filters = {}) {
    let alerts = [...this.alerts];

    if (filters.status) {
      alerts = alerts.filter(alert => alert.status === filters.status);
    }

    if (filters.severity) {
      alerts = alerts.filter(alert => alert.severity === filters.severity);
    }

    if (filters.type) {
      alerts = alerts.filter(alert => alert.type === filters.type);
    }

    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter(alert => alert.acknowledged === filters.acknowledged);
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get anomalies
  getAnomalies(filters = {}) {
    let anomalies = [...this.anomalies];

    if (filters.type) {
      anomalies = anomalies.filter(anomaly => anomaly.type === filters.type);
    }

    if (filters.severity) {
      anomalies = anomalies.filter(anomaly => anomaly.severity === filters.severity);
    }

    if (filters.status) {
      anomalies = anomalies.filter(anomaly => anomaly.status === filters.status);
    }

    return anomalies.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get monitoring statistics
  getMonitoringStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentAlerts = this.alerts.filter(alert => alert.timestamp > oneHourAgo);
    const recentAnomalies = this.anomalies.filter(anomaly => anomaly.timestamp > oneHourAgo);

    return {
      isMonitoring: this.isMonitoring,
      uptime: process.uptime(),
      totalAlerts: this.alerts.length,
      activeAlerts: this.alerts.filter(a => a.status === 'active').length,
      recentAlerts: recentAlerts.length,
      totalAnomalies: this.anomalies.length,
      recentAnomalies: recentAnomalies.length,
      metricsHistorySize: this.metricsHistory.length,
      thresholds: this.thresholds,
      currentMetrics: this.metrics
    };
  }

  // Update thresholds
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.emit('thresholdsUpdated', this.thresholds);
    return this.thresholds;
  }

  // Get system health
  getSystemHealth() {
    const current = this.metrics;
    let health = 'healthy';
    let issues = [];

    // Check CPU
    if (current.system.cpu.usage > this.thresholds.cpu) {
      health = 'warning';
      issues.push('High CPU usage');
    }

    // Check memory
    if (current.system.memory.usage > this.thresholds.memory) {
      health = 'warning';
      issues.push('High memory usage');
    }

    // Check disk
    if (current.system.disk.usage > this.thresholds.disk) {
      health = 'critical';
      issues.push('High disk usage');
    }

    // Check response time
    if (current.api.responseTime.average > this.thresholds.responseTime) {
      health = 'warning';
      issues.push('High response time');
    }

    // Check error rate
    if (current.api.errors.rate > this.thresholds.errorRate) {
      health = 'critical';
      issues.push('High error rate');
    }

    return {
      status: health,
      issues,
      timestamp: new Date(),
      metrics: current
    };
  }

  // Export monitoring data
  exportMonitoringData(format = 'json') {
    const data = {
      metrics: this.metricsHistory,
      alerts: this.alerts,
      anomalies: this.anomalies,
      thresholds: this.thresholds,
      exportedAt: new Date()
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      default:
        throw new Error('Unsupported export format');
    }
  }

  // Convert to CSV
  convertToCSV(data) {
    // Implementation for CSV conversion
    return 'timestamp,metric,value\n' + 
           data.metrics.map(m => `${m.timestamp},system.cpu.usage,${m.system.cpu.usage}`).join('\n');
  }

  // Clean up old data
  cleanupOldData(daysToKeep = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const initialAlerts = this.alerts.length;
    const initialAnomalies = this.anomalies.length;
    const initialMetrics = this.metricsHistory.length;

    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffDate);
    this.anomalies = this.anomalies.filter(anomaly => anomaly.timestamp > cutoffDate);
    this.metricsHistory = this.metricsHistory.filter(metric => metric.timestamp > cutoffDate);

    return {
      alertsRemoved: initialAlerts - this.alerts.length,
      anomaliesRemoved: initialAnomalies - this.anomalies.length,
      metricsRemoved: initialMetrics - this.metricsHistory.length
    };
  }
}

module.exports = MonitoringService;


