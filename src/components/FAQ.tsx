import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'Is my health data secure and private?',
    answer: 'Yes, absolutely. We use bank-level encryption (AES-256) and comply with HIPAA regulations. Your data is never shared without explicit consent and is stored on secure, audited servers. We also offer end-to-end encryption for all communications.',
  },
  {
    question: 'Does this replace seeing a doctor?',
    answer: 'No, our platform is designed to complement medical care, not replace it. We provide risk assessment and screening tools to help you make informed decisions about when to seek professional medical attention. Always consult healthcare professionals for diagnosis and treatment.',
  },
  {
    question: 'Can I use this if I have no symptoms?',
    answer: 'Absolutely! Our platform is specifically designed for preventive care. Many heart conditions develop silently over years. Regular risk assessment can help identify potential issues before symptoms appear, enabling early intervention and better outcomes.',
  },
  {
    question: 'How accurate is the AI risk assessment?',
    answer: 'Our AI model has been trained on millions of clinical data points and achieves 94% accuracy in risk stratification. However, all AI assessments are reviewed by licensed medical professionals through our human-in-the-loop verification process.',
  },
  {
    question: 'What happens if I\'m classified as high risk?',
    answer: 'If our assessment indicates elevated risk, you\'ll receive immediate guidance and we\'ll help connect you with qualified cardiologists in your area. We also provide personalized lifestyle recommendations and ongoing monitoring support.',
  },
  {
    question: 'How much does the assessment cost?',
    answer: 'Basic risk assessment is free and includes your cardiovascular score with general recommendations. Our premium service ($29/month) includes detailed analysis, ongoing monitoring, and priority access to cardiologist referrals.',
  },
  {
    question: 'Can I upload existing medical reports?',
    answer: 'Yes! You can upload lab results, ECGs, imaging reports, and other medical documents. Our AI can analyze these alongside your conversational assessment to provide a more comprehensive risk evaluation.',
  },
  {
    question: 'Is this available internationally?',
    answer: 'Currently available in the US, Canada, UK, and Australia. We\'re expanding to other countries throughout 2025. Cardiologist referral networks vary by location, but risk assessment is available globally.',
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-gray-50">
      <div className="w-full px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about our AI-powered heart health platform.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-8">
                  {faq.question}
                </h3>
                {openIndex === index ? (
                  <ChevronUp className="w-6 h-6 text-blue-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-8 pb-6">
                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;