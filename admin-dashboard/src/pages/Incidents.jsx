import React, { useState, useEffect } from 'react';
import { 
  FileText, AlertTriangle, Eye, CheckCircle2, MapPin, 
  Clock, Search, Activity, RefreshCw, Check, X, ShieldAlert,
  ArrowRight, ShieldCheck, Map
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import socket from '../services/socket';

const markerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected incident details for inspection / map preview
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [clusterInfo, setClusterInfo] = useState(null);
  const [clusterLoading, setClusterLoading] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/incidents');
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) {
        setIncidents(list);
      }
    } catch (err) {
      console.warn('Failed to load incident reports queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    socket.emit('join_room', { room: 'admin_dispatch' });

    const handleNewIncident = (data) => {
      const report = data.details || data;
      setIncidents((prev) => {
        const exists = prev.some((i) => i.id === report.id || i.report_code === report.report_code);
        if (exists) return prev;
        return [report, ...prev];
      });
    };

    socket.on('new_incident_report', handleNewIncident);
    return () => {
      socket.off('new_incident_report', handleNewIncident);
    };
  }, []);

  const handleInspect = async (incident) => {
    setSelectedIncident(incident);
    setClusterInfo(null);
    if (!incident.latitude || !incident.longitude) return;

    setClusterLoading(true);
    try {
      const res = await api.get('/incidents/cluster-recommendation', {
        params: {
          lat: incident.latitude,
          lng: incident.longitude,
          category: incident.category
        }
      });
      if (res.data?.data) {
        setClusterInfo(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch cluster suggestions', err);
    } finally {
      setClusterLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await api.patch(`/incidents/${id}/status`, { status });
      const updated = res.data?.data?.report || res.data?.data || res.data;
      
      setIncidents((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: updated?.status || status } : i))
      );
      
      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident(prev => ({ ...prev, status: updated?.status || status }));
        // Refresh cluster check if newly verified
        if (status === 'verified') {
          handleInspect({ ...selectedIncident, status: 'verified' });
        }
      }
      alert(`Incident status updated to ${status}.`);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleCreateZoneFromPreset = async () => {
    if (!selectedIncident) return;
    const name = prompt('Enter Danger Zone Name:', clusterInfo?.recommendedName || `High Risk Area near ${selectedIncident.location_name || 'Report Point'}`);
    if (!name) return;

    const desc = prompt('Enter Hazard Description:', selectedIncident.description || 'Verified tourist incident cluster reports.');
    if (!desc) return;

    try {
      await api.post('/zones/danger-zones', {
        name,
        description: desc,
        latitude: parseFloat(selectedIncident.latitude),
        longitude: parseFloat(selectedIncident.longitude),
        radiusMeters: clusterInfo?.recommendedRadius || 400,
        warningDistanceMeters: 200,
        severity: clusterInfo?.recommendedSeverity || 'high',
        dangerType: (selectedIncident.category || 'THEFT').toUpperCase(),
        safetyInstructions: 'Stay alert. Carry valuables securely. Avoid isolated stretches.',
        recommendedAction: 'Proceed immediately along well-lit main corridors.',
        networkStatus: 'available'
      });
      alert('Geofenced Danger Zone created and published successfully!');
    } catch (err) {
      alert(`Zone creation failed: ${err.message}`);
    }
  };

  const filteredIncidents = incidents.filter((i) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (i.title || '').toLowerCase().includes(term) ||
      (i.category || '').toLowerCase().includes(term) ||
      (i.location_name || '').toLowerCase().includes(term) ||
      (i.report_code || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#0a2540] via-[#0D47A1] to-[#1e3a8a] text-white p-6 rounded-3xl shadow-xl border border-blue-900/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 m-0">
            <FileText className="w-6 h-6 text-red-400" /> Tourist Incident Command & Verification Desk
          </h1>
          <p className="text-xs font-semibold text-blue-100 m-0 mt-1">
            Review crowd-sourced tourist safety submissions and verify incident clusters to register geofenced perimeters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by code, title, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-60 text-slate-900"
            />
          </div>
          <button
            onClick={fetchIncidents}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Incident Queue Column (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider m-0">
            Report Queue ({filteredIncidents.length})
          </h2>

          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <Activity className="w-8 h-8 text-[#0D47A1] animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Loading incident queue...</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">No Incident Reports Pending</p>
              <p className="text-xs text-slate-500 mt-1">All clear. Listening to real-time tourist submissions.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
              {filteredIncidents.map((item) => {
                const isSelected = selectedIncident?.id === item.id;
                const isVerified = item.status === 'verified';
                const isPending = item.status === 'pending' || item.status === 'under_investigation';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleInspect(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-black text-slate-400">
                            {item.report_code || `INC-${item.id}`}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            item.severity === 'critical' || item.severity === 'high'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.severity || 'medium'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-bold">
                            {item.category || 'THEFT'}
                          </span>
                        </div>

                        <h3 className="text-xs font-black text-slate-900 m-0 pt-1">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-slate-600 m-0 line-clamp-2">
                          {item.description}
                        </p>

                        <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{item.location_name || 'GPS Target Area'}</span>
                          <span>•</span>
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'rejected'
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status || 'pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Verification & Cluster Recommendation Inspection Panel (Col 3) */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider m-0">
            Report Verification Desk
          </h2>

          {selectedIncident ? (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-slate-900">
              
              {/* Inspection Details */}
              <div className="space-y-3">
                <div className="pb-3 border-b">
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    REPORT CODE: {selectedIncident.report_code || `INC-${selectedIncident.id}`}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 m-0 pt-0.5">
                    {selectedIncident.title}
                  </h3>
                </div>

                <div className="text-xs space-y-2">
                  <div>
                    <strong className="text-slate-500 block text-[10px] uppercase">Description</strong>
                    <p className="m-0 leading-relaxed font-semibold text-slate-800">{selectedIncident.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <strong className="text-slate-500 block text-[10px] uppercase">Reporter</strong>
                      <span className="font-bold text-slate-800 block">{selectedIncident.reporter_name || 'Tourist User'}</span>
                      <span className="font-mono text-slate-500 block">{selectedIncident.reporter_phone}</span>
                    </div>

                    <div>
                      <strong className="text-slate-500 block text-[10px] uppercase">Current Status</strong>
                      <span className="font-bold text-slate-800 uppercase block">{selectedIncident.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Preview (Requirement 19 - View on Map) */}
              {selectedIncident.latitude && selectedIncident.longitude && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Incident Location Preview</span>
                  <div className="h-44 rounded-2xl overflow-hidden border border-slate-200 relative z-0">
                    <MapContainer
                      center={[parseFloat(selectedIncident.latitude), parseFloat(selectedIncident.longitude)]}
                      zoom={14}
                      zoomControl={false}
                      scrollWheelZoom={false}
                      className="w-full h-full"
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker
                        position={[parseFloat(selectedIncident.latitude), parseFloat(selectedIncident.longitude)]}
                        icon={markerIcon}
                      />
                    </MapContainer>
                  </div>
                </div>
              )}

              {/* Cluster Recommendation Panel (Requirement 21) */}
              {selectedIncident.status === 'verified' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-800">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wide">
                      Safety Cluster Intelligence
                    </span>
                  </div>

                  {clusterLoading ? (
                    <div className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" /> Evaluating nearby verified clusters...
                    </div>
                  ) : clusterInfo?.clusterDetected ? (
                    <div className="space-y-2 text-xs text-slate-700">
                      <p className="m-0 leading-relaxed font-bold">
                        🚨 Found <strong className="text-red-700">{clusterInfo.incidentCount} verified reports</strong> within 500m of this location.
                      </p>
                      <div className="p-2.5 rounded-xl bg-white border border-amber-300 space-y-1">
                        <span className="text-[10px] font-black uppercase text-amber-800 block">Recommended Zone Preset</span>
                        <div className="font-extrabold text-slate-900">{clusterInfo.recommendedName}</div>
                        <div className="text-[10px] text-slate-500">Radius: {clusterInfo.recommendedRadius}m • Severity: {clusterInfo.recommendedSeverity}</div>
                      </div>

                      <button
                        onClick={handleCreateZoneFromPreset}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        Create Geofenced Danger Zone <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 m-0 leading-relaxed">
                      No active cluster threshold detected yet. Needs at least 3 verified reports within 500m to recommend a permanent geofence perimeter.
                    </p>
                  )}
                </div>
              )}

              {/* Status Action Buttons (Requirement 19) */}
              <div className="flex items-center gap-2 pt-2">
                {selectedIncident.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedIncident.id, 'under_investigation')}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-extrabold text-xs cursor-pointer hover:bg-slate-50"
                  >
                    Investigate
                  </button>
                )}

                {selectedIncident.status !== 'verified' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedIncident.id, 'verified')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Verify
                  </button>
                )}

                {selectedIncident.status !== 'rejected' && selectedIncident.status !== 'verified' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedIncident.id, 'rejected')}
                    className="px-4 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-extrabold text-xs cursor-pointer flex items-center justify-center"
                    title="Reject Report"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                )}

                {selectedIncident.status === 'verified' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedIncident.id, 'resolved')}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs cursor-pointer"
                  >
                    Resolve Report
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs font-semibold">
              Select an incident from the queue to review metadata, view on map, and verify safety clusters.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Incidents;
