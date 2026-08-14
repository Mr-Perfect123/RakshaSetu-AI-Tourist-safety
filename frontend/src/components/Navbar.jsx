import React from 'react';
import { Shield, PhoneCall, Sparkles, LogOut, Sun, Moon, Car, Utensils, Compass, Ticket, Map, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

const Navbar = ({ tourist, onLogout, darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 md:px-8 py-3 flex items-center justify-between shadow-xs transition-colors duration-300 ${
      darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
    }`}>
      <Link to="/" className="flex items-center gap-3 decoration-none">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] flex items-center justify-center text-white shadow-md shadow-blue-900/20">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className={`text-lg md:text-xl font-extrabold tracking-tight flex items-center gap-2 m-0 leading-none ${
            darkMode ? 'text-blue-400' : 'text-[#0D47A1]'
          }`}>
            RAKSHASETU <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
            }`}>Tourist Safe</span>
          </h1>
          <p className={`text-[11px] font-medium m-0 mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            AI Tourist Protection & Emergency Guard
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Amazon-Style Global Language Picker */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl border bg-slate-800/10 border-slate-500/20 text-xs font-bold">
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-xs font-bold outline-none cursor-pointer"
          >
            <option value="English" className="text-slate-900">🇬🇧 English</option>
            <option value="Hindi" className="text-slate-900">🇮🇳 हिंदी (Hindi)</option>
            <option value="Tamil" className="text-slate-900">🇮🇳 தமிழ் (Tamil)</option>
            <option value="Marathi" className="text-slate-900">🇮🇳 मराठी (Marathi)</option>
          </select>
        </div>

        {tourist ? (
          <>
            {/* Navigation Quick Links when Logged In */}
            <Link
              to="/safety-map"
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-emerald-500" /> {t('nav.safetyMap', 'Safety Map')}
            </Link>

            <Link
              to="/travel"
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-purple-600" /> {t('nav.travel', 'Travel Hub')}
            </Link>

            <Link
              to="/vehicles"
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-blue-600" /> {t('nav.vehicles', 'Rides')}
            </Link>

            <Link
              to="/food"
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-amber-500" /> {t('nav.food', 'Food')}
            </Link>

            <Link
              to="/ai"
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> {t('nav.aiAssistant', 'AI Sentinel')}
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/landing"
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold hidden md:block ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Overview
            </Link>
          </>
        )}

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className={`p-2.5 rounded-xl transition-all duration-300 cursor-pointer ${
            darkMode
              ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        <a
          href="tel:112"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/20 font-bold text-xs hover:bg-[#D32F2F] hover:text-white transition-all"
        >
          <PhoneCall className="w-3.5 h-3.5" /> Call 112
        </a>

        {tourist ? (
          <>
            <div className={`h-6 w-px ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>

            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-[#0D47A1]'
              }`}>
                {tourist.full_name ? tourist.full_name.charAt(0).toUpperCase() : 'T'}
              </div>
              <div className="hidden lg:block text-left">
                <p className={`text-xs font-bold m-0 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {tourist.full_name}
                </p>
                <p className={`text-[10px] font-medium m-0 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {tourist?.nationality || 'Tourist'}
                </p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                darkMode ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'
              }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="px-5 py-2 rounded-xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-medium text-xs shadow-sm transition-all decoration-none flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" /> Login
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
