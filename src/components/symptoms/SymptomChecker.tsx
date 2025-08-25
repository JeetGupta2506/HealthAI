import { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';



interface SelectedSymptom {
  name: string;
  severity?: 'mild' | 'moderate' | 'severe';
  bodyPart?: string;
  inputType: 'severity' | 'bodyPart';
}

const commonSymptoms = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea', 'Dizziness', 'Joint Pain', 'Chest Pain'
];

const extendedSymptoms = [
  'Abdominal Pain', 'Back Pain', 'Shortness of Breath', 'Rash', 'Swelling', 'Numbness', 'Tremors', 'Memory Loss',
  'Vision Problems', 'Hearing Loss', 'Difficulty Swallowing', 'Constipation', 'Diarrhea', 'Vomiting', 'Loss of Appetite',
  'Weight Loss', 'Weight Gain', 'Night Sweats', 'Insomnia', 'Anxiety', 'Depression', 'Mood Changes', 'Confusion',
  'Seizures', 'Paralysis', 'Bleeding', 'Bruising', 'Pale Skin', 'Yellow Skin', 'Dark Urine', 'Blood in Stool',
  'Difficulty Urinating', 'Frequent Urination', 'Painful Urination', 'Irregular Heartbeat', 'High Blood Pressure',
  'Low Blood Pressure', 'Diabetes Symptoms', 'Thyroid Problems', 'Allergic Reactions', 'Hives', 'Itching',
  'Hair Loss', 'Nail Changes', 'Mouth Sores', 'Tooth Pain', 'Ear Pain', 'Sinus Pain', 'Sore Throat',
  'Runny Nose', 'Congestion', 'Sneezing', 'Watery Eyes', 'Dry Eyes', 'Blurred Vision', 'Double Vision',
  'Light Sensitivity', 'Eye Pain', 'Eye Redness', 'Eye Discharge', 'Ear Discharge', 'Tinnitus', 'Vertigo',
  'Balance Problems', 'Coordination Issues', 'Muscle Weakness', 'Muscle Spasms', 'Stiffness', 'Tingling',
  'Burning Sensation', 'Cold Sensitivity', 'Heat Sensitivity', 'Sweating', 'Chills', 'Hot Flashes',
  'Menstrual Problems', 'Breast Changes', 'Testicular Pain', 'Erectile Dysfunction', 'Libido Changes',
  'Pregnancy Symptoms', 'Menopause Symptoms', 'Hormonal Changes', 'Acne', 'Eczema', 'Psoriasis',
  'Warts', 'Moles', 'Skin Tags', 'Age Spots', 'Wrinkles', 'Dry Skin', 'Oily Skin', 'Sensitive Skin'
];

// Helper function to determine if symptom needs body part input vs severity
const getSymptomInputType = (symptom: string): 'severity' | 'bodyPart' => {
  const bodyPartSymptoms = [
    'Pain', 'Ache', 'Swelling', 'Numbness', 'Tingling', 'Burning Sensation', 
    'Stiffness', 'Weakness', 'Spasms', 'Tremors', 'Rash', 'Itching',
    'Bruising', 'Bleeding', 'Discharge', 'Sensitivity', 'Cramps',
    'Joint Pain', 'Muscle Pain', 'Back Pain', 'Abdominal Pain', 'Chest Pain'
  ];
  
  // Check if symptom contains any body part related keywords
  const needsBodyPart = bodyPartSymptoms.some(keyword => 
    symptom.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return needsBodyPart ? 'bodyPart' : 'severity';
};

// Body part options for different types of symptoms
const bodyPartOptions = [
  'Head', 'Neck', 'Chest', 'Back', 'Abdomen', 'Arms', 'Hands', 'Legs', 'Feet',
  'Shoulders', 'Joints', 'Muscles', 'Skin', 'Eyes', 'Ears', 'Throat', 'General'
];

export function SymptomChecker() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => {
      const existingIndex = prev.findIndex(s => s.name === symptom);
      if (existingIndex >= 0) {
        // Remove symptom if it already exists
        return prev.filter(s => s.name !== symptom);
      } else {
        // Add symptom with appropriate input type and default values
        const inputType = getSymptomInputType(symptom);
        const newSymptom: SelectedSymptom = {
          name: symptom,
          inputType,
          ...(inputType === 'severity' 
            ? { severity: 'moderate' }
            : { bodyPart: 'General' }
          )
        };
        return [...prev, newSymptom];
      }
    });
  };

  const handleSeverityChange = (symptomName: string, severity: 'mild' | 'moderate' | 'severe') => {
    setSelectedSymptoms(prev => 
      prev.map(s => 
        s.name === symptomName 
          ? { ...s, severity }
          : s
      )
    );
  };

  const handleBodyPartChange = (symptomName: string, bodyPart: string) => {
    setSelectedSymptoms(prev => 
      prev.map(s => 
        s.name === symptomName 
          ? { ...s, bodyPart }
          : s
      )
    );
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredSymptoms = extendedSymptoms.filter(symptom =>
    symptom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const analyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0) return;

    setIsAnalyzing(true);
    try {
      // Format symptoms for the backend using user-selected severity or body part
      const formattedSymptoms = selectedSymptoms.map(symptom => ({
        name: symptom.name,
        severity: symptom.severity || 'moderate', // Default if not specified
        bodyPart: symptom.bodyPart || getBodyPart(symptom.name) // Use user selection or fallback
      }));

      console.log('Sending symptoms to backend:', formattedSymptoms);
      
      const response = await fetch('http://localhost:8000/api/assess-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: formattedSymptoms
        }),
      });
      
      console.log('Backend response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        // Format the analysis response
        const formattedAnalysis = formatAnalysisResponse(data);
        setAnalysis(formattedAnalysis);
      } else {
        // Try to get more specific error information
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            setAnalysis(`Analysis error: ${errorData.detail}`);
          } else {
            setAnalysis('Unable to analyze symptoms at this time. Please try again later.');
          }
        } catch {
          setAnalysis('Unable to analyze symptoms at this time. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Symptom analysis error:', error);
      
      // Check if it's a network error (backend not running)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setAnalysis('🚨 **Backend Service Unavailable**\n\nPlease ensure the server is running and try again. If the problem persists, contact support.');
      } else {
        setAnalysis('❌ **Connection Error**\n\nUnable to connect to the symptom analysis service. Please check your internet connection and try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };



  // Helper function to determine body part
  const getBodyPart = (symptom: string): string => {
    const bodyPartMap: Record<string, string> = {
      'Headache': 'head',
      'Fever': 'general',
      'Cough': 'respiratory',
      'Chest Pain': 'chest',
      'Abdominal Pain': 'abdomen',
      'Back Pain': 'back',
      'Joint Pain': 'joints',
      'Shortness of Breath': 'respiratory',
      'Dizziness': 'neurological',
      'Nausea': 'digestive',
      'Vomiting': 'digestive',
      'Diarrhea': 'digestive',
      'Constipation': 'digestive',
      'Rash': 'skin',
      'Swelling': 'general',
      'Numbness': 'neurological',
      'Tremors': 'neurological',
      'Memory Loss': 'neurological',
      'Vision Problems': 'eyes',
      'Hearing Loss': 'ears',
      'Sore Throat': 'throat',
      'Runny Nose': 'respiratory',
      'Congestion': 'respiratory',
      'Fatigue': 'general',
      'Insomnia': 'neurological',
      'Anxiety': 'psychological',
      'Depression': 'psychological'
    };
    
    return bodyPartMap[symptom] || 'general';
  };

  // Helper function to format the analysis response
  const formatAnalysisResponse = (data: any): string => {
    let response = '';
    
    // Risk Level
    if (data.riskLevel && data.riskLevel !== 'unknown') {
      const riskEmoji = data.riskLevel === 'urgent' ? '🚨' : 
                       data.riskLevel === 'high' ? '⚠️' : 
                       data.riskLevel === 'moderate' ? '🟡' : '🟢';
      response += `${riskEmoji} **Risk Level:** ${data.riskLevel.toUpperCase()}\n\n`;
    }
    
    // Possible Conditions
    if (data.conditions && data.conditions.length > 0) {
      response += '## 🔍 **Possible Conditions**\n';
      data.conditions.forEach((condition: any) => {
        const urgency = condition.urgent ? '🚨 URGENT - Seek immediate medical attention!' : '⚠️ Monitor closely';
        const description = condition.description ? ` - ${condition.description}` : '';
        response += `• **${condition.name}** (${condition.probability}% likely)${description}\n`;
        response += `  ${urgency}\n\n`;
      });
    }
    
    // Immediate Actions
    if (data.immediateActions && data.immediateActions.length > 0) {
      response += '## ⚡ **Immediate Actions**\n';
      data.immediateActions.forEach((action: string) => {
        response += `• ${action}\n`;
      });
      response += '\n';
    }
    
    // Precautions
    if (data.precautions && data.precautions.length > 0) {
      response += '## 🛡️ **Precautions**\n';
      data.precautions.forEach((precaution: string) => {
        response += `• ${precaution}\n`;
      });
      response += '\n';
    }
    
    // Medications
    if (data.medications && data.medications.length > 0) {
      response += '## 💊 **Medications**\n';
      data.medications.forEach((medication: string) => {
        response += `• ${medication}\n`;
      });
      response += '\n';
    }
    
    // Lifestyle Changes
    if (data.lifestyleChanges && data.lifestyleChanges.length > 0) {
      response += '## 🌱 **Lifestyle Changes**\n';
      data.lifestyleChanges.forEach((change: string) => {
        response += `• ${change}\n`;
      });
      response += '\n';
    }
    
    // When to Seek Medical Help
    if (data.whenToSeekHelp && data.whenToSeekHelp.length > 0) {
      response += '## 🚨 **When to Seek Medical Help**\n';
      data.whenToSeekHelp.forEach((symptom: string) => {
        response += `• ${symptom}\n`;
      });
      response += '\n';
    }
    
    // Follow-up
    if (data.followUp) {
      response += '## 📋 **Follow-up**\n';
      response += `${data.followUp}\n\n`;
    }
    
    // Disclaimer
    response += '---\n';
    response += '**⚠️ Disclaimer:** This analysis is for informational purposes only and should not replace professional medical advice. Always consult a qualified healthcare provider for proper diagnosis and treatment.';
    
    if (!response.trim()) {
      response = 'Analysis completed. Please consult a healthcare professional for medical advice.';
    }
    
    return response;
  };



  const clearAll = () => {
    setSelectedSymptoms([]);
    setAnalysis(null);
    setSearchTerm('');
  };

  const getSeverityColor = (symptom: string) => {
    // This is a simplified severity assessment - in a real app, you'd have a database
    const severeSymptoms = ['Chest Pain', 'Shortness of Breath', 'Seizures', 'Paralysis', 'Severe Bleeding'];
    const moderateSymptoms = ['Fever', 'Severe Pain', 'Dizziness', 'Confusion'];
    
    if (severeSymptoms.includes(symptom)) return 'text-red-600 dark:text-red-400';
    if (moderateSymptoms.includes(symptom)) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Symptom Checker</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Select your symptoms to get AI-powered health insights and recommendations</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Left Side - Symptom Selection */}
          <div className="p-6 border-r border-gray-200 dark:border-gray-600">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Common Symptoms
              </h2>
              <div className="flex flex-wrap gap-2">
                {commonSymptoms.map((symptom) => (
                  <Button
                    key={symptom}
                    variant={selectedSymptoms.some(s => s.name === symptom) ? 'primary' : 'outline'}
                    onClick={() => handleSymptomToggle(symptom)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      selectedSymptoms.some(s => s.name === symptom)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500'
                    }`}
                  >
                    {symptom}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Search All Symptoms
              </h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search symptoms..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
                />
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredSymptoms.map((symptom) => (
                  <Button
                    key={symptom}
                    variant={selectedSymptoms.some(s => s.name === symptom) ? 'primary' : 'ghost'}
                    onClick={() => handleSymptomToggle(symptom)}
                    className={`w-full justify-start px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      selectedSymptoms.some(s => s.name === symptom)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className={getSeverityColor(symptom)}>●</span>
                    <span className="ml-2">{symptom}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={analyzeSymptoms}
                disabled={selectedSymptoms.length === 0 || isAnalyzing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Analyze Symptoms
                  </>
                )}
              </Button>
              
              <Button
                onClick={clearAll}
                variant="outline"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Right Side - Analysis Results */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Analysis Results
            </h2>
            
            {selectedSymptoms.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3">
                  Selected Symptoms ({selectedSymptoms.length})
                </h3>
                <div className="space-y-3">
                  {selectedSymptoms.map((symptom) => (
                    <div
                      key={symptom.name}
                      className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-blue-800 dark:text-blue-200 font-medium">
                          {symptom.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {symptom.inputType === 'severity' ? (
                            <>
                              <span className="text-xs text-gray-600 dark:text-gray-400">Severity:</span>
                              <select
                                value={symptom.severity || 'moderate'}
                                onChange={(e) => handleSeverityChange(symptom.name, e.target.value as 'mild' | 'moderate' | 'severe')}
                                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="mild">Mild</option>
                                <option value="moderate">Moderate</option>
                                <option value="severe">Severe</option>
                              </select>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-gray-600 dark:text-gray-400">Body Part:</span>
                              <select
                                value={symptom.bodyPart || 'General'}
                                onChange={(e) => handleBodyPartChange(symptom.name, e.target.value)}
                                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {bodyPartOptions.map(part => (
                                  <option key={part} value={part}>{part}</option>
                                ))}
                              </select>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSymptomToggle(symptom.name)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis ? (
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">
                      AI Assessment
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {analysis}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium mb-2">No Analysis Yet</p>
                <p className="text-sm">
                  Select symptoms and click "Analyze Symptoms" to get AI-powered health insights.
                </p>
              </div>
            )}

            {selectedSymptoms.length === 0 && !analysis && (
              <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">
                  💡 <strong>Tip:</strong> Start by selecting common symptoms or search for specific ones to get personalized health recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}