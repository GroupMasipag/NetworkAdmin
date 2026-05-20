import { useState } from 'react';
import { Search, Download, Filter, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';

interface SystemLogsProps {
  darkMode: boolean;
}

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'critical' | 'error' | 'warning' | 'info' | 'success';
  category: string;
  message: string;
  source: string;
  details?: string;
}

export default function SystemLogs({ darkMode }: SystemLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const logs: LogEntry[] = [
    {
      id: 1,
      timestamp: '2026-05-18 14:35:42',
      level: 'critical',
      category: 'Security',
      message: 'DDoS attack detected from multiple IP addresses',
      source: 'Firewall Module',
      details: 'Attack pattern: SYN flood. Sources: 45 unique IPs. Rate: 15,000 req/sec. Mitigation: Activated rate limiting and IP blocking.',
    },
    {
      id: 2,
      timestamp: '2026-05-18 14:33:15',
      level: 'warning',
      category: 'Authentication',
      message: 'Multiple failed login attempts detected',
      source: 'Auth Service',
      details: 'User: admin. Failed attempts: 5. Source IP: 192.168.1.45. Action: Account temporarily locked for 15 minutes.',
    },
    {
      id: 3,
      timestamp: '2026-05-18 14:30:22',
      level: 'error',
      category: 'Network',
      message: 'Connection timeout to database server',
      source: 'DB Connection Pool',
      details: 'Target: db-primary.internal:5432. Timeout after 30s. Failover to secondary database successful.',
    },
    {
      id: 4,
      timestamp: '2026-05-18 14:28:50',
      level: 'warning',
      category: 'Security',
      message: 'Suspicious port scanning activity detected',
      source: 'IDS System',
      details: 'Source IP: 203.0.113.42. Scanned ports: 22, 80, 443, 3306, 5432. Action: IP blocked and added to blacklist.',
    },
    {
      id: 5,
      timestamp: '2026-05-18 14:25:33',
      level: 'success',
      category: 'System',
      message: 'System backup completed successfully',
      source: 'Backup Service',
      details: 'Backup size: 45.2 GB. Duration: 12m 34s. Location: backup-server:/backups/2026-05-18/',
    },
    {
      id: 6,
      timestamp: '2026-05-18 14:22:18',
      level: 'warning',
      category: 'Security',
      message: 'Malware signature detected in uploaded file',
      source: 'Antivirus Scanner',
      details: 'File: document.exe. Signature: Trojan.Generic.KD.12345. Action: File quarantined. User notified.',
    },
    {
      id: 7,
      timestamp: '2026-05-18 14:20:05',
      level: 'info',
      category: 'Network',
      message: 'SSL certificate renewed successfully',
      source: 'Certificate Manager',
      details: 'Domain: *.example.com. Issuer: Let\'s Encrypt. Valid until: 2026-08-16.',
    },
    {
      id: 8,
      timestamp: '2026-05-18 14:18:42',
      level: 'warning',
      category: 'Performance',
      message: 'High CPU usage detected on web server',
      source: 'Monitoring Agent',
      details: 'Server: web-01. CPU usage: 89%. Memory: 76%. Action: Alert sent to operations team.',
    },
    {
      id: 9,
      timestamp: '2026-05-18 14:15:27',
      level: 'error',
      category: 'Security',
      message: 'SQL injection attempt blocked',
      source: 'WAF (Web Application Firewall)',
      details: 'Attack pattern: UNION-based SQLi. Target: /api/users. Source IP: 198.51.100.78. Request blocked.',
    },
    {
      id: 10,
      timestamp: '2026-05-18 14:12:55',
      level: 'info',
      category: 'System',
      message: 'Firewall rules updated',
      source: 'Firewall Service',
      details: 'Added 12 new rules. Removed 3 obsolete rules. Total active rules: 342.',
    },
    {
      id: 11,
      timestamp: '2026-05-18 14:10:33',
      level: 'success',
      category: 'Security',
      message: 'Threat signature database updated',
      source: 'Security Updates',
      details: 'New signatures: 1,247. Updated signatures: 456. Database version: 2026.05.18-001.',
    },
    {
      id: 12,
      timestamp: '2026-05-18 14:08:12',
      level: 'warning',
      category: 'Network',
      message: 'Unusual outbound traffic pattern detected',
      source: 'Network Monitor',
      details: 'Source: 10.0.2.156. Volume: 2.3 GB in 5 minutes. Investigating potential data exfiltration.',
    },
    {
      id: 13,
      timestamp: '2026-05-18 14:05:47',
      level: 'info',
      category: 'Authentication',
      message: 'User session established',
      source: 'Auth Service',
      details: 'User: admin@example.com. IP: 10.0.1.100. Session ID: a1b2c3d4e5f6.',
    },
    {
      id: 14,
      timestamp: '2026-05-18 14:03:22',
      level: 'critical',
      category: 'Security',
      message: 'Ransomware behavior detected',
      source: 'Endpoint Protection',
      details: 'Host: workstation-042. Process: suspicious.exe. Action: Process terminated. Files restored from shadow copies.',
    },
    {
      id: 15,
      timestamp: '2026-05-18 14:00:15',
      level: 'info',
      category: 'System',
      message: 'System health check completed',
      source: 'Health Monitor',
      details: 'All systems operational. Uptime: 45 days 12 hours. No issues detected.',
    },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterLevel === 'all' || log.level === filterLevel;

    return matchesSearch && matchesFilter;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-500';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-blue-500';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'critical':
        return darkMode ? 'bg-red-900/20' : 'bg-red-50';
      case 'error':
        return darkMode ? 'bg-red-900/15' : 'bg-red-50';
      case 'warning':
        return darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50';
      case 'success':
        return darkMode ? 'bg-green-900/20' : 'bg-green-50';
      default:
        return darkMode ? 'bg-blue-900/20' : 'bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1a2942] border border-blue-900/30' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            System Logs
          </h2>
          <div className="flex items-center gap-3">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-900 hover:bg-blue-800 text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              Export Logs
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                darkMode
                  ? 'bg-[#0f1f35] border-blue-800/50 text-white placeholder-gray-500 focus:ring-blue-600'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'
              }`}
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className={`px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                darkMode
                  ? 'bg-[#0f1f35] border-blue-800/50 text-white focus:ring-blue-600'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              }`}
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
            </select>
          </div>
        </div>

        <div className={`mb-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing {filteredLogs.length} of {logs.length} log entries
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-blue-900/30' : 'border-gray-200'}`}>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Timestamp
                </th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Level
                </th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Category
                </th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Message
                </th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Source
                </th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className={`border-b ${darkMode ? 'border-blue-900/30 hover:bg-[#0f1f35]' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
                >
                  <td className={`px-4 py-4 text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${getLevelBg(log.level)} ${getLevelColor(log.level)}`}>
                      {getLevelIcon(log.level)}
                      {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td className={`px-4 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {log.category}
                  </td>
                  <td className={`px-4 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {log.message}
                  </td>
                  <td className={`px-4 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {log.source}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className={`text-sm px-3 py-1 rounded transition-colors ${
                        darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-900 hover:bg-blue-800 text-white'
                      }`}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedLog(null)}>
          <div
            className={`max-w-3xl w-full p-6 rounded-xl shadow-2xl ${darkMode ? 'bg-[#1a2942]' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className={`text-2xl mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Log Entry Details
                </h2>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getLevelBg(selectedLog.level)} ${getLevelColor(selectedLog.level)}`}>
                  {getLevelIcon(selectedLog.level)}
                  {selectedLog.level.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1f35]' : 'bg-gray-50'}`}>
                <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Timestamp</p>
                <p className={`font-mono ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedLog.timestamp}</p>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1f35]' : 'bg-gray-50'}`}>
                <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Category</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedLog.category}</p>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1f35]' : 'bg-gray-50'}`}>
                <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Source</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedLog.source}</p>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1f35]' : 'bg-gray-50'}`}>
                <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Message</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedLog.message}</p>
              </div>

              {selectedLog.details && (
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1f35]' : 'bg-gray-50'}`}>
                  <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Detailed Information</p>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>{selectedLog.details}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
