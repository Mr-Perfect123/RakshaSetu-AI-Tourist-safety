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
import DangerZonesMgmt from './pages/DangerZonesMgmt';
import RedAlertsAdmin from './pages/RedAlertsAdmin';
import VehicleBookingsAdmin from './pages/VehicleBookingsAdmin';
import FoodOrdersAdmin from './pages/FoodOrdersAdmin';
import TravelBookingsAdmin from './pages/TravelBookingsAdmin';
import Login from './pages/Login';

import { LanguageProvider } from './context/LanguageContext';

/* ── Error Boundary ────────────────────────────────────────────── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[RakshaSetu ErrorBoundary]', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-8">
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl border border-red-200 shadow-xl max-w-lg text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl font-black">!</div>
            <h2 className="text-lg font-extrabold text-slate-900">Component Render Error</h2>
            <p className="text-xs text-slate-600 font-medium">{this.state.error?.message || 'An unexpected error occurred in this section.'}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-6 py-2.5 rounded-xl bg-[#0D47A1] text-white font-bold text-xs cursor-pointer hover:bg-blue-800 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── App ───────────────────────────────────────────────────────── */
const App = () => {
  const token = localStorage.getItem('rakshasetu_token') || localStorage.getItem('token') || 'demo_token';

  return (
    <LanguageProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              token ? (
                <div className="min-h-screen app-admin-bg flex flex-col">
                  <Navbar />
                  <div className="flex flex-1">
                    <Sidebar />
                    <main className="flex-1 p-6 overflow-y-auto">
                      <ErrorBoundary>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/sos" element={<SosMonitor />} />
                          <Route path="/ai-chat" element={<AiChat />} />
                          <Route path="/incidents" element={<Incidents />} />
                          <Route path="/users" element={<UsersPage />} />
                          <Route path="/heatmap" element={<HeatmapPage />} />
                          <Route path="/responders" element={<RespondersPage />} />
                          <Route path="/analytics" element={<AnalyticsPage />} />
                          <Route path="/zones" element={<DangerZonesMgmt />} />
                          <Route path="/red-alerts" element={<RedAlertsAdmin />} />
                          <Route path="/vehicle-bookings" element={<VehicleBookingsAdmin />} />
                          <Route path="/travel-bookings" element={<TravelBookingsAdmin />} />
                          <Route path="/food-orders" element={<FoodOrdersAdmin />} />
                          <Route path="/database" element={<DatabaseMgmt />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </ErrorBoundary>
                    </main>
                  </div>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  </LanguageProvider>
  );
};

export default App;
