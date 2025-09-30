import React, { useState } from 'react';
import { AlertCircle, Calendar, Clock, CheckCircle, Edit, Trash2, Eye, MapPin } from 'lucide-react';
import ChatbotFlow from './ChatbotFlow';
import AssessmentResults from './AssessmentResults';

interface AssessmentHistoryProps {
  assessments: any[];
  onRefresh: () => void;
  onDeleteAssessment: (id: string) => void;
}

const AssessmentHistory: React.FC<AssessmentHistoryProps> = ({ assessments, onRefresh, onDeleteAssessment }) => {
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [editingAssessment, setEditingAssessment] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showCardiologistSearch, setShowCardiologistSearch] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [cardiologists, setCardiologists] = useState<any[]>([]);
  const [searchingCardiologists, setSearchingCardiologists] = useState(false);

  const handleDeleteConfirm = async (assessmentId: string) => {
    try {
      await onDeleteAssessment(assessmentId);
      setDeleteConfirmId(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting assessment:', error);
    }
  };

  const getRiskColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'borderline': return 'text-yellow-600 bg-yellow-100';
      case 'intermediate': return 'text-orange-600 bg-orange-100';
      case 'very high':
      case 'very high risk':
      case 'high':
      case 'high risk': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const searchCardiologists = async () => {
    if (!zipCode) return;

    setSearchingCardiologists(true);
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
        setCardiologists(data || []);
      }
    } catch (error) {
      console.error('Error searching cardiologists:', error);
    } finally {
      setSearchingCardiologists(false);
    }
  };

  if (editingAssessment) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setEditingAssessment(null)}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Assessment History
          </button>
        </div>
        <ChatbotFlow
          onAssessmentComplete={() => {
            setEditingAssessment(null);
            onRefresh();
          }}
          onEditComplete={() => {
            setEditingAssessment(null);
            onRefresh();
          }}
          hasPendingAssessment={false}
          hasConsent={true}
          editingAssessment={editingAssessment}
        />
      </div>
    );
  }

  if (selectedAssessment) {
    return (
      <AssessmentResults
        assessment={selectedAssessment}
        onBack={() => setSelectedAssessment(null)}
        onCardiologistSearch={() => setShowCardiologistSearch(true)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Assessment History</h3>
        <button
          onClick={onRefresh}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No assessments found</p>
          <p className="text-gray-400 text-sm mt-2">
            Complete your first heart health assessment to see results here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    Submitted on: {new Date(assessment.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center">
                  {assessment.status === 'pending_review' ? (
                    <div className="flex items-center text-yellow-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="text-sm">Pending Review</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">Reviewed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                <div>👨 Sex: {assessment.inputs.gender}</div>
                <div>🎂 Age: {assessment.inputs.age}</div>
                <div>🩸 Total Cholesterol: {assessment.inputs.totalCholesterol} mg/dL</div>
                <div>❤️ HDL: {assessment.inputs.hdlCholesterol} mg/dL</div>
                <div>💉 SBP: {assessment.inputs.systolicBP} mmHg</div>
                <div>Diabetes: {assessment.inputs.diabetes ? 'Yes' : 'No'}</div>
                <div>Smoker: {assessment.inputs.smoker ? 'Yes' : 'No'}</div>
                <div>HTN Treatment: {assessment.inputs.bpMedication ? 'Yes' : 'No'}</div>
              </div>

              {assessment.status === 'pending_review' ? (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center text-yellow-800">
                      <Clock className="w-5 h-5 mr-2" />
                      <div>
                        <p className="font-medium">Your assessment is being reviewed by healthcare professionals.</p>
                        <p className="text-sm mt-1">Results will be available within 24–48 hours.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <button
                      onClick={() => setEditingAssessment(assessment)}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(assessment.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-sm text-gray-600">Risk Score: </span>
                      <span className="font-semibold">{assessment.risk_score}</span>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(assessment.risk_category)}`}>
                        {assessment.risk_category?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {assessment.status !== 'pending_review' && (
                      <button
                        onClick={() => setSelectedAssessment(assessment)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                    )}
                    {assessment.status === 'pending_review' && (
                      <button
                        onClick={() => setEditingAssessment(assessment)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteConfirmId(assessment.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Assessment</h3>
              <p className="text-gray-600">
                Are you sure you want to delete this assessment? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cardiologist Search Modal */}
      {showCardiologistSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Find Cardiologists Near You</h3>
              <button
                onClick={() => setShowCardiologistSearch(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Enter your zip code"
                  className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={searchCardiologists}
                  disabled={searchingCardiologists || !zipCode}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50"
                >
                  {searchingCardiologists ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {cardiologists.length > 0 && (
              <div className="grid gap-4">
                {cardiologists.map((cardiologist, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">{cardiologist.name}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {cardiologist.location}
                          </div>
                          <div>📞 {cardiologist.phone}</div>
                          <div>🏥 {cardiologist.specialty}</div>
                        </div>
                      </div>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Contact
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentHistory;