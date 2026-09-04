import React, { useState, useEffect } from 'react';
import { Shield, PhoneCall, Sparkles, LogOut, Sun, Moon, Car, Utensils, Map, Ticket, Globe, Bookmark, User, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import NotificationCenter from './NotificationCenter';
import axios from 'axios';

const Navbar = ({ tourist, onLogout, darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [currentCity, setCurrentCity] = useState('Detecting GPS...');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
              headers: { 'User-Agent': 'RakshaSetu/1.0' },
              timeout: 3000
            });
            if (res.data?.address) {
              const addr = res.data.address;
              const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Local Area';
              const state = addr.state || '';
              setCurrentCity(`${city}${state ? `, ${state}` : ''}`);
            } else {
              setCurrentCity(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
            }
          } catch {
            setCurrentCity('Coimbatore, Tamil Nadu');
          }
        },
        () => setCurrentCity('Location Active')
      );
    }
  }, []);

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-3 md:px-8 py-2.5 flex items-center justify-between shadow-xs transition-colors duration-300 ${
      darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
    }`}>
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 decoration-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] flex items-center justify-center text-white shadow-md shadow-blue-900/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-base md:text-lg font-extrabold tracking-tight flex items-center gap-2 m-0 leading-none ${
              darkMode ? 'text-blue-400' : 'text-[#0D47A1]'
            }`}>
              RAKSHASETU
              <span className={`hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
              }`}>{t('dashboard.touristSafeBadge', 'Tourist Safe')}</span>
            </h1>
            <p className={`text-[10px] font-medium m-0 mt-0.5 hidden sm:block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('dashboard.navbarTitleDesc', 'AI Tourist Safety & Exploration')}
            </p>
          </div>
        </Link>

        {/* Live GPS Location Badge */}
        <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${
          darkMode ? 'bg-slate-800/80 border-slate-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate max-w-[160px]">{currentCity}</span>
        </div>
      </div>

      {/* Right Controls & Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Amazon-Style Multilingual Language Selector (8 Languages) */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl border bg-slate-800/10 border-slate-500/20 text-xs font-bold">
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
            <option value="Telugu" className="text-slate-900">🇮🇳 తెలుగు (Telugu)</option>
            <option value="Malayalam" className="text-slate-900">🇮🇳 മലയാളം (Malayalam)</option>
            <option value="Kannada" className="text-slate-900">🇮🇳 ಕನ್ನಡ (Kannada)</option>
            <option value="Bengali" className="text-slate-900">🇮🇳 বাংলা (Bengali)</option>
          </select>
        </div>

        {tourist ? (
          <>
            {/* Nav Quick Links for Desktop */}
            <div className="hidden xl:flex items-center gap-1.5">
              <Link
                to="/safety-map"
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Map className="w-3.5 h-3.5 text-emerald-500" /> {t('nav.safetyMap', 'Map')}
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
                to="/bookings"
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 text-purple-500" /> {t('nav.bookings', 'Bookings')}
              </Link>

              <Link
                to="/saved"
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-500" /> {t('nav.saved', 'Saved')}
              </Link>

              <Link
                to="/ai"
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> {t('nav.aiAssistant', 'AI')}
              </Link>
            </div>

            {/* Notification Center */}
            <NotificationCenter darkMode={darkMode} />
          </>
        ) : null}

        {/* Admin Command Center Quick Button */}
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            darkMode
              ? 'bg-red-950/40 border-red-800/60 text-red-300 hover:bg-red-900/60'
              : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
          }`}
          title="Open Admin Command Center (Port 5173)"
        >
          <Shield className="w-3.5 h-3.5 text-red-600 animate-pulse" />
          <span>{t('dashboard.navbarAdminLink', 'Admin Command')}</span>
        </a>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-xl transition-all duration-300 cursor-pointer ${
            darkMode
              ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
          title={darkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <a
          href="tel:112"
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/20 font-extrabold text-xs hover:bg-[#D32F2F] hover:text-white transition-all"
        >
          <PhoneCall className="w-3.5 h-3.5" /> Call 112
        </a>

        {tourist ? (
          <div className="flex items-center gap-1.5">
            <Link
              to="/profile"
              className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all ${
                darkMode ? 'bg-blue-900/50 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-[#0D47A1] border-blue-300'
              }`}
              title="My Profile"
            >
              {tourist.full_name ? tourist.full_name.charAt(0).toUpperCase() : 'T'}
            </Link>

            <button
              onClick={onLogout}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                darkMode ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'
              }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            style={{ color: '#ffffff' }}
            className="px-4 py-1.5 rounded-xl bg-[#0D47A1] hover:bg-blue-900 !text-white font-bold text-xs shadow-sm transition-all decoration-none flex items-center justify-center"
          >
            {t('dashboard.navbarLoginBtn', 'Sign In')}
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
