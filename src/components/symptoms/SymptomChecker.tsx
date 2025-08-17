import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface Symptom {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  bodyPart: string;
}

const commonSymptoms = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea', 'Chest Pain',
  'Shortness of Breath', 'Dizziness', 'Back Pain', 'Sore Throat'
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
      case 'mild': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'severe': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredSymptoms = commonSymptoms.filter(symptom =>
    symptom.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedSymptoms.find(s => s.name === symptom)
  );

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
      setCurrentStep('assessment');
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (currentStep === 'assessment') {
    return (
      <Card>
        <CardHeader title="Health Assessment Results" subtitle="AI-powered analysis of your symptoms" />
        <CardContent className="space-y-6">
          {loading && <div className="text-blue-600">Loading assessment...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {assessment && (
            <>
              {/* Risk Level */}
              <div className={`p-4 rounded-lg border-2 ${getRiskColor(assessment.riskLevel)}`}>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6" />
                  <div>
                    <h3 className="font-semibold capitalize">Risk Level: {assessment.riskLevel}</h3>
                    <p className="text-sm opacity-80">Based on your reported symptoms</p>
                  </div>
                </div>
              </div>
              {/* Possible Conditions */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Possible Conditions</h3>
                <div className="space-y-3">
                  {assessment.conditions && assessment.conditions.length > 0 ? assessment.conditions.map((condition: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{condition.name}</p>
                        {condition.probability && <p className="text-sm text-gray-600">{condition.probability}% match</p>}
                      </div>
                      {condition.urgent && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Urgent</span>
                        </div>
                      )}
                    </div>
                  )) : <div className="text-gray-500">No conditions found.</div>}
                </div>
              </div>
              {/* Recommendations */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {assessment.recommendations && assessment.recommendations.length > 0 ? assessment.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{rec}</p>
                    </div>
                  )) : <div className="text-gray-500">No recommendations found.</div>}
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="AI Symptom Checker" 
        subtitle="Get AI-powered health assessments based on your symptoms"
      />
      <CardContent className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className={`flex items-center gap-2 ${currentStep === 'symptoms' ? 'text-blue-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'symptoms' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {currentStep === 'symptoms' ? '1' : <CheckCircle className="w-5 h-5" />}
            </div>
            <span className="font-medium">Select Symptoms</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${currentStep === 'details' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'details' ? 'bg-blue-600 text-white' : 'border-2 border-gray-300 text-gray-400'
            }`}>
              2
            </div>
            <span className="font-medium">Add Details</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center gap-2 text-gray-400`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-300 text-gray-400">
              3
            </div>
            <span className="font-medium">Get Assessment</span>
          </div>
        </div>

        {currentStep === 'symptoms' && (
          <>
            {/* Symptom Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search and select your symptoms
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type a symptom..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Symptom Suggestions */}
              {searchTerm && filteredSymptoms.length > 0 && (
                <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredSymptoms.map((symptom) => (
                    <button
                      key={symptom}
                      onClick={() => addSymptom(symptom)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Common Symptoms */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Common symptoms:</p>
              <div className="flex flex-wrap gap-2">
                {commonSymptoms.filter(s => !selectedSymptoms.find(sel => sel.name === s)).map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => addSymptom(symptom)}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-full transition-all duration-200"
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Symptoms */}
            {selectedSymptoms.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Selected symptoms:</p>
                <div className="space-y-2">
                  {selectedSymptoms.map((symptom) => (
                    <div key={symptom.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="font-medium flex-1">{symptom.name}</span>
                      <button
                        onClick={() => removeSymptom(symptom.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
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
            <h3 className="font-semibold text-gray-800">Provide more details about your symptoms</h3>
            
            {selectedSymptoms.map((symptom) => (
              <div key={symptom.id} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">{symptom.name}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity
                    </label>
                    <select
                      value={symptom.severity}
                      onChange={(e) => updateSymptom(symptom.id, { severity: e.target.value as 'mild' | 'moderate' | 'severe' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body Part
                    </label>
                    <select
                      value={symptom.bodyPart}
                      onChange={(e) => updateSymptom(symptom.id, { bodyPart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {error && <div className="text-red-600 mt-2">{error}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}