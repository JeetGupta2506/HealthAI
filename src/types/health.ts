export interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target?: number | null;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: Date;
  endDate?: Date;
  totalDoses?: number;
  instructions?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  agentType?: 'general' | 'symptom' | 'nutrition' | 'mental-health' | 'emergency';
}

export interface HealthInsight {
  id: string;
  title: string;
  description: string;
  category: 'exercise' | 'nutrition' | 'sleep' | 'mental-health' | 'preventive';
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
}