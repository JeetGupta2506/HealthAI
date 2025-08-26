import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { HealthProvider } from './contexts/HealthContext';
import { AuthProvider } from './contexts/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { SignInPage } from './components/auth/SignInPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { HealthMetrics } from './components/dashboard/HealthMetrics';
import { AIChat } from './components/chat/AIChat';
import { MedicationReminders } from './components/dashboard/MedicationReminders';
import { HealthInsights } from './components/dashboard/HealthInsights';
import { SymptomChecker } from './components/symptoms/SymptomChecker';
import { useAuth } from './contexts/AuthContext';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  return <>{children}</>;
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Dashboard component mounted');
    const fetchHealth = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Attempting to fetch backend health...');
        const res = await fetch('http://127.0.0.1:8000/health');
        if (!res.ok) throw new Error('Failed to fetch backend health');
        const data = await res.json();
        setHealthStatus(data.status);
        console.log('Backend health:', data.status);
      } catch (err: any) {
        console.error('Health check error:', err);
        setError(err.message || 'Unknown error');
        // Don't block the dashboard if backend is unavailable
        setHealthStatus('unavailable');
      } finally {
        setLoading(false);
      }
    };
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Health check timeout, proceeding with dashboard');
        setLoading(false);
        setHealthStatus('timeout');
      }
    }, 5000); // 5 second timeout
    
    fetchHealth();
    
    return () => clearTimeout(timeoutId);
  }, []);

  const renderContent = () => {
    console.log('Rendering content for tab:', activeTab);
    try {
      switch (activeTab) {
        case 'dashboard':
          return (
            <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30 dark:from-gray-900 dark:via-blue-900/20 dark:to-emerald-900/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="lg:col-span-2 transition-all duration-300 ease-in-out hover:scale-[1.02]">
                  <HealthMetrics />
                </div>
                <div className="transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1">
                  <MedicationReminders />
                </div>
                <div className="transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1">
                  <HealthInsights />
                </div>
              </div>
            </div>
          );
        case 'chat':
          return <AIChat />;
        case 'symptoms':
          return <SymptomChecker />;
        case 'medications':
          return <MedicationReminders />;
        case 'insights':
          return <HealthInsights />;
                 case 'reports':
           return (
             <div className="h-full bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 flex items-center justify-center rounded-2xl shadow-xl border-2 border-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-700 dark:to-pink-700">
               <div className="text-center p-8 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg backdrop-blur-sm">
                 <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Health Reports</h2>
                 <p className="text-gray-600 dark:text-gray-300 text-lg">Detailed health reports and analytics coming soon...</p>
               </div>
             </div>
           );
        default:
          return (
            <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30 dark:from-gray-900 dark:via-blue-900/20 dark:to-emerald-900/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-2 transition-all duration-300 ease-in-out hover:scale-[1.02]">
                  <HealthMetrics />
                </div>
                <div className="transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1">
                  <MedicationReminders />
                </div>
                <div className="transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1">
                  <HealthInsights />
                </div>
              </div>
            </div>
          );
      }
    } catch (err) {
      console.error('Error rendering content:', err);
      return (
        <div className="p-6 text-red-500">
          Error rendering content: {err instanceof Error ? err.message : 'Unknown error'}
        </div>
      );
    }
  };

  console.log('Dashboard render - activeTab:', activeTab, 'loading:', loading, 'error:', error, 'healthStatus:', healthStatus);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-emerald-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-emerald-900/10 transition-all duration-300">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-transparent">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <div className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-2">Loading dashboard...</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Checking backend connection...</div>
                <div className="flex justify-center mt-4 gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          ) : error && healthStatus !== 'unavailable' && healthStatus !== 'timeout' ? (
            <div className="p-8 text-center">
              <div className="inline-block p-6 bg-red-50/80 dark:bg-red-900/20 rounded-2xl shadow-lg backdrop-blur-sm border-2 border-red-200 dark:border-red-700">
                <div className="text-red-600 dark:text-red-400 text-lg font-medium">Error: {error}</div>
              </div>
            </div>
          ) : (
            <>
              {/* Backend Status Indicator */}
              {healthStatus && (
                <div className={`p-2 text-center text-sm ${
                  healthStatus === 'ok' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                  healthStatus === 'unavailable' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}>
                  Backend: {healthStatus === 'ok' ? 'Connected' : healthStatus === 'unavailable' ? 'Unavailable' : 'Timeout'}
                </div>
              )}
              {renderContent()}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HealthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </HealthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;