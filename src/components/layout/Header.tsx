import { useState } from 'react';
import { User, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { SettingsModal } from './SettingsModal';

export function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Health Dashboard
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Settings */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-300"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {/* User Profile */}
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden md:inline text-gray-700 dark:text-gray-200">
                John Doe
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
}