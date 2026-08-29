import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AlertTriangle, Plus, ShieldCheck, MapPin, CheckCircle2, 
  ToggleLeft, ToggleRight, Trash2, Edit3, X, Save, RefreshCw,
  Radio, Eye, AlertOctagon, Info
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

// Danger type options with standard categories
const DANGER_TYPES = [
  { value: 'THEFT', label: '🎒 Theft / Pickpocketing', color: '#DC2626' },
  { value: 'NO_NETWORK', label: '📵 No Network Coverage', color: '#7C3AED' },
  { value: 'HIGH_CRIME', label: '⚠️ High Crime Area', color: '#B91C1C' },
  { value: 'NIGHT_UNSAFE', label: '🌙 Unsafe at Night', color: '#4338CA' },
  { value: 'ACCIDENT_PRONE', label: '🚗 Accident-Prone Area', color: '#EA580C' },
  { value: 'FLOOD_PRONE', label: '🌊 Flood-Prone Area', color: '#0284C7' },
  { value: 'LANDSLIDE_PRONE', label: '⛰️ Landslide-Prone Area', color: '#854D0E' },
  { value: 'WILDLIFE_DANGER', label: '🐅 Wildlife Danger', color: '#15803D' },
  { value: 'RESTRICTED_AREA', label: '⛔ Restricted Area', color: '#475569' },
  { value: 'POOR_ROAD', label: '🚧 Poor Road Condition', color: '#D97706' },
  { value: 'MEDICAL_EMERGENCY', label: '🚑 Medical Emergency Risk', color: '#E11D48' },
  { value: 'OTHER', label: '🛡️ Other Safety Hazard', color: '#64748B' }
];

// Map Click Picker component for Admin coordinate selection
const MapClickPicker = ({ onLocationSelected }) => {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

const DangerZonesMgmt = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Creating / Editing
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('28.6420');
  const [longitude, setLongitude] = useState('77.2180');
  const [radiusMeters, setRadiusMeters] = useState('500');
  const [warningDistanceMeters, setWarningDistanceMeters] = useState('200');
  const [severity, setSeverity] = useState('high');
  const [dangerType, setDangerType] = useState('THEFT');
  const [safetyInstructions, setSafetyInstructions] = useState('Keep phone and wallet secure. Avoid isolated alleys after 9 PM.');
  const [recommendedAction, setRecommendedAction] = useState('Stay along well-lit main arterial road with high pedestrian presence.');
  const [networkStatus, setNetworkStatus] = useState('available');

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await api.get('/zones?all=true');
      const data = res.data?.data || res.data || [];
      setZones(Array.isArray(data) ? data : []);
    } catch {
      // Fallback
      try {
        const res2 = await api.get('/danger-zones');
        const data2 = res2.data?.data || res2.data || [];
        setZones(Array.isArray(data2) ? data2 : []);
      } catch (err) {
        console.warn('Could not fetch danger zones', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const [syncing, setSyncing] = useState(false);

  const handleSyncFeeds = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/zones/sync');
      const data = res.data?.data || res.data;
      alert(`Synchronized successfully! Ingested or updated ${data?.ingestedCount || 0} active danger/disaster zones from GDACS, USGS, and Curated feeds.`);
      fetchZones();
    } catch (err) {
      alert(`Synchronization failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleMapLocationSelect = (lat, lng) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
  };

  const handleEditClick = (zone) => {
    setEditingZoneId(zone.id);
    setName(zone.name || '');
    setDescription(zone.description || '');
    setLatitude(String(zone.latitude || 28.6420));
    setLongitude(String(zone.longitude || 77.2180));
    setRadiusMeters(String(zone.radius_meters || 500));
    setWarningDistanceMeters(String(zone.warning_distance_meters || 200));
    setSeverity(zone.severity || 'high');
    setDangerType(zone.danger_type || 'THEFT');
    setSafetyInstructions(zone.safety_instructions || zone.advisory_message || '');
    setRecommendedAction(zone.recommended_action || '');
    setNetworkStatus(zone.network_status || 'available');
  };

  const handleCancelEdit = () => {
    setEditingZoneId(null);
    setName('');
    setDescription('');
    setLatitude('28.6420');
    setLongitude('77.2180');
    setRadiusMeters('500');
    setWarningDistanceMeters('200');
    setSeverity('high');
    setDangerType('THEFT');
    setSafetyInstructions('Keep phone and wallet secure. Avoid isolated alleys after 9 PM.');
    setRecommendedAction('Stay along well-lit main arterial road with high pedestrian presence.');
    setNetworkStatus('available');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name,
      description,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radiusMeters: parseInt(radiusMeters, 10),
      warningDistanceMeters: parseInt(warningDistanceMeters, 10),
      severity,
      dangerType,
      safetyInstructions,
      recommendedAction,
      networkStatus
    };

    try {
      if (editingZoneId) {
        await api.put(`/zones/${editingZoneId}`, payload);
        alert('Danger Zone updated successfully!');
      } else {
        await api.post('/zones/danger-zones', payload);
        alert('New Danger Zone registered successfully!');
      }
      handleCancelEdit();
      fetchZones();
    } catch (err) {
      alert(`Operation failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await api.patch(`/zones/danger-zones/${id}/toggle`);
      fetchZones();
    } catch (err) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hazard zone? This will immediately remove it from all tourist maps.')) return;
    try {
      await api.delete(`/zones/danger-zones/${id}`);
      fetchZones();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const curLat = parseFloat(latitude) || 28.6420;
  const curLng = parseFloat(longitude) || 77.2180;
  const curRadius = parseInt(radiusMeters, 10) || 500;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#0a2540] via-[#0D47A1] to-[#1e3a8a] text-white p-6 rounded-3xl shadow-xl border border-blue-900/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-7 h-7 text-amber-400 animate-pulse" />
            <h1 className="text-xl md:text-2xl font-black text-white m-0">
              Hazard & Danger Zone Command Center
            </h1>
          </div>
          <p className="text-xs font-semibold text-blue-100 m-0 mt-1">
            Configure real-time geofences, danger types, automated tourist warning triggers, and emergency instructions.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSyncFeeds}
            disabled={syncing}
            className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-650 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-75 transition-all"
            title="Sync GDACS Disasters and USGS Earthquakes active feeds"
          >
            <Radio className={`w-3.5 h-3.5 ${syncing ? 'animate-pulse' : ''}`} /> Sync USGS/GDACS Feeds
          </button>
          <button
            onClick={fetchZones}
            className="px-4 py-2 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer backdrop-blur-md transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Zones
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Column (Col 1) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#0D47A1] uppercase tracking-wider m-0 flex items-center gap-1.5">
              {editingZoneId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingZoneId ? `Edit Zone #${editingZoneId}` : 'Register New Hazard Zone'}
            </h2>
            {editingZoneId && (
              <button onClick={handleCancelEdit} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Zone Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Paharganj Alley Market"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Danger Type *</label>
                <select
                  value={dangerType}
                  onChange={(e) => setDangerType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                >
                  {DANGER_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Severity *</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 font-bold"
                >
                  <option value="low">🟢 Low / Safe Corridor</option>
                  <option value="moderate">🟡 Moderate Risk</option>
                  <option value="high">🔴 High Risk Area</option>
                  <option value="critical">🚨 Critical Hazard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Latitude *</label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                  placeholder="28.6420"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Longitude *</label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  placeholder="77.2180"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Geofence Radius (m)</label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  step="50"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Warning Dist (m)</label>
                <input
                  type="number"
                  min="50"
                  max="2000"
                  step="50"
                  value={warningDistanceMeters}
                  onChange={(e) => setWarningDistanceMeters(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Hazard Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High density evening foot traffic with reported pickpocketing..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 h-16"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Tourist Safety Instructions *</label>
              <textarea
                value={safetyInstructions}
                onChange={(e) => setSafetyInstructions(e.target.value)}
                placeholder="Keep backpack in front. Secure valuables."
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 h-16"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Recommended Escape / Safe Action</label>
              <input
                type="text"
                value={recommendedAction}
                onChange={(e) => setRecommendedAction(e.target.value)}
                placeholder="Move toward main lighted road."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              {editingZoneId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-black text-xs cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
              >
                {submitting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                ) : editingZoneId ? (
                  <><Save className="w-4 h-4" /> Update Hazard Zone</>
                ) : (
                  <><Plus className="w-4 h-4" /> Create Hazard Zone</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Spatial Preview Map & Zone Directory (Cols 2 & 3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Interactive Leaflet Placement Map */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider m-0 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-600" /> Click on Map to Select Coordinate Position
              </h2>
              <span className="text-[11px] font-mono font-bold text-blue-700">
                Selected: {curLat.toFixed(4)}, {curLng.toFixed(4)} (Radius: {curRadius}m)
              </span>
            </div>

            <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
              <MapContainer center={[curLat, curLng]} zoom={13} scrollWheelZoom={true} className="w-full h-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickPicker onLocationSelected={handleMapLocationSelect} />

                {/* Current Active Form Preview Circle */}
                <Circle
                  center={[curLat, curLng]}
                  radius={curRadius}
                  pathOptions={{ color: '#DC2626', fillColor: '#EF4444', fillOpacity: 0.35, weight: 3 }}
                />

                {/* All Existing Registered Zones */}
                {zones.map((z) => {
                  const lat = parseFloat(z.latitude);
                  const lng = parseFloat(z.longitude);
                  if (isNaN(lat) || isNaN(lng)) return null;
                  return (
                    <Circle
                      key={`preview-zone-${z.id}`}
                      center={[lat, lng]}
                      radius={z.radius_meters || 500}
                      pathOptions={{
                        color: z.is_active ? '#EA580C' : '#94A3B8',
                        fillColor: z.is_active ? '#F97316' : '#CBD5E1',
                        fillOpacity: 0.2,
                        weight: 1.5,
                        dashArray: z.is_active ? null : '4, 6'
                      }}
                    >
                      <Popup>
                        <div className="p-1 text-xs space-y-1">
                          <strong className="block text-slate-900">{z.name}</strong>
                          <span className="text-[10px] font-bold text-slate-500">{z.danger_type || 'THEFT'} • {z.radius_meters}m</span>
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Zones Directory List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider m-0">
                Registered Danger Zones ({zones.length})
              </h2>
              <span className="text-xs text-slate-500 font-bold">
                {zones.filter(z => z.is_active).length} Active on Sentinel Map
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400 font-bold text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" /> Loading danger zones...
              </div>
            ) : zones.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                No danger zones registered yet. Use the form above to add your first zone.
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {zones.map((z) => {
                  const typeObj = DANGER_TYPES.find(t => t.value === (z.danger_type || '').toUpperCase()) || { label: z.danger_type || 'HAZARD', color: '#DC2626' };
                  const isCrit = (z.severity || '').toLowerCase() === 'critical' || (z.severity || '').toLowerCase() === 'high';

                  return (
                    <div
                      key={z.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        z.is_active
                          ? 'bg-slate-50 border-slate-200 shadow-xs'
                          : 'bg-slate-100/60 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-black text-[#0D47A1] bg-blue-50 px-2 py-0.5 rounded">
                              {z.zone_code || `DZ-${z.id}`}
                            </span>
                            <h3 className="text-xs font-black text-slate-900 m-0">{z.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isCrit ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {z.severity || 'high'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600">
                              {typeObj.label}
                            </span>
                            {z.is_sample_data ? (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                                Sample Data
                              </span>
                            ) : null}
                          </div>

                          <p className="text-xs text-slate-600 m-0 font-medium leading-relaxed">
                            {z.description || z.advisory_message}
                          </p>

                          {(z.safety_instructions || z.precautions) && (
                            <p className="text-[11px] text-blue-900 m-0 font-bold">
                              Instructions: {z.safety_instructions || z.precautions}
                            </p>
                          )}

                          <p className="text-[10px] text-slate-400 font-mono m-0 pt-0.5">
                            Coords: {parseFloat(z.latitude).toFixed(4)}, {parseFloat(z.longitude).toFixed(4)} • Radius: {z.radius_meters}m • Warning: {z.warning_distance_meters || 200}m
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggleActive(z.id)}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                              z.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
                            }`}
                            title={z.is_active ? 'Active on map (Click to disable)' : 'Inactive on map (Click to enable)'}
                          >
                            {z.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>

                          <button
                            onClick={() => handleEditClick(z)}
                            className="p-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all cursor-pointer"
                            title="Edit Hazard Zone"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(z.id)}
                            className="p-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all cursor-pointer"
                            title="Delete Hazard Zone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default DangerZonesMgmt;
