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
  endDate: string;
  totalDoses: number;
  instructions: string;
}

export function MedicationReminders() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [dosesTaken, setDosesTaken] = useState<Record<string, number>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [formData, setFormData] = useState<AddMedicationForm>({
    name: '',
    dosage: '',
    frequency: '',
    prescribedBy: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    totalDoses: 0,
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
      // Calculate total doses automatically
      const totalDoses = calculateTotalDoses(formData.frequency, formData.startDate, formData.endDate);
      
      const response = await fetch('http://localhost:8000/api/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          totalDoses
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
        }
      }
    } catch (error) {
      console.error('Error deleting medication:', error);
    }
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
            <>
              {/* Active Medications */}
              {activeMedications.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Active Medications</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{activeMedications.length} active</span>
                  </div>
                  {activeMedications.map((medication) => {
                    const remainingDoses = getRemainingDoses(medication);
                    
                    return (
                      <div key={medication.id} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                            <Pill className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{medication.name}</h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{medication.dosage}</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{medication.frequency}</p>
                            
                            {/* Dose Progress */}
                            {medication.totalDoses && (
                              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                                {/* Remaining Doses - Prominently Displayed */}
                                <div className="text-center mb-2">
                                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {remainingDoses}
                                  </div>
                                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    Doses Left
                                  </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600 dark:text-gray-400">Taken: {dosesTaken[medication.id] || 0}</span>
                                    <span className="text-gray-600 dark:text-gray-400">Total: {medication.totalDoses}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div 
                                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${medication.totalDoses ? ((dosesTaken[medication.id] || 0) / medication.totalDoses) * 100 : 0}%` 
                                      }}
                                    ></div>
                                  </div>
                                </div>
                                
                                {/* Status Indicators */}
                                <div className="flex justify-center mt-2">
                                  {remainingDoses === 0 ? (
                                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full font-medium">
                                      <Check className="w-3 h-3" />
                                      Course Complete! 🎉
                                    </div>
                                  ) : remainingDoses <= 3 ? (
                                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full font-medium">
                                      <AlertCircle className="w-3 h-3" />
                                      Running Low - {remainingDoses} doses left
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            )}
                            
                            {medication.instructions && (
                              <div className="flex items-center gap-1 mb-2">
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                <span className="text-xs text-amber-600 dark:text-gray-400">{medication.instructions}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {/* Dose Tracking Buttons */}
                            {medication.totalDoses && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markDoseTaken(medication.id)}
                                  disabled={remainingDoses === 0}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 font-medium text-xs px-2 py-1"
                                >
                                  ✅ Take Dose
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markDoseUntaken(medication.id)}
                                  disabled={(dosesTaken[medication.id] || 0) === 0}
                                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 font-medium text-xs px-2 py-1"
                                >
                                  ↩️ Undo Dose
                                </Button>
                              </>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMedication(medication.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 px-2 py-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Completed Medications */}
              {completedMedications.length > 0 && (
                <div className="space-y-3 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Completed Courses</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs"
                    >
                      {showCompleted ? 'Hide' : 'Show'} ({completedMedications.length})
                    </Button>
                  </div>
                  {showCompleted && (
                    <div className="space-y-2">
                      {completedMedications.map((medication) => (
                        <div key={medication.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-100 dark:border-green-800 transition-colors duration-200">
                          <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{medication.name}</h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{medication.dosage}</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300">{medication.frequency}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                Course Completed! 🎉
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMedication(medication.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 px-2 py-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
                  disabled={!formData.name || !formData.dosage || !formData.frequency || !formData.prescribedBy || !formData.endDate}
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