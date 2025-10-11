import React, { useState } from 'react';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import ResetPasswordPage from './components/ResetPasswordPage';
import HeroSection from './components/HeroSection';
import FeatureGrid from './components/FeatureGrid';
import HowItWorks from './components/HowItWorks';
import TestimonialsCarousel from './components/TestimonialsCarousel';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import CardiologistSearch from "./components/CardiologistSearch";

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Check if we're on the reset password page
  const isResetPasswordPage = window.location.pathname === '/reset-password';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isResetPasswordPage) {
    return <ResetPasswordPage />;
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="font-inter">
      <Navigation onAuthClick={() => setShowAuthModal(true)} />
      <HeroSection onAuthClick={() => setShowAuthModal(true)} />
      <FeatureGrid />
      <HowItWorks />
      <TestimonialsCarousel />
      <FAQ />
      <Footer onAuthClick={() => setShowAuthModal(true)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;