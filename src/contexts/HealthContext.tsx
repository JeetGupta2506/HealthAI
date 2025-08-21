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
  const [metrics, setMetrics] = useState<HealthMetric[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert stored date strings back to Date objects
      return parsed.map((metric: any) => ({
        ...metric,
        lastUpdated: new Date(metric.lastUpdated)
      }));
    }
    return initialMetrics;
  });

  // Reset daily metrics at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const resetDailyMetrics = () => {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  }, [metrics]);

  const updateMetric = (id: string, value: number) => {
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
    setMetrics(prevMetrics =>
      prevMetrics.map(metric =>
        metric.name === 'Symptom Checks'
          ? { ...metric, value: metric.value + 1, lastUpdated: new Date() }
          : metric
      )
    );
  };

  const incrementHydration = () => {
    setMetrics(prevMetrics =>
      prevMetrics.map(metric =>
        metric.name === 'Hydration'
          ? { ...metric, value: metric.value + 1, lastUpdated: new Date() }
          : metric
      )
    );
  };

  const decrementHydration = () => {
    setMetrics(prevMetrics =>
      prevMetrics.map(metric =>
        metric.name === 'Hydration' && metric.value > 0
          ? { ...metric, value: metric.value - 1, lastUpdated: new Date() }
          : metric
      )
    );
  };

  const updateSleepQuality = (value: number) => {
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

  return (
    <HealthContext.Provider
      value={{
        metrics,
        updateMetric,
        updateTarget,
        incrementSymptomChecks,
        incrementHydration,
        decrementHydration,
        updateSleepQuality
      }}
    >
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
