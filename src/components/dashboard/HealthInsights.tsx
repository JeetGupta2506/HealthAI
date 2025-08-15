import React from 'react';
import { Lightbulb, TrendingUp, Shield, Brain } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
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
    case 'high': return 'border-red-200 bg-red-50';
    case 'medium': return 'border-yellow-200 bg-yellow-50';
    case 'low': return 'border-green-200 bg-green-50';
    default: return 'border-gray-200 bg-gray-50';
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
    <Card>
      <CardHeader 
        title="AI Health Insights" 
        subtitle="Personalized recommendations from your health data"
      />
      <CardContent>
        <div className="space-y-4">
          {mockInsights.map((insight) => (
            <div key={insight.id} className={`p-4 rounded-lg border-2 ${getPriorityColor(insight.priority)}`}>
              <div className="flex items-start gap-3">
                <div className="text-blue-600">
                  {getCategoryIcon(insight.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800">{insight.title}</h4>
                    <div className={`w-2 h-2 rounded-full ${getPriorityDot(insight.priority)}`}></div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize">{insight.category}</span>
                    {insight.actionable && (
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        Take Action →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}