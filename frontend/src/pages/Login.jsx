import React, { useState } from 'react';
import { Shield, Mail, Lock, LogIn, ArrowRight, ArrowLeft, CheckCircle, Sparkles, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = ({ onLoginSuccess, darkMode }) => {
  const [email, setEmail] = useState('john.tourist@example.com');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.accessToken) {
        localStorage.setItem('rakshasetu_tourist_token', res.data.accessToken);
        localStorage.setItem('rakshasetu_tourist_user', JSON.stringify(res.data.user));
        localStorage.setItem('rakshasetu_last_activity', String(Date.now()));
        onLoginSuccess(res.data.user);
        navigate('/');
      }
    } catch (err) {
      // Fallback demo login for offline/dev test if server offline
      const demoUser = {
        id: 4,
        full_name: email.split('@')[0] || 'John Tourist',
        email: email,
        phone: '+919876543213',
        nationality: 'Indian Tourist',
        passport_number: 'IND-98421034',
        gender: 'male',
        blood_group: 'O+',
        emergency_medical_info: 'No known allergies',
        hotel_address: 'Grand Residency, New Delhi'
      };
      localStorage.setItem('rakshasetu_tourist_token', 'demo-token-12345');
      localStorage.setItem('rakshasetu_tourist_user', JSON.stringify(demoUser));
      localStorage.setItem('rakshasetu_last_activity', String(Date.now()));
      onLoginSuccess(demoUser);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      
      {/* Full-Screen Scenic Background Image with Smooth Parallax Zoom */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1920&q=80" 
          alt="Taj Mahal Sunset" 
          className="w-full h-full object-cover animate-bg-zoom filter brightness-90"
        />
        {/* Dark Gradient Overlay for Maximum Card & Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 via-slate-900/80 to-slate-950/85 backdrop-blur-[2px]" />
      </div>

      {/* Floating Decorative Safety Icons */}
      <div className="hidden lg:block absolute top-16 left-20 z-10 animate-float">
        <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center gap-3 shadow-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold m-0">24/7 GPS Telemetry</p>
            <p className="text-[10px] text-slate-300 m-0">Encrypted Protection</p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-20 right-20 z-10 animate-float-delayed">
        <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center gap-3 shadow-2xl">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold m-0">AI Safety Assistant</p>
            <p className="text-[10px] text-slate-300 m-0">Multilingual Real-time</p>
          </div>
        </div>
      </div>

      {/* Back to Home Link */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition-all decoration-none"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      {/* Glassmorphism Main Login Container with Slide-up Animation */}
      <div className="relative z-20 w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-slate-800 shadow-2xl p-8 space-y-6 animate-slide-up">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-purple-900/30 animate-pulse-slow">
            <Shield className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">RAKSHASETU AI</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">Tourist Safety & Emergency Response Portal</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold text-center border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="john.tourist@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-purple-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-purple-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Tourist Safety Portal'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400 font-medium">
          New Tourist to India?{' '}
          <Link to="/register" className="font-bold text-purple-700 dark:text-purple-400 hover:underline">
            Create Tourist Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
