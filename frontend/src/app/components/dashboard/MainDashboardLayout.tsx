import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Users, Server, Activity, Globe } from 'lucide-react';

interface MainDashboardLayoutProps {
  darkMode: boolean;
}

export default function MainDashboardLayout({ darkMode }: MainDashboardLayoutProps) {
  // 1. Set up a secure default state so the UI doesn't crash while loading
  const [summary, setSummary] = useState({
    currentTraffic: 0,
    activeConnections: 0,
    blockedThreats: 0,
    serverLoad: 0,
    recentLogs: [] as any[],
    recentAlerts: [] as any[]
  });

  // 2. Fetch the Hub data from Python
  useEffect(() => {
    const fetchSummary = () => {
      fetch('https://networkadmin.onrender.com/api/dashboard-summary')
        .then((res) => res.json())
        .then((data) => {
          setSummary({
            currentTraffic: data.currentTraffic,
            activeConnections: data.activeConnections,
            blockedThreats: data.blockedThreats,
            serverLoad: data.serverLoad,
            recentLogs: data.recentLogs,
            recentAlerts: data.recentAlerts
          });
        })
        .catch((err) => console.error("Database Connection Failed:", err));
    };

    fetchSummary();
    
    // Refresh the main dashboard every 3 seconds
    const interval = setInterval(fetchSummary, 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Active Connections', value: summary.activeConnections.toLocaleString(), icon: Users, color: 'blue' },
    { label: 'Blocked Threats', value: summary.blockedThreats.toLocaleString(), icon: Shield, color: 'green' },
    { label: 'Server Load', value: `${summary.serverLoad}%`, icon: Server, color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-[#1a2942] border-blue-900/30' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Current Traffic
            </h3>
            <Globe className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {summary.currentTraffic}
            </h2>
            <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              requests/sec
            </span>
          </div>
        </div>

        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`p-6 rounded-xl border ${darkMode ? 'bg-[#1a2942] border-blue-900/30' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </h3>
                <Icon className={`w-5 h-5 ${
                  stat.color === 'blue' ? (darkMode ? 'text-blue-400' : 'text-blue-600') :
                  stat.color === 'green' ? (darkMode ? 'text-green-400' : 'text-green-600') :
                  (darkMode ? 'text-orange-400' : 'text-orange-600')
                }`} />
              </div>
              <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {stat.value}
              </h2>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Security Logs */}
        <div className={`p-6 rounded-xl border flex flex-col ${darkMode ? 'bg-[#1a2942] border-blue-900/30' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              System Security Logs
            </h3>
            <button className={`text-sm hover:underline ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              View All
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {summary.recentLogs.map((log, index) => (
              <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'bg-[#0f1f35] border-blue-900/30' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    log.level === 'critical' ? 'bg-red-500' : 
                    log.level === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {log.message || 'System event recorded'}
                  </p>
                </div>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {summary.recentLogs.length === 0 && (
              <p className={`text-sm italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No recent logs available.</p>
            )}
          </div>
        </div>

        {/* Active Security Alerts */}
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-[#1a2942] border-blue-900/30' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Active Security Alerts
            </h3>
          </div>
          <div className="space-y-4">
            {summary.recentAlerts.map((alert, index) => {
              const isCritical = alert.severity.toLowerCase() === 'critical';
              return (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  isCritical 
                    ? `border-red-500 ${darkMode ? 'bg-red-900/10' : 'bg-red-50'}` 
                    : `border-yellow-500 ${darkMode ? 'bg-yellow-900/10' : 'bg-yellow-50'}`
                }`}>
                  <div className="flex items-start gap-3">
                    {isCritical ? (
                      <Shield className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`font-medium ${
                        isCritical 
                          ? (darkMode ? 'text-red-400' : 'text-red-700') 
                          : (darkMode ? 'text-yellow-400' : 'text-yellow-700')
                      }`}>
                        {alert.severity.toUpperCase()}: {alert.attack_type}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        isCritical 
                          ? (darkMode ? 'text-red-300' : 'text-red-600') 
                          : (darkMode ? 'text-yellow-300' : 'text-yellow-600')
                      }`}>
                        {alert.description || `Threat detected from IP address ${alert.ip}`}
                      </p>
                      <p className={`text-xs mt-2 ${
                        isCritical 
                          ? (darkMode ? 'text-red-400/70' : 'text-red-500') 
                          : (darkMode ? 'text-yellow-400/70' : 'text-yellow-500')
                      }`}>
                        {new Date(alert.timestamp).toLocaleTimeString()} - Source: {alert.ip}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {summary.recentAlerts.length === 0 && (
              <p className={`text-sm italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No active alerts at this time.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}