import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TrafficGraphProps {
  darkMode: boolean;
}

interface TrafficData {
  time: string;
  traffic: number;
  threats: number;
  bandwidth: string;
  packets: number;
}

export default function TrafficGraph({ darkMode }: TrafficGraphProps) {
  const [data, setData] = useState<TrafficData[]>([]);

  useEffect(() => {
    const fetchTraffic = () => {
      // 1. Grab the VIP wristband from the browser's memory
      const token = localStorage.getItem('masipag_token');

      // 2. Attach it to the Headers
      fetch('https://networkadmin.onrender.com/api/traffic', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then((res) => {
          // 3. SAFETY NET: Catch the 401 before it breaks React
          if (res.status === 401) {
            console.error("Token expired or missing in TrafficGraph");
            return null; // Stop processing so React doesn't crash
          }
          return res.json();
        })
        .then((dbData) => {
          // 4. If we got blocked (null) or Python sent an error instead of an array, stop here.
          if (!dbData || !Array.isArray(dbData)) return;

          const liveData = dbData.map((item: any) => ({
            time: new Date(item.timestamp).toLocaleTimeString(),
            traffic: item.requests_per_sec || 0,
            threats: item.active_threats || 0,
            bandwidth: `${item.bandwidth_mbps || 0} MB/s`,
            packets: item.packets || 0,
          }));
          
          // Reverse the data so the newest is on the right side/top of the graph
          setData(liveData.reverse());
        })
        .catch((err) => console.error("Database Connection Failed:", err));
    };

    fetchTraffic();
    
    // Refresh the graph every 2 seconds to match your UI's fast pace
    const interval = setInterval(fetchTraffic, 2000);
    return () => clearInterval(interval);
  }, []);

  // SAFETY NET: Prevent Division by Zero crashes when the database is empty!
  const avgTraffic = data.length > 0 
    ? Math.floor(data.reduce((acc, curr) => acc + curr.traffic, 0) / data.length)
    : 0;
  const currentTraffic = data.length > 0 ? data[data.length - 1].traffic : 0;
  const trafficTrend = currentTraffic >= avgTraffic ? 'up' : 'down';
  const trafficChange = avgTraffic > 0 
    ? Math.abs(((currentTraffic - avgTraffic) / avgTraffic) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1a2942] border border-blue-900/30' : 'bg-white border border-gray-200'}`}>
        <h2 className={`text-2xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Real-time Traffic Monitor
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1f35]' : 'bg-blue-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Current Traffic
              </p>
              {trafficTrend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
            <p className={`text-2xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {currentTraffic}
            </p>
            <p className={`text-xs mt-1 ${trafficTrend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trafficTrend === 'up' ? '+' : '-'}{trafficChange}% from avg
            </p>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1f35]' : 'bg-green-50'}`}>
            <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Average Traffic
            </p>
            <p className={`text-2xl ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              {avgTraffic}
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              requests/sec
            </p>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1f35]' : 'bg-red-50'}`}>
            <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Active Threats
            </p>
            <p className={`text-2xl ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              {data.length > 0 ? data[data.length - 1].threats : 0}
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              detected
            </p>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1f35]' : 'bg-purple-50'}`}>
            <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Bandwidth
            </p>
            <p className={`text-2xl ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              {data.length > 0 ? data[data.length - 1].bandwidth : '0 MB/s'}
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              current usage
            </p>
          </div>
        </div>

        <div className={`mb-4 text-sm flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <Activity className="w-4 h-4" />
          Live Traffic Data - Updates every 2 seconds
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-blue-900/30' : 'border-gray-200'}`}>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Time
                </th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Requests/sec
                </th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Threats
                </th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Bandwidth
                </th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Packets
                </th>
                <th className={`px-4 py-3 text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.slice().reverse().map((row, index) => {
                const isHigh = row.traffic > avgTraffic * 1.2;
                const isCritical = row.threats > 15;

                return (
                  <tr
                    key={index}
                    className={`border-b ${
                      darkMode ? 'border-blue-900/30 hover:bg-[#0f1f35]' : 'border-gray-100 hover:bg-gray-50'
                    } transition-colors ${index === 0 ? (darkMode ? 'bg-blue-900/10' : 'bg-blue-50/50') : ''}`}
                  >
                    <td className={`px-4 py-3 text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {row.time}
                      {index === 0 && (
                        <span className="ml-2 text-xs text-green-500">● LIVE</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-sm ${
                      isHigh
                        ? 'text-orange-500'
                        : darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {row.traffic}
                    </td>
                    <td className={`px-4 py-3 text-sm ${
                      isCritical
                        ? 'text-red-500'
                        : row.threats > 10
                        ? 'text-yellow-500'
                        : darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {row.threats}
                    </td>
                    <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {row.bandwidth}
                    </td>
                    <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {row.packets.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        isCritical
                          ? darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                          : isHigh
                          ? darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                          : darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                      }`}>
                        {isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'NORMAL'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}