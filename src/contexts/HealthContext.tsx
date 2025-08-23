import React, { createContext, useContext, useState, useEffect } from 'react';
import { HealthMetric } from '../types/health';

interface HealthContextType {
  metrics: HealthMetric[];
  updateMetric: (id: string, value: number) => void;
  updateTarget: (id: string, target: number) => void;
  incrementSymptomChecks: () => void;
  incrementHydration: () => void;
  decrementHydration: () => void;
  updateSleepQuality: (value: number) => void;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

const initialMetrics: HealthMetric[] = [
  {
    id: '1',
    name: 'Wellness Score',
    value: 85,
    unit: '%',
    target: 90,
    trend: 'up',
    lastUpdated: new Date()
  },
  {
    id: '2',
    name: 'Symptom Checks',
    value: 0,
    unit: 'today',
    target: null,
    trend: 'stable',
    lastUpdated: new Date()
  },
  {
    id: '3',
    name: 'Sleep Quality',
    value: 85,
    unit: '%',
    target: 80,
    trend: 'up',
    lastUpdated: new Date()
  },
  {
    id: '4',
    name: 'Hydration',
    value: 0,
    unit: 'glasses',
    target: 8,
    trend: 'up',
    lastUpdated: new Date()
  }
];

const STORAGE_KEY = 'healthMetrics';

export function HealthProvider({ children }: { children: React.ReactNode }) {
  console.log('HealthProvider - initializing');
  
  const [metrics, setMetrics] = useState<HealthMetric[]>(() => {
    console.log('HealthProvider - initializing metrics state');
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('HealthProvider - loaded metrics from localStorage:', parsed);
        // Convert stored date strings back to Date objects
        const converted = parsed.map((metric: any) => ({
          ...metric,
          lastUpdated: new Date(metric.lastUpdated)
        }));
        console.log('HealthProvider - converted metrics:', converted);
        return converted;
      } catch (error) {
        console.error('HealthProvider - error parsing localStorage metrics:', error);
        console.log('HealthProvider - using initial metrics due to parse error');
        return initialMetrics;
      }
    }
    console.log('HealthProvider - no saved metrics, using initial:', initialMetrics);
    return initialMetrics;
  });

  console.log('HealthProvider - current metrics state:', metrics);

  // Reset daily metrics at midnight
  useEffect(() => {
    console.log('HealthProvider - setting up daily reset timer');
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const resetDailyMetrics = () => {
      console.log('HealthProvider - resetting daily metrics');
      setMetrics(prevMetrics => prevMetrics.map(metric => {
        if (metric.name === 'Symptom Checks' || metric.name === 'Hydration') {
          return { ...metric, value: 0, lastUpdated: new Date() };
        }
        return metric;
      }));
    };

    const timer = setTimeout(resetDailyMetrics, timeUntilMidnight);
    return () => clearTimeout(timer);
  }, []);

  // Save metrics to localStorage whenever they change
  useEffect(() => {
    console.log('HealthProvider - saving metrics to localStorage:', metrics);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  }, [metrics]);

  const updateMetric = (id: string, value: number) => {
    console.log('HealthProvider - updateMetric called:', { id, value });
    setMetrics(prevMetrics =>
      prevMetrics.map(metric =>
        metric.id === id
          ? {
              ...metric,
              value,
              lastUpdated: new Date(),
              trend: value > metric.value ? 'up' : value < metric.value ? 'down' : 'stable'
            }
          : metric
      )
    );
  };

  const updateTarget = (id: string, target: number) => {
    console.log('HealthProvider - updateTarget called:', { id, target });
    setMetrics(prevMetrics =>
      prevMetrics.map(metric =>
        metric.id === id
          ? {
              ...metric,
              target
            }
          : metric
      )
    );
  };

  const incrementSymptomChecks = () => {
    console.log('HealthProvider - incrementSymptomChecks called');
    setMetrics(prevMetrics =>
      prevMetrics.map(metric =>
        metric.name === 'Symptom Checks'
          ? { ...metric, value: metric.value + 1, lastUpdated: new Date() }
          : metric
      )
    );
  };

  const incrementHydration = () => {
    console.log('HealthProvider - incrementHydration called');
    setMetrics(prevMetrics =>
      prevMetrics.map(metric =>
        metric.name === 'Hydration'
          ? { ...metric, value: metric.value + 1, lastUpdated: new Date() }
          : metric
      )
    );
  };

  const decrementHydration = () => {
    console.log('HealthProvider - decrementHydration called');
    setMetrics(prevMetrics =>
      prevMetrics.map(metric =>
        metric.name === 'Hydration' && metric.value > 0
          ? { ...metric, value: metric.value - 1, lastUpdated: new Date() }
          : metric
      )
    );
  };

  const updateSleepQuality = (value: number) => {
    console.log('HealthProvider - updateSleepQuality called:', { value });
    setMetrics(prevMetrics =>
      prevMetrics.map(metric =>
        metric.name === 'Sleep Quality'
          ? {
              ...metric,
              value,
              lastUpdated: new Date(),
              trend: value > metric.value ? 'up' : value < metric.value ? 'down' : 'stable'
            }
          : metric
      )
    );
  };

  const contextValue = {
    metrics,
    updateMetric,
    updateTarget,
    incrementSymptomChecks,
    incrementHydration,
    decrementHydration,
    updateSleepQuality
  };

  console.log('HealthProvider - providing context value:', contextValue);

  return (
    <HealthContext.Provider value={contextValue}>
      {children}
    </HealthContext.Provider>
  );
}

export function useHealth() {
  const context = useContext(HealthContext);
  if (context === undefined) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
}
