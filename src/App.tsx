import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { HealthProvider } from './contexts/HealthContext';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { LandingPage } from './components/landing/LandingPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { SignInPage } from './components/auth/SignInPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { HealthMetrics } from './components/dashboard/HealthMetrics';
import { AIChat } from './components/chat/AIChat';
import { MedicationReminders } from './components/dashboard/MedicationReminders';
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
    }, 15000); // 15 second timeout
    
    fetchHealth();
    
    return () => clearTimeout(timeoutId);
  }, []);

  const renderContent = () => {
    console.log('Rendering content for tab:', activeTab);
    try {
      switch (activeTab) {
        case 'dashboard':
          return (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col">
                  <HealthMetrics />
                </div>
                <div className="flex flex-col">
                  <MedicationReminders showAddButton={false} />
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
        default:
          return (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col">
                  <HealthMetrics />
                </div>
                <div className="flex flex-col">
                  <MedicationReminders showAddButton={false} />
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab !== 'chat' && <Header />}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">Loading dashboard...</div>
              <div className="text-sm text-gray-400 mt-2">Checking backend connection...</div>
            </div>
          ) : error && healthStatus !== 'unavailable' && healthStatus !== 'timeout' ? (
            <div className="p-6 text-center text-red-500">
              <div>Error: {error}</div>
            </div>
          ) : (
            <>
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
          <ChatProvider>
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
          </ChatProvider>
        </HealthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;