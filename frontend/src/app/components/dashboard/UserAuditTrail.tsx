import { useEffect, useState } from 'react';
import { User, Monitor, Clock, Activity } from 'lucide-react';

interface AuditLog {
  username: string;
  user_ip: string;
  action: string;
  timestamp: string;
}

interface UserAuditTrailProps {
  darkMode: boolean;
}

export default function UserAuditTrail({ darkMode }: UserAuditTrailProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLogs = () => {
      const token = localStorage.getItem('masipag_token');
      
      fetch('https://networkadmin.onrender.com/api/audit-trail', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then((res) => {
          if (res.status === 401) return null; // Safety net
          return res.json();
        })
        .then((data) => {
          if (!data || data.error) return;
          setLogs(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch audit trail:", err);
          setLoading(false);
        });
    };

    fetchAuditLogs();
    const interval = setInterval(fetchAuditLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`p-6 rounded-xl border ${darkMode ? 'bg-[#1a2942] border-blue-900/30' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            User Audit Trail
          </h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Complete record of user logins, logouts, and system actions.
          </p>
        </div>
      </div>

      {/* THE FIX: Constrained height to 400px and added a vertical scrollbar */}
      <div className="overflow-x-auto overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
        <table className="w-full text-left border-collapse relative">
          
          {/* THE FIX: Sticky header so column names don't disappear when scrolling */}
          <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-[#1a2942]' : 'bg-white'}`}>
            <tr className={`border-b ${darkMode ? 'border-blue-900/30' : 'border-gray-200'}`}>
              <th className={`pb-3 pt-2 font-medium text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Timestamp</div>
              </th>
              <th className={`pb-3 pt-2 font-medium text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="flex items-center gap-2"><User className="w-4 h-4" /> User</div>
              </th>
              <th className={`pb-3 pt-2 font-medium text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="flex items-center gap-2"><Activity className="w-4 h-4" /> Action</div>
              </th>
              <th className={`pb-3 pt-2 font-medium text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="flex items-center gap-2"><Monitor className="w-4 h-4" /> IP Address</div>
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-200 dark:divide-blue-900/30">
            {loading ? (
              <tr>
                <td colSpan={4} className={`py-8 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className={`py-8 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No activity logs found.
                </td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <tr key={index} className={`hover:${darkMode ? 'bg-blue-900/10' : 'bg-gray-50'} transition-colors`}>
                  <td className={`py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {log.username}
                    </span>
                  </td>
                  <td className={`py-3 text-sm font-medium ${
                    log.action.includes('Failed') ? 'text-red-500' : 
                    log.action.includes('Logout') ? 'text-yellow-500' : 
                    darkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {log.action}
                  </td>
                  <td className={`py-3 text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {log.user_ip}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}