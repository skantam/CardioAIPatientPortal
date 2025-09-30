import React from 'react';
import { ArrowLeft, Calendar, User, Activity, Heart, FileText, AlertTriangle, Phone, MapPin, X } from 'lucide-react';

interface AssessmentResultsProps {
  assessment: any;
  onBack: () => void;
}

const AssessmentResults: React.FC<AssessmentResultsProps> = ({ 
  assessment, 
  onBack
}) => {
  const [zipCode, setZipCode] = React.useState('');
  const [cardiologists, setCardiologists] = React.useState<any[]>([]);
  const [searchingCardiologists, setSearchingCardiologists] = React.useState(false);
  const [searchCompleted, setSearchCompleted] = React.useState(false);
  const [searchError, setSearchError] = React.useState('');
  const [selectedCardiologist, setSelectedCardiologist] = React.useState<any>(null);
  const [showContactModal, setShowContactModal] = React.useState(false);

  const getRiskColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      case 'borderline': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'intermediate': return 'text-orange-600 bg-orange-100 border-orange-200';
     case 'very high':
      case 'very high risk':
      case 'high':
      case 'high risk': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const shouldShowCardiologistSearch = assessment.overall_recommendation?.toLowerCase().includes('requires-discussion');

  const searchCardiologists = async () => {
    if (!zipCode) return;

    setSearchingCardiologists(true);
    setSearchCompleted(false);
    setSearchError('');
    setCardiologists([]);
    
    try {
      const response = await fetch('https://skantam.app.n8n.cloud/webhook/Cardiologist_Search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zipcode: zipCode }),
      });

      if (response.ok) {
  const data = await response.json();
  console.log('Cardiologist search response:', data);
  console.log('Data type:', typeof data);
  console.log('Is array:', Array.isArray(data));
  
  // Check if data is directly the providers array
  if (Array.isArray(data) && data.length > 0 && data[0].name) {
    setCardiologists(data);
  }
  // Check if data is wrapped in an object with providers property
  else if (data && data.providers && Array.isArray(data.providers)) {
    setCardiologists(data.providers);
  }
  // Check if data is an array with first item containing providers
  else if (Array.isArray(data) && data.length > 0 && data[0].providers) {
    setCardiologists(data[0].providers);
  }
  else {
    console.log('Unexpected data structure:', data);
    setSearchError('No cardiologists found in your area.');
  }
} else {
  setSearchError('Failed to search for cardiologists. Please try again.');
}
    } catch (error) {
      console.error('Error searching cardiologists:', error);
      setSearchError('An error occurred while searching. Please try again.');
    } finally {
      setSearchingCardiologists(false);
      setSearchCompleted(true);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assessment History
        </button>
      </div>

      {/* Section 1: ASCVD Risk Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ASCVD Risk Profile</h2>
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Generated on: {new Date(assessment.created_at || assessment.timestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
        </div>

        <p className="text-gray-600 mb-8">
          Below is a summary of the patient's risk, treatment options, and treatment advice based on the data provided.
        </p>

        {/* Risk Assessment Card */}
        <div className={`border-2 rounded-2xl p-6 mb-8 ${getRiskColor(assessment.risk_category)}`}>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">10-year risk for first ASCVD event is:</h3>
            <div className="text-3xl font-bold mb-2">💥 Risk Score: {assessment.risk_score}</div>
            <div className="text-xl font-semibold">
              🔴 Risk Category: {assessment.risk_category?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Input Summary Table */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Input Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="font-medium">Sex</span>
              <span>{assessment.inputs.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Race</span>
              <span>{assessment.inputs.race}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Age</span>
              <span>{assessment.inputs.age}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Cholesterol</span>
              <span>{assessment.inputs.totalCholesterol} mg/dL</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">HDL Cholesterol</span>
              <span>{assessment.inputs.hdlCholesterol} mg/dL</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Systolic BP</span>
              <span>{assessment.inputs.systolicBP} mm Hg</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Diabetes</span>
              <span>{assessment.inputs.diabetes ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Smoker</span>
              <span>{assessment.inputs.smoker ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">HTN Treatment</span>
              <span>{assessment.inputs.bpMedication ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Professional Review */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex items-center mb-6">
          <User className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-900">Professional Review</h3>
        </div>

        {assessment.overall_recommendation && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Overall Recommendation:</h4>
            <p className="text-blue-800">{assessment.overall_recommendation}</p>
          </div>
        )}

        {assessment.provider_comments && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Provider Comments:</h4>
            <p className="text-gray-700">{assessment.provider_comments}</p>
          </div>
        )}
      </div>

      {/* Section 3: Treatment Advice & Recommendations */}
{assessment.recommendations && (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
    <div className="flex items-center mb-6">
      <Activity className="w-6 h-6 text-green-600 mr-3" />
      <h3 className="text-xl font-bold text-gray-900">Treatment Advice & Recommendations</h3>
    </div>

    <div className="space-y-6">
      {assessment.recommendations.map(({ category, text }, index) => {
        const getIcon = (cat) => {
          const lower = cat.toLowerCase();
          if (lower.includes('exercise')) return '🧘';
          if (lower.includes('nutrition')) return '🥗';
          if (lower.includes('smoking')) return '🚬';
          if (lower.includes('bp') || lower.includes('hypertension')) return '💊';
          if (lower.includes('cholesterol')) return '🧬';
          if (lower.includes('diabetes')) return '🍬';
          if (lower.includes('aspirin')) return '🩹';
          return '💡';
        };

        // Format category (capitalize words, replace underscores)
        const formatCategoryName = (cat) =>
          cat
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())
            .trim();

        return (
          <div key={index} className="border-l-4 border-blue-500 pl-6">
            <h4 className="font-semibold text-gray-900 mb-2">
              {getIcon(category)} {formatCategoryName(category)}
            </h4>
            <p className="text-gray-700">{text.trim()}</p>
          </div>
        );
      })}
    </div>
  </div>
)}


      {/* Section 4: Guidelines & Disclaimer */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex items-center mb-6">
          <FileText className="w-6 h-6 text-purple-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-900">Guidelines & Disclaimer</h3>
        </div>

         {assessment.guidelines && assessment.guidelines.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Guideline References:</h4>
            <div className="space-y-2">
              {assessment.guidelines.map(({ title, url }, index) => (
                <div key={index}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline block py-1"
                  >
                    {title}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {assessment.disclaimer && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Important Disclaimer:</h4>
                <p className="text-yellow-700 text-sm italic">{assessment.disclaimer}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cardiologist Search Section */}
      {shouldShowCardiologistSearch && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <Heart className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">Cardiologist Referral</h3>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <p className="text-red-800 mb-4">
              Based on your assessment, we recommend consulting with a cardiologist for further evaluation and treatment planning.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-red-800 mb-2">
                Enter your zip code to find cardiologists near you:
              </label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter zip code"
                className="w-full p-3 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={searchCardiologists}
              disabled={!zipCode || searchingCardiologists}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              {searchingCardiologists ? 'Searching...' : 'Find Cardiologists Near Me'}
            </button>
          </div>

          {/* Search Status Messages */}
          {searchCompleted && !searchingCardiologists && (
            <div className="mt-4">
              {searchError ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800">{searchError}</p>
                </div>
              ) : cardiologists.length > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-800">Found {cardiologists.length} healthcare provider(s) in your area:</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Cardiologist Results */}
          {cardiologists.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Healthcare Providers in your area:</h4>
              <div className="grid gap-4">
                {cardiologists.map((cardiologist, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">{cardiologist.name}</h5>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 mr-2" />
                            {cardiologist.address}
                          </div>
                          <div>🆔 ID: {cardiologist.id}</div>
                          <div>🏥 {cardiologist.specialty}</div>
                        </div>
                      </div>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        <button 
                          onClick={() => {
                            setSelectedCardiologist(cardiologist);
                            setShowContactModal(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Contact
                        </button>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Contact Modal */}
      {showContactModal && selectedCardiologist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Contact Provider</h3>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setSelectedCardiologist(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">{selectedCardiologist.name}</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {selectedCardiologist.address}
                </div>
                <div>🆔 ID: {selectedCardiologist.id}</div>
                <div>🏥 {selectedCardiologist.specialty}</div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const address = encodeURIComponent(selectedCardiologist.address);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Get Directions
              </button>
              
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setSelectedCardiologist(null);
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssessmentResults;