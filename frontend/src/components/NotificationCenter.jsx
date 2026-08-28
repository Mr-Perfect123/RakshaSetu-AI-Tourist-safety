import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, Car, CloudRain, CheckCircle, Info, X, Clock } from 'lucide-react';
import socket from '../services/socket';

const NotificationCenter = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'RakshaSetu Live Protection Active',
      message: 'GPS location tracking & spatio-temporal safety monitoring enabled.',
      time: 'Just now',
      type: 'system',
      read: false
    },
    {
      id: 2,
      title: 'Weather Advisory',
      message: 'Pleasant & clear weather reported in your current sector.',
      time: '10m ago',
      type: 'weather',
      read: false
    }
  ]);

  useEffect(() => {
    // Listen for live socket notifications from backend / admin dashboard
    const handleSocketNotification = (data) => {
      if (data) {
        const newNotif = {
          id: Date.now(),
          title: data.title || 'RakshaSetu Safety Alert',
          message: data.description || data.message || 'Notification received from RakshaSetu Command Center.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: data.type || 'alert',
          read: false
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }
    };

    socket.on('tourist_notification', handleSocketNotification);
    socket.on('sos_status_update', handleSocketNotification);

    return () => {
      socket.off('tourist_notification', handleSocketNotification);
      socket.off('sos_status_update', handleSocketNotification);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
          darkMode
            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
        }`}
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-extrabold flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 md:w-96 rounded-2xl p-4 shadow-2xl border z-50 animate-fade-in ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/20">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-extrabold m-0">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 font-bold text-[10px]">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-blue-500 hover:underline cursor-pointer"
              >
                Mark read
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto py-2 space-y-2">
            {notifications.length === 0 ? (
              <p className="text-xs text-center text-slate-400 py-4">No notifications yet.</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    notif.read
                      ? darkMode ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                      : darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-blue-50/70 border-blue-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-xs font-bold m-0">{notif.title}</h5>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.time}</span>
                  </div>
                  <p className="text-[11px] mt-1 m-0 opacity-90 leading-tight">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
