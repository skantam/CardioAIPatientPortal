import React from 'react';
import { MessageCircle, Heart, Star } from 'lucide-react';

interface HeroSectionProps {
  onAuthClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onAuthClick }) => {

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-6 pt-32 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Heart Health.{' '}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Reimagined with AI.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              Proactive, personalized, and preventative care — all starting with a simple conversation.
            </p>

            {/* 5-star rating */}
            <div className="flex items-center justify-center lg:justify-start mb-8">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="ml-3 text-gray-600 font-medium">4.9/5 from 2,000+ users</span>
            </div>

            <button 
              onClick={onAuthClick}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Check My Heart Risk
            </button>
          </div>

          {/* Visual Elements */}
          <div className="relative">
            {/* Chatbot Interface Mockup */}
            <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6 transform rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">CardioAI Assistant</p>
                  <p className="text-sm text-green-500">Online</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-100 rounded-2xl p-3 max-w-xs">
                  <p className="text-sm text-gray-700">Hi! I'm here to help assess your heart health. Do you experience chest pain or shortness of breath?</p>
                </div>
                <div className="bg-blue-500 text-white rounded-2xl p-3 max-w-xs ml-auto">
                  <p className="text-sm">Sometimes during exercise</p>
                </div>
                <div className="bg-gray-100 rounded-2xl p-3 max-w-xs">
                  <p className="text-sm text-gray-700">I understand. Let me ask a few more questions to better assess your risk...</p>
                </div>
              </div>
            </div>

            {/* Heart Risk Meter */}
            <div className="bg-white rounded-3xl shadow-2xl p-6 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="text-center">
                <h3 className="font-bold text-gray-900 mb-4">Your Heart Risk Score</h3>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      strokeDasharray="75, 100"
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">25</div>
                      <div className="text-xs text-gray-500">LOW RISK</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-sm text-gray-600">Based on 12 health factors</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;