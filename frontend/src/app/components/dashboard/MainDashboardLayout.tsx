import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Activity, Users, Server, Globe } from 'lucide-react';

interface MainDashboardLayoutProps {
  darkMode: boolean;
}

export default function MainDashboardLayout({ darkMode }: MainDashboardLayoutProps) {
  const [currentTraffic, setCurrentTraffic] = useState(500);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTraffic(Math.floor(Math.random() * 1000) + 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Active Connections', value: '1,247', icon: Users, color: 'blue' },
    { label: 'Blocked Threats', value: '23', icon: Shield, color: 'green' },
    { label: 'Server Load', value: '67%', icon: Server, color: 'orange' },
  ];

  const recentLogs = [
    { time: '14:32:15', event: 'Failed login attempt from 192.168.1.45', severity: 'warning' },
    { time: '14:30:02', event: 'DDoS attack detected and mitigated', severity: 'critical' },
    { time: '14:28:33', event: 'Firewall rule updated successfully', severity: 'info' },
    { time: '14:25:11', event: 'Suspicious traffic from external IP blocked', severity: 'warning' },
    { time: '14:22:45', event: 'System backup completed', severity: 'success' },
  ];

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'}`}>
        <div className="flex items-center gap-3">
          <Activity className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          <div>
            <h2 className={`text-lg ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
              System Status
            </h2>
            <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
              All systems operational
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1a2942] border border-blue-900/30' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Current Traffic
            </h3>
            <Globe className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <p className={`text-3xl mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {currentTraffic}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            requests/sec
          </p>
        </div>

        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`p-6 rounded-lg ${darkMode ? 'bg-[#1a2942] border border-blue-900/30' : 'bg-white border border-gray-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </h3>
                <Icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <p className={`text-3xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1a2942] border border-blue-900/30' : 'bg-white border border-gray-200'}`}>
          <h3 className={`text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            System Security Logs
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentLogs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  darkMode ? 'bg-[#0f1f35] border-blue-800/30' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    log.severity === 'critical' ? 'bg-red-500' :
                    log.severity === 'warning' ? 'bg-yellow-500' :
                    log.severity === 'success' ? 'bg-green-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {log.time}
                    </p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {log.event}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1a2942] border border-blue-900/30' : 'bg-white border border-gray-200'}`}>
          <h3 className={`text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Live Camera Feed
          </h3>
          <div className={`relative aspect-video rounded-lg overflow-hidden ${darkMode ? 'bg-[#0f1f35]' : 'bg-gray-900'}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Shield className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Camera Feed: Entrance</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-500 text-xs">LIVE</span>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-white text-xs">CAM-01</span>
              <span className="text-white text-xs">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1a2942] border border-blue-900/30' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Active Threats & Alerts
        </h3>
        <div className="space-y-3">
          <div className={`p-4 rounded-lg border-l-4 border-red-500 ${darkMode ? 'bg-red-900/10' : 'bg-red-50'}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className={`font-medium ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                  Critical: DDoS Attack Detected
                </h4>
                <p className={`text-sm mt-1 ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                  High volume traffic from multiple sources targeting server cluster. Mitigation protocols activated.
                </p>
                <p className={`text-xs mt-2 ${darkMode ? 'text-red-400/70' : 'text-red-500'}`}>
                  14:30:02 - Source: Multiple IPs
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border-l-4 border-yellow-500 ${darkMode ? 'bg-yellow-900/10' : 'bg-yellow-50'}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className={`font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                  Warning: Multiple Failed Login Attempts
                </h4>
                <p className={`text-sm mt-1 ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                  5 failed login attempts detected from IP 192.168.1.45. Account temporarily locked.
                </p>
                <p className={`text-xs mt-2 ${darkMode ? 'text-yellow-400/70' : 'text-yellow-500'}`}>
                  14:32:15 - Target: Admin account
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
