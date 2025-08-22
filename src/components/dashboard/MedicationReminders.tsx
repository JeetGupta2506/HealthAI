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
  endDate: string;
  instructions: string;
  dosesAlreadyTaken: number;
}

export function MedicationReminders() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [takenToday, setTakenToday] = useState<Set<string>>(new Set());
  // Track total doses taken today for each medication (not just if it's marked as taken)
  const [dosesTakenToday, setDosesTakenToday] = useState<Map<string, number>>(new Map());
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<AddMedicationForm>({
    name: '',
    dosage: '',
    frequency: '',
    timeToTake: [''],
    prescribedBy: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    instructions: '',
    dosesAlreadyTaken: 0
  });

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

  const addMedication = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.dosage || !formData.frequency || !formData.prescribedBy) {
        console.error('Missing required fields');
        return;
      }

      // Filter out empty time fields
      const validTimes = formData.timeToTake.filter(time => time.trim() !== '');
      if (validTimes.length === 0) {
        console.error('At least one time must be specified');
        return;
      }

      const medicationData = {
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        timeToTake: validTimes,
        prescribedBy: formData.prescribedBy,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        instructions: formData.instructions || undefined
      };

      console.log('Sending medication data:', medicationData);

      const response = await fetch('http://localhost:8000/api/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(medicationData),
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
      endDate: '',
      instructions: '',
      dosesAlreadyTaken: 0
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

  const toggleTaken = async (medId: string) => {
    try {
      const newTakenToday = new Set(takenToday);
      const currentCount = dosesTakenToday.get(medId) || 0;
      let newCount = currentCount;

      if (takenToday.has(medId)) {
        // If it was marked as taken, decrease the count
        newTakenToday.delete(medId);
        newCount = Math.max(0, currentCount - 1);
      } else {
        // If it's being marked as taken, increase the count
        newTakenToday.add(medId);
        newCount = currentCount + 1;
      }

      // Update local state immediately
      setTakenToday(newTakenToday);
      setDosesTakenToday(prev => {
        const newMap = new Map(prev);
        newMap.set(medId, newCount);
        return newMap;
      });

      // Save to backend
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch('http://localhost:8000/api/doses-taken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicationId: medId,
          date: today,
          count: newCount
        }),
      });

      if (!response.ok) {
        console.error('Failed to save dose tracking to backend');
        // Revert local state if backend save failed
        setTakenToday(takenToday);
        setDosesTakenToday(prev => {
          const newMap = new Map(prev);
          newMap.set(medId, currentCount);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Error updating dose tracking:', error);
      // Revert local state on error
      setTakenToday(takenToday);
      setDosesTakenToday(prev => {
        const newMap = new Map(prev);
        newMap.set(medId, dosesTakenToday.get(medId) || 0);
        return newMap;
      });
    }
  };

  // Check if it's time for the next dose and reset taken status if needed
  const checkAndResetTakenStatus = (medication: Medication) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Find the next dose time
    let nextDoseTime = null;
    for (const time of medication.timeToTake) {
      if (time.trim()) {
        const [hours, minutes] = time.split(':').map(Number);
        const doseTime = hours * 60 + minutes;
        if (doseTime > currentTime) {
          nextDoseTime = doseTime;
          break;
        }
      }
    }
    
    // Only reset taken status if:
    // 1. We found a next dose time
    // 2. It's within 120 minutes (2 hours) of the next dose time
    // 3. The medication is currently marked as taken
    // 4. AND the user hasn't already taken the dose for this specific time
    if (nextDoseTime && (nextDoseTime - currentTime) <= 120 && takenToday.has(medication.id)) {
      // Check if this is actually the next dose the user needs to take
      const today = new Date();
      const start = new Date(medication.startDate);
      
      // Reset time to start of day for accurate calculation
      start.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      // Only reset if medication has started
      if (today >= start) {
        // Check if the user has already taken the dose for the next dose time
        // by looking at how many doses they've taken vs. how many they should have taken by now
        
        const actualDosesTaken = dosesTakenToday.get(medication.id) || 0;
        let expectedDosesByNow = 0;
        
        for (const time of medication.timeToTake) {
          if (time.trim()) {
            const [hours, minutes] = time.split(':').map(Number);
            const doseTime = hours * 60 + minutes;
            if (doseTime <= currentTime) {
              expectedDosesByNow++;
            }
          }
        }
        
        // Only reset if the user hasn't taken enough doses to cover what should have been taken by now
        // AND they haven't taken the dose for the next scheduled time
        if (actualDosesTaken < expectedDosesByNow) {
          setTakenToday(prev => {
            const newSet = new Set(prev);
            newSet.delete(medication.id);
            return newSet;
          });
        }
      }
    }
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

  const getRemainingDays = (startDate: Date, frequency: string, timeToTake: string[], endDate?: Date) => {
    if (!endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    // Reset time to start of day for accurate calculation
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    // If medication hasn't started yet
    if (today < start) {
      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    
    // If medication has ended
    if (today > end) {
      return 0;
    }
    
    // Calculate total days of the medication course
    const totalCourseDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate days elapsed since start
    const daysElapsed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate remaining days
    const remainingDays = totalCourseDays - daysElapsed;
    
    return Math.max(0, remainingDays);
  };

  const getRemainingDoses = (startDate: Date, endDate: Date, frequency: string, timeToTake: string[], medicationId: string) => {
    if (!endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    // Reset time to start of day for accurate calculation
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    // If medication hasn't started yet
    if (today < start) {
      return null;
    }
    
    // If medication has ended
    if (today > end) {
      return 0;
    }
    
    // Calculate total days of the medication course
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate doses per day based on frequency and times
    let dosesPerDay = 1; // Default
    
    if (frequency.includes('daily')) {
      if (frequency.includes('Once')) {
        dosesPerDay = 1;
      } else if (frequency.includes('Twice')) {
        dosesPerDay = 2;
      } else if (frequency.includes('Three times')) {
        dosesPerDay = 3;
      }
    } else if (frequency.includes('Every')) {
      const hours = parseInt(frequency.match(/\d+/)?.[0] || '24');
      dosesPerDay = Math.ceil(24 / hours);
    } else if (frequency === 'As needed') {
      dosesPerDay = 1; // Default for as needed
    }
    
    // Use the actual number of times specified if available
    if (timeToTake && timeToTake.length > 0) {
      dosesPerDay = timeToTake.length;
    }
    
    // Calculate total doses in the course
    const totalDoses = totalDays * dosesPerDay;
    
    // Calculate doses that should have been taken so far
    const daysElapsed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    let expectedDoses = 0;
    
    if (daysElapsed > 0) {
      // For completed days, count all doses
      expectedDoses = (daysElapsed - 1) * dosesPerDay;
      
      // For today, count doses that should have been taken by now
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      let todayDoses = 0;
      for (const time of timeToTake) {
        if (time.trim()) {
          const [hours, minutes] = time.split(':').map(Number);
          const doseTime = hours * 60 + minutes;
          if (doseTime <= currentTime) {
            todayDoses++;
          }
        }
      }
      
      expectedDoses += todayDoses;
    }
    
    // Calculate remaining doses based on expected doses
    let remainingDoses = Math.max(0, totalDoses - expectedDoses);
    
    // Subtract the actual doses taken today (this is the key fix!)
    const actualDosesTakenToday = dosesTakenToday.get(medicationId) || 0;
    remainingDoses = Math.max(0, remainingDoses - actualDosesTakenToday);
    
    return remainingDoses;
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
                                 const remainingDays = getRemainingDays(medication.startDate, medication.frequency, medication.timeToTake, medication.endDate);
                 const remainingDoses = medication.endDate ? getRemainingDoses(medication.startDate, medication.endDate, medication.frequency, medication.timeToTake, medication.id) : null;
                 
                                   // Debug logging for dose calculation
                  if (medication.endDate && remainingDoses !== null) {
                    const start = new Date(medication.startDate);
                    const end = new Date(medication.endDate);
                    const today = new Date();
                    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    const dosesPerDay = medication.timeToTake.length;
                    const totalDoses = totalDays * dosesPerDay;
                    
                    // Calculate expected doses for debugging
                    const daysElapsed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    const now = new Date();
                    const currentTime = now.getHours() * 60 + now.getMinutes();
                    
                    let todayDoses = 0;
                    for (const time of medication.timeToTake) {
                      if (time.trim()) {
                        const [hours, minutes] = time.split(':').map(Number);
                        const doseTime = hours * 60 + minutes;
                        if (doseTime <= currentTime) {
                          todayDoses++;
                        }
                      }
                    }
                    
                    const expectedDoses = (daysElapsed - 1) * dosesPerDay + todayDoses;
                    const isTaken = takenToday.has(medication.id);
                    
                    console.log(`Medication: ${medication.name}`, {
                      totalDays,
                      dosesPerDay,
                      totalDoses,
                      daysElapsed,
                      todayDoses,
                      expectedDoses,
                      isTaken,
                      remainingDoses,
                      frequency: medication.frequency,
                      times: medication.timeToTake,
                      currentTime: `${Math.floor(currentTime/60)}:${(currentTime%60).toString().padStart(2,'0')}`
                    });
                  }
                
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
                                             {remainingDoses !== null && (
                         <div className="flex items-center gap-1 mt-1">
                           <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                             {remainingDoses === 0 ? 'Completed' : `${remainingDoses} dose${remainingDoses === 1 ? '' : 's'} remaining`}
                           </span>
                         </div>
                       )}
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
                  onClick={() => {
                    console.log('Form data before submission:', formData);
                    addMedication();
                  }}
                  disabled={
                    !formData.name || 
                    !formData.dosage || 
                    !formData.frequency || 
                    !formData.prescribedBy || 
                    formData.timeToTake.some(t => !t.trim()) ||
                    (formData.endDate !== '' && formData.endDate <= formData.startDate)
                  }
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