import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let result;
      
      if (isForgotPassword) {
        result = await resetPassword(email);
        if (!result.error) {
          setSuccessMessage('Password reset email sent! Check your inbox.');
          setEmail('');
          return;
        }
      } else {
        result = isLogin 
          ? await signIn(email, password)
          : await signUp(email, password);
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        if (!isForgotPassword) {
          onClose();
          setEmail('');
          setPassword('');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    if (isForgotPassword) {
      setIsForgotPassword(false);
      setIsLogin(true);
    } else {
      setIsLogin(!isLogin);
    }
    setError('');
    setSuccessMessage('');
  };

  const showForgotPassword = () => {
    setIsForgotPassword(true);
    setIsLogin(false);
    setError('');
    setSuccessMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </h2>
          <p className="text-gray-600">
            {isForgotPassword 
              ? 'Enter your email to receive a password reset link'
              : (isLogin 
                ? 'Sign in to access your heart health dashboard' 
                : 'Join thousands taking control of their heart health')
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-green-600 text-sm">{successMessage}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? 'Please wait...' : (isForgotPassword ? 'Send Reset Email' : (isLogin ? 'Sign In' : 'Create Account'))}
          </button>
        </form>

        <div className="mt-6 text-center">
          {!isForgotPassword && isLogin && (
            <p className="text-gray-600 mb-4">
              <button
                onClick={showForgotPassword}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot your password?
              </button>
            </p>
          )}
          <p className="text-gray-600">
            {isForgotPassword ? "Remember your password? " : (isLogin ? "Don't have an account? " : "Already have an account? ")}
            <button
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isForgotPassword ? 'Sign in' : (isLogin ? 'Sign up' : 'Sign in')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;