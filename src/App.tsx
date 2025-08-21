import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { HealthProvider } from './contexts/HealthContext';
import { LandingPage } from './components/landing/LandingPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { HealthMetrics } from './components/dashboard/HealthMetrics';
import { AIChat } from './components/chat/AIChat';
import { MedicationReminders } from './components/dashboard/MedicationReminders';
import { HealthInsights } from './components/dashboard/HealthInsights';
import { SymptomChecker } from './components/symptoms/SymptomChecker';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLanding, setShowLanding] = useState(true);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://127.0.0.1:8000/health');
        if (!res.ok) throw new Error('Failed to fetch backend health');
        const data = await res.json();
        setHealthStatus(data.status);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  // Show landing page by default
  if (showLanding) {
    return (
      <ThemeProvider>
        <HealthProvider>
          <LandingPage onStartNow={() => setShowLanding(false)} />
        </HealthProvider>
      </ThemeProvider>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <HealthMetrics />
            </div>
            <MedicationReminders />
            <HealthInsights />
          </div>
        );
      case 'chat':
        return (
          <div className="max-w-4xl mx-auto">
            <AIChat />
          </div>
        );
      case 'symptoms':
        return (
          <div className="max-w-4xl mx-auto">
            <SymptomChecker />
          </div>
        );
      case 'medications':
        return (
          <div className="max-w-4xl mx-auto">
            <MedicationReminders />
          </div>
        );
      case 'insights':
        return (
          <div className="max-w-4xl mx-auto">
            <HealthInsights />
          </div>
        );
      case 'reports':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Health Reports</h2>
              <p className="text-gray-600 dark:text-gray-300">Detailed health reports and analytics coming soon...</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <HealthMetrics />
            </div>
            <MedicationReminders />
            <HealthInsights />
          </div>
        );
    }
  };

  return (
    <ThemeProvider>
      <HealthProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogoClick={() => setShowLanding(true)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
            <div className="mb-4">
              {loading ? (
                <span className="text-gray-500 dark:text-gray-400">Checking backend health...</span>
              ) : error ? (
                <span className="text-red-500 dark:text-red-400">Backend error: {error}</span>
              ) : (
                <span className="text-green-600 dark:text-green-400">Backend health: {healthStatus}</span>
              )}
            </div>
            {renderContent()}
          </main>
        </div>
      </div>
      </HealthProvider>
    </ThemeProvider>
  );
}

export default App;