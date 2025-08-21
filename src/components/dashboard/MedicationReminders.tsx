import { useState } from 'react';
import { Pill, Clock, Plus, Check, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Medication } from '../../types/health';

const mockMedications: Medication[] = [
  {
    id: '1',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    timeToTake: ['08:00'],
    prescribedBy: 'Dr. Smith',
    startDate: new Date(),
    instructions: 'Take with food'
  },
  {
    id: '2',
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    timeToTake: ['08:00', '20:00'],
    prescribedBy: 'Dr. Johnson',
    startDate: new Date(),
    instructions: 'Take with meals'
  },
  {
    id: '3',
    name: 'Vitamin D3',
    dosage: '2000 IU',
    frequency: 'Once daily',
    timeToTake: ['08:00'],
    prescribedBy: 'Dr. Smith',
    startDate: new Date()
  }
];

export function MedicationReminders() {
  const [medications] = useState<Medication[]>(mockMedications);
  const [takenToday, setTakenToday] = useState<Set<string>>(new Set());

  const toggleTaken = (medId: string) => {
    setTakenToday(prev => {
      const newSet = new Set(prev);
      if (newSet.has(medId)) {
        newSet.delete(medId);
      } else {
        newSet.add(medId);
      }
      return newSet;
    });
  };

  const getNextDose = (times: string[]) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const time of times) {
      const [hours, minutes] = time.split(':').map(Number);
      const doseTime = hours * 60 + minutes;
      if (doseTime > currentTime) {
        return time;
      }
    }
    return times[0]; // Next day's first dose
  };

  return (
    <Card>
      <CardHeader 
        title="Medication Reminders" 
        subtitle="Stay on track with your prescriptions"
        action={
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        }
      />
      <CardContent>
        <div className="space-y-4">
          {medications.map((medication) => {
            const isTaken = takenToday.has(medication.id);
            const nextDose = getNextDose(medication.timeToTake);
            
            return (
              <div key={medication.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isTaken 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                }`}>
                  {isTaken ? <Check className="w-6 h-6" /> : <Pill className="w-6 h-6" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{medication.name}</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{medication.dosage}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{medication.frequency}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Next: {nextDose}</span>
                  </div>
                  {medication.instructions && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-amber-600 dark:text-amber-400">{medication.instructions}</span>
                    </div>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant={isTaken ? 'ghost' : 'primary'}
                  onClick={() => toggleTaken(medication.id)}
                >
                  {isTaken ? 'Taken' : 'Mark Taken'}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}