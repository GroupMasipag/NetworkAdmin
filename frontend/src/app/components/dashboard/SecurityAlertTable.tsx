import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Info, X } from 'lucide-react';
// 1. Import the MitigationModal component 
import MitigationModal from './MitigationModal'; 

interface SecurityAlertTableProps {
  darkMode: boolean;
}

interface Alert {
  id: number;
  time: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: string;
  source: string;
  description: string;
  status: 'active' | 'mitigated' | 'investigating';
}

export default function SecurityAlertTable({ darkMode }: SecurityAlertTableProps) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // 2. Add state to track whether the mitigation console overlay is visible
  const [isMitigationOpen, setIsMitigationOpen] = useState(false);

  // Fetch data from local Flask API
  useEffect(() => {
    const fetchThreats = () => {
      // 1. Grab the VIP wristband
      const token = localStorage.getItem('masipag_token');

      // 2. Attach it to the Headers
      fetch('https://networkadmin.onrender.com/api/threats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then((res) => {
          // 3. The 401 Safety Net
          if (res.status === 401) {
            console.error("Token expired! Redirecting to login...");
            localStorage.removeItem('masipag_token');
            window.location.href = '/'; 
            return null; 
          }
          return res.json();
        })
        .then((data) => {
          if (!data || !Array.isArray(data)) return;
          const activeThreats = data.filter((item: any) => item.status !== 'mitigated');
          const liveData = activeThreats.map((item: any) => ({
            id: item.id || Math.random(),
            time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Unknown Time',
            severity: item.severity ? item.severity.toLowerCase() : 'medium', 
            type: item.attack_type || 'Unknown Threat',
            source: item.ip || 'Unknown IP',
            description: `Automated detection: ${item.attack_type || 'Suspicious activity'} detected originating from IP address ${item.ip || 'Unknown'}.`,
            status: 'active' as 'active' | 'mitigated' | 'investigating'

          }));
          setAlerts(liveData);
        })
        .catch((err) => console.error("Database Connection Failed:", err));
    };

    fetchThreats();
    const interval = setInterval(fetchThreats, 15000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return darkMode ? 'bg-red-900/20' : 'bg-red-50';
      case 'high': return darkMode ? 'bg-orange-900/20' : 'bg-orange-50';
      case 'medium': return darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50';
      case 'low': return darkMode ? 'bg-blue-900/20' : 'bg-blue-50';
      default: return darkMode ? 'bg-gray-900/20' : 'bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-500';
      case 'mitigated': return 'text-green-500';
      case 'investigating': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1a2942] border border-blue-900/30' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Security Alerts
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Live Monitoring
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-blue-900/30' : 'border-gray-200'}`}>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Time</th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Severity</th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type</th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Source</th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className={`border-b ${darkMode ? 'border-blue-900/30 hover:bg-[#0f1f35]' : 'border-gray-100 hover:bg-gray-50'} transition-colors cursor-pointer`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <td className={`px-4 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{alert.time}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getSeverityBg(alert.severity)} ${getSeverityColor(alert.severity)}`}>
                      {alert.severity === 'critical' || alert.severity === 'high' ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : alert.severity === 'info' ? (
                        <Info className="w-3 h-3" />
                      ) : (
                        <Shield className="w-3 h-3" />
                      )}
                      {alert.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className={`px-4 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{alert.type}</td>
                  <td className={`px-4 py-4 text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{alert.source}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-medium ${getStatusColor(alert.status)}`}>
                      {alert.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button className={`text-sm px-3 py-1 rounded transition-colors ${
                      darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-900 hover:bg-blue-800 text-white'
                    }`}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Details Modal Backdrop */}
      {selectedAlert && !isMitigationOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedAlert(null)}>
          <div
            className={`max-w-2xl w-full p-6 rounded-xl shadow-2xl ${darkMode ? 'bg-[#1a2942]' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className={`text-2xl mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Alert Details
                </h2>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getSeverityBg(selectedAlert.severity)} ${getSeverityColor(selectedAlert.severity)}`}>
                  <AlertTriangle className="w-4 h-4" />
                  {selectedAlert.severity.toUpperCase()} SEVERITY
                </span>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Time</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedAlert.time}</p>
              </div>

              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Threat Type</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedAlert.type}</p>
              </div>

              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Source</p>
                <p className={`font-mono ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedAlert.source}</p>
              </div>

              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Description</p>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedAlert.description}</p>
              </div>

              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                <p className={`font-medium ${getStatusColor(selectedAlert.status)}`}>
                  {selectedAlert.status.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {/* 3. Wire up the Take Action click handler to activate the mitigation console view */}
              <button
                onClick={() => setIsMitigationOpen(true)}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-900 hover:bg-blue-800 text-white'
                }`}
              >
                Take Action
              </button>
              <button
                onClick={() => setSelectedAlert(null)}
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

      {/* 4. Display the Mitigation Console when active */}
      {isMitigationOpen && selectedAlert && (
        <MitigationModal
          alert={{
            id: selectedAlert.id,
            type: selectedAlert.type,
            source: selectedAlert.source,
            severity: selectedAlert.severity
          }}
          darkMode={darkMode}
          // Pressing back rolls the view back into the alert details card
          onBack={() => setIsMitigationOpen(false)}
          // Pressing close exits out of both layers completely
          onClose={() => {
            setIsMitigationOpen(false);
            setSelectedAlert(null);
          }}
        />
      )}
    </div>
  );
}