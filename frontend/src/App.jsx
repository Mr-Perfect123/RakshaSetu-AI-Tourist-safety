import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
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

function App() {
  const [tourist, setTourist] = useState(() => {
    const saved = localStorage.getItem('rakshasetu_tourist_user');
    return saved ? JSON.parse(saved) : {
      id: 4,
      full_name: 'John Doe Tourist',
      email: 'john.tourist@example.com',
      phone: '+919876543213',
      nationality: 'American',
      passport_number: 'US-98421034',
      gender: 'male',
      blood_group: 'O+',
      emergency_medical_info: 'Asthma - Carries inhaler',
      hotel_address: 'The Grand Heritage Hotel, Connaught Place, New Delhi'
    };
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

  const handleLogout = () => {
    localStorage.removeItem('rakshasetu_tourist_token');
    localStorage.removeItem('rakshasetu_tourist_user');
    setTourist(null);
  };

  return (
    <BrowserRouter>
      <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark bg-[#0f172a] text-slate-100' : 'bg-[#F5F7FA] text-slate-800'}`}>
        <Navbar tourist={tourist} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        <main className="flex-1 px-4 md:px-8 py-6">
          <ErrorBoundary>
            <Routes>
              {/* Public Routes */}
              <Route path="/places/:id" element={<PlaceDetails darkMode={darkMode} />} />
              <Route path="/places/details/:id" element={<PlaceDetails darkMode={darkMode} />} />
              <Route path="/login" element={<Login onLoginSuccess={(u) => setTourist(u)} darkMode={darkMode} />} />
              <Route path="/register" element={<Register onLoginSuccess={(u) => setTourist(u)} darkMode={darkMode} />} />
              <Route path="/forgot-password" element={<ForgotPassword darkMode={darkMode} />} />
              <Route path="/reset-password" element={<ResetPassword darkMode={darkMode} />} />
              <Route path="/verify-otp" element={<OtpVerification darkMode={darkMode} />} />

              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  tourist ? (
                    <Routes>
                      <Route path="/" element={<Dashboard tourist={tourist} darkMode={darkMode} />} />
                      <Route path="/safety-map" element={<SafetyMap darkMode={darkMode} />} />
                      <Route path="/travel" element={<TravelBooking darkMode={darkMode} />} />
                      <Route path="/vehicles" element={<VehicleBooking darkMode={darkMode} />} />
                      <Route path="/food" element={<FoodModule darkMode={darkMode} />} />
                      <Route path="/ai" element={<AiAssistant darkMode={darkMode} />} />
                      <Route path="/incidents" element={<Incidents darkMode={darkMode} />} />
                      <Route path="/nearby" element={<NearbyHelp darkMode={darkMode} />} />
                      <Route path="/contacts" element={<EmergencyContacts tourist={tourist} darkMode={darkMode} />} />
                      <Route path="/privacy" element={<PrivacySettings darkMode={darkMode} />} />
                      <Route path="/chat" element={<LiveChat tourist={tourist} darkMode={darkMode} />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
          </ErrorBoundary>
        </main>
        {tourist && <FloatingChatbot tourist={tourist} darkMode={darkMode} />}
      </div>
    </BrowserRouter>
  );
}

export default App;
