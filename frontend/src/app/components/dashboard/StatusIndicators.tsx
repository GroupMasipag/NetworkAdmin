import { useEffect, useState } from 'react';
import { Server, Shield, Activity, Database, Wifi, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

interface StatusIndicatorsProps {
  darkMode: boolean;
}

export default function StatusIndicators({ darkMode }: StatusIndicatorsProps) {
  const [uptime, setUptime] = useState(99.98);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(prev => Math.min(99.99, prev + Math.random() * 0.01));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const systemComponents = [
    { name: 'Web Server', status: 'online', load: 67, icon: Server, color: 'green' },
    { name: 'Database', status: 'online', load: 45, icon: Database, color: 'green' },
    { name: 'Firewall', status: 'online', load: 32, icon: Shield, color: 'green' },
    { name: 'Load Balancer', status: 'online', load: 58, icon: Activity, color: 'green' },
    { name: 'VPN Gateway', status: 'warning', load: 89, icon: Lock, color: 'yellow' },
    { name: 'Network Switch', status: 'online', load: 41, icon: Wifi, color: 'green' },
  ];

  const securityMetrics = [
    { label: 'Threats Blocked (24h)', value: '1,247', trend: '+12%', status: 'success' },
    { label: 'Active Firewall Rules', value: '342', trend: '+5', status: 'info' },
    { label: 'Failed Login Attempts', value: '23', trend: '-8%', status: 'warning' },
    { label: 'Malware Detected', value: '7', trend: '-15%', status: 'success' },
  ];

  const networkStatus = [
    { name: 'Primary Gateway', status: 'Operational', latency: '12ms', uptime: '99.99%' },
    { name: 'Secondary Gateway', status: 'Operational', latency: '15ms', uptime: '99.97%' },
    { name: 'DNS Servers', status: 'Operational', latency: '8ms', uptime: '100%' },
    { name: 'External API', status: 'Degraded', latency: '245ms', uptime: '98.50%' },
  ];

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1a2942] border border-blue-900/30' : 'bg-white border border-gray-200'}`}>
        <h2 className={`text-2xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          System Status Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                  System Uptime
                </p>
                <p className={`text-2xl mt-1 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                  {uptime.toFixed(2)}%
                </p>
              </div>
              <CheckCircle className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>

          {securityMetrics.slice(0, 3).map((metric, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1f35]' : 'bg-gray-50'}`}
            >
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {metric.label}
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className={`text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {metric.value}
                </p>
                <span className={`text-sm ${
                  metric.status === 'success' ? 'text-green-500' :
                  metric.status === 'warning' ? 'text-yellow-500' :
                  'text-blue-500'
                }`}>
                  {metric.trend}
                </span>
              </div>
            </div>
          ))}
        </div>

        <h3 className={`text-xl mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          System Components
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {systemComponents.map((component, index) => {
            const Icon = component.icon;
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${darkMode ? 'bg-[#0f1f35] border-blue-900/30' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      component.status === 'online'
                        ? darkMode ? 'bg-green-900/30' : 'bg-green-100'
                        : darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        component.status === 'online' ? 'text-green-500' : 'text-yellow-500'
                      }`} />
                    </div>
                    <div>
                      <h4 className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {component.name}
                      </h4>
                      <p className={`text-sm ${
                        component.status === 'online' ? 'text-green-500' : 'text-yellow-500'
                      }`}>
                        {component.status.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Load
                    </p>
                    <p className={`${
                      component.load > 80 ? 'text-red-500' :
                      component.load > 60 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {component.load}%
                    </p>
                  </div>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className={`h-full transition-all ${
                      component.load > 80 ? 'bg-red-500' :
                      component.load > 60 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${component.load}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <h3 className={`text-xl mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Network Status
        </h3>

        <div className="space-y-3">
          {networkStatus.map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${darkMode ? 'bg-[#0f1f35] border-blue-900/30' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    item.status === 'Operational' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <h4 className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.name}
                    </h4>
                    <p className={`text-sm ${
                      item.status === 'Operational' ? 'text-green-500' : 'text-yellow-500'
                    }`}>
                      {item.status}
                    </p>
                  </div>
                </div>
                <div className="flex gap-8 text-right">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Latency
                    </p>
                    <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.latency}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Uptime
                    </p>
                    <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.uptime}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
