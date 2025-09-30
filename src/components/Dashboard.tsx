import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MessageCircle, FileText, History, LogOut, Calendar, User, Heart, Settings } from 'lucide-react';
import ChatbotFlow from './ChatbotFlow';
import AssessmentHistory from './AssessmentHistory';
import PasswordChangeModal from './PasswordChangeModal';
import Footer from './Footer';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('chatbot');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [consentHistory, setConsentHistory] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchConsentHistory();
      fetchAssessments();
    }
  }, [user]);

  const fetchConsentHistory = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('consent_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setConsentHistory(data);
    }
  };

  const fetchAssessments = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('assessments')
      .select('id, user_id, created_at, inputs, risk_score, risk_category, recommendations, guidelines, disclaimer, overall_recommendation, provider_comments, status, results')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAssessments(data);
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own assessments

      if (error) {
        console.error('Error deleting assessment:', error);
        setError(`Failed to delete assessment: ${error.message}`);
      } else {
        // Remove from local state immediately
        setAssessments(prev => prev.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
      setError('An error occurred while deleting the assessment');
    }
  };

  const revokeConsentAndDeleteData = async () => {
    setShowRevokeModal(true);
  };

  const handleRevokeConfirm = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Delete all assessments for the user
      const { error: assessmentsError } = await supabase
        .from('assessments')
        .delete()
        .eq('user_id', user.id);

      if (assessmentsError) {
        console.error('Error deleting assessments:', assessmentsError);
        setError(`Failed to delete assessments: ${assessmentsError.message}`);
        return;
      }

      // Delete all consent history for the user
      const { error: consentError } = await supabase
        .from('consent_history')
        .delete()
        .eq('user_id', user.id);

      if (consentError) {
        console.error('Error deleting consent history:', consentError);
        setError(`Failed to delete consent history: ${consentError.message}`);
        return;
      }

      // Refresh data and close modal
      setAssessments([]);
      setConsentHistory([]);
      setShowRevokeModal(false);
      setError('');
      
      // Show success message
      alert('All your data has been successfully deleted.');
    } catch (error) {
      console.error('Error during data deletion:', error);
      setError(`An error occurred while deleting your data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const hasPendingAssessment = assessments.some(a => a.status === 'pending_review');
  const hasConsent = consentHistory.some(c => c.consent_given === true);

  const tabs = [
    { id: 'chatbot', label: 'Heart Assessment', icon: MessageCircle },
    { id: 'consent', label: 'Consent History', icon: FileText },
    { id: 'history', label: 'Assessment History', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col space-y-1">
              <span className="text-xl font-bold text-gray-900">CardioAI</span>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome to Your Heart Health Dashboard
              </h1>
              <p className="text-gray-600">
                Manage your cardiovascular health with AI-powered insights
              </p>
            </div>


            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600">
                <User className="w-5 h-5 mr-2" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Change Password
              </button>
              <button
                onClick={signOut}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'chatbot' && (
              <div>
                <ChatbotFlow 
                  onAssessmentComplete={fetchAssessments} 
                  hasPendingAssessment={hasPendingAssessment}
                  hasConsent={hasConsent}
                  hasCompletedAssessments={assessments.length > 0}
                />
              </div>
            )}
            
            {activeTab === 'consent' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Consent History</h3>
                  {hasConsent && (
                    <button
                      onClick={revokeConsentAndDeleteData}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Deleting...' : 'Revoke Consent & Delete All Data'}
                    </button>
                  )}
                </div>
                {consentHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No consent records found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {consentHistory.map((consent) => (
                      <div key={consent.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              Privacy Consent {consent.consent_given ? 'Granted' : 'Denied'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span className="text-sm">
                                {new Date(consent.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'history' && (
              <AssessmentHistory 
                assessments={assessments} 
                onRefresh={fetchAssessments}
                onDeleteAssessment={handleDeleteAssessment}
              />
            )}
          </div>
        </div>
      </div>

      {/* Revoke Consent Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Revoke Consent & Delete Data
              </h3>
              <p className="text-gray-600 leading-relaxed">
                This will permanently delete all your assessments and consent history from our database. This action cannot be undone.
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowRevokeModal(false);
                  setError('');
                }}
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeConfirm}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete All Data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      <PasswordChangeModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </div>
  );
};

export default Dashboard;