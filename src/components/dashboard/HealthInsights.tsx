 
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
    <div className="h-full bg-gradient-to-br from-gray-50 via-emerald-50/20 to-teal-50/20 dark:from-gray-900 dark:via-emerald-900/10 dark:to-teal-900/10 p-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-t-2xl">
        <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">AI Health Insights</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1 text-xs">Personalized recommendations from your health data</p>
      </div>
      <div className="px-6 py-4">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-900/40 dark:to-indigo-900/40 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 text-lg">💡 Wellness Tip</h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
              Based on your current metrics, try to maintain consistent sleep patterns and stay hydrated throughout the day.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50/90 to-green-50/90 dark:from-emerald-900/40 dark:to-green-900/40 p-6 rounded-2xl border-2 border-emerald-200 dark:border-green-700 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3 text-lg">🎯 Goal Setting</h3>
            <p className="text-green-700 dark:text-green-300 text-sm leading-relaxed">
              Set realistic health goals and track your progress. Small, consistent changes lead to lasting improvements.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50/90 to-orange-50/90 dark:from-amber-900/40 dark:to-orange-900/40 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-700 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 text-lg">⚠️ Attention</h3>
            <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
              Remember to consult healthcare professionals for medical advice. This app is for informational purposes only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}