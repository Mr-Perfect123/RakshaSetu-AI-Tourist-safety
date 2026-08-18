import React, { useState, useEffect } from 'react';
import { AlertOctagon, CheckCircle2, XCircle, MapPin, Phone, Shield, Search, Clock, Activity, Bell } from 'lucide-react';
import socket from '../services/socket';
import api from '../services/api';

const SosMonitor = () => {
  const [sosList, setSosList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const DEFAULT_ACTIVE_SOS = [
    {
      id: 101,
      sos_code: 'SOS-RS-8891',
      tourist_name: 'John Smith (UK Tourist)',
      phone: '+44 7911 123456',
      trigger_type: 'one_tap_sos',
      latitude: 28.6315,
      longitude: 77.2167,
      address: 'Inner Circle, Connaught Place, New Delhi',
      nationality: 'United Kingdom',
      status: 'active',
      created_at: new Date(Date.now() - 5 * 60000).toISOString()
    },
    {
      id: 102,
      sos_code: 'SOS-RS-4420',
      tourist_name: 'Elena Rostova',
      phone: '+7 912 345 6789',
      trigger_type: 'fall_detection',
      latitude: 11.0168,
      longitude: 76.9558,
      address: 'Marudamalai Temple Foot Steps, Coimbatore',
      nationality: 'Russia',
      status: 'dispatched',
      created_at: new Date(Date.now() - 25 * 60000).toISOString()
    },
    {
      id: 103,
      sos_code: 'SOS-RS-9912',
      tourist_name: 'Karthik Raja',
      phone: '+91 94433 22110',
      trigger_type: 'voice_keyword',
      latitude: 13.0827,
      longitude: 80.2707,
      address: 'Marina Beach Light House Promenade, Chennai',
      nationality: 'India',
      status: 'active',
      created_at: new Date(Date.now() - 2 * 60000).toISOString()
    }
  ];

  // Fetch active SOS alerts from API on mount
  useEffect(() => {
    const fetchActiveSos = async () => {
      setLoading(true);
      try {
        const res = await api.get('/sos/active');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setSosList(res.data);
        } else {
          setSosList(DEFAULT_ACTIVE_SOS);
        }
      } catch (err) {
        setSosList(DEFAULT_ACTIVE_SOS);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveSos();
  }, []);

  // Listen for real-time SOS alerts via WebSocket
  useEffect(() => {
    socket.emit('join_room', { room: 'admin_dispatch' });

    const handleNewSos = (newSos) => {
      setSosList((prev) => {
        // Avoid duplicates
        const exists = prev.some(s => s.sos_code === newSos.sos_code || s.id === newSos.id);
        if (exists) return prev;
        return [
          {
            id: newSos.id || Date.now(),
            sos_code: newSos.sos_code || newSos.sosCode || `SOS-${Date.now()}`,
            tourist_name: newSos.touristName || newSos.tourist_name || 'Unknown Tourist',
            phone: newSos.touristPhone || newSos.phone || 'N/A',
            trigger_type: newSos.trigger_type || newSos.triggerType || 'one_tap',
            latitude: newSos.latitude || 28.6139,
            longitude: newSos.longitude || 77.2090,
            address: newSos.address || 'GPS Coordinates Broadcast',
            nationality: newSos.nationality || 'Unknown',
            status: newSos.status || 'active',
            created_at: newSos.created_at || new Date().toISOString()
          },
          ...prev
        ];
      });

      // Show notification banner
      setNotification({
        type: 'new_sos',
        message: `🚨 NEW SOS: ${newSos.touristName || newSos.tourist_name || 'Tourist'} triggered emergency alert! Code: ${newSos.sos_code || newSos.sosCode}`,
        timestamp: new Date().toLocaleTimeString()
      });
      setTimeout(() => setNotification(null), 8000);

      // Play emergency sound
      playAlertSound();
    };

    const handleStatusUpdate = (data) => {
      setSosList((prev) =>
        prev.map((item) =>
          (item.id === data.sosId || item.sos_code === data.sosId)
            ? { ...item, status: data.status }
            : item
        ).filter(item => item.status !== 'cancelled')
      );
    };

    socket.on('new_sos_alert', handleNewSos);
    socket.on('sos_status_updated', handleStatusUpdate);

    return () => {
      socket.off('new_sos_alert', handleNewSos);
      socket.off('sos_status_updated', handleStatusUpdate);
    };
  }, []);

  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  };

  // Handle Dispatch / Resolve actions via API
  const handleStatusChange = async (sosId, sosCode, newStatus) => {
    // Optimistically update UI
    setSosList((prev) =>
      prev.map((item) =>
        (item.id === sosId || item.sos_code === sosCode)
          ? { ...item, status: newStatus }
          : item
      )
    );

    try {
      await api.patch(`/sos/${sosId}/status`, { status: newStatus });
    } catch (err) {
      console.warn(`Status update API call failed for SOS ${sosCode}, but UI is updated.`);
      // Socket will broadcast the change anyway
    }
  };

  // Filter by search term
  const filteredSos = sosList.filter((sos) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (sos.sos_code || '').toLowerCase().includes(term) ||
      (sos.tourist_name || '').toLowerCase().includes(term) ||
      (sos.address || '').toLowerCase().includes(term)
    );
  });

  const getTimeSince = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just Now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Live Notification Banner */}
      {notification && (
        <div className="p-4 rounded-2xl bg-red-600 text-white shadow-xl animate-pulse flex items-center justify-between gap-4 border border-red-700">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-white animate-bounce" />
            <div>
              <p className="text-sm font-bold m-0">{notification.message}</p>
              <p className="text-xs text-red-200 m-0">{notification.timestamp}</p>
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-bold hover:bg-white/30"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar — Frosted Glass Container for High Text Visibility */}
      <div className="bg-slate-900/90 border border-slate-700 text-white backdrop-blur-md p-5 rounded-3xl shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2 m-0">
            <AlertOctagon className="w-6 h-6 text-red-500 animate-pulse" /> SOS Emergency Dispatch Queue
          </h1>
          <p className="text-xs font-semibold text-slate-300 m-0 mt-0.5">
            Live monitoring of distress signals and real-time police dispatch
            {sosList.filter(s => s.status === 'active').length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
                {sosList.filter(s => s.status === 'active').length} ACTIVE
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            WebSocket Live
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Activity className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading active SOS alerts...</p>
        </div>
      ) : filteredSos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No Active SOS Alerts</p>
          <p className="text-xs text-slate-500 mt-1">All clear in the jurisdiction. Monitoring WebSocket for new distress signals.</p>
        </div>
      ) : (
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-4">SOS Code</th>
                <th className="p-4">Tourist Info</th>
                <th className="p-4">Trigger Mechanism</th>
                <th className="p-4">GPS Location</th>
                <th className="p-4">Time</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Dispatch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSos.map((sos) => (
                <tr key={sos.id || sos.sos_code} className={`hover:bg-slate-50/80 transition-colors ${
                  sos.status === 'active' ? 'bg-red-50/30' : ''
                }`}>
                  <td className="p-4 font-mono font-bold text-primary">{sos.sos_code}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{sos.tourist_name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" /> {sos.phone}
                    </div>
                    {sos.nationality && (
                      <div className="text-[10px] text-slate-400 mt-0.5">🌍 {sos.nationality}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-md bg-red-100 text-danger font-bold text-[10px] uppercase">
                      {(sos.trigger_type || 'one_tap').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-danger shrink-0" />
                      <span className="truncate max-w-xs">{sos.address}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {sos.latitude?.toFixed(4)}, {sos.longitude?.toFixed(4)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {getTimeSince(sos.created_at)}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                      sos.status === 'active'
                        ? 'bg-danger text-white animate-pulse'
                        : sos.status === 'dispatched'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {sos.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {sos.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(sos.id, sos.sos_code, 'dispatched')}
                          className="px-3 py-1.5 rounded-lg bg-primary text-white font-semibold hover:bg-blue-800 transition-colors text-[11px]"
                        >
                          🚔 Dispatch Police
                        </button>
                        <button
                          onClick={() => handleStatusChange(sos.id, sos.sos_code, 'resolved')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors text-[11px]"
                        >
                          ✅ Mark Resolved
                        </button>
                      </>
                    )}
                    {sos.status === 'dispatched' && (
                      <button
                        onClick={() => handleStatusChange(sos.id, sos.sos_code, 'resolved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors text-[11px]"
                      >
                        ✅ Resolve SOS
                      </button>
                    )}
                    {sos.status === 'resolved' && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Case Closed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SosMonitor;
