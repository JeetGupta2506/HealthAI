import { Heart, Activity, Moon, Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { HealthMetric } from '../../types/health';

const mockMetrics: HealthMetric[] = [
  {
    id: '1',
    name: 'Heart Rate',
    value: 72,
    unit: 'bpm',
    target: 70,
    trend: 'stable',
    lastUpdated: new Date()
  },
  {
    id: '2',
    name: 'Blood Pressure',
    value: 120,
    unit: 'mmHg',
    target: 120,
    trend: 'down',
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
    value: 6,
    unit: 'glasses',
    target: 8,
    trend: 'up',
    lastUpdated: new Date()
  }
];

const getIcon = (name: string) => {
  switch (name) {
    case 'Heart Rate': return <Heart className="w-5 h-5" />;
    case 'Blood Pressure': return <Activity className="w-5 h-5" />;
    case 'Sleep Quality': return <Moon className="w-5 h-5" />;
    case 'Hydration': return <Droplets className="w-5 h-5" />;
    default: return <Activity className="w-5 h-5" />;
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
    default: return <Minus className="w-4 h-4 text-gray-400 dark:text-gray-500" />;
  }
};

export function HealthMetrics() {
  return (
    <Card>
      <CardHeader title="Health Metrics" subtitle="Real-time health data overview" />
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockMetrics.map((metric) => (
            <div key={metric.id} className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-blue-600 dark:text-blue-400">{getIcon(metric.name)}</div>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {metric.value}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">{metric.unit}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{metric.name}</p>
                {metric.target && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Target: {metric.target} {metric.unit}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}