import React, { useState, useEffect } from 'react';
import { MessageCircle, Upload, Check, AlertCircle, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Tesseract from 'tesseract.js';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/webpack';
import mammoth from 'mammoth';

interface ChatbotFlowProps {
  onAssessmentComplete: () => void;
  hasPendingAssessment: boolean;
  hasConsent: boolean;
  hasCompletedAssessments: boolean;
  editingAssessment?: any;
  onEditComplete?: () => void;
}

interface AssessmentData {
  age?: number;
  gender?: string;
  race?: string;
  smoker?: boolean;
  diabetes?: boolean;
  familyHistory?: boolean;
  highBP?: boolean;
  bpMedication?: boolean;
  cholesterolMedication?: boolean;
  systolicBP?: number;
  totalCholesterol?: number;
  hdlCholesterol?: number;
}

const ChatbotFlow: React.FC<ChatbotFlowProps> = ({ onAssessmentComplete, hasPendingAssessment, hasConsent, hasCompletedAssessments, editingAssessment, onEditComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(() => {
    if (hasPendingAssessment) return 'pending';
    if (hasCompletedAssessments && hasConsent) return 'new-assessment-prompt';
    if (hasConsent) return 'age';
    return 'intro';
  });
  const [consentGiven, setConsentGiven] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileParseMessage, setFileParseMessage] = useState('');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Real-time validation function
  const validateField = (field: keyof AssessmentData, value: any): string | null => {
    switch (field) {
      case 'age':
        if (!value || value < 45 || value > 85) {
          return 'Please enter a valid age between 45 and 85';
        }
        break;
      case 'systolicBP':
        if (!value || value < 70 || value > 250) {
          return 'Please enter a valid systolic blood pressure (70-250)';
        }
        break;
      case 'totalCholesterol':
        if (!value || value < 100 || value > 500) {
          return 'Please enter a valid total cholesterol (100-500 mg/dL)';
        }
        break;
      case 'hdlCholesterol':
        if (!value || value < 20 || value > 100) {
          return 'Please enter a valid HDL cholesterol (20-100 mg/dL)';
        }
        break;
    }
    return null;
  };

  // Initialize with editing data if provided
  useEffect(() => {
    if (editingAssessment) {
      setAssessmentData(editingAssessment.inputs);
      setStep('age');
    }
  }, [editingAssessment]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      parseLabFile(file);
    }
  };

  const parseLabFile = async (file: File) => {
    setIsParsingFile(true);
    setFileParseMessage('');
    
    try {
      let text = '';
      
      // Extract text based on file type
      if (file.type.startsWith('image/')) {
        // Handle images with OCR
        setFileParseMessage('🔍 Using OCR to read text from image...');
        const { data: { text: ocrText } } = await Tesseract.recognize(file, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              setFileParseMessage(`🔍 OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        text = ocrText;
      } else if (file.type === 'application/pdf') {
        // Handle PDF files
        setFileParseMessage('📄 Extracting text from PDF...');
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        text = fullText;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Handle Word documents
        setFileParseMessage('📝 Extracting text from Word document...');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (file.type.startsWith('text/') || !file.type) {
        // Handle text files and unknown types
        setFileParseMessage('📄 Reading text file...');
        text = await file.text();
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      console.log('Extracted text:', text);
      
      const extractedValues: Partial<AssessmentData> = {};
      let foundValues = 0;
      
      console.log('Parsing extracted text:', text);
      setFileParseMessage('🔍 Analyzing text for lab values...');
      console.log('File type:', file.type);
      console.log('File name:', file.name);
      
      // Clean the text and split into lines
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      console.log('Text lines:', lines);
      
      // Method 1: Line-by-line exact matching for your lab report format
      for (const line of lines) {
        console.log('Processing line:', line);
        
        // Look for "Cholesterol 177" format (total cholesterol)
        const cholesterolMatch = line.match(/^Cholesterol\s+(\d{2,3})$/i);
        if (cholesterolMatch && !extractedValues.totalCholesterol) {
          const value = parseInt(cholesterolMatch[1]);
          if (value >= 100 && value <= 500) {
            extractedValues.totalCholesterol = value;
            foundValues++;
            console.log('Found total cholesterol from line match:', value);
          }
        }
        
        // Look for "HDL Cholesterol 80" pattern
        const hdlMatch = line.match(/^HDL\s+Cholesterol\s+(\d{1,3})$/i);
        if (hdlMatch && !extractedValues.hdlCholesterol) {
          const value = parseInt(hdlMatch[1]);
          if (value >= 20 && value <= 150) {
            extractedValues.hdlCholesterol = value;
            foundValues++;
            console.log('Found HDL cholesterol (exact match):', value);
          }
        }
        
        // Look for blood pressure patterns
        const bpMatch = line.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
        if (bpMatch && !extractedValues.systolicBP) {
          const systolic = parseInt(bpMatch[1]);
          if (systolic >= 80 && systolic <= 250) {
            extractedValues.systolicBP = systolic;
            foundValues++;
            console.log('Found systolic BP (exact match):', systolic);
          }
        }
      }
      
      // Clean and normalize the text
      const cleanText = text.replace(/\s+/g, ' ').trim();
      
      console.log('Text lines found:', lines);
      
      // Method 1: Line-by-line exact matching for your specific lab format
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        console.log('Processing line:', line);
        
        // Skip lines that contain normal ranges or reference ranges
        if (line.toLowerCase().includes('normal range') || 
            line.toLowerCase().includes('reference range') || 
            line.toLowerCase().includes('normal value') ||
            line.match(/\d+\s*-\s*\d+/)) { // Skip range patterns like "100 - 199"
          console.log('Skipping normal range line:', line);
          continue;
        }
        
        // Look for cholesterol values
        if (line.toLowerCase().includes('cholesterol') && !line.toLowerCase().includes('hdl') && !line.toLowerCase().includes('ldl')) {
          const numbers = line.match(/\b\d+\b/g);
          if (numbers) {
            const cholValue = parseInt(numbers[0]);
            if (cholValue >= 100 && cholValue <= 400) {
              console.log('Found cholesterol value:', cholValue);
              extractedValues.totalCholesterol = cholValue;
            }
          }
        }
        
        // Look for HDL values
        if (line.toLowerCase().includes('hdl')) {
          // Skip if it's just the HDL label line
          if (!line.toLowerCase().includes('normal') && !line.toLowerCase().includes('range')) {
            const numbers = line.match(/\b\d+\b/g);
            if (numbers) {
              const hdlValue = parseInt(numbers[0]);
              if (hdlValue >= 20 && hdlValue <= 100) {
                console.log('Found HDL value:', hdlValue);
                extractedValues.hdlCholesterol = hdlValue;
              }
            }
          }
        }
        
        // Look for lines that might contain values after labels
        if (line.toLowerCase().includes('value') && line.match(/\b\d+\b/)) {
          const numbers = line.match(/\b\d+\b/g);
          if (numbers) {
            const value = parseInt(numbers[0]);
            console.log('Found value line:', line, 'Value:', value);
            
            // Check previous lines to see what this value might be for
            const prevLines = lines.slice(Math.max(0, i-3), i);
            const context = prevLines.join(' ').toLowerCase();
            
            if (context.includes('hdl') && value >= 20 && value <= 100) {
              console.log('Assigning value to HDL based on context:', value);
              extractedValues.hdlCholesterol = value;
            } else if (context.includes('cholesterol') && !context.includes('hdl') && value >= 100 && value <= 400) {
              console.log('Assigning value to total cholesterol based on context:', value);
              extractedValues.totalCholesterol = value;
            }
          }
        }
      }
      
      // Additional proximity search for cholesterol value
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('cholesterol') && !line.includes('hdl') && !line.includes('ldl') && !line.includes('normal')) {
          // Look in the next few lines for a standalone number
          for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
            const nextLine = lines[j];
            const numbers = nextLine.match(/^\s*\d+\s*$/); // Line with just a number
            if (numbers) {
              const cholValue = parseInt(numbers[0]);
              if (cholValue >= 100 && cholValue <= 400) {
                console.log('Found cholesterol value in proximity:', cholValue);
                extractedValues.totalCholesterol = cholValue;
                break;
              }
            }
          }
        }
      }
      
      console.log('Final extracted values:', extractedValues);
      
      // Method 2: Broader pattern matching if exact matching didn't work
      if (foundValues < 3) {
        console.log('Trying broader pattern matching...');
        
        // Look for cholesterol values with more flexible patterns
        if (!extractedValues.totalCholesterol) {
          const cholesterolPatterns = [
            /cholesterol[^\d]*?(\d{2,3})/gi,
            /total\s+cholesterol[^\d]*?(\d{2,3})/gi,
            /tc[:\s]*(\d{2,3})/gi,
            /chol[:\s]*(\d{2,3})/gi
          ];
          
          for (const pattern of cholesterolPatterns) {
            const matches = [...cleanText.matchAll(pattern)];
            for (const match of matches) {
              const value = parseInt(match[1]);
              if (value >= 100 && value <= 500) {
                extractedValues.totalCholesterol = value;
                foundValues++;
                console.log('Found total cholesterol (broad match):', value);
                break;
              }
            }
            if (extractedValues.totalCholesterol) break;
          }
        }
        
        // Look for HDL values with more flexible patterns
        if (!extractedValues.hdlCholesterol) {
          const hdlPatterns = [
            /hdl\s+cholesterol[^\d]*?(\d{1,3})/gi,
            /hdl[:\s]*(\d{1,3})/gi,
            /high\s+density[^\d]*?(\d{1,3})/gi
          ];
          
          for (const pattern of hdlPatterns) {
            const matches = [...cleanText.matchAll(pattern)];
            for (const match of matches) {
              const value = parseInt(match[1]);
              if (value >= 20 && value <= 150) {
                extractedValues.hdlCholesterol = value;
                foundValues++;
                console.log('Found HDL cholesterol (broad match):', value);
                break;
              }
            }
            if (extractedValues.hdlCholesterol) break;
          }
        }
        
        // Look for blood pressure with more flexible patterns
        if (!extractedValues.systolicBP) {
          const bpPatterns = [
            /systolic[^\d]*?(\d{2,3})/gi,
            /bp[^\d]*?(\d{2,3})\s*\//gi,
            /blood\s+pressure[^\d]*?(\d{2,3})/gi,
            /sbp[:\s]*(\d{2,3})/gi
          ];
          
          for (const pattern of bpPatterns) {
            const matches = [...cleanText.matchAll(pattern)];
            for (const match of matches) {
              const value = parseInt(match[1]);
              if (value >= 80 && value <= 250) {
                extractedValues.systolicBP = value;
                foundValues++;
                console.log('Found systolic BP (broad match):', value);
                break;
              }
            }
            if (extractedValues.systolicBP) break;
          }
        }
      }
      
      // Method 3: Context-based number extraction as last resort
      if (foundValues < 2) {
        console.log('Trying context-based number extraction...');
        const numbers = cleanText.match(/\b(\d{2,3})\b/g);
        if (numbers) {
          console.log('Found numbers in text:', numbers);
          
          for (const numStr of numbers) {
            const num = parseInt(numStr);
            
            // Look for cholesterol-like values
            if (!extractedValues.totalCholesterol && num >= 150 && num <= 300) {
              // Check if this number appears near cholesterol-related words
              const cholesterolContext = /cholesterol|chol|tc/gi;
              const numIndex = cleanText.indexOf(numStr);
              const contextBefore = cleanText.substring(Math.max(0, numIndex - 50), numIndex);
              const contextAfter = cleanText.substring(numIndex, Math.min(cleanText.length, numIndex + 50));
              
              if (cholesterolContext.test(contextBefore) || cholesterolContext.test(contextAfter)) {
                extractedValues.totalCholesterol = num;
                foundValues++;
                console.log('Found total cholesterol (context-based):', num);
              }
            }
            
            // Look for HDL-like values
            if (!extractedValues.hdlCholesterol && num >= 30 && num <= 100) {
              const hdlContext = /hdl|high.density/gi;
              const numIndex = cleanText.indexOf(numStr);
              const contextBefore = cleanText.substring(Math.max(0, numIndex - 50), numIndex);
              const contextAfter = cleanText.substring(numIndex, Math.min(cleanText.length, numIndex + 50));
              
              if (hdlContext.test(contextBefore) || hdlContext.test(contextAfter)) {
                extractedValues.hdlCholesterol = num;
                foundValues++;
                console.log('Found HDL cholesterol (context-based):', num);
              }
            }
            
            // Look for BP-like values
            if (!extractedValues.systolicBP && num >= 90 && num <= 180) {
              const bpContext = /blood.pressure|bp|systolic|mmhg/gi;
              const numIndex = cleanText.indexOf(numStr);
              const contextBefore = cleanText.substring(Math.max(0, numIndex - 50), numIndex);
              const contextAfter = cleanText.substring(numIndex, Math.min(cleanText.length, numIndex + 50));
              
              if (bpContext.test(contextBefore) || bpContext.test(contextAfter)) {
                extractedValues.systolicBP = num;
                foundValues++;
                console.log('Found systolic BP (context-based):', num);
              }
            }
          }
        }
      }
      
      // Method 2: Broader pattern matching if line matching didn't work
      if (foundValues === 0) {
        console.log('Line matching failed, trying broader patterns...');
        
        // Look for cholesterol patterns in the entire text
        const cholesterolPatterns = [
          /Cholesterol[^\d]*?(\d{2,3})/gi,
          /Total\s+Cholesterol[^\d]*?(\d{2,3})/gi,
          /TC[^\d]*?(\d{2,3})/gi
        ];
        
        for (const pattern of cholesterolPatterns) {
          const matches = [...text.matchAll(pattern)];
          for (const match of matches) {
            const value = parseInt(match[1]);
            if (value >= 100 && value <= 500 && !extractedValues.totalCholesterol) {
              extractedValues.totalCholesterol = value;
              foundValues++;
              console.log('Found total cholesterol (broad match):', value);
              break;
            }
          }
          if (extractedValues.totalCholesterol) break;
        }
      }
      
      if (foundValues > 0) {
        // Update assessment data with extracted values
        setAssessmentData(prev => ({ ...prev, ...extractedValues }));
        const valuesList = [];
        if (extractedValues.totalCholesterol) valuesList.push(`Total Cholesterol: ${extractedValues.totalCholesterol}`);
        if (extractedValues.hdlCholesterol) valuesList.push(`HDL: ${extractedValues.hdlCholesterol}`);
        if (extractedValues.systolicBP) valuesList.push(`Systolic BP: ${extractedValues.systolicBP}`);
        
        setFileParseMessage(`✅ Found ${foundValues} lab value(s): ${valuesList.join(', ')}`);
      } else {
        setFileParseMessage('⚠️ Could not automatically extract lab values from your file. Please enter them manually below. Make sure the file contains clear cholesterol and blood pressure values.');
      }
    } catch (error) {
      console.error('File parsing error:', error);
      if (file.type.startsWith('image/')) {
        setFileParseMessage('❌ Error reading image file. Please try a clearer image or enter values manually.');
      } else if (file.type === 'application/pdf') {
        setFileParseMessage('❌ Error reading PDF file. Please try a text-based PDF or enter values manually.');
      } else if (file.type.includes('word')) {
        setFileParseMessage('❌ Error reading Word document. Please try a different format or enter values manually.');
      } else {
        setFileParseMessage('❌ Error reading file. Please enter your lab values manually below.');
      }
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleConsent = async (consent: boolean) => {
    if (!user) return;

    setConsentGiven(consent);
    
    // Store consent in database
    await supabase.from('consent_history').insert({
      user_id: user.id,
      consent_given: consent
    });

    if (consent) {
      setStep('age');
    } else {
      setStep('declined');
    }
  };

  const updateAssessmentData = (field: keyof AssessmentData, value: any) => {
    setAssessmentData(prev => ({ ...prev, [field]: value }));
    
    // Clear any existing validation errors for this field
    setValidationErrors(prev => prev.filter(error => !error.toLowerCase().includes(field.toLowerCase())));
    
    // Auto-progress to next step for new assessments (not editing) - except for age
    if (!editingAssessment) {
      setTimeout(() => {
        if (step === 'gender' && field === 'gender' && value) {
          setStep('race');
        } else if (step === 'race' && field === 'race' && value) {
          setStep('smoker');
        } else if (step === 'smoker' && field === 'smoker' && value !== undefined) {
          setStep('diabetes');
        } else if (step === 'diabetes' && field === 'diabetes' && value !== undefined) {
          setStep('family-history');
        } else if (step === 'family-history' && field === 'familyHistory' && value !== undefined) {
          setStep('blood-pressure');
        } else if (step === 'blood-pressure' && field === 'highBP' && value !== undefined) {
          if (value) {
            setStep('bp-medication');
          } else {
            setAssessmentData(prev => ({ ...prev, bpMedication: false }));
            setStep('cholesterol-medication');
          }
        } else if (step === 'bp-medication' && field === 'bpMedication' && value !== undefined) {
          setStep('cholesterol-medication');
        } else if (step === 'cholesterol-medication' && field === 'cholesterolMedication' && value !== undefined) {
          setStep('lab-data');
        }
      }, 100); // Reduced delay for faster progression
    }
  };

  const validateAssessmentData = (): string[] => {
    const errors: string[] = [];
    
    if (!assessmentData.age || assessmentData.age < 45 || assessmentData.age > 85) {
      errors.push('Please enter a valid age between 45 and 85');
    }
    if (!assessmentData.gender) {
      errors.push('Please select your gender');
    }
    if (!assessmentData.race) {
      errors.push('Please select your race');
    }
    if (assessmentData.smoker === undefined) {
      errors.push('Please indicate if you smoke');
    }
    if (assessmentData.diabetes === undefined) {
      errors.push('Please indicate if you have diabetes');
    }
    if (!assessmentData.systolicBP || assessmentData.systolicBP < 70 || assessmentData.systolicBP > 250) {
      errors.push('Please enter a valid systolic blood pressure (70-250)');
    }
    if (!assessmentData.totalCholesterol || assessmentData.totalCholesterol < 100 || assessmentData.totalCholesterol > 500) {
      errors.push('Please enter a valid total cholesterol (100-500 mg/dL)');
    }
    if (!assessmentData.hdlCholesterol || assessmentData.hdlCholesterol < 20 || assessmentData.hdlCholesterol > 100) {
      errors.push('Please enter a valid HDL cholesterol (20-100 mg/dL)');
    }
    
    return errors;
  };

  const handleValidationError = () => {
    // Navigate back to the first step with validation errors
    if (validationErrors.some(error => error.includes('age'))) {
      setStep('age');
    } else if (validationErrors.some(error => error.includes('gender'))) {
      setStep('gender');
    } else if (validationErrors.some(error => error.includes('race'))) {
      setStep('race');
    } else if (validationErrors.some(error => error.includes('smoke'))) {
      setStep('smoker');
    } else if (validationErrors.some(error => error.includes('diabetes'))) {
      setStep('diabetes');
    } else if (validationErrors.some(error => error.includes('blood pressure'))) {
      setStep('lab-data');
    } else if (validationErrors.some(error => error.includes('cholesterol'))) {
      setStep('lab-data');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'age' && assessmentData.age) {
      setStep('gender');
    } else if (step === 'gender' && assessmentData.gender) {
      setStep('race');
    } else if (step === 'race' && assessmentData.race) {
      setStep('smoker');
    } else if (step === 'smoker' && assessmentData.smoker !== undefined) {
      setStep('diabetes');
    } else if (step === 'diabetes' && assessmentData.diabetes !== undefined) {
      setStep('family-history');
    } else if (step === 'family-history' && assessmentData.familyHistory !== undefined) {
      setStep('blood-pressure');
    } else if (step === 'blood-pressure' && assessmentData.highBP !== undefined) {
      if (assessmentData.highBP) {
        setStep('bp-medication');
      } else {
        setAssessmentData(prev => ({ ...prev, bpMedication: false }));
        setStep('cholesterol-medication');
      }
    } else if (step === 'bp-medication' && assessmentData.bpMedication !== undefined) {
      setStep('cholesterol-medication');
    } else if (step === 'cholesterol-medication' && assessmentData.cholesterolMedication !== undefined) {
      setStep('lab-data');
    } else if (step === 'review') {
      submitAssessment();
    }
  };

  const handleLabDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('review');
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextStep?: string) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && nextStep) {
      e.preventDefault();
      setStep(nextStep);
    }
  };

  const submitAssessment = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      let assessment;
      
      if (editingAssessment) {
        // Update existing assessment
        const { data, error: dbError } = await supabase
          .from('assessments')
          .update({
            inputs: assessmentData,
            status: 'pending_review'
          })
          .eq('id', editingAssessment.id)
          .select()
          .single();
        
        if (dbError) throw dbError;
        assessment = data;
      } else {
        // Create new assessment
        // Get user's country from metadata
        const userCountry = user?.user_metadata?.country || null;
        console.log('User country from metadata:', userCountry);
        console.log('Full user metadata:', user?.user_metadata);
        
        const submittedAssessment = {
          user_id: user.id,
          inputs: assessmentData,
          status: 'pending_review',
          usercountry: userCountry,
        };

        console.log('Submitting assessment with country:', submittedAssessment.usercountry);

        const { data, error } = await supabase
          .from('assessments')
          .insert(submittedAssessment)
          .select();

        if (error) {
          console.error('Error submitting assessment:', error);
          setError('Failed to submit assessment. Please try again.');
          return;
        }

        console.log('Assessment submitted successfully with country:', data?.[0]?.usercountry);
        assessment = data[0];
      }

      // Call n8n webhook
      try {
        const response = await fetch('https://skantam.app.n8n.cloud/webhook/CardioAI_GetRISKScore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(assessmentData),
        });

        if (response.ok) {
          const result = await response.json();

          // Check if result and suggestions exist
          if (result && result.suggestions) {
            const suggestions = result.suggestions;
            
            // Update assessment with results
            await supabase
              .from('assessments')
              .update({
                risk_score: suggestions.estimated_10yr_risk?.score,
                risk_category: suggestions.estimated_10yr_risk?.category,
                recommendations: suggestions.recommendations,
                guidelines: suggestions.guideline_references,
                disclaimer: suggestions.disclaimer,
                results: suggestions,
                status: 'pending_review'
              })
              .eq('id', assessment.id);
          } else {
            console.error('Webhook response missing suggestions data:', result);
            // Keep assessment in pending_review status if webhook data is incomplete
          }
        }
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        // Continue even if webhook fails - assessment is saved
      }

      setStep('complete');
      if (editingAssessment && onEditComplete) {
        onEditComplete();
      } else {
        onAssessmentComplete();
      }
    } catch (err) {
      setError(`Failed to ${editingAssessment ? 'update' : 'submit'} assessment. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'new-assessment-prompt':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {hasPendingAssessment ? 'Assessment Under Review' : 'Start New Assessment'}
            </h3>
            {hasPendingAssessment ? (
              <div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Your assessment is currently under review by our healthcare professionals. 
                  You can view it in the Assessment History tab.
                </p>
                <p className="text-gray-600 mb-8">
                  Would you like to create a new assessment while waiting for your review?
                </p>
              </div>
            ) : (
              <p className="text-gray-600 mb-8 leading-relaxed">
                You have completed assessments. Would you like to start a new heart health assessment?
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setStep('age')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Start New Assessment
              </button>
              <button
                onClick={() => setStep('intro')}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        );

      case 'pending':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Assessment Under Review
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              You have a pending assessment that is currently being reviewed by our healthcare professionals. 
              Results will be available within 24-48 hours.
            </p>
            <p className="text-gray-600 mb-8">
              You can check your Assessment History tab to see the status of your review.
            </p>
          </div>
        );

      case 'intro':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Hi there! I'm your friendly health assistant.
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              My goal is to help you get a clearer picture of your long-term heart health by asking a few key questions. 
              It's all about understanding and empowerment, with absolutely no judgment.
            </p>
            <p className="text-gray-600 mb-8">
              Your privacy is my top priority. Ready to get started?
            </p>
            <button
              onClick={() => setStep('consent')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Let's Begin
            </button>
          </div>
        );

      case 'consent':
        if (hasConsent) {
          setStep('age');
          return null;
        }
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Consent & Privacy</h3>
            <p className="text-gray-600 mb-6">
              Before we begin, we need to handle your privacy and consent.
            </p>
            
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Key Assurances:</h4>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  Confidential: Your answers will not be shared.
                </li>
                <li className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  Secure: Your data is protected with strong encryption.
                </li>
                <li className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  For You: Only used to calculate your heart health insights.
                </li>
                <li className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  In Control: You can opt out any time.
                </li>
              </ul>
            </div>

            <p className="text-gray-600 mb-6">
              <a 
                href="https://drive.google.com/file/d/1hcF-5aESNvtbvC7GS8SKl8h2FTf6MQUF" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                View Full Privacy Policy
              </a>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleConsent(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center"
              >
                <Check className="w-5 h-5 mr-2" />
                I Agree, Let's Start!
              </button>
              <button
                onClick={() => setStep('more-info')}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
              >
                Tell Me More First
              </button>
              <button
                onClick={() => handleConsent(false)}
                className="bg-red-100 text-red-700 px-6 py-3 rounded-full font-semibold hover:bg-red-200 transition-all"
              >
                No, Not Right Now
              </button>
            </div>
          </div>
        );

      case 'age':
        return (
          <form onSubmit={(e) => {
            e.preventDefault();
            // Validate age in real-time
            const ageError = validateField('age', assessmentData.age);
            if (ageError) {
              setValidationErrors([ageError]);
              return;
            }
            setValidationErrors([]);
            if (assessmentData.age && !ageError) {
              setStep('gender');
            }
          }}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Great! First things first, how old are you?</h3>
            <input
              type="number"
              min="18"
              max="120"
              value={assessmentData.age || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                setAssessmentData(prev => ({ ...prev, age: value }));
                
                // Real-time validation
                if (value) {
                  const error = validateField('age', value);
                  if (error) {
                    setValidationErrors([error]);
                  } else {
                    setValidationErrors([]);
                  }
                }
              }}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              placeholder="Enter your age"
              required
            />
            
            {/* Display validation errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {assessmentData.age && (assessmentData.age < 45 || assessmentData.age > 85) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800 text-sm">
                    Tool works best between ages 45–85. Your results may be general guidance.
                  </p>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={!assessmentData.age || validationErrors.length > 0}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
            >
              Continue
            </button>
          </form>
        );

      case 'gender':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Got it, thank you. And just for our calculations, are you male or female? This helps us use the most accurate formula for you</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('gender', 'male');
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.gender === 'male'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('gender', 'female');
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.gender === 'female'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Female
              </button>
            </div>
            {editingAssessment && assessmentData.gender && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('age')}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('race')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case 'race':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Would you describe yourself as African American, Caucasian, Chinese or of another race?
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {['African American', 'Caucasian', 'Chinese', 'Other'].map((race) => (
                <button
                  key={race}
                  type="button"
                  onClick={() => {
                    updateAssessmentData('race', race);
                  }}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    assessmentData.race === race
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {race}
                </button>
              ))}
            </div>
            {editingAssessment && assessmentData.race && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('gender')}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('smoker')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case 'smoker':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Do you currently smoke cigarettes?</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('smoker', true);
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.smoker === true
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('smoker', false);
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.smoker === false
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                No
              </button>
            </div>
            {editingAssessment && assessmentData.smoker !== undefined && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('race')}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('diabetes')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case 'diabetes':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Has a doctor ever told you that you have diabetes?
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('diabetes', true);
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.diabetes === true
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('diabetes', false);
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.diabetes === false
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                No
              </button>
            </div>
            {editingAssessment && assessmentData.diabetes !== undefined && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('smoker')}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('family-history')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case 'family-history':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Have any immediate family members (parents, siblings, children) had a heart attack before age 60?
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('familyHistory', true);
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.familyHistory === true
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('familyHistory', false);
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.familyHistory === false
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                No
              </button>
            </div>
            {editingAssessment && assessmentData.familyHistory !== undefined && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('diabetes')}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('blood-pressure')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case 'blood-pressure':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Has a doctor said you have high blood pressure?
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('highBP', true);
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.highBP === true
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('highBP', false);
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.highBP === false
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                No
              </button>
            </div>
            {editingAssessment && assessmentData.highBP !== undefined && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('family-history')}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (assessmentData.highBP) {
                      setStep('bp-medication');
                    } else {
                      setAssessmentData(prev => ({ ...prev, bpMedication: false }));
                      setStep('cholesterol-medication');
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case 'bp-medication':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Are you currently taking prescribed medication for high blood pressure?
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('bpMedication', true);
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.bpMedication === true
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('bpMedication', false);
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.bpMedication === false
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                No
              </button>
            </div>
            {editingAssessment && assessmentData.bpMedication !== undefined && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('blood-pressure')}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('cholesterol-medication')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case 'cholesterol-medication':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Are you taking cholesterol medication (e.g., statins)?
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('cholesterolMedication', true);
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.cholesterolMedication === true
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => {
                  updateAssessmentData('cholesterolMedication', false);
                }}
                className={`p-4 border-2 rounded-xl transition-all ${
                  assessmentData.cholesterolMedication === false
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                No
              </button>
            </div>
            {editingAssessment && assessmentData.cholesterolMedication !== undefined && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (assessmentData.highBP) {
                      setStep('bp-medication');
                    } else {
                      setStep('blood-pressure');
                    }
                  }}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('lab-data')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case 'lab-data':
        return (
          <form onSubmit={(e) => {
            e.preventDefault();
            setStep('review');
          }}>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Lab Data</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Systolic Blood Pressure (top number)
                </label>
                <input
                  type="number"
                  value={assessmentData.systolicBP || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    setAssessmentData(prev => ({ ...prev, systolicBP: value }));
                    
                    // Real-time validation
                    if (value) {
                      const error = validateField('systolicBP', value);
                      if (error) {
                        setValidationErrors(prev => [...prev.filter(err => !err.includes('blood pressure')), error]);
                      } else {
                        setValidationErrors(prev => prev.filter(err => !err.includes('blood pressure')));
                      }
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 120"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Cholesterol (mg/dL)
                </label>
                <input
                  type="number"
                  value={assessmentData.totalCholesterol || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    setAssessmentData(prev => ({ ...prev, totalCholesterol: value }));
                    
                    // Real-time validation
                    if (value) {
                      const error = validateField('totalCholesterol', value);
                      if (error) {
                        setValidationErrors(prev => [...prev.filter(err => !err.includes('total cholesterol')), error]);
                      } else {
                        setValidationErrors(prev => prev.filter(err => !err.includes('total cholesterol')));
                      }
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HDL Cholesterol (mg/dL)
                </label>
                <input
                  type="number"
                  value={assessmentData.hdlCholesterol || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    setAssessmentData(prev => ({ ...prev, hdlCholesterol: value }));
                    
                    // Real-time validation
                    if (value) {
                      const error = validateField('hdlCholesterol', value);
                      if (error) {
                        setValidationErrors(prev => [...prev.filter(err => !err.includes('HDL cholesterol')), error]);
                      } else {
                        setValidationErrors(prev => prev.filter(err => !err.includes('HDL cholesterol')));
                      }
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 50"
                  required
                />
              </div>
            </div>
            
            {/* Display validation errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-red-800 mb-2">Please fix the following:</h4>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-start">
                <Upload className="w-5 h-5 text-blue-600 mr-3 mt-1" />
                <div>
                  <p className="text-blue-800 font-medium mb-2">Don't know your numbers?</p>
                  <p className="text-blue-700 text-sm">
                    You can upload your recent lab report, and I'll find the numbers for you.
                  </p>
                  <div className="mt-3">
                    <input
                      type="file"
                      id="lab-report-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="lab-report-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Lab Report
                    </label>
                    {uploadedFile && (
                      <div className="mt-2">
                        <p className="text-blue-700 text-sm">
                          ✓ Uploaded: {uploadedFile.name}
                        </p>
                        {isParsingFile && (
                          <p className="text-blue-600 text-sm mt-1">
                            {fileParseMessage || '🔍 Processing file...'}
                          </p>
                        )}
                      </div>
                    )}
                    {fileParseMessage && (
                      <div className={`mt-3 p-3 rounded-lg text-sm ${
                        fileParseMessage.includes('✅') 
                          ? 'bg-green-50 border border-green-200 text-green-800' 
                          : fileParseMessage.includes('⚠️')
                          ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        {fileParseMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {editingAssessment ? (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('cholesterol-medication')}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={!assessmentData.systolicBP || !assessmentData.totalCholesterol || !assessmentData.hdlCholesterol || validationErrors.length > 0}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Continue to Review
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!assessmentData.systolicBP || !assessmentData.totalCholesterol || !assessmentData.hdlCholesterol || validationErrors.length > 0}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Continue to Review
              </button>
            )}
          </form>
        );

      case 'review':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingAssessment ? 'Edit Your Assessment' : 'Review Your Information'}
            </h3>
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Age:</strong> {assessmentData.age}</div>
                <div><strong>Gender:</strong> {assessmentData.gender}</div>
                <div><strong>Race:</strong> {assessmentData.race}</div>
                <div><strong>Smoker:</strong> {assessmentData.smoker ? 'Yes' : 'No'}</div>
                <div><strong>Diabetes:</strong> {assessmentData.diabetes ? 'Yes' : 'No'}</div>
                <div><strong>Family History:</strong> {assessmentData.familyHistory ? 'Yes' : 'No'}</div>
                <div><strong>High BP:</strong> {assessmentData.highBP ? 'Yes' : 'No'}</div>
                <div><strong>BP Medication:</strong> {assessmentData.bpMedication ? 'Yes' : 'No'}</div>
                <div><strong>Cholesterol Medication:</strong> {assessmentData.cholesterolMedication ? 'Yes' : 'No'}</div>
                <div><strong>Systolic BP:</strong> {assessmentData.systolicBP}</div>
                <div><strong>Total Cholesterol:</strong> {assessmentData.totalCholesterol}</div>
                <div><strong>HDL Cholesterol:</strong> {assessmentData.hdlCholesterol}</div>
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-red-800 mb-2">Please fix the following errors:</h4>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={handleValidationError}
                  className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Fix Errors
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep('lab-data')}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={submitAssessment}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitAssessment();
                  }
                }}
                tabIndex={0}
              >
                {loading ? (editingAssessment ? 'Updating...' : 'Submitting...') : (editingAssessment ? 'Update Assessment' : 'Submit Assessment')}
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingAssessment ? 'Assessment Updated!' : 'Assessment Under Review!'}
            </h3>
            <p className="text-gray-600 mb-8">
              {editingAssessment 
                ? 'Your assessment has been updated and is being re-processed. You can view your results in the Assessment History tab.'
                : 'Perfect, that\'s everything I need! Your assessment has been submitted and is being processed. You can view your results in the Assessment History tab.'
              }
            </p>
           
          </div>
        );

      case 'declined':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">We Understand</h3>
            <p className="text-gray-600 mb-8">
              Your privacy is important. If you change your mind, we'll be here to help you assess your heart health.
            </p>
          </div>
        );

      case 'more-info':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">More Information</h3>
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <p className="text-gray-700 mb-4">
                Our heart health assessment uses clinically validated algorithms to estimate your cardiovascular risk. 
                Here's what you should know:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Your data is encrypted and stored securely</li>
                <li>• We never share your information with third parties</li>
                <li>• You can delete your data at any time</li>
                <li>• This assessment is for educational purposes only</li>
                <li>• Always consult with healthcare professionals for medical advice</li>
              </ul>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleConsent(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Okay, I'm Ready to Agree
              </button>
              <button
                onClick={() => setStep('consent')}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
              >
                Back to Consent
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {renderStep()}
      </div>
    </div>
  );
};

export default ChatbotFlow;