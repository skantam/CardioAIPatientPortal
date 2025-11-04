import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Patient',
    content: 'The AI assessment caught early warning signs my regular checkup missed. The cardiologist referral probably saved my life.',
    rating: 5,
    avatar: 'SM',
  },
  {
    name: 'Dr. James Chen',
    role: 'Cardiologist',
    content: 'This platform provides excellent pre-screening. Patients arrive more informed and we can focus on targeted treatment.',
    rating: 5,
    avatar: 'JC',
  },
  {
    name: 'Michael Rodriguez',
    role: 'Patient',
    content: 'Finally, a health tool that actually listens. The conversation felt natural and the recommendations were spot-on.',
    rating: 5,
    avatar: 'MR',
  },
  {
    name: 'Dr. Lisa Thompson',
    role: 'Family Physician',
    content: 'The human verification step gives me confidence in the AI recommendations. Great tool for preventive care.',
    rating: 5,
    avatar: 'LT',
  },
  {
    name: 'David Park',
    role: 'Patient',
    content: 'Easy to use, comprehensive analysis, and the peace of mind is invaluable. Highly recommend to anyone concerned about heart health.',
    rating: 5,
    avatar: 'DP',
  },
  {
    name: 'Dr. Rachel Green',
    role: 'Cardiologist',
    content: 'The quality of risk assessments is impressive. This is the future of preventive cardiovascular medicine.',
    rating: 5,
    avatar: 'RG',
  },
];

const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  return (
    <section className="py-20 bg-white">
      <div className="w-full px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Patients & Doctors
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See what healthcare professionals and patients are saying about our AI-powered heart health platform.
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border border-gray-100 max-w-4xl mx-auto">
                    <div className="flex items-center mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    
                    <blockquote className="text-lg md:text-xl text-gray-700 italic mb-8 leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>
                    
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-gray-600">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow duration-300"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow duration-300"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

          {/* Dots indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsAutoPlaying(false);
                }}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;