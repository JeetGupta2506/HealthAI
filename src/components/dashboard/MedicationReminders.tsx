import { useState, useEffect } from 'react';
import { Pill, Clock, Plus, Check, AlertCircle, X, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Medication } from '../../types/health';

interface AddMedicationForm {
  name: string;
  dosage: string;
  frequency: string;
  timeToTake: string[];
  prescribedBy: string;
  startDate: string;
  instructions: string;
}

export function MedicationReminders() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [takenToday, setTakenToday] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<AddMedicationForm>({
    name: '',
    dosage: '',
    frequency: '',
    timeToTake: [''],
    prescribedBy: '',
    startDate: new Date().toISOString().split('T')[0],
    instructions: ''
  });

  // Fetch medications on component mount
  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/medications');
      if (response.ok) {
        const data = await response.json();
        setMedications(data.medications || []);
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMedication = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          timeToTake: formData.timeToTake.filter(time => time.trim() !== '')
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMedications(prev => [...prev, data.medication]);
          setShowAddForm(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error adding medication:', error);
    }
  };

  const deleteMedication = async (medId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/medications/${medId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMedications(prev => prev.filter(med => med.id !== medId));
          // Also remove from takenToday if it was there
          setTakenToday(prev => {
            const newSet = new Set(prev);
            newSet.delete(medId);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error('Error deleting medication:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      frequency: '',
      timeToTake: [''],
      prescribedBy: '',
      startDate: new Date().toISOString().split('T')[0],
      instructions: ''
    });
  };

  const addTimeField = () => {
    setFormData(prev => ({
      ...prev,
      timeToTake: [...prev.timeToTake, '']
    }));
  };

  const removeTimeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      timeToTake: prev.timeToTake.filter((_, i) => i !== index)
    }));
  };

  const updateTimeField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      timeToTake: prev.timeToTake.map((time, i) => i === index ? value : time)
    }));
  };

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

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Loading medications...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader 
          title="Medication Reminders" 
          subtitle="Stay on track with your prescriptions"
          action={
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          }
        />
        <CardContent>
          {medications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No medications added yet. Click "Add" to get started.
            </div>
          ) : (
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
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isTaken ? 'ghost' : 'primary'}
                        onClick={() => toggleTaken(medication.id)}
                      >
                        {isTaken ? 'Taken' : 'Mark Taken'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMedication(medication.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Medication Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Add New Medication</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medication Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Lisinopril"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dosage *
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 10mg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select frequency</option>
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Every 4 hours">Every 4 hours</option>
                  <option value="Every 6 hours">Every 6 hours</option>
                  <option value="Every 8 hours">Every 8 hours</option>
                  <option value="Every 12 hours">Every 12 hours</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Times to Take *
                </label>
                {formData.timeToTake.map((time, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateTimeField(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {formData.timeToTake.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeField(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimeField}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Time
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prescribed By *
                </label>
                <input
                  type="text"
                  value={formData.prescribedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, prescribedBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Dr. Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instructions (Optional)
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Take with food"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addMedication}
                  disabled={!formData.name || !formData.dosage || !formData.frequency || !formData.prescribedBy || formData.timeToTake.some(t => !t.trim())}
                  className="flex-1"
                >
                  Add Medication
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}