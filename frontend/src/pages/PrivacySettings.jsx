import React, { useState, useEffect } from 'react';
import { Shield, MapPin, Eye, Lock, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

const PrivacySettings = ({ darkMode }) => {
  const [locationActive, setLocationActive] = useState(false);
  const [coords, setCoords] = useState({ latitude: null, longitude: null, last_active_at: null });
  const [adminRequests, setAdminRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await api.get('/location/status');
      if (res.data) {
        setLocationActive(res.data.location_sharing_active);
        setCoords({
          latitude: res.data.latitude,
          longitude: res.data.longitude,
          last_active_at: res.data.last_active_at
        });
        setAdminRequests(res.data.pending_admin_requests || []);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleStartSharing = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await api.post('/location/permission', { location_sharing_active: true });
            await api.post('/location/update', {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            });
            setLocationActive(true);
            setCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              last_active_at: new Date().toISOString()
            });
            setMsg('Location sharing ENABLED.');
          } catch (e) {}
        },
        (err) => setMsg('Geolocation permission denied by browser.')
      );
    }
  };

  const handleStopSharing = async () => {
    try {
      await api.post('/location/stop');
      setLocationActive(false);
      setMsg('Location sharing DISABLED.');
    } catch (e) {}
  };

  const handleRespondRequest = async (requestId, status) => {
    try {
      await api.post('/location/respond-request', { requestId, status });
      setMsg(`Admin request ${status === 'approved' ? 'APPROVED' : 'DECLINED'}.`);
      fetchStatus();
    } catch (e) {}
  };

  return (
    <div className={`min-h-screen p-4 sm:p-8 ${darkMode ? 'bg-slate-900 text-white' : 'bg-[#F5F7FA] text-slate-900'}`}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Privacy & Location Controls</h1>
            <p className="text-xs text-slate-500">Control your live safety tracking, consent status, and administrative location access.</p>
          </div>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs font-bold border border-blue-200 flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="text-xs font-bold text-slate-400">✕</button>
          </div>
        )}

        {/* Location Status Card */}
        <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className={`w-5 h-5 ${locationActive ? 'text-emerald-500' : 'text-slate-400'}`} />
              <span className="font-extrabold text-sm uppercase">Location Sharing Status</span>
            </div>
            <span className={`px-3 py-1 rounded-full font-black text-xs uppercase ${
              locationActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {locationActive ? '📍 Sharing: ON' : '🔒 Sharing: OFF'}
            </span>
          </div>

          {!locationActive ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-700" /> Location sharing is currently disabled.
              </div>
              <p>Your location is NOT being broadcast to emergency dispatch or command centers. Turn on sharing to enable emergency alerts and safe route monitoring.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">Latitude</span>
                <span className="font-bold text-slate-800">{coords.latitude ? coords.latitude.toFixed(6) : 'Available'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">Longitude</span>
                <span className="font-bold text-slate-800">{coords.longitude ? coords.longitude.toFixed(6) : 'Available'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">Last Updated</span>
                <span className="font-bold text-slate-800">{coords.last_active_at ? new Date(coords.last_active_at).toLocaleTimeString() : 'Just Now'}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {!locationActive ? (
              <button
                onClick={handleStartSharing}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                Start Location Sharing
              </button>
            ) : (
              <button
                onClick={handleStopSharing}
                className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                Stop Location Sharing
              </button>
            )}
          </div>
        </div>

        {/* Pending Admin Location Requests Drawer */}
        {adminRequests.length > 0 && (
          <div className="p-6 rounded-3xl border border-blue-200 bg-blue-50/60 space-y-4">
            <h2 className="text-sm font-black text-blue-900 uppercase flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-700" /> Pending Admin Location Requests ({adminRequests.length})
            </h2>

            {adminRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-2xl bg-white border border-blue-200 shadow-sm space-y-2 text-xs">
                <p className="font-bold text-slate-800">{req.message}</p>
                <p className="text-[10px] text-slate-500">Requested by Admin: <span className="font-semibold text-slate-700">{req.admin_name}</span> at {new Date(req.requested_at).toLocaleString()}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleRespondRequest(req.id, 'declined')}
                    className="w-1/2 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    DECLINE
                  </button>
                  <button
                    onClick={() => handleRespondRequest(req.id, 'approved')}
                    className="w-1/2 py-2 rounded-xl bg-primary font-extrabold text-white hover:bg-blue-800 cursor-pointer"
                  >
                    ALLOW LOCATION
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacySettings;
