import { useState } from 'react';
import { Moon, Sun, LogOut, Home, Activity, Shield, Camera, BarChart3, Menu, X, FileText } from 'lucide-react';
import MainDashboardLayout from './dashboard/MainDashboardLayout';
import TrafficGraph from './dashboard/TrafficGraph';
import SecurityAlertTable from './dashboard/SecurityAlertTable';
import StatusIndicators from './dashboard/StatusIndicators';
import LiveCamera from './dashboard/LiveCamera';
import SystemLogs from './dashboard/SystemLogs';
import logoImage from '../../imports/Black_and_Gold_Real_Estate_Logo__1_-removebg-preview.png';

interface DashboardProps {
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

type ViewType = 'main' | 'traffic' | 'alerts' | 'status' | 'camera' | 'logs';

export default function Dashboard({ onLogout, darkMode, setDarkMode }: DashboardProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogoutConfirm = async () => {
    const token = localStorage.getItem('masipag_token');
    
    if (token) {
      try {
        // Tell Python to record this logout in the Audit Trail table
        await fetch('https://networkadmin.onrender.com/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error("Failed to log out on server:", error);
      }
    }
    localStorage.removeItem('masipag_token');
    
    // Trigger the App.tsx state change to hide the dashboard
    onLogout();
  };

  const menuItems = [
    { id: 'main' as ViewType, icon: Home, label: 'Main Dashboard Layout' },
    { id: 'traffic' as ViewType, icon: BarChart3, label: 'Real-time Traffic Table' },
    { id: 'alerts' as ViewType, icon: Shield, label: 'Security Alert Table' },
    { id: 'status' as ViewType, icon: Activity, label: 'Status Indicators' },
    { id: 'camera' as ViewType, icon: Camera, label: 'Live Camera' },
    { id: 'logs' as ViewType, icon: FileText, label: 'System Logs' },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0a1628]' : 'bg-gray-50'}`}>
      <header className={`border-b ${darkMode ? 'bg-[#1a2942] border-blue-900/30' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${darkMode ? 'text-white' : 'text-gray-700'}`}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className={`flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <img src={logoImage} alt="MASIPAG Logo" className="w-14 h-14 object-contain" />
              <div>
                <h1 className="text-xl font-semibold tracking-wide">MASIPAG</h1>
                <p className="text-xs opacity-70">Security Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${darkMode ? 'text-white' : 'text-gray-700'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {sidebarOpen && (
          <aside className={`w-80 min-h-[calc(100vh-73px)] border-r p-6 ${
            darkMode ? 'bg-[#1a2942] border-blue-900/30' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Quick Actions
            </h2>
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      currentView === item.id
                        ? darkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-900 text-white'
                        : darkMode
                          ? 'text-gray-300 hover:bg-blue-900/20'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        <main className="flex-1 p-6">
          {currentView === 'main' && <MainDashboardLayout darkMode={darkMode} />}
          {currentView === 'traffic' && <TrafficGraph darkMode={darkMode} />}
          {currentView === 'alerts' && <SecurityAlertTable darkMode={darkMode} />}
          {currentView === 'status' && <StatusIndicators darkMode={darkMode} />}
          {currentView === 'camera' && <LiveCamera darkMode={darkMode} />}
          {currentView === 'logs' && <SystemLogs darkMode={darkMode} />}
        </main>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full p-6 rounded-xl shadow-2xl ${darkMode ? 'bg-[#1a2942]' : 'bg-white'}`}>
            <h2 className={`text-2xl mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Confirm Logout
            </h2>
            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to logout from MASIPAG System?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
