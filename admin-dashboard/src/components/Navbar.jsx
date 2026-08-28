import React, { useState, useEffect, useRef } from 'react';
import { Shield, Bell, UserCheck, AlertTriangle, Volume2, ShieldAlert, Activity, CheckCircle, X, Globe, Phone, MapPin, Trash2, ArrowRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import socket from '../services/socket';
import { addNewSosAlert } from '../redux/sosSlice';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
  const { language, setLanguage, t } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { activeSosList } = useSelector((state) => state.sos);
  const [activeNotification, setActiveNotification] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsHistory, setNotificationsHistory] = useState([
    {
      id: 1,
      type: 'sos',
      title: '🚨 Emergency SOS Triggered',
      touristName: 'John Smith (UK Tourist)',
      phone: '+44 7911 123456',
      address: 'Inner Circle, Connaught Place, New Delhi',
      code: 'SOS-RS-8891',
      time: '5 mins ago',
      read: false
    },
    {
      id: 2,
      type: 'sos',
      title: '🚨 Distress Panic Trigger',
      touristName: 'Elena Rostova',
      phone: '+7 912 345 6789',
      address: 'Marudamalai Temple, Coimbatore',
      code: 'SOS-RS-4420',
      time: '25 mins ago',
      read: true
    }
  ]);

  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      const touristName = newSos.touristName || newSos.tourist_name || 'Tourist User';
      const touristPhone = newSos.touristPhone || newSos.phone || '+91 98765 43210';
      const address = newSos.address || `Lat: ${newSos.latitude}, Lng: ${newSos.longitude}`;
      const code = newSos.sos_code || newSos.sosCode || `SOS-${Date.now().toString().slice(-6)}`;

      setActiveNotification({
        type: 'sos',
        title: '🚨 EMERGENCY SOS ALERT',
        message: `${touristName} (${touristPhone}) triggered SOS! Code: ${code} at ${address}`,
        timestamp: new Date().toLocaleTimeString()
      });

      setNotificationsHistory((prev) => [
        {
          id: Date.now(),
          type: 'sos',
          title: '🚨 Emergency SOS Triggered',
          touristName,
          phone: touristPhone,
          address,
          code,
          time: 'Just now',
          read: false
        },
        ...prev.slice(0, 40)
      ]);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 RAKSHASETU EMERGENCY SOS ALERT', {
          body: `Distress signal from ${touristName} (${touristPhone}) at ${address}`,
          icon: '/favicon.svg'
        });
      }
    };

    // Handle Incident Reports
    const handleIncident = (incident) => {
      playEmergencyChime();
      const touristName = incident.touristName || 'Tourist';
      const title = incident.title || 'Safety Issue';

      setActiveNotification({
        type: 'incident',
        title: '⚠️ NEW INCIDENT REPORTED',
        message: `${touristName} reported: ${title}`,
        timestamp: new Date().toLocaleTimeString()
      });

      setNotificationsHistory((prev) => [
        {
          id: Date.now(),
          type: 'incident',
          title: `⚠️ Incident: ${title}`,
          touristName,
          phone: incident.phone || '',
          address: incident.location || incident.address || 'Reported Location',
          code: `INC-${Date.now().toString().slice(-4)}`,
          time: 'Just now',
          read: false
        },
        ...prev.slice(0, 40)
      ]);
    };

    // Handle General Tourist Activities
    const handleActivity = (act) => {
      playActivityChime();
      const touristName = act.touristName || 'Tourist';
      const desc = act.description || 'New activity logged';

      setActiveNotification({
        type: 'activity',
        title: `🔔 ${act.title || 'Tourist Activity'}`,
        message: `${touristName}: ${desc}`,
        timestamp: new Date().toLocaleTimeString()
      });

      setNotificationsHistory((prev) => [
        {
          id: Date.now(),
          type: 'activity',
          title: `🔔 ${act.title || 'Activity'}`,
          touristName,
          phone: act.touristPhone || '',
          address: desc,
          code: act.type?.toUpperCase() || 'ACTIVITY',
          time: 'Just now',
          read: false
        },
        ...prev.slice(0, 40)
      ]);
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

  const unreadCount = notificationsHistory.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotificationsHistory(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotificationsHistory([]);
  };

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
              {t('navbar.title', 'RAKSHASETU')} <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold uppercase">{t('navbar.subBadge', 'Command Center')}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">{t('navbar.subtitle', 'AI Powered Tourist Protection & Emergency Response System')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Active Emergency SOS Alarm Pill */}
          {activeSosList.length > 0 && (
            <div className="sos-pulse-animation px-3 py-1.5 rounded-full bg-danger/10 text-danger border border-danger/30 flex items-center gap-2 text-xs font-bold animate-bounce">
              <AlertTriangle className="w-4 h-4 text-danger" />
              <span>{activeSosList.length} {t('navbar.activeSos', 'ACTIVE SOS DISPATCHES')}</span>
              <button onClick={playEmergencyChime} title="Test Emergency Alarm Chime">
                <Volume2 className="w-3.5 h-3.5 text-danger ml-1" />
              </button>
            </div>
          )}

          {/* Interactive Notification Bell & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(prev => !prev)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                showNotifications || unreadCount > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/80'
              }`}
              title="Notifications Center"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-96 max-w-[90vw] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Dropdown Header */}
                <div className="p-4 bg-gradient-to-r from-[#0a2540] to-[#0D47A1] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-300" />
                    <h3 className="font-extrabold text-sm m-0">Live Notifications</h3>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                      {notificationsHistory.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-blue-200 hover:text-white font-bold cursor-pointer underline"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={clearAllNotifications}
                      className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                      title="Clear All"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notificationsHistory.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600 m-0">No new notifications</p>
                      <p className="text-[10px] text-slate-400 mt-1 m-0">All SOS dispatches and safety alerts will appear here in real-time.</p>
                    </div>
                  ) : (
                    notificationsHistory.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.type === 'sos') navigate('/sos');
                          setShowNotifications(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer space-y-1.5 ${
                          !item.read ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            item.type === 'sos'
                              ? 'bg-red-100 text-red-700'
                              : item.type === 'incident'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
                        </div>

                        <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                          <span>👤 {item.touristName}</span>
                          {item.phone && (
                            <span className="text-[11px] text-blue-600 font-mono flex items-center gap-1 font-bold">
                              <Phone className="w-3 h-3" /> {item.phone}
                            </span>
                          )}
                        </div>

                        {item.address && (
                          <div className="text-[11px] text-slate-600 flex items-start gap-1 font-medium line-clamp-2">
                            <MapPin className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                            <span>{item.address}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 text-[10px] font-bold text-slate-400">
                          <span className="font-mono text-primary">{item.code}</span>
                          {item.type === 'sos' && (
                            <span className="text-red-600 flex items-center gap-0.5 hover:underline">
                              Dispatch Now <ArrowRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Dropdown Footer */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <Link
                    to="/sos"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-extrabold text-primary hover:underline inline-flex items-center gap-1.5"
                  >
                    Open SOS Command Monitor <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Language Switcher Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-xs">
            <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="English" className="text-slate-900">EN (English)</option>
              <option value="Hindi" className="text-slate-900">HI (हिंदी)</option>
              <option value="Marathi" className="text-slate-900">MR (मराठी)</option>
              <option value="Tamil" className="text-slate-900">TA (தமிழ்)</option>
              <option value="Telugu" className="text-slate-900">TE (తెలుగు)</option>
              <option value="Kannada" className="text-slate-900">KN (ಕನ್ನಡ)</option>
              <option value="Malayalam" className="text-slate-900">ML (മലയാളം)</option>
            </select>
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
              {t('navbar.logout', 'Logout')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
