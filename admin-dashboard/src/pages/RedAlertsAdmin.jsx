import React, { useState, useEffect } from 'react';
import { AlertOctagon, Plus, CheckCircle2, ShieldAlert, MapPin } from 'lucide-react';
import api from '../services/api';

const RedAlertsAdmin = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('27.1751');
  const [longitude, setLongitude] = useState('78.0421');
  const [radiusMeters, setRadiusMeters] = useState('1000');
  const [severity, setSeverity] = useState('critical');

  const fetchRedAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts/active');
      if (res.data) setAlerts(res.data);
    } catch (e) {
      console.warn('Using default active alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedAlerts();
  }, []);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      await api.post('/alerts', {
        title,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusMeters: parseInt(radiusMeters),
        severity
      });
      alert('🚨 RED ALERT BROADCASTED SUCCESSFULLY TO ALL TOURISTS IN SECTOR!');
      fetchRedAlerts();
      setTitle('');
      setDescription('');
    } catch (err) {
      alert(`Failed: ${err.message || 'Server error'}`);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await api.patch(`/alerts/${id}/deactivate`);
      alert('Alert deactivated.');
      fetchRedAlerts();
    } catch (e) {
      setAlerts((prev) => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar — Royal Ocean Gradient Banner */}
      <div className="bg-gradient-to-r from-[#0a2540] via-[#0D47A1] to-[#1e3a8a] text-white p-6 rounded-3xl shadow-xl border border-blue-900/20 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 m-0">
            <AlertOctagon className="w-6 h-6 text-red-400 animate-pulse" /> Emergency Red Alert Command Center
          </h1>
          <p className="text-xs font-semibold text-blue-100 m-0 mt-1">
            Broadcast emergency sector alerts instantly across tourist mobile apps & command desks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form (Col 1) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-red-600 uppercase tracking-wider m-0 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Broadcast Red Alert
          </h2>

          <form onSubmit={handleCreateAlert} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Alert Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Crowd Surge Advisory"
                required
                className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Description / Emergency Directive</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High density bottleneck reported. Avoid sector corridors..."
                required
                className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Latitude</label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Longitude</label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Radius (Meters)</label>
                <input
                  type="number"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                >
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical (Red Flag)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider hover:bg-red-700 transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Broadcast Red Alert Now
            </button>
          </form>
        </div>

        {/* Alerts List (Cols 2 & 3) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider m-0">Active Broadcasted Red Alerts ({alerts.length})</h2>

          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className="p-4 rounded-2xl border border-red-200 bg-red-50/50 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-600">{a.alert_code}</span>
                    <h3 className="text-xs font-extrabold text-slate-900 m-0">{a.title}</h3>
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase animate-pulse">
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 m-0 font-medium">{a.description}</p>
                  <p className="text-[11px] text-slate-400 font-mono m-0">Lat: {a.latitude}, Lng: {a.longitude} • Radius: {a.radius_meters}m</p>
                </div>

                <button
                  onClick={() => handleDeactivate(a.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold shrink-0 cursor-pointer"
                >
                  Deactivate
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedAlertsAdmin;
