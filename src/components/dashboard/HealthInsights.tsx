 
import { Lightbulb, TrendingUp, Shield, Brain } from 'lucide-react';

import { HealthInsight } from '../../types/health';

const mockInsights: HealthInsight[] = [
  {
    id: '1',
    title: 'Improve Sleep Quality',
    description: 'Your sleep pattern analysis suggests going to bed 30 minutes earlier could improve your REM sleep by 15%.',
    category: 'sleep',
    priority: 'high',
    actionable: true,
    createdAt: new Date()
  },
  {
    id: '2',
    title: 'Hydration Goals',
    description: 'You\'ve been consistently meeting 75% of your daily water intake. Try setting reminders to reach your full goal.',
    category: 'nutrition',
    priority: 'medium',
    actionable: true,
    createdAt: new Date()
  },
  {
    id: '3',
    title: 'Exercise Recovery',
    description: 'Your heart rate variability indicates good recovery. Your current exercise routine is well-balanced.',
    category: 'exercise',
    priority: 'low',
    actionable: false,
    createdAt: new Date()
  },
  {
    id: '4',
    title: 'Preventive Care Reminder',
    description: 'It\'s been 11 months since your last annual check-up. Consider scheduling your next appointment.',
    category: 'preventive',
    priority: 'high',
    actionable: true,
    createdAt: new Date()
  }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'exercise': return <TrendingUp className="w-5 h-5" />;
    case 'nutrition': return <Lightbulb className="w-5 h-5" />;
    case 'sleep': return <Brain className="w-5 h-5" />;
    case 'mental-health': return <Brain className="w-5 h-5" />;
    case 'preventive': return <Shield className="w-5 h-5" />;
    default: return <Lightbulb className="w-5 h-5" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'border-red-200 bg-red-50 dark:border-gray-700 dark:from-gray-800 dark:to-gray-700';
    case 'medium': return 'border-yellow-200 bg-yellow-50 dark:border-gray-700 dark:from-gray-800 dark:to-gray-700';
    case 'low': return 'border-green-200 bg-green-50 dark:border-gray-700 dark:from-gray-800 dark:to-gray-700';
    default: return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:from-gray-800 dark:to-gray-700';
  }
};

const getPriorityDot = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

export function HealthInsights() {
  return (
    <div className="h-full bg-white dark:bg-gray-800">
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">AI Health Insights</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Personalized recommendations from your health data</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {mockInsights.map((insight) => (
            <div key={insight.id} className={`p-4 rounded-lg border-2 bg-gradient-to-r ${getPriorityColor(insight.priority)}`}>
              <div className="flex items-start gap-3">
                <div className="text-gray-600 dark:text-gray-400">
                  {getCategoryIcon(insight.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{insight.title}</h4>
                    <div className={`w-2 h-2 rounded-full ${getPriorityDot(insight.priority)}`}></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{insight.category}</span>
                    {insight.actionable && (
                      <button className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
                        Take Action →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}