import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { SettingsModal } from './SettingsModal';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileData {
  name: string;
  email: string;
}

export function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.username ?? '',
    email: user?.email ?? '',
  });

  // Keep local profileData in sync with authenticated user when it changes
  useEffect(() => {
    setProfileData(prev => ({
      ...prev,
      name: user?.username ?? prev.name,
      email: user?.email ?? prev.email
    }));
  }, [user]);

  const handleProfileUpdate = (updatedProfile: ProfileData) => {
    setProfileData(updatedProfile);
    // Persist updated username/email into auth context so header and other
    // components reflect the change across the app
    try {
      updateUser({ username: updatedProfile.name, email: updatedProfile.email });
    } catch (e) {
      // ignore if updateUser not available or fails; UI still updates locally
      // In a real app you might show an error toast here
      console.error('Failed to update auth user:', e);
    }
  };

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
            
            {/* User Profile with Settings */}
            <Button 
              variant="ghost" 
              className="flex items-center gap-2"
              onClick={() => setIsSettingsOpen(true)}
            >
              <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden md:inline text-gray-700 dark:text-gray-200">
                {user?.username ?? profileData.name}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        profileData={profileData}
        onProfileUpdate={handleProfileUpdate}
      />
    </>
  );
}