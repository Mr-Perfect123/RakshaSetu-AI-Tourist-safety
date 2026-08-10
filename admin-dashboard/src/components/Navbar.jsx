import React, { useEffect } from 'react';
import { Shield, Bell, UserCheck, AlertTriangle, Volume2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import socket from '../services/socket';
import { addNewSosAlert } from '../redux/sosSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { activeSosList } = useSelector((state) => state.sos);

  const playEmergencyChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  useEffect(() => {
    socket.emit('join_room', { room: 'admin_dispatch' });

    socket.on('new_sos_alert', (newSos) => {
      dispatch(addNewSosAlert(newSos));
      playEmergencyChime();

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 RAKSHASETU EMERGENCY SOS ALERT', {
          body: `Distress signal received: ${newSos.sos_code || 'SOS-ALERT'} from ${newSos.tourist_name || 'Tourist'}`,
          icon: '/favicon.svg'
        });
      }
    });

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('new_sos_alert');
    };
  }, [dispatch]);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
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
            {user ? user.full_name.charAt(0) : 'A'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800">{user ? user.full_name : 'Chief Dispatcher'}</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold text-primary">{user ? user.role : 'Admin'}</p>
          </div>
          <button
            onClick={() => dispatch(logout())}
            className="text-xs text-slate-500 hover:text-danger font-medium ml-2 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
