import React from 'react';
import { MessageSquare, Zap, BookOpen, Users, UserCheck } from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Conversational Data Gathering',
    description: 'Natural language processing collects your health history through an intuitive chat interface.',
  },
  {
    icon: Zap,
    title: 'Instant Risk Score (API)',
    description: 'Real-time cardiovascular risk assessment using advanced machine learning algorithms.',
  },
  {
    icon: BookOpen,
    title: 'RAG-based AI Recommendations',
    description: 'Evidence-based suggestions powered by the latest medical research and guidelines.',
  },
  {
    icon: Users,
    title: 'Human-in-the-loop (HITL) Verification',
    description: 'Medical professionals review and validate all AI-generated risk assessments.',
  },
  {
    icon: UserCheck,
    title: 'Cardiologist Referral',
    description: 'Seamless connection to qualified cardiologists in your area when needed.',
  },
];

const FeatureGrid = () => {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Heart Health Platform
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our AI-powered platform combines cutting-edge technology with human expertise to deliver personalized cardiovascular care.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;