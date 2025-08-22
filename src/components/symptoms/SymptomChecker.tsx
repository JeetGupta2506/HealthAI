import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';

import { Button } from '../ui/Button';
import { useHealth } from '../../contexts/HealthContext';

interface Symptom {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  bodyPart: string;
}

// Common symptoms that show as buttons on the page
const commonSymptoms = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea', 'Chest Pain',
  'Shortness of Breath', 'Dizziness', 'Back Pain', 'Sore Throat'
];

// Extended symptoms for the dropdown search (not shown as buttons)
const extendedSymptoms = [
  // General Symptoms
  'Weakness', 'Chills', 'Sweating', 'Loss of Appetite', 'Weight Loss', 'Weight Gain', 
  'Insomnia', 'Excessive Sleepiness', 'Night Sweats', 'Fever with Chills',
  
  // Respiratory Symptoms
  'Runny Nose', 'Congestion', 'Wheezing', 'Difficulty Breathing', 'Chest Tightness', 
  'Hoarseness', 'Sinus Pain', 'Post-nasal Drip', 'Sneezing', 'Sore Throat',
  
  // Cardiovascular Symptoms
  'Heart Palpitations', 'Irregular Heartbeat', 'High Blood Pressure', 'Low Blood Pressure',
  'Chest Discomfort', 'Pain Radiating to Arm', 'Swelling in Legs', 'Cold Hands/Feet',
  'Rapid Heartbeat', 'Slow Heartbeat',
  
  // Gastrointestinal Symptoms
  'Abdominal Pain', 'Stomach Cramps', 'Diarrhea', 'Constipation', 'Bloating', 'Gas',
  'Acid Reflux', 'Heartburn', 'Vomiting', 'Food Intolerance', 'Indigestion',
  'Loss of Appetite', 'Increased Appetite', 'Stomach Upset',
  
  // Musculoskeletal Symptoms
  'Neck Pain', 'Joint Pain', 'Muscle Aches', 'Stiffness', 'Swelling',
  'Limited Range of Motion', 'Muscle Weakness', 'Cramps', 'Tremors', 'Joint Stiffness',
  'Muscle Spasms', 'Tenderness', 'Bone Pain',
  
  // Neurological Symptoms
  'Memory Problems', 'Confusion', 'Difficulty Concentrating', 'Anxiety', 'Depression',
  'Mood Changes', 'Irritability', 'Numbness', 'Tingling', 'Vision Problems',
  'Brain Fog', 'Difficulty Speaking', 'Coordination Problems', 'Balance Issues',
  
  // Skin Symptoms
  'Rash', 'Itching', 'Dry Skin', 'Acne', 'Hives', 'Bruising',
  'Skin Discoloration', 'Hair Loss', 'Nail Changes', 'Skin Lesions',
  'Warmth in Skin', 'Skin Tightness', 'Scarring',
  
  // Urinary Symptoms
  'Frequent Urination', 'Painful Urination', 'Blood in Urine', 'Incontinence',
  'Difficulty Urinating', 'Cloudy Urine', 'Urgency', 'Nocturia',
  
  // Reproductive Symptoms
  'Irregular Periods', 'Heavy Bleeding', 'Painful Periods', 'Breast Pain',
  'Erectile Dysfunction', 'Low Libido', 'Menstrual Cramps', 'Breast Tenderness',
  
  // Eye Symptoms
  'Blurred Vision', 'Eye Pain', 'Redness', 'Dry Eyes', 'Watery Eyes',
  'Sensitivity to Light', 'Floaters', 'Double Vision', 'Eye Pressure',
  'Eye Discharge', 'Eyelid Swelling',
  
  // Ear Symptoms
  'Ear Pain', 'Hearing Loss', 'Ringing in Ears', 'Ear Pressure', 'Ear Discharge',
  'Ear Fullness', 'Tinnitus', 'Vertigo',
  
  // Dental Symptoms
     'Tooth Pain', 'Gum Pain', 'Mouth Sores', 'Bad Breath', 'Difficulty Chewing',
   'Jaw Pain', 'Temporomandibular Joint Pain', 'Gum Bleeding', 'Tooth Sensitivity','Blackout'
 ];

const mockAssessment = {
  riskLevel: 'moderate',
  conditions: [
    { name: 'Common Cold', probability: 75, urgent: false },
    { name: 'Viral Infection', probability: 60, urgent: false },
    { name: 'Stress-related symptoms', probability: 45, urgent: false }
  ],
  recommendations: [
    'Monitor symptoms for 24-48 hours',
    'Stay hydrated and get adequate rest',
    'Consider telehealth consultation if symptoms worsen',
    'Seek immediate care if you experience severe chest pain or difficulty breathing'
  ]
};

export function SymptomChecker() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState<'symptoms' | 'details' | 'assessment'>('symptoms');
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSymptom = (symptomName: string) => {
    const newSymptom: Symptom = {
      id: Date.now().toString(),
      name: symptomName,
      severity: 'mild',
      bodyPart: 'general'
    };
    setSelectedSymptoms(prev => [...prev, newSymptom]);
    setSearchTerm('');
  };

  const removeSymptom = (id: string) => {
    setSelectedSymptoms(prev => prev.filter(s => s.id !== id));
  };

  const updateSymptom = (id: string, updates: Partial<Symptom>) => {
    setSelectedSymptoms(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-gray-800 dark:border-gray-700 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-gray-800 dark:border-gray-700 border-yellow-200';
      case 'severe': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-gray-800 dark:border-gray-700 border-red-200';
      default: return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-gray-800';
      case 'moderate': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-gray-800';
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-gray-800';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  const filteredSymptoms = [...commonSymptoms, ...extendedSymptoms].filter(symptom =>
    symptom.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedSymptoms.find(s => s.name === symptom)
  );

  const { incrementSymptomChecks } = useHealth();

  const getAIAssessment = async () => {
    setLoading(true);
    setError(null);
    setAssessment(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/assess-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: selectedSymptoms.map(({ name, severity, bodyPart }) => ({ name, severity, bodyPart }))
        })
      });
      if (!response.ok) throw new Error('Failed to get assessment');
      const data = await response.json();
      setAssessment(data);
      incrementSymptomChecks(); // Increment the symptom check count
      setCurrentStep('assessment');
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (currentStep === 'assessment') {
    return (
      <div className="h-full bg-white dark:bg-gray-800">
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Health Assessment Results</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">AI-powered analysis of your symptoms</p>
        </div>
        <div className="p-6 space-y-6">
          {loading && <div className="text-gray-600">Loading assessment...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {assessment && (
            <>
              {/* Risk Level */}
                              <div className={`p-4 rounded-lg border-2 ${getPriorityColor(assessment.riskLevel)} border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-current" />
                  <div>
                    <h3 className="font-semibold capitalize text-gray-800 dark:text-white">Risk Level: {assessment.riskLevel}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Based on your reported symptoms</p>
                  </div>
                </div>
              </div>
              {/* Possible Conditions */}
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Possible Conditions</h3>
                <div className="space-y-3">
                  {assessment.conditions && assessment.conditions.length > 0 ? assessment.conditions.map((condition: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{condition.name}</p>
                        {condition.probability && <p className="text-sm text-gray-600 dark:text-gray-400">{condition.probability}% match</p>}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(condition.risk)}`}>
                        {condition.risk}
                      </span>
                    </div>
                  )) : <div className="text-gray-500 dark:text-gray-400">No conditions found.</div>}
                </div>
              </div>
              {/* Recommendations */}
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {assessment.recommendations && assessment.recommendations.length > 0 ? assessment.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-800 dark:text-white">{rec}</p>
                    </div>
                  )) : <div className="text-gray-500 dark:text-gray-400">No recommendations found.</div>}
                </div>
              </div>
            </>
          )}
          <div className="flex gap-3">
            <Button onClick={() => { setCurrentStep('symptoms'); setAssessment(null); }}>
              Check New Symptoms
            </Button>
            <Button variant="outline">
              Save Assessment
            </Button>
            <Button variant="secondary">
              Book Appointment
            </Button>
                  </div>
      </div>
    </div>
  );
}

  return (
    <div className="h-full bg-white dark:bg-gray-800">
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">AI Symptom Checker</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Get AI-powered health assessments based on your symptoms</p>
      </div>
      <div className="p-6 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className={`flex items-center gap-2 ${currentStep === 'symptoms' ? 'text-gray-600 dark:text-gray-400' : 'text-green-600 dark:text-green-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'symptoms' ? 'bg-gray-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {currentStep === 'symptoms' ? '1' : <CheckCircle className="w-5 h-5" />}
            </div>
            <span className="font-medium">Select Symptoms</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <div className={`flex items-center gap-2 ${currentStep === 'details' ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'details' ? 'bg-gray-600 text-white' : 'border-2 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
            }`}>
              2
            </div>
            <span className="font-medium">Add Details</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <div className={`flex items-center gap-2 text-gray-400 dark:text-gray-500`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500">
              3
            </div>
            <span className="font-medium">Get Assessment</span>
          </div>
        </div>

        {currentStep === 'symptoms' && (
          <>
            {/* Symptom Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search and select your symptoms
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type a symptom..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              {/* Symptom Suggestions */}
              {searchTerm && filteredSymptoms.length > 0 && (
                <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredSymptoms.map((symptom) => (
                    <button
                      key={symptom}
                      onClick={() => addSymptom(symptom)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-white"
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Common Symptoms */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Common symptoms:</p>
              <div className="flex flex-wrap gap-2">
                {commonSymptoms.filter(s => !selectedSymptoms.find(sel => sel.name === s)).map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => addSymptom(symptom)}
                    className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-white rounded-full transition-all duration-200 border border-gray-200 dark:border-gray-600 shadow-sm"
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Symptoms */}
            {selectedSymptoms.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Selected symptoms:</p>
                <div className="space-y-2">
                  {selectedSymptoms.map((symptom) => (
                    <div key={symptom.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="font-medium flex-1 text-gray-800 dark:text-white">{symptom.name}</span>
                      <button
                        onClick={() => removeSymptom(symptom.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={() => setCurrentStep('details')} 
                  className="mt-4"
                  disabled={selectedSymptoms.length === 0}
                >
                  Continue to Details
                </Button>
              </div>
            )}
          </>
        )}

        {currentStep === 'details' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">Provide more details about your symptoms</h3>
            
            {selectedSymptoms.map((symptom) => (
              <div key={symptom.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-800 dark:text-white mb-3">{symptom.name}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Severity
                    </label>
                    <select
                      value={symptom.severity}
                      onChange={(e) => updateSymptom(symptom.id, { severity: e.target.value as 'mild' | 'moderate' | 'severe' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Body Part
                    </label>
                    <select
                      value={symptom.bodyPart}
                      onChange={(e) => updateSymptom(symptom.id, { bodyPart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="general">General</option>
                      <option value="head">Head</option>
                      <option value="chest">Chest</option>
                      <option value="abdomen">Abdomen</option>
                      <option value="back">Back</option>
                      <option value="limbs">Limbs</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex gap-3">
              <Button onClick={getAIAssessment} disabled={loading}>
                {loading ? 'Getting Assessment...' : 'Get AI Assessment'}
              </Button>
              <Button variant="ghost" onClick={() => setCurrentStep('symptoms')} disabled={loading}>
                Back
              </Button>
            </div>
            {error && <div className="text-red-600 dark:text-red-400 mt-2">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}