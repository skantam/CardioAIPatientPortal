import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MessageCircle, Upload, FileText, Send, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

interface ChatbotFlowProps {
  onAssessmentComplete: () => void;
  onEditComplete?: () => void;
  hasPendingAssessment: boolean;
  hasConsent: boolean;
  hasCompletedAssessments?: boolean;
  editingAssessment?: any;
}

const ChatbotFlow: React.FC<ChatbotFlowProps> = ({ 
  onAssessmentComplete, 
  onEditComplete,
  hasPendingAssessment, 
  hasConsent,
  hasCompletedAssessments = false,
  editingAssessment 
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consentGiven, setConsentGiven] = useState(hasConsent);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedText, setExtractedText] = useState('');
  const [processingFiles, setProcessingFiles] = useState(false);

  useEffect(() => {
    if (editingAssessment) {
      // Pre-populate responses with existing assessment data
      setResponses(editingAssessment.inputs);
      setConsentGiven(true);
      // Skip to the first actual question (after consent and upload)
      setCurrentStep(2);
    }
  }, [editingAssessment]);

  // If there's a pending assessment and we're not editing, show the under review message
  if (hasPendingAssessment && !editingAssessment) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-yellow-800 mb-4">
            Assessment Under Review
          </h3>
          <p className="text-yellow-700 mb-6 leading-relaxed">
            Your heart health assessment has been submitted and is currently being reviewed by our healthcare professionals. 
            You'll receive your personalized results within 24-48 hours.
          </p>
          <div className="bg-yellow-100 rounded-xl p-4">
            <p className="text-yellow-800 text-sm">
              <strong>What happens next?</strong><br />
              Our medical team will carefully review your responses and provide personalized recommendations. 
              You'll be notified once your results are ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const questions = [
    {
      id: 'consent',
      type: 'consent',
      question: 'Privacy & Data Consent',
      description: 'Before we begin your heart health assessment, please review and accept our privacy policy.',
      required: true
    },
    {
      id: 'upload',
      type: 'upload',
      question: 'Upload Medical Documents (Optional)',
      description: 'You can upload any relevant medical documents like lab results, ECGs, or previous cardiac reports to enhance your assessment.',
      required: false
    },
    {
      id: 'age',
      type: 'number',
      question: 'What is your age?',
      description: 'Please enter your current age in years.',
      required: true,
      min: 18,
      max: 120
    },
    {
      id: 'gender',
      type: 'select',
      question: 'What is your biological sex?',
      description: 'This information is used for accurate risk calculation.',
      required: true,
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' }
      ]
    },
    {
      id: 'race',
      type: 'select',
      question: 'What is your race/ethnicity?',
      description: 'This helps us provide more accurate risk assessment.',
      required: true,
      options: [
        { value: 'white', label: 'White' },
        { value: 'african_american', label: 'African American' },
        { value: 'hispanic', label: 'Hispanic/Latino' },
        { value: 'asian', label: 'Asian' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      id: 'totalCholesterol',
      type: 'number',
      question: 'What is your total cholesterol level?',
      description: 'Enter your most recent total cholesterol reading in mg/dL. If you don\'t know, enter 200.',
      required: true,
      min: 100,
      max: 500,
      unit: 'mg/dL'
    },
    {
      id: 'hdlCholesterol',
      type: 'number',
      question: 'What is your HDL (good) cholesterol level?',
      description: 'Enter your HDL cholesterol reading in mg/dL. If you don\'t know, enter 50.',
      required: true,
      min: 20,
      max: 150,
      unit: 'mg/dL'
    },
    {
      id: 'systolicBP',
      type: 'number',
      question: 'What is your systolic blood pressure?',
      description: 'Enter the top number of your blood pressure reading (e.g., if your BP is 120/80, enter 120). If you don\'t know, enter 120.',
      required: true,
      min: 80,
      max: 250,
      unit: 'mmHg'
    },
    {
      id: 'diabetes',
      type: 'boolean',
      question: 'Do you have diabetes?',
      description: 'This includes Type 1, Type 2, or gestational diabetes.',
      required: true
    },
    {
      id: 'smoker',
      type: 'boolean',
      question: 'Do you currently smoke or have you smoked in the past 30 days?',
      description: 'This includes cigarettes, cigars, or pipes.',
      required: true
    },
    {
      id: 'bpMedication',
      type: 'boolean',
      question: 'Are you currently taking medication for high blood pressure?',
      description: 'This includes any prescription medication to control blood pressure.',
      required: true
    }
  ];

  const handleFileUpload = async (files: FileList) => {
    setProcessingFiles(true);
    const fileArray = Array.from(files);
    setUploadedFiles(fileArray);
    
    let allExtractedText = '';
    
    for (const file of fileArray) {
      try {
        let text = '';
        
        if (file.type === 'application/pdf') {
          text = await extractTextFromPDF(file);
        } else if (file.type.includes('word') || file.name.endsWith('.docx')) {
          text = await extractTextFromWord(file);
        } else if (file.type.startsWith('image/')) {
          text = await extractTextFromImage(file);
        } else if (file.type === 'text/plain') {
          text = await file.text();
        }
        
        if (text) {
          allExtractedText += `\n--- ${file.name} ---\n${text}\n`;
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }
    }
    
    setExtractedText(allExtractedText);
    setProcessingFiles(false);
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n';
    }
    
    return text;
  };

  const extractTextFromWord = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const extractTextFromImage = async (file: File): Promise<string> => {
    const { data: { text } } = await Tesseract.recognize(file, 'eng');
    return text;
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    
    // Re-extract text from remaining files
    if (newFiles.length === 0) {
      setExtractedText('');
    }
  };

  const handleConsent = async (consent: boolean) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('consent_history')
        .insert({
          user_id: user.id,
          consent_given: consent,
        });

      if (error) {
        console.error('Error saving consent:', error);
        setError('Failed to save consent. Please try again.');
        return;
      }

      setConsentGiven(consent);
      if (consent) {
        setCurrentStep(1); // Move to upload step
      } else {
        setError('Consent is required to proceed with the assessment.');
      }
    } catch (error) {
      console.error('Error saving consent:', error);
      setError('An error occurred while saving consent.');
    }
  };

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const nextStep = () => {
    const currentQuestion = questions[currentStep];
    
    if (currentQuestion.required && !responses[currentQuestion.id] && currentQuestion.type !== 'upload') {
      setError(`Please answer: ${currentQuestion.question}`);
      return;
    }
    
    setError('');
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitAssessment();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const submitAssessment = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const assessmentData = {
        user_id: user.id,
        inputs: {
          ...responses,
          uploadedDocuments: extractedText || null
        },
        status: 'pending_review'
      };

      if (editingAssessment) {
        // Update existing assessment
        const { error } = await supabase
          .from('assessments')
          .update(assessmentData)
          .eq('id', editingAssessment.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating assessment:', error);
          setError('Failed to update assessment. Please try again.');
          return;
        }

        if (onEditComplete) {
          onEditComplete();
        }
      } else {
        // Create new assessment
        const { error } = await supabase
          .from('assessments')
          .insert(assessmentData);

        if (error) {
          console.error('Error submitting assessment:', error);
          setError('Failed to submit assessment. Please try again.');
          return;
        }

        onAssessmentComplete();
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setError('An error occurred while submitting your assessment.');
    } finally {
      setLoading(false);
    }
  };

  if (!consentGiven && currentStep === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Privacy & Data Consent</h3>
            <p className="text-gray-600 leading-relaxed">
              Before we begin your heart health assessment, please review our privacy policy and provide your consent for data processing.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h4 className="font-semibold text-gray-900 mb-4">What we collect and why:</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• <strong>Health Information:</strong> To calculate your cardiovascular risk score</li>
              <li>• <strong>Medical Documents:</strong> To enhance assessment accuracy (optional)</li>
              <li>• <strong>Contact Information:</strong> To provide results and recommendations</li>
              <li>• <strong>Usage Data:</strong> To improve our AI models and user experience</li>
            </ul>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Your data is secure:</strong> We use bank-level encryption, comply with HIPAA regulations, 
                and never share your personal health information without explicit consent.
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-6">
              By clicking "I Agree", you consent to the collection and processing of your health data as described in our{' '}
              <a href="https://drive.google.com/file/d/1hcF-5aESNvtbvC7GS8SKl8h2FTf6MQUF" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">
                Privacy Policy
              </a>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleConsent(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                I Do Not Agree
              </button>
              <button
                onClick={() => handleConsent(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-colors"
              >
                I Agree & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            {editingAssessment ? 'Editing Assessment' : 'Heart Health Assessment'}
          </span>
          <span className="text-sm text-gray-500">
            {currentStep + 1} of {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {currentQuestion.question}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {currentQuestion.description}
          </p>
        </div>

        {/* Question Input */}
        <div className="mb-8">
          {currentQuestion.type === 'upload' && (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Drag and drop files here, or click to select
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl cursor-pointer transition-colors inline-block"
                >
                  Choose Files
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Supported: PDF, Word, Text, Images (JPG, PNG)
                </p>
              </div>

              {processingFiles && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing files...
                  </div>
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Uploaded Files:</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-500 mr-3" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentQuestion.type === 'number' && (
            <div>
              <input
                type="number"
                min={currentQuestion.min}
                max={currentQuestion.max}
                value={responses[currentQuestion.id] || ''}
                onChange={(e) => handleResponse(currentQuestion.id, parseInt(e.target.value))}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder={`Enter ${currentQuestion.question.toLowerCase()}`}
              />
              {currentQuestion.unit && (
                <p className="text-sm text-gray-500 mt-2">Unit: {currentQuestion.unit}</p>
              )}
            </div>
          )}

          {currentQuestion.type === 'select' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleResponse(currentQuestion.id, option.value)}
                  className={`w-full p-4 text-left border-2 rounded-xl transition-colors ${
                    responses[currentQuestion.id] === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'boolean' && (
            <div className="space-y-3">
              <button
                onClick={() => handleResponse(currentQuestion.id, true)}
                className={`w-full p-4 text-left border-2 rounded-xl transition-colors ${
                  responses[currentQuestion.id] === true
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => handleResponse(currentQuestion.id, false)}
                className={`w-full p-4 text-left border-2 rounded-xl transition-colors ${
                  responses[currentQuestion.id] === false
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                No
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <button
            onClick={nextStep}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {editingAssessment ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              <>
                {currentStep === questions.length - 1 ? (editingAssessment ? 'Update Assessment' : 'Submit Assessment') : 'Next'}
                {currentStep < questions.length - 1 && <Send className="w-4 h-4 ml-2" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotFlow;