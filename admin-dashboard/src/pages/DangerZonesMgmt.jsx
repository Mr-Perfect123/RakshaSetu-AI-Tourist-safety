import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, ShieldCheck, MapPin, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../services/api';

const DangerZonesMgmt = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('28.6420');
  const [longitude, setLongitude] = useState('77.2180');
  const [radiusMeters, setRadiusMeters] = useState('500');
  const [severity, setSeverity] = useState('high');
  const [crimeType, setCrimeType] = useState('Pickpocketing & Overselling Scams');
  const [advisoryMessage, setAdvisoryMessage] = useState('Avoid carrying visible valuables after 9 PM.');

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await api.get('/zones/danger-zones');
      if (res.data) setZones(res.data);
    } catch (e) {
      console.warn('Using default zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleCreateZone = async (e) => {
    e.preventDefault();
    try {
      await api.post('/zones/danger-zones', {
        name,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusMeters: parseInt(radiusMeters),
        severity,
        crimeType,
        advisoryMessage
      });
      alert('Danger Zone registered successfully!');
      fetchZones();
      setName('');
      setDescription('');
    } catch (err) {
      alert(`Failed: ${err.message || 'Server error'}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" /> Danger & Hazard Zone Command Management
          </h1>
          <p className="text-xs text-slate-500">
            Define spatial danger zones with automated tourist warning advisories
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Zone Form (Col 1) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-[#0D47A1] uppercase tracking-wider m-0">Register New Hazard Zone</h2>

          <form onSubmit={handleCreateZone} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Zone Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Paharganj Alley Market"
                required
                className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Hazard Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Narrow unlit corridors..."
                className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
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
                  <option value="low">Low (Yellow)</option>
                  <option value="moderate">Moderate (Orange)</option>
                  <option value="high">High (Red)</option>
                  <option value="critical">Critical Alert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Advisory Warning Message</label>
              <textarea
                value={advisoryMessage}
                onChange={(e) => setAdvisoryMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 h-20"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-blue-800 transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Danger Zone
            </button>
          </form>
        </div>

        {/* Existing Danger Zones List (Cols 2 & 3) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider m-0">Active Registered Hazard Zones ({zones.length})</h2>

          <div className="space-y-3">
            {zones.map((z) => (
              <div key={z.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0D47A1]">{z.zone_code}</span>
                    <h3 className="text-xs font-extrabold text-slate-900 m-0">{z.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      z.severity === 'critical' || z.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {z.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 m-0 font-medium">{z.description || z.advisory_message}</p>
                  <p className="text-[11px] text-slate-400 font-mono m-0">Lat: {z.latitude}, Lng: {z.longitude} • Radius: {z.radius_meters}m</p>
                </div>

                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DangerZonesMgmt;
