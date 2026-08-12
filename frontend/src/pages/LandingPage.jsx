import React, { useState } from 'react';
import { 
  Shield, 
  MapPin, 
  PhoneCall, 
  Sparkles, 
  AlertOctagon, 
  UserCheck, 
  Users, 
  Lock, 
  Compass, 
  Navigation, 
  FileText, 
  HeartHandshake, 
  CheckCircle, 
  ArrowRight,
  Mail,
  Phone,
  Building,
  ChevronRight,
  Award,
  Globe,
  Radio,
  Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const LandingPage = ({ tourist, onLogout, darkMode }) => {
  const navigate = useNavigate();
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setContactSubmitted(false);
    }, 4000);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      darkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      
      {/* 1. Header Navigation Bar (Matches EduManage Screenshot Header Layout) */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b px-4 md:px-12 py-3.5 flex items-center justify-between transition-colors ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200/80 shadow-xs'
      }`}>
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 decoration-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-md shadow-purple-900/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className={`text-xl font-extrabold tracking-tight flex items-center gap-1.5 m-0 leading-none ${
              darkMode ? 'text-indigo-400' : 'text-[#5b21b6]'
            }`}>
              RakshaSetu <span className="text-xs font-bold text-purple-600 dark:text-purple-400">AI</span>
            </h1>
            <p className={`text-[11px] font-medium m-0 mt-0.5 ${
              darkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Tourist Safety & Emergency System
            </p>
          </div>
        </Link>

        {/* Centered Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <button 
            onClick={() => scrollToSection('features')} 
            className={`transition-colors cursor-pointer ${
              darkMode ? 'text-slate-300 hover:text-purple-400' : 'text-slate-700 hover:text-purple-700'
            }`}
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('roles')} 
            className={`transition-colors cursor-pointer ${
              darkMode ? 'text-slate-300 hover:text-purple-400' : 'text-slate-700 hover:text-purple-700'
            }`}
          >
            Roles
          </button>
          <button 
            onClick={() => scrollToSection('about')} 
            className={`transition-colors cursor-pointer ${
              darkMode ? 'text-slate-300 hover:text-purple-400' : 'text-slate-700 hover:text-purple-700'
            }`}
          >
            About
          </button>
          <button 
            onClick={() => scrollToSection('contact')} 
            className={`transition-colors cursor-pointer ${
              darkMode ? 'text-slate-300 hover:text-purple-400' : 'text-slate-700 hover:text-purple-700'
            }`}
          >
            Contact Us
          </button>
        </nav>

        {/* Right Action Button (Purple Pill Button from Screenshot) */}
        <div className="flex items-center gap-3">
          {tourist ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button
                onClick={onLogout}
                className={`px-3.5 py-2 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                  darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-6 py-2 rounded-xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-semibold text-sm shadow-md shadow-purple-900/30 transition-all decoration-none flex items-center gap-1.5"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        
        {/* 2. Hero Banner Container (Exact replica of EduManage rounded hero container) */}
        <section className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800/30">
          {/* Background Image with Crisp Dark Gradient Overlay & Parallax Zoom */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=80" 
              alt="Tourist Landmark" 
              className="w-full h-full object-cover animate-bg-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/90 backdrop-brightness-75" />
          </div>

          {/* Floating Decorative Badges in Hero */}
          <div className="hidden lg:block absolute top-8 left-8 z-10 animate-float">
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 shadow-xl">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">100% Verified Guard</span>
            </div>
          </div>

          <div className="hidden lg:block absolute bottom-8 right-8 z-10 animate-float-delayed">
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 shadow-xl">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">24/7 AI Sentinel</span>
            </div>
          </div>

          {/* Hero Content Overlay (Strict High-Contrast White Text) */}
          <div className="relative z-10 px-6 sm:px-12 py-20 sm:py-28 text-center text-white max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-md">
              Comprehensive Student Management System
            </h2>
            <p className="text-sm sm:text-lg text-slate-100 font-medium leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
              Streamlining administration and enhancing communication for modern educational institutions.
            </p>
            <div className="pt-4 flex items-center justify-center gap-4">
              <button
                onClick={() => scrollToSection('features')}
                className="px-8 py-3.5 rounded-xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-bold text-sm shadow-xl shadow-purple-900/50 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                Explore Features
              </button>
              {!tourist && (
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm backdrop-blur-md border border-white/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  Quick Sign In <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Live Safety Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs font-extrabold m-0 ${darkMode ? 'text-white' : 'text-slate-900'}`}>112 Helpline</p>
              <p className={`text-[11px] font-medium m-0 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Direct Police Dispatch</p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs font-extrabold m-0 ${darkMode ? 'text-white' : 'text-slate-900'}`}>100% Geo-Private</p>
              <p className={`text-[11px] font-medium m-0 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Encrypted Location</p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs font-extrabold m-0 ${darkMode ? 'text-white' : 'text-slate-900'}`}>50,000+ Safe</p>
              <p className={`text-[11px] font-medium m-0 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Protected Journeys</p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs font-extrabold m-0 ${darkMode ? 'text-white' : 'text-slate-900'}`}>24/7 AI Sentinel</p>
              <p className={`text-[11px] font-medium m-0 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Multilingual Guard</p>
            </div>
          </div>
        </div>

        {/* 3. Core Features Section (Exact replica of EduManage Core Features Grid with Crisp Text) */}
        <section id="features" className="scroll-mt-24 space-y-10 text-center">
          <div className="space-y-2">
            <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-950'
            }`}>
              Core Features Built for Modern Education
            </h2>
            <p className={`text-sm sm:text-base font-medium max-w-2xl mx-auto ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Equipped with real-time tracking, 24/7 SOS response, AI intelligence, and verified emergency contacts.
            </p>
          </div>

          {/* Feature Cards Grid (Row of 4 Cards with Distinct Colored Icons and Crisp Contrast) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            
            {/* Card 1: Blue Icon (Emergency SOS) */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 card-hover-lift ${
              darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-md shadow-slate-200/50'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-extrabold mb-2 ${
                darkMode ? 'text-white' : 'text-slate-950'
              }`}>
                Instant SOS & Emergency Alert
              </h3>
              <p className={`text-xs sm:text-sm font-medium leading-relaxed ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                One-tap emergency panic button dispatches live coordinates and alerts to nearby police patrol & emergency services.
              </p>
            </div>

            {/* Card 2: Green Icon (Real-Time GPS Tracking) */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 card-hover-lift ${
              darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-md shadow-slate-200/50'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-extrabold mb-2 ${
                darkMode ? 'text-white' : 'text-slate-950'
              }`}>
                Geo-Fenced GPS Tracking
              </h3>
              <p className={`text-xs sm:text-sm font-medium leading-relaxed ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Automated safe-zone monitoring alerts tourists when entering high-risk areas or straying from guided paths.
              </p>
            </div>

            {/* Card 3: Yellow/Amber Icon (AI Safety Assistant) */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 card-hover-lift ${
              darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-md shadow-slate-200/50'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-extrabold mb-2 ${
                darkMode ? 'text-white' : 'text-slate-950'
              }`}>
                AI Sentinel Assistant
              </h3>
              <p className={`text-xs sm:text-sm font-medium leading-relaxed ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Multilingual AI chatbot providing instant local advisory, weather updates, travel booking guidance, and safety tips.
              </p>
            </div>

            {/* Card 4: Red Icon (Verified Help & Incident Management) */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 card-hover-lift ${
              darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-md shadow-slate-200/50'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 font-bold">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-extrabold mb-2 ${
                darkMode ? 'text-white' : 'text-slate-950'
              }`}>
                Verified Incident Portal
              </h3>
              <p className={`text-xs sm:text-sm font-medium leading-relaxed ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Report incidents, request medical assistance, find nearby police stations, hospitals, and embassy contacts instantly.
              </p>
            </div>

          </div>
        </section>

        {/* 4. Roles Section */}
        <section id="roles" className="scroll-mt-24 space-y-8">
          <div className="text-center space-y-2">
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-950'
            }`}>
              Roles & User Access Levels
            </h2>
            <p className={`text-sm font-medium max-w-xl mx-auto ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Tailored dashboards and tools for tourists, security officials, emergency responders, and administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-2xl border space-y-3 ${
              darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-extrabold text-sm">
                01
              </div>
              <h3 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Tourists & Travelers</h3>
              <p className={`text-xs sm:text-sm font-medium leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Access live safety maps, 1-tap SOS signal dispatch, verified travel/rides/food services, and AI voice assistance.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-3 ${
              darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 flex items-center justify-center font-extrabold text-sm">
                02
              </div>
              <h3 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Emergency Services & Police</h3>
              <p className={`text-xs sm:text-sm font-medium leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Real-time alert dispatch console, GPS victim locator, active tracking during emergencies, and dispatch log.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-3 ${
              darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-extrabold text-sm">
                03
              </div>
              <h3 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Tourism Board & Admins</h3>
              <p className={`text-xs sm:text-sm font-medium leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Central management dashboard for tourist statistics, safe-zone configuration, verified vendor approvals, and audit logs.
              </p>
            </div>
          </div>
        </section>

        {/* 5. About Us Section */}
        <section id="about" className={`scroll-mt-24 rounded-3xl p-8 sm:p-12 border ${
          darkMode ? 'bg-slate-800/60 border-slate-700 text-white' : 'bg-slate-900 text-white border-slate-800 shadow-xl'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                About RakshaSetu AI
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Empowering Safe & Frictionless Tourism Across India
              </h2>
              <p className="text-sm text-slate-200 font-medium leading-relaxed">
                RakshaSetu AI combines cutting-edge location telemetry, predictive danger zoning, and automated emergency alert dispatching to ensure international and domestic tourists explore destinations with peace of mind.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-200 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-400" /> Integrated directly with National Emergency Helpline 112
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-400" /> End-to-end encryption & location privacy controls
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-400" /> 24/7 AI-driven assistance in over 12 languages
                </li>
              </ul>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
              <img 
                src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80" 
                alt="Taj Mahal Agra Safe Tourism" 
                className="w-full h-72 object-cover"
              />
            </div>
          </div>
        </section>

        {/* 6. Contact Us Section */}
        <section id="contact" className="scroll-mt-24 space-y-8">
          <div className="text-center space-y-2">
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-950'
            }`}>
              Get in Touch with Our Safety Team
            </h2>
            <p className={`text-sm font-medium max-w-xl mx-auto ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Have questions or need assistance? Send us a message or reach out to our emergency support line.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className={`lg:col-span-1 p-6 rounded-2xl border space-y-6 ${
              darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <h3 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Emergency Contacts</h3>
              
              <div className="space-y-5 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-bold">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-extrabold m-0 ${darkMode ? 'text-white' : 'text-slate-950'}`}>National Police & Emergency</p>
                    <p className={`font-semibold m-0 mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Dial 112 (Toll Free 24/7)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-extrabold m-0 ${darkMode ? 'text-white' : 'text-slate-950'}`}>Tourist Support Desk</p>
                    <p className={`font-semibold m-0 mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>support@rakshasetu.gov.in</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-bold">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-extrabold m-0 ${darkMode ? 'text-white' : 'text-slate-950'}`}>Ministry of Tourism HQ</p>
                    <p className={`font-semibold m-0 mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Sansad Marg, New Delhi</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`lg:col-span-2 p-6 sm:p-8 rounded-2xl border ${
              darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-md'
            }`}>
              {contactSubmitted ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Message Sent Successfully</h4>
                  <p className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Our safety support representative will reply to your email within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="John Doe"
                        className={`w-full px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none ${
                          darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-950 placeholder:text-slate-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="john@example.com"
                        className={`w-full px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none ${
                          darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-950 placeholder:text-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>Subject</label>
                    <input 
                      type="text" 
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="Safety Inquiry / Feedback"
                      className={`w-full px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-950 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>Message</label>
                    <textarea 
                      rows="4"
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe your inquiry here..."
                      className={`w-full px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-950 placeholder:text-slate-400'
                      }`}
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="px-7 py-3 rounded-xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-900/30 transition-all cursor-pointer"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className={`mt-20 border-t py-8 px-4 text-center text-xs sm:text-sm ${
        darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700 font-medium'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="m-0">© 2026 RakshaSetu AI Tourist Safety & Emergency System. All rights reserved.</p>
          <div className="flex items-center gap-6 font-semibold">
            <button onClick={() => scrollToSection('features')} className="hover:underline cursor-pointer">Features</button>
            <button onClick={() => scrollToSection('roles')} className="hover:underline cursor-pointer">Roles</button>
            <button onClick={() => scrollToSection('about')} className="hover:underline cursor-pointer">About</button>
            <button onClick={() => scrollToSection('contact')} className="hover:underline cursor-pointer">Contact</button>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
