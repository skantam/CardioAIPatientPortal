import React from 'react';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  onAuthClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAuthClick }) => {
  return (
    <footer className="bg-gray-900 text-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* CTA Section */}
        <div className="text-center mb-16 py-12 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Take Control of Your Heart Health?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Start your personalized cardiovascular risk assessment today.
          </p>
          <button 
            onClick={onAuthClick}
            className="bg-white text-blue-600 font-semibold px-8 py-4 rounded-full text-lg hover:bg-gray-100 transition-colors duration-300 transform hover:scale-105"
          >
            Get Started Today
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">CardioAI</span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              AI-powered heart health platform providing personalized cardiovascular risk assessment and preventive care guidance.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                <Mail className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                <Phone className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Product</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Risk Assessment</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">AI Chat</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Doctor Network</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Health Monitoring</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Company</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Press</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Legal & Support</h3>
            <ul className="space-y-3">
              <li><a href="https://drive.google.com/file/d/1hcF-5aESNvtbvC7GS8SKl8h2FTf6MQUF" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">For Doctors</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 CardioAI. All rights reserved. | Medical device FDA cleared.
            </p>
            <p className="text-gray-400 text-sm">
              Not intended for emergency use. Call 911 for medical emergencies.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;