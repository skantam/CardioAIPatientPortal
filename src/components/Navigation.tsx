import React from 'react';
import { Heart, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  onAuthClick: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onAuthClick }) => {
  const { user, signOut } = useAuth();

  const handleAuthClick = () => {
    if (user) {
      signOut();
    } else {
      onAuthClick();
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CardioAI</span>
          </div>

          {/* CTA Button */}
          <button 
            onClick={handleAuthClick}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
          >
            {user ? (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </>
            ) : (
              'Login / Signup'
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;