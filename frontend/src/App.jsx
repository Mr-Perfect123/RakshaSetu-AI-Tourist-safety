import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import AiAssistant from './pages/AiAssistant';
import Incidents from './pages/Incidents';
import NearbyHelp from './pages/NearbyHelp';
import EmergencyContacts from './pages/EmergencyContacts';
import LiveChat from './pages/LiveChat';
import FloatingChatbot from './components/FloatingChatbot';

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

  // Dark Mode State — persisted in localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('rakshasetu_dark_mode');
    if (saved !== null) return saved === 'true';
    // Default to system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('rakshasetu_dark_mode', String(next));
      return next;
    });
  };

  // Apply dark class to root HTML element for global reach
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
        {tourist && <Navbar tourist={tourist} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}

        <main className="flex-1 px-4 md:px-8 py-6">
          <Routes>
            <Route path="/login" element={<Login onLoginSuccess={(u) => setTourist(u)} darkMode={darkMode} />} />
            <Route path="/register" element={<Register onLoginSuccess={(u) => setTourist(u)} darkMode={darkMode} />} />
            <Route
              path="/*"
              element={
                tourist ? (
                  <Routes>
                    <Route path="/" element={<Dashboard tourist={tourist} darkMode={darkMode} />} />
                    <Route path="/ai" element={<AiAssistant darkMode={darkMode} />} />
                    <Route path="/incidents" element={<Incidents darkMode={darkMode} />} />
                    <Route path="/nearby" element={<NearbyHelp darkMode={darkMode} />} />
                    <Route path="/contacts" element={<EmergencyContacts tourist={tourist} darkMode={darkMode} />} />
                    <Route path="/chat" element={<LiveChat tourist={tourist} darkMode={darkMode} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </main>
        {tourist && <FloatingChatbot tourist={tourist} darkMode={darkMode} />}
      </div>
    </BrowserRouter>
  );
}

export default App;
