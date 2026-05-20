import { useState } from 'react';
import { Eye, EyeOff, Moon, Sun } from 'lucide-react';
import logoImage from '../../imports/Black_and_Gold_Real_Estate_Logo__1_-removebg-preview.png';

interface LoginPageProps {
  onLogin: () => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export default function LoginPage({ onLogin, darkMode, setDarkMode }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center ${darkMode ? 'bg-[#0a1628]' : 'bg-gray-100'}`}>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-6 right-6 p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        {darkMode ? <Sun className="w-6 h-6 text-white" /> : <Moon className="w-6 h-6 text-gray-700" />}
      </button>

      <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl ${darkMode ? 'bg-[#1a2942] border border-blue-900/30' : 'bg-white'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={logoImage} alt="MASIPAG Logo" className="w-32 h-32 object-contain" />
          </div>
          <h1 className={`text-3xl mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome Back!</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Monitoring and Automated Security Intelligence<br />for Protection Against Global-threats
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className={`w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                darkMode
                  ? 'bg-[#0f1f35] border-blue-800/50 text-white placeholder-gray-500 hover:border-blue-700 focus:ring-blue-600'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:ring-blue-500'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                  darkMode
                    ? 'bg-[#0f1f35] border-blue-800/50 text-white placeholder-gray-500 hover:border-blue-700 focus:ring-blue-600'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Remember me
              </span>
            </label>
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-medium transition-all ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-900 hover:bg-blue-800 text-white'
            }`}
          >
            Log In
          </button>
        </form>

        <div className={`mt-6 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          By logging in, you agree to our{' '}
          <button
            onClick={() => setShowTerms(true)}
            className={`underline transition-colors ${
              darkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'
            }`}
          >
            Terms of Use
          </button>{' '}
          and{' '}
          <button
            onClick={() => setShowPrivacy(true)}
            className={`underline transition-colors ${
              darkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'
            }`}
          >
            Privacy Policy
          </button>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowTerms(false)}>
          <div
            className={`max-w-2xl w-full max-h-[80vh] rounded-xl shadow-2xl ${darkMode ? 'bg-[#1a2942]' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-6 border-b ${darkMode ? 'border-blue-900/30' : 'border-gray-200'}`}>
              <h2 className={`text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>Terms of Use</h2>
            </div>
            <div className={`p-6 overflow-y-auto max-h-[50vh] ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <h3 className="text-lg mb-3">1. Acceptance of Terms</h3>
              <p className="mb-4">By accessing and using this Network Monitoring & Control System, you accept and agree to be bound by the terms and provision of this agreement.</p>

              <h3 className="text-lg mb-3">2. Use License</h3>
              <p className="mb-4">Permission is granted to access the network monitoring system for authorized personnel only. This license shall automatically terminate if you violate any of these restrictions.</p>

              <h3 className="text-lg mb-3">3. Disclaimer</h3>
              <p className="mb-4">The materials on the Network Monitoring System are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties.</p>

              <h3 className="text-lg mb-3">4. Limitations</h3>
              <p className="mb-4">In no event shall the company or its suppliers be liable for any damages arising out of the use or inability to use the materials on the system.</p>

              <h3 className="text-lg mb-3">5. Security Responsibilities</h3>
              <p className="mb-4">Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account.</p>
            </div>
            <div className={`p-6 border-t ${darkMode ? 'border-blue-900/30' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowTerms(false)}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-900 hover:bg-blue-800 text-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowPrivacy(false)}>
          <div
            className={`max-w-2xl w-full max-h-[80vh] rounded-xl shadow-2xl ${darkMode ? 'bg-[#1a2942]' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-6 border-b ${darkMode ? 'border-blue-900/30' : 'border-gray-200'}`}>
              <h2 className={`text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>Privacy Policy</h2>
            </div>
            <div className={`p-6 overflow-y-auto max-h-[50vh] ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <h3 className="text-lg mb-3">1. Information We Collect</h3>
              <p className="mb-4">We collect information necessary for network security monitoring including login credentials, network activity logs, and system usage data.</p>

              <h3 className="text-lg mb-3">2. How We Use Information</h3>
              <p className="mb-4">Your information is used to provide network security services, detect threats, prevent unauthorized access, and maintain system integrity.</p>

              <h3 className="text-lg mb-3">3. Data Security</h3>
              <p className="mb-4">We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or destruction.</p>

              <h3 className="text-lg mb-3">4. Log Data</h3>
              <p className="mb-4">We collect log data including IP addresses, timestamps, and system events for security monitoring and threat detection purposes.</p>

              <h3 className="text-lg mb-3">5. Third Party Disclosure</h3>
              <p className="mb-4">We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except as required by law or for security purposes.</p>

              <h3 className="text-lg mb-3">6. Your Rights</h3>
              <p className="mb-4">You have the right to access, correct, or delete your personal information. Contact your system administrator for assistance.</p>
            </div>
            <div className={`p-6 border-t ${darkMode ? 'border-blue-900/30' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowPrivacy(false)}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-900 hover:bg-blue-800 text-white'
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
