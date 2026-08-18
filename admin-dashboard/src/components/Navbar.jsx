import React, { useState, useEffect } from 'react';
import { Shield, Bell, UserCheck, AlertTriangle, Volume2, ShieldAlert, Activity, CheckCircle, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import socket from '../services/socket';
import { addNewSosAlert } from '../redux/sosSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { activeSosList } = useSelector((state) => state.sos);
  const [activeNotification, setActiveNotification] = useState(null);

  const playEmergencyChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  };

  const playActivityChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  useEffect(() => {
    socket.emit('join_room', { room: 'admin_dispatch' });
    socket.emit('join_room', { room: 'police_dispatch' });

    // Handle SOS Alert
    const handleSos = (newSos) => {
      dispatch(addNewSosAlert(newSos));
      playEmergencyChime();

      setActiveNotification({
        type: 'sos',
        title: '🚨 EMERGENCY SOS ALERT',
        message: `${newSos.touristName || newSos.tourist_name || 'Tourist'} triggered SOS! Code: ${newSos.sos_code || newSos.sosCode || 'SOS-ALERT'}`,
        timestamp: new Date().toLocaleTimeString()
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 RAKSHASETU EMERGENCY SOS ALERT', {
          body: `Distress signal: ${newSos.sos_code || 'SOS'} from ${newSos.touristName || newSos.tourist_name || 'Tourist'}`,
          icon: '/favicon.svg'
        });
      }
    };

    // Handle Incident Reports
    const handleIncident = (incident) => {
      playEmergencyChime();
      setActiveNotification({
        type: 'incident',
        title: '⚠️ NEW INCIDENT REPORTED',
        message: `${incident.touristName || 'Tourist'} reported incident: ${incident.title || 'Safety Issue'}`,
        timestamp: new Date().toLocaleTimeString()
      });
    };

    // Handle General Tourist Activities
    const handleActivity = (act) => {
      playActivityChime();
      setActiveNotification({
        type: 'activity',
        title: `🔔 ${act.title || 'Tourist Activity'}`,
        message: `${act.touristName || 'Tourist'}: ${act.description || 'New activity logged'}`,
        timestamp: new Date().toLocaleTimeString()
      });
    };

    socket.on('new_sos_alert', handleSos);
    socket.on('sos_notification', handleSos);
    socket.on('new_incident_report', handleIncident);
    socket.on('tourist_activity', handleActivity);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('new_sos_alert', handleSos);
      socket.off('sos_notification', handleSos);
      socket.off('new_incident_report', handleIncident);
      socket.off('tourist_activity', handleActivity);
    };
  }, [dispatch]);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-md">
      {/* Global Real-time Live Alert Toast Banner */}
      {activeNotification && (
        <div className={`px-6 py-2.5 text-white flex items-center justify-between text-xs font-bold shadow-lg animate-in slide-in-from-top duration-200 ${
          activeNotification.type === 'sos'
            ? 'bg-red-600 border-b border-red-700 animate-pulse'
            : activeNotification.type === 'incident'
              ? 'bg-amber-600 border-b border-amber-700'
              : 'bg-[#0D47A1] border-b border-blue-900'
        }`}>
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-white animate-bounce shrink-0" />
            <div>
              <span className="font-extrabold uppercase tracking-wide mr-2">{activeNotification.title}:</span>
              <span>{activeNotification.message}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">{activeNotification.timestamp}</span>
            <button
              onClick={() => setActiveNotification(null)}
              className="p-1 rounded bg-white/20 hover:bg-white/30 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-blue-900/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary tracking-tight flex items-center gap-2">
              RAKSHASETU <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold uppercase">Command Center</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">AI Powered Tourist Protection & Emergency Response System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Active Emergency SOS Alarm Pill */}
          {activeSosList.length > 0 && (
            <div className="sos-pulse-animation px-3 py-1.5 rounded-full bg-danger/10 text-danger border border-danger/30 flex items-center gap-2 text-xs font-bold animate-bounce">
              <AlertTriangle className="w-4 h-4 text-danger" />
              <span>{activeSosList.length} ACTIVE SOS DISPATCHES</span>
              <button onClick={playEmergencyChime} title="Test Emergency Alarm Chime">
                <Volume2 className="w-3.5 h-3.5 text-danger ml-1" />
              </button>
            </div>
          )}

          <div className="relative">
            <button className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors relative">
              <Bell className="w-5 h-5" />
              {activeSosList.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-danger ring-2 ring-white"></span>
              )}
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200"></div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-sm">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800">{user?.full_name || user?.name || 'Chief Dispatcher'}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold text-primary">{user?.role || 'Admin'}</p>
            </div>
            <button
              onClick={() => dispatch(logout())}
              className="text-xs text-slate-500 hover:text-danger font-medium ml-2 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
