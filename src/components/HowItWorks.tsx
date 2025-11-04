import React from 'react';
import { MessageCircle, Shield, Heart } from 'lucide-react';

const steps = [
  {
    icon: MessageCircle,
    number: '01',
    title: 'Engage & Gather',
    description: 'Share your health information through our conversational AI or upload existing medical reports.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Shield,
    number: '02',
    title: 'Analyze & Verify',
    description: 'Our AI calculates your risk score while medical professionals verify the assessment for accuracy.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Heart,
    number: '03',
    title: 'Empower & Connect',
    description: 'Receive personalized guidance and connect with local cardiologists when intervention is needed.',
    color: 'from-emerald-500 to-emerald-600',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="w-full px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Three simple steps to take control of your heart health with AI-powered insights and expert validation.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connection line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent transform translate-x-6 z-0"></div>
                )}
                
                <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
                  <div className="relative">
                    <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {step.number}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;