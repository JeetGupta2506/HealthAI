 
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
  console.log('HealthInsights component rendering');
  
  return (
    <div className="h-full bg-white dark:bg-gray-800">
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">AI Health Insights</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Personalized recommendations from your health data</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Wellness Tip</h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Based on your current metrics, try to maintain consistent sleep patterns and stay hydrated throughout the day.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">🎯 Goal Setting</h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Set realistic health goals and track your progress. Small, consistent changes lead to lasting improvements.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">⚠️ Attention</h3>
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              Remember to consult healthcare professionals for medical advice. This app is for informational purposes only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}