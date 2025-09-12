const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class AuditService {
  constructor() {
    this.auditLogs = [];
    this.auditIndex = new Map();
    this.maxLogSize = 10000;
    this.auditFile = path.join(__dirname, '../data/audit.log');
    this.ensureAuditDirectory();
    this.loadAuditLogs();
  }

  // Ensure audit directory exists
  ensureAuditDirectory() {
    const auditDir = path.dirname(this.auditFile);
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }
  }

  // Load existing audit logs
  loadAuditLogs() {
    try {
      if (fs.existsSync(this.auditFile)) {
        const data = fs.readFileSync(this.auditFile, 'utf8');
        const lines = data.trim().split('\n');
        
        lines.forEach(line => {
          if (line.trim()) {
            try {
              const logEntry = JSON.parse(line);
              this.auditLogs.push(logEntry);
              this.indexLogEntry(logEntry);
            } catch (error) {
              console.error('Error parsing audit log line:', error.message);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading audit logs:', error.message);
    }
  }

  // Save audit logs to file
  saveAuditLogs() {
    try {
      const data = this.auditLogs
        .map(log => JSON.stringify(log))
        .join('\n');
      
      fs.writeFileSync(this.auditFile, data);
    } catch (error) {
      console.error('Error saving audit logs:', error.message);
    }
  }

  // Index log entry for fast searching
  indexLogEntry(logEntry) {
    // Index by timestamp
    const dateKey = new Date(logEntry.timestamp).toISOString().split('T')[0];
    if (!this.auditIndex.has(dateKey)) {
      this.auditIndex.set(dateKey, []);
    }
    this.auditIndex.get(dateKey).push(logEntry.id);

    // Index by user
    if (logEntry.userId) {
      const userKey = `user_${logEntry.userId}`;
      if (!this.auditIndex.has(userKey)) {
        this.auditIndex.set(userKey, []);
      }
      this.auditIndex.get(userKey).push(logEntry.id);
    }

    // Index by action
    if (logEntry.action) {
      const actionKey = `action_${logEntry.action}`;
      if (!this.auditIndex.has(actionKey)) {
        this.auditIndex.set(actionKey, []);
      }
      this.auditIndex.get(actionKey).push(logEntry.id);
    }

    // Index by resource
    if (logEntry.resource) {
      const resourceKey = `resource_${logEntry.resource}`;
      if (!this.auditIndex.has(resourceKey)) {
        this.auditIndex.set(resourceKey, []);
      }
      this.auditIndex.get(resourceKey).push(logEntry.id);
    }
  }

  // Create audit log entry
  createAuditEntry(data) {
    const auditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId: data.userId || null,
      action: data.action,
      resource: data.resource || null,
      resourceId: data.resourceId || null,
      details: data.details || {},
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      sessionId: data.sessionId || null,
      severity: data.severity || 'info',
      category: data.category || 'general',
      outcome: data.outcome || 'success',
      errorMessage: data.errorMessage || null,
      dataHash: this.generateDataHash(data),
      isEncrypted: data.isEncrypted || false,
      encryptionKey: data.encryptionKey || null,
      metadata: data.metadata || {}
    };

    this.auditLogs.push(auditEntry);
    this.indexLogEntry(auditEntry);

    // Maintain log size
    if (this.auditLogs.length > this.maxLogSize) {
      this.auditLogs = this.auditLogs.slice(-this.maxLogSize);
    }

    // Save to file
    this.saveAuditLogs();

    return auditEntry;
  }

  // Log user action
  logUserAction(userId, action, resource, details = {}) {
    return this.createAuditEntry({
      userId,
      action,
      resource,
      details,
      category: 'user_action',
      severity: 'info'
    });
  }

  // Log system event
  logSystemEvent(action, details = {}) {
    return this.createAuditEntry({
      action,
      details,
      category: 'system_event',
      severity: 'info'
    });
  }

  // Log security event
  logSecurityEvent(action, details = {}, severity = 'warning') {
    return this.createAuditEntry({
      action,
      details,
      category: 'security',
      severity
    });
  }

  // Log data access
  logDataAccess(userId, resource, resourceId, details = {}) {
    return this.createAuditEntry({
      userId,
      action: 'data_access',
      resource,
      resourceId,
      details,
      category: 'data_access',
      severity: 'info'
    });
  }

  // Log data modification
  logDataModification(userId, action, resource, resourceId, details = {}) {
    return this.createAuditEntry({
      userId,
      action,
      resource,
      resourceId,
      details,
      category: 'data_modification',
      severity: 'info'
    });
  }

  // Log authentication
  logAuthentication(userId, action, success, details = {}) {
    return this.createAuditEntry({
      userId,
      action: `auth_${action}`,
      details: { ...details, success },
      category: 'authentication',
      severity: success ? 'info' : 'warning',
      outcome: success ? 'success' : 'failure'
    });
  }

  // Log authorization
  logAuthorization(userId, action, resource, success, details = {}) {
    return this.createAuditEntry({
      userId,
      action: `authz_${action}`,
      resource,
      details: { ...details, success },
      category: 'authorization',
      severity: success ? 'info' : 'warning',
      outcome: success ? 'success' : 'failure'
    });
  }

  // Log error
  logError(action, error, details = {}) {
    return this.createAuditEntry({
      action,
      details: { ...details, error: error.message, stack: error.stack },
      category: 'error',
      severity: 'error',
      outcome: 'failure',
      errorMessage: error.message
    });
  }

  // Log transaction
  logTransaction(transactionId, action, details = {}) {
    return this.createAuditEntry({
      action: `tx_${action}`,
      resource: 'transaction',
      resourceId: transactionId,
      details,
      category: 'transaction',
      severity: 'info'
    });
  }

  // Log compliance event
  logComplianceEvent(action, details = {}) {
    return this.createAuditEntry({
      action,
      details,
      category: 'compliance',
      severity: 'info'
    });
  }

  // Log audit trail access
  logAuditAccess(userId, action, details = {}) {
    return this.createAuditEntry({
      userId,
      action: `audit_${action}`,
      resource: 'audit_trail',
      details,
      category: 'audit_access',
      severity: 'info'
    });
  }

  // Search audit logs
  searchAuditLogs(filters = {}) {
    let results = [...this.auditLogs];

    // Filter by date range
    if (filters.startDate) {
      results = results.filter(log => 
        new Date(log.timestamp) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      results = results.filter(log => 
        new Date(log.timestamp) <= new Date(filters.endDate)
      );
    }

    // Filter by user
    if (filters.userId) {
      results = results.filter(log => log.userId === filters.userId);
    }

    // Filter by action
    if (filters.action) {
      results = results.filter(log => log.action.includes(filters.action));
    }

    // Filter by resource
    if (filters.resource) {
      results = results.filter(log => log.resource === filters.resource);
    }

    // Filter by category
    if (filters.category) {
      results = results.filter(log => log.category === filters.category);
    }

    // Filter by severity
    if (filters.severity) {
      results = results.filter(log => log.severity === filters.severity);
    }

    // Filter by outcome
    if (filters.outcome) {
      results = results.filter(log => log.outcome === filters.outcome);
    }

    // Search in details
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      results = results.filter(log => 
        JSON.stringify(log.details).toLowerCase().includes(searchTerm) ||
        log.action.toLowerCase().includes(searchTerm) ||
        (log.resource && log.resource.toLowerCase().includes(searchTerm))
      );
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  // Get audit statistics
  getAuditStatistics(filters = {}) {
    const logs = this.searchAuditLogs(filters);
    
    const stats = {
      totalLogs: logs.length,
      byCategory: {},
      bySeverity: {},
      byOutcome: {},
      byAction: {},
      byUser: {},
      timeRange: {
        start: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
        end: logs.length > 0 ? logs[0].timestamp : null
      }
    };

    logs.forEach(log => {
      // Count by category
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
      
      // Count by outcome
      stats.byOutcome[log.outcome] = (stats.byOutcome[log.outcome] || 0) + 1;
      
      // Count by action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      
      // Count by user
      if (log.userId) {
        stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
      }
    });

    return stats;
  }

  // Generate audit report
  generateAuditReport(filters = {}) {
    const logs = this.searchAuditLogs(filters);
    const stats = this.getAuditStatistics(filters);
    
    return {
      reportId: crypto.randomUUID(),
      generatedAt: new Date(),
      filters,
      statistics: stats,
      logs: logs,
      summary: {
        totalEvents: logs.length,
        securityEvents: logs.filter(log => log.category === 'security').length,
        errorEvents: logs.filter(log => log.severity === 'error').length,
        failedActions: logs.filter(log => log.outcome === 'failure').length
      }
    };
  }

  // Export audit logs
  exportAuditLogs(filters = {}, format = 'json') {
    const logs = this.searchAuditLogs(filters);
    
    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      case 'csv':
        return this.convertToCSV(logs);
      case 'xml':
        return this.convertToXML(logs);
      default:
        throw new Error('Unsupported export format');
    }
  }

  // Convert logs to CSV
  convertToCSV(logs) {
    if (logs.length === 0) return '';
    
    const headers = Object.keys(logs[0]);
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const values = headers.map(header => {
        const value = log[header];
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }

  // Convert logs to XML
  convertToXML(logs) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<auditLogs>\n';
    
    logs.forEach(log => {
      xml += '  <log>\n';
      Object.keys(log).forEach(key => {
        xml += `    <${key}>${this.escapeXML(String(log[key]))}</${key}>\n`;
      });
      xml += '  </log>\n';
    });
    
    xml += '</auditLogs>';
    return xml;
  }

  // Escape XML special characters
  escapeXML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Generate data hash
  generateDataHash(data) {
    return crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  // Verify data integrity
  verifyDataIntegrity(logId) {
    const log = this.auditLogs.find(l => l.id === logId);
    if (!log) {
      throw new Error('Log entry not found');
    }
    
    const expectedHash = this.generateDataHash({
      userId: log.userId,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      details: log.details
    });
    
    return {
      isValid: log.dataHash === expectedHash,
      expectedHash,
      actualHash: log.dataHash
    };
  }

  // Clean up old logs
  cleanupOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const initialCount = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter(log => 
      new Date(log.timestamp) > cutoffDate
    );
    
    const removedCount = initialCount - this.auditLogs.length;
    
    // Rebuild index
    this.auditIndex.clear();
    this.auditLogs.forEach(log => this.indexLogEntry(log));
    
    // Save updated logs
    this.saveAuditLogs();
    
    return removedCount;
  }

  // Get audit trail by user
  getAuditTrailByUser(userId, limit = 100) {
    return this.searchAuditLogs({ userId, limit });
  }

  // Get audit trail by resource
  getAuditTrailByResource(resource, resourceId = null, limit = 100) {
    return this.searchAuditLogs({ resource, resourceId, limit });
  }

  // Get recent audit logs
  getRecentAuditLogs(limit = 50) {
    return this.auditLogs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }
}

module.exports = AuditService;


