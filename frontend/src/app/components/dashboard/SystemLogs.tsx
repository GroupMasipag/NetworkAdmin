import { useState, useEffect } from 'react';
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

  // 1. Start with an empty table
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // 2. Fetch the live data from Python
  useEffect(() => {
    const fetchLogs = () => {
      // 1. Grab the VIP wristband from the browser's memory
      const token = localStorage.getItem('masipag_token');

      // 2. Attach it to the Headers
      fetch('https://networkadmin.onrender.com/api/logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then((res) => {
          // 3. Catch the 401 before it causes the Black Screen of Death
          if (res.status === 401) {
            console.error("Token expired! Redirecting to login...");
            localStorage.removeItem('masipag_token');
            window.location.href = '/'; 
            return null; 
          }
          return res.json();
        })
        .then((data) => {
          // 4. Safety check: ensure we actually got an array back from Python
          if (!data || !Array.isArray(data)) return;

          // 5. Translate Python's database format into React's UI format
          const liveData = data.map((item: any) => ({
            id: item.id,
            timestamp: new Date(item.timestamp).toLocaleString(),
            level: item.level.toLowerCase(),
            category: item.category,
            message: item.message,
            source: item.source,
            details: item.details
          }));
          
          setLogs(liveData);
        })
        .catch((err) => console.error("Database Connection Failed:", err));
    };

    fetchLogs();
    
    // Refresh the logs every 15 seconds
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, []);

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
