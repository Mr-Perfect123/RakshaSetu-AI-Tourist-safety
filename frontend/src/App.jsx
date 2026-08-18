import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OtpVerification from './pages/OtpVerification';
import PlaceDetails from './pages/PlaceDetails';
import VehicleBooking from './pages/VehicleBooking';
import TravelBooking from './pages/TravelBooking';
import SafetyMap from './pages/SafetyMap';
import FoodModule from './pages/FoodModule';
import AiAssistant from './pages/AiAssistant';
import Incidents from './pages/Incidents';
import NearbyHelp from './pages/NearbyHelp';
import EmergencyContacts from './pages/EmergencyContacts';
import LiveChat from './pages/LiveChat';
import FloatingChatbot from './components/FloatingChatbot';
import PrivacySettings from './pages/PrivacySettings';
import ErrorBoundary from './components/ErrorBoundary';
import { Clock, AlertTriangle } from 'lucide-react';

import { LanguageProvider } from './context/LanguageContext';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 Minutes Inactivity Timeout Limit

const AdminRedirect = () => {
  useEffect(() => {
    window.location.href = 'http://localhost:5173';
  }, []);

  return (
    <div className="p-12 text-center space-y-4">
      <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center mx-auto animate-bounce">
        <Clock className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-black text-slate-800">Redirecting to RakshaSetu Admin Command Center...</h2>
      <p className="text-xs text-slate-500 font-semibold">Opening Command Portal on Port 5173</p>
      <a
        href="http://localhost:5173"
        className="inline-block px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs shadow-md"
      >
        Click Here to Open Admin Command Center
      </a>
    </div>
  );
};

function App() {
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  const [tourist, setTourist] = useState(() => {
    const saved = localStorage.getItem('rakshasetu_tourist_user');
    const lastAct = localStorage.getItem('rakshasetu_last_activity');
    if (saved) {
      if (lastAct && (Date.now() - parseInt(lastAct, 10) > SESSION_TIMEOUT_MS)) {
        localStorage.removeItem('rakshasetu_tourist_token');
        localStorage.removeItem('rakshasetu_tourist_user');
        localStorage.removeItem('rakshasetu_last_activity');
        return null;
      }
      return JSON.parse(saved);
    }
    return null;
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('rakshasetu_dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('rakshasetu_dark_mode', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = useCallback((dueToTimeout = false) => {
    localStorage.removeItem('rakshasetu_tourist_token');
    localStorage.removeItem('rakshasetu_tourist_user');
    localStorage.removeItem('rakshasetu_last_activity');
    setTourist(null);

    if (dueToTimeout) {
      setSessionExpiredNotice(true);
      setTimeout(() => setSessionExpiredNotice(false), 7000);
    }
  }, []);

  // Update Activity Timestamp on User Interaction
  const updateActivity = useCallback(() => {
    if (tourist) {
      const now = Date.now();
      const last = localStorage.getItem('rakshasetu_last_activity');
      if (!last || (now - parseInt(last, 10) > 10000)) { // Throttled every 10s
        localStorage.setItem('rakshasetu_last_activity', String(now));
      }
    }
  }, [tourist]);

  useEffect(() => {
    if (!tourist) return;

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, updateActivity));

    // Check Session Expiration Every 15 Seconds
    const interval = setInterval(() => {
      const lastAct = localStorage.getItem('rakshasetu_last_activity');
      if (lastAct && (Date.now() - parseInt(lastAct, 10) > SESSION_TIMEOUT_MS)) {
        handleLogout(true);
      }
    }, 15000);

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      clearInterval(interval);
    };
  }, [tourist, updateActivity, handleLogout]);

  return (
    <LanguageProvider tourist={tourist}>
      <BrowserRouter>
        <div className={`min-h-screen flex flex-col font-sans app-tourist-bg bg-security-grid ${darkMode ? 'dark text-slate-100' : 'text-slate-800'}`}>
        
        {/* Session Expired Banner Notification */}
        {sessionExpiredNotice && (
          <div className="bg-amber-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-lg sticky top-0 z-50 animate-bounce">
            <div className="flex items-center gap-2 max-w-7xl mx-auto">
              <Clock className="w-4 h-4 text-amber-200" />
              <span>Session timed out after 30 minutes of inactivity. Please sign in again to continue.</span>
            </div>
            <button 
              onClick={() => setSessionExpiredNotice(false)} 
              className="text-amber-200 hover:text-white font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        <Navbar tourist={tourist} onLogout={() => handleLogout(false)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        <main className="flex-1 px-4 md:px-8 py-6">
          <ErrorBoundary>
            <Routes>
              {/* Public & Landing Page Routes */}
              <Route path="/landing" element={<LandingPage tourist={tourist} onLogout={() => handleLogout(false)} darkMode={darkMode} />} />
              <Route path="/places/:id" element={<PlaceDetails darkMode={darkMode} />} />
              <Route path="/places/details/:id" element={<PlaceDetails darkMode={darkMode} />} />
              <Route 
                path="/login" 
                element={
                  <Login 
                    onLoginSuccess={(u) => {
                      setTourist(u);
                      localStorage.setItem('rakshasetu_last_activity', String(Date.now()));
                    }} 
                    darkMode={darkMode} 
                  />
                } 
              />
              <Route 
                path="/register" 
                element={
                  <Register 
                    onLoginSuccess={(u) => {
                      setTourist(u);
                      localStorage.setItem('rakshasetu_last_activity', String(Date.now()));
                    }} 
                    darkMode={darkMode} 
                  />
                } 
              />
              <Route path="/forgot-password" element={<ForgotPassword darkMode={darkMode} />} />
              <Route path="/reset-password" element={<ResetPassword darkMode={darkMode} />} />
              <Route path="/verify-otp" element={<OtpVerification darkMode={darkMode} />} />

              {/* Home Route: Landing Page if not logged in, Dashboard if logged in */}
              <Route 
                path="/" 
                element={
                  tourist ? (
                    <Dashboard tourist={tourist} darkMode={darkMode} />
                  ) : (
                    <LandingPage tourist={tourist} onLogout={() => handleLogout(false)} darkMode={darkMode} />
                  )
                } 
              />

              {/* Admin Portal Redirect Route */}
              <Route path="/admin" element={<AdminRedirect />} />

              {/* Protected Routes */}
              <Route path="/safety-map" element={tourist ? <SafetyMap darkMode={darkMode} /> : <Navigate to="/login" replace />} />
              <Route path="/travel" element={tourist ? <TravelBooking darkMode={darkMode} /> : <Navigate to="/login" replace />} />
              <Route path="/vehicles" element={tourist ? <VehicleBooking darkMode={darkMode} /> : <Navigate to="/login" replace />} />
              <Route path="/food" element={tourist ? <FoodModule darkMode={darkMode} /> : <Navigate to="/login" replace />} />
              <Route path="/ai" element={tourist ? <AiAssistant darkMode={darkMode} /> : <Navigate to="/login" replace />} />
              <Route path="/incidents" element={tourist ? <Incidents darkMode={darkMode} /> : <Navigate to="/login" replace />} />
              <Route path="/nearby" element={tourist ? <NearbyHelp darkMode={darkMode} /> : <Navigate to="/login" replace />} />
              <Route path="/contacts" element={tourist ? <EmergencyContacts tourist={tourist} darkMode={darkMode} /> : <Navigate to="/login" replace />} />
              <Route path="/privacy" element={tourist ? <PrivacySettings darkMode={darkMode} /> : <Navigate to="/login" replace />} />
              <Route path="/chat" element={tourist ? <LiveChat tourist={tourist} darkMode={darkMode} /> : <Navigate to="/login" replace />} />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
        {tourist && <FloatingChatbot tourist={tourist} darkMode={darkMode} />}
      </div>
    </BrowserRouter>
  </LanguageProvider>
  );
}

export default App;
