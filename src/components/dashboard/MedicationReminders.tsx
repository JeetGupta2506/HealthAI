import { useState, useEffect, useCallback } from 'react';
import { Pill, Plus, Check, AlertCircle, X, Trash2 } from 'lucide-react';

import { Button } from '../ui/Button';
import { Medication } from '../../types/health';

interface AddMedicationForm {
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  instructions: string;
  dosesAlreadyTaken: number;
}

export function MedicationReminders() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [takenToday, setTakenToday] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [formData, setFormData] = useState<AddMedicationForm>({
    name: '',
    dosage: '',
    frequency: '',
    prescribedBy: '',
    startDate: new Date().toISOString().split('T')[0],
    instructions: ''
  });

  // Load doses taken from localStorage on component mount
  useEffect(() => {
    const savedDoses = localStorage.getItem('medicationDosesTaken');
    if (savedDoses) {
      try {
        const parsedDoses = JSON.parse(savedDoses);
        setDosesTaken(parsedDoses);
        console.log('Loaded doses from localStorage:', parsedDoses);
      } catch (error) {
        console.error('Error parsing saved doses:', error);
      }
    }
  }, []);

  // Save doses taken to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(dosesTaken).length > 0) {
      localStorage.setItem('medicationDosesTaken', JSON.stringify(dosesTaken));
      console.log('Saved doses to localStorage:', dosesTaken);
    }
  }, [dosesTaken]);

  // Fetch medications on component mount
  useEffect(() => {
    fetchMedications();
  }, []);

  // Check and reset taken status for all medications every minute
  useEffect(() => {
    const interval = setInterval(() => {
      medications.forEach(medication => {
        checkAndResetTakenStatus(medication);
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [medications]);

  // Check taken status when medications are loaded
  useEffect(() => {
    if (medications.length > 0) {
      medications.forEach(medication => {
        checkAndResetTakenStatus(medication);
      });
    }
  }, [medications]);

  // Note: Daily reset is now handled by the backend - each date has its own tracking data

  const fetchMedications = async () => {
    try {
      const [medicationsResponse, dosesResponse] = await Promise.all([
        fetch('http://localhost:8000/api/medications'),
        fetch('http://localhost:8000/api/doses-taken')
      ]);

      if (medicationsResponse.ok) {
        const medicationsData = await medicationsResponse.json();
        setMedications(medicationsData.medications || []);
      }

      if (dosesResponse.ok) {
        const dosesData = await dosesResponse.json();
        const today = new Date().toISOString().split('T')[0];
        const todayDoses = dosesData.doses_taken[today] || {};
        
        // Convert to Map format for dosesTakenToday
        const dosesMap = new Map();
        for (const [medId, doseInfo] of Object.entries(todayDoses)) {
          dosesMap.set(medId, (doseInfo as any).count);
        }
        setDosesTakenToday(dosesMap);
        
        // Also set takenToday based on current doses
        const takenSet = new Set<string>();
        for (const [medId, count] of dosesMap.entries()) {
          if (count > 0) {
            takenSet.add(medId);
          }
        }
        setTakenToday(takenSet);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      frequency: '',
      prescribedBy: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      totalDoses: 0,
      instructions: ''
    });
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

      console.log('Response status:', response.status);

             if (response.ok) {
         const data = await response.json();
         console.log('Response data:', data);
         if (data.success) {
           const newMedication = data.medication;
           setMedications(prev => [...prev, newMedication]);
           
                       // If user indicated they've already taken doses today, mark them as taken
            if (formData.dosesAlreadyTaken > 0) {
              setTakenToday(prev => {
                const newSet = new Set(prev);
                // Mark the medication as taken for the number of doses already taken
                for (let i = 0; i < formData.dosesAlreadyTaken; i++) {
                  newSet.add(newMedication.id);
                }
                return newSet;
              });
              
              // Also track the count of doses already taken
              setDosesTakenToday(prev => {
                const newMap = new Map(prev);
                newMap.set(newMedication.id, formData.dosesAlreadyTaken);
                return newMap;
              });

              // Save to backend
              try {
                const today = new Date().toISOString().split('T')[0];
                await fetch('http://localhost:8000/api/doses-taken', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    medicationId: newMedication.id,
                    date: today,
                    count: formData.dosesAlreadyTaken
                  }),
                });
              } catch (error) {
                console.error('Failed to save initial doses taken to backend:', error);
              }
            }
           
           setShowAddForm(false);
           resetForm();
           console.log('Medication added successfully!');
         } else {
           console.error('Backend error:', data.message || 'Unknown error');
         }
       } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('HTTP error:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error adding medication:', error);
    }
  };

  // Calculate total doses based on frequency and duration
  const calculateTotalDoses = (frequency: string, startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Add 1 to include both start and end dates
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const frequencyMap: Record<string, number> = {
      'Once daily': 1,
      'Twice daily': 2,
      'Three times daily': 3,
      'Every 4 hours': 6,
      'Every 6 hours': 4,
      'Every 8 hours': 3,
      'Every 12 hours': 2,
      'As needed': 1
    };
    
    return daysDiff * (frequencyMap[frequency] || 1);
  };

  // Calculate remaining doses
  const getRemainingDoses = useCallback((medication: Medication): number => {
    const total = medication.totalDoses || 0;
    const taken = dosesTaken[medication.id] || 0;
    return Math.max(0, total - taken);
  }, [dosesTaken]);

  // Filter active and completed medications
  const activeMedications = medications.filter(med => getRemainingDoses(med) > 0);
  const completedMedications = medications.filter(med => getRemainingDoses(med) === 0);

  // Mark dose as taken
  const markDoseTaken = useCallback((medicationId: string) => {
    setDosesTaken(prev => {
      const newDoses = {
        ...prev,
        [medicationId]: (prev[medicationId] || 0) + 1
      };
      // Immediately save to localStorage
      localStorage.setItem('medicationDosesTaken', JSON.stringify(newDoses));
      console.log('Dose taken, new state:', newDoses);
      return newDoses;
    });
  }, []);

  // Mark dose as untaken (undo)
  const markDoseUntaken = useCallback((medicationId: string) => {
    setDosesTaken(prev => {
      const newDoses = {
        ...prev,
        [medicationId]: Math.max(0, (prev[medicationId] || 0) - 1)
      };
      // Immediately save to localStorage
      localStorage.setItem('medicationDosesTaken', JSON.stringify(newDoses));
      console.log('Dose undone, new state:', newDoses);
      return newDoses;
    });
  }, []);

  const deleteMedication = async (medId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/medications/${medId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMedications(prev => prev.filter(med => med.id !== medId));
          // Also remove from dosesTaken
          setDosesTaken(prev => {
            const newDoses = { ...prev };
            delete newDoses[medId];
            // Immediately save to localStorage
            localStorage.setItem('medicationDosesTaken', JSON.stringify(newDoses));
            return newDoses;
          });
          
          // Also remove from dosesTakenToday
          setDosesTakenToday(prev => {
            const newMap = new Map(prev);
            newMap.delete(medId);
            return newMap;
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
      <div className="h-full bg-white dark:bg-gray-800 flex items-center justify-center rounded-lg">
        <div className="text-gray-500">Loading medications...</div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full bg-white dark:bg-gray-800">
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Medication Reminders</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Stay on track with your prescriptions</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          {/* Medication Summary */}
          {medications.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-100 dark:border-blue-800 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {activeMedications.length}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Active Medications</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {completedMedications.length}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">Completed Courses</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {activeMedications.filter(med => getRemainingDoses(med) <= 3).length}
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400">Running Low</div>
              </div>
            </div>
          )}
          
          {/* Active Medications */}
          {activeMedications.length === 0 && completedMedications.length === 0 ? (
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
                  placeholder="e.g., 10mg, 10ml, etc."
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
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  min={formData.startDate}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Doses (Auto-calculated)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.endDate ? calculateTotalDoses(formData.frequency, formData.startDate, formData.endDate) : 0}
                    disabled
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    doses
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Based on frequency and duration
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  min={formData.startDate}
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

               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   Doses Already Taken Today
                 </label>
                 <input
                   type="number"
                   min="0"
                   max="10"
                   value={formData.dosesAlreadyTaken}
                   onChange={(e) => setFormData(prev => ({ ...prev, dosesAlreadyTaken: parseInt(e.target.value) || 0 }))}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                   placeholder="0"
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   If you've already taken some doses today, enter the count here
                 </p>
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