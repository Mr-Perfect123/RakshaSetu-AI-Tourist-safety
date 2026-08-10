import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SosMonitor from './pages/SosMonitor';
import Incidents from './pages/Incidents';
import UsersPage from './pages/Users';
import HeatmapPage from './pages/Heatmap';
import RespondersPage from './pages/Responders';
import AnalyticsPage from './pages/Analytics';
import SettingsPage from './pages/Settings';
import DatabaseMgmt from './pages/DatabaseMgmt';
import AiChat from './pages/AiChat';
import Login from './pages/Login';

const App = () => {
  const token = localStorage.getItem('rakshasetu_token') || 'demo_token';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            token ? (
              <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
                <Navbar />
                <div className="flex flex-1">
                  <Sidebar />
                  <main className="flex-1 p-6 overflow-y-auto">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/sos" element={<SosMonitor />} />
                      <Route path="/ai-chat" element={<AiChat />} />
                      <Route path="/incidents" element={<Incidents />} />
                      <Route path="/users" element={<UsersPage />} />
                      <Route path="/heatmap" element={<HeatmapPage />} />
                      <Route path="/responders" element={<RespondersPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/database" element={<DatabaseMgmt />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
