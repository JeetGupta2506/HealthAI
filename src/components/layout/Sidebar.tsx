 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Activity, 
  Pill, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
  { id: 'symptoms', label: 'Symptom Checker', icon: Activity },
  { id: 'medications', label: 'Medications', icon: Pill }
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300">
      {/* Logo */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <button 
          onClick={() => {
            navigate('/', { replace: true });
            window.location.href = '/';
          }} 
          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-300"
          title="Go to Landing Page"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                HealthAI
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your AI Health Companion
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800/80 dark:to-gray-700/80 text-blue-700 dark:text-gray-100 border-r-2 border-blue-500 dark:border-blue-400/60 shadow-sm dark:shadow-gray-900/50' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="space-y-2">
          <button 
            onClick={() => {
              logout();
              navigate('/', { replace: true });
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-all duration-300"
            title="Sign Out and Return to Landing Page"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}