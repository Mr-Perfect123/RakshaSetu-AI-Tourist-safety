import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertTriangle, Plus, CheckCircle2, ShieldAlert, MapPin, Clock, RefreshCw,
  Search, Filter, Trash2, Edit3, X, Calendar, Layers, ShieldCheck,
  AlertOctagon, CheckCircle, Ban, ArrowUpRight, Compass, Eye, Zap, Info
} from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import AdminGoogleMapDrawer from '../components/AdminGoogleMapDrawer';

const ALERT_TYPES = [
  { value: 'HEAVY_RAIN', label: '🌧️ Heavy Rain Alert', category: 'Weather' },
  { value: 'FLOOD', label: '🌊 Flood Warning', category: 'Weather' },
  { value: 'LANDSLIDE', label: '⛰️ Landslide Hazard', category: 'Weather' },
  { value: 'CYCLONE', label: '🌀 Cyclone / Storm Alert', category: 'Weather' },
  { value: 'SNOW_AVALANCHE', label: '❄️ Snow Avalanche Risk', category: 'Weather' },
  { value: 'WILDFIRE', label: '🔥 Wildfire Hazard', category: 'Weather' },
  { value: 'EXTREME_HEAT', label: '☀️ Extreme Heatwave', category: 'Weather' },
  { value: 'STORM_SURGE', label: '🌊 Storm Surge / Coastal Hazard', category: 'Weather' },
  { value: 'ROAD_CLOSURE', label: '🚧 Temporary Road Closure', category: 'Infrastructure' },
  { value: 'BRIDGE_DAMAGE', label: '🌉 Bridge Damage / Impassable', category: 'Infrastructure' },
  { value: 'CONSTRUCTION_BLASTING', label: '💥 Construction Blasting Zone', category: 'Infrastructure' },
  { value: 'TOURIST_SPOT_CLOSED', label: '⛔ Tourist Spot Closed', category: 'Tourism' },
  { value: 'FESTIVAL_CROWD_CRUSH', label: '👥 Festival High-Density Crowd', category: 'Crowd & Public' },
  { value: 'VIP_MOVEMENT_RESTRICTION', label: '🚔 VIP Movement Corridor', category: 'Security' },
  { value: 'TERROR_THREAT', label: '🚨 Security Threat Advisory', category: 'Security' },
  { value: 'CIVIL_UNREST', label: '🛑 Civil Unrest / Protest Area', category: 'Security' },
  { value: 'CURFEW_ZONE', label: '⏳ Curfew Enforced Sector', category: 'Security' },
  { value: 'HIGH_THEFT_ZONE', label: '🎒 Transient Theft Spike', category: 'Crime' },
  { value: 'EPIDEMIC_OUTBREAK', label: '☣️ Epidemic / Quarantine Area', category: 'Health' },
  { value: 'HAZARDOUS_GAS_LEAK', label: '⚠️ Hazardous Gas Leak', category: 'Hazard' },
  { value: 'OTHER_TEMPORARY_HAZARD', label: '⚠️ Other Temporary Safety Hazard', category: 'General' }
];

export default function TemporaryAlertsAdmin() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingAlert, setExtendingAlert] = useState(null);
  const [extendHours, setExtendHours] = useState(24);
  const [extendReason, setExtendReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [extendCustomDate, setExtendCustomDate] = useState('');

  // Form states
  const [formAlertId, setFormAlertId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAlertType, setFormAlertType] = useState('HEAVY_RAIN');
  const [formSeverity, setFormSeverity] = useState('HIGH');
  const [formGeometryType, setFormGeometryType] = useState('circle');
  const [formLat, setFormLat] = useState('11.0168');
  const [formLng, setFormLng] = useState('76.9558');
  const [formRadius, setFormRadius] = useState(1000);
  const [formPolygonCoords, setFormPolygonCoords] = useState([]);
  const [formDescription, setFormDescription] = useState('');
  const [formAdvisory, setFormAdvisory] = useState('');
  const [formSource, setFormSource] = useState('State Disaster Management Authority');
  const [formCountry, setFormCountry] = useState('India');
  const [formState, setFormState] = useState('Tamil Nadu');
  const [formCity, setFormCity] = useState('Coimbatore');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formValidFrom, setFormValidFrom] = useState('');
  const [formValidUntil, setFormValidUntil] = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (severityFilter !== 'ALL') params.severity = severityFilter;
      if (typeFilter !== 'ALL') params.alert_type = typeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/temporary-alerts', { params });
      const data = res.data?.data || res.data || [];
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch temporary alerts', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Socket.IO real-time updates
  useEffect(() => {
    const handleCreated = (alert) => {
      if (!alert) return;
      setAlerts(prev => [alert, ...prev.filter(a => a.id !== alert.id)]);
    };
    const handleUpdated = (alert) => {
      if (!alert) return;
      setAlerts(prev => prev.map(a => a.id === alert.id ? alert : a));
    };
    const handleDeleted = (data) => {
      const id = data?.id || data;
      setAlerts(prev => prev.filter(a => a.id !== id));
    };

    socket.on('temporary_alert_created', handleCreated);
    socket.on('temporary_alert_updated', handleUpdated);
    socket.on('temporary_alert_resolved', handleUpdated);
    socket.on('temporary_alert_deleted', handleDeleted);

    return () => {
      socket.off('temporary_alert_created', handleCreated);
      socket.off('temporary_alert_updated', handleUpdated);
      socket.off('temporary_alert_resolved', handleUpdated);
      socket.off('temporary_alert_deleted', handleDeleted);
    };
  }, []);

  // Preset Date Helpers
  const setDefaultDates = () => {
    const now = new Date();
    const next24 = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const toISOStringForInput = (d) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };
    setFormValidFrom(toISOStringForInput(now));
    setFormValidUntil(toISOStringForInput(next24));
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAlert(null);
    setFormAlertId('');
    setFormTitle('');
    setFormAlertType('HEAVY_RAIN');
    setFormSeverity('HIGH');
    setFormGeometryType('circle');
    setFormLat('11.0168');
    setFormLng('76.9558');
    setFormRadius(1000);
    setFormPolygonCoords([]);
    setFormDescription('');
    setFormAdvisory('');
    setFormSource('District Disaster Management Authority');
    setFormCountry('India');
    setFormState('');
    setFormCity('');
    setFormStatus('ACTIVE');
    setDefaultDates();
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (alert) => {
    setEditingAlert(alert);
    setFormAlertId(alert.id);
    setFormTitle(alert.title || '');
    setFormAlertType(alert.alert_type || 'HEAVY_RAIN');
    setFormSeverity(alert.severity || 'HIGH');
    setFormGeometryType(alert.geometry_type || 'circle');
    setFormLat(alert.latitude != null ? String(alert.latitude) : '11.0168');
    setFormLng(alert.longitude != null ? String(alert.longitude) : '76.9558');
    setFormRadius(alert.radius_meters || 1000);
    
    let poly = [];
    if (alert.polygon_coordinates) {
      if (typeof alert.polygon_coordinates === 'string') {
        try { poly = JSON.parse(alert.polygon_coordinates); } catch { poly = []; }
      } else if (Array.isArray(alert.polygon_coordinates)) {
        poly = alert.polygon_coordinates;
      }
    }
    setFormPolygonCoords(poly);
    setFormDescription(alert.description || '');
    setFormAdvisory(alert.advisory_message || '');
    setFormSource(alert.source_attribution || '');
    setFormCountry(alert.country || 'India');
    setFormState(alert.state || '');
    setFormCity(alert.city || '');
    setFormStatus(alert.status || 'ACTIVE');

    const toISOStringForInput = (d) => {
      if (!d) return '';
      const date = new Date(d);
      if (isNaN(date.getTime())) return '';
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    setFormValidFrom(toISOStringForInput(alert.valid_from));
    setFormValidUntil(toISOStringForInput(alert.valid_until));
    setShowModal(true);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: formTitle,
        alert_type: formAlertType,
        severity: formSeverity,
        geometry_type: formGeometryType,
        latitude: formGeometryType === 'circle' || (formPolygonCoords.length === 0) ? parseFloat(formLat) : (formPolygonCoords[0]?.[0] || parseFloat(formLat)),
        longitude: formGeometryType === 'circle' || (formPolygonCoords.length === 0) ? parseFloat(formLng) : (formPolygonCoords[0]?.[1] || parseFloat(formLng)),
        radius_meters: formGeometryType === 'circle' ? parseInt(formRadius, 10) : null,
        polygon_coordinates: formGeometryType === 'polygon' ? formPolygonCoords : null,
        description: formDescription,
        advisory_message: formAdvisory,
        source_attribution: formSource,
        country: formCountry,
        state: formState,
        city: formCity,
        status: formStatus,
        valid_from: formValidFrom ? new Date(formValidFrom).toISOString() : new Date().toISOString(),
        valid_until: formValidUntil ? new Date(formValidUntil).toISOString() : new Date(Date.now() + 86400000).toISOString()
      };

      if (editingAlert) {
        await api.put(`/temporary-alerts/${editingAlert.id}`, payload);
      } else {
        await api.post('/temporary-alerts', payload);
      }

      setShowModal(false);
      fetchAlerts();
    } catch (err) {
      const isRoleMismatch = err.response?.status === 403 || String(err.response?.data?.message || err.message || '').toLowerCase().includes('tourist');
      const isAuthMissing = err.response?.status === 401 || err.message?.includes('Authorization') || err.message?.includes('token');

      if (isRoleMismatch) {
        alert('Permission Denied: You are currently logged in with a Tourist account. Deploying safety alerts requires an Administrator or Police HQ account. Redirecting to Admin Command login...');
        localStorage.removeItem('rakshasetu_user');
        localStorage.removeItem('rakshasetu_token');
        localStorage.removeItem('rakshasetu_admin_token');
        window.location.href = '/login';
        return;
      }

      if (isAuthMissing) {
        alert('Authentication required: Your admin session is missing or expired. Redirecting to Admin Login...');
        window.location.href = '/login';
        return;
      }
      alert(`Error saving alert: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Action: Resolve Alert
  const handleResolveAlert = async (alert) => {
    const reason = window.prompt(`Enter resolution reason for "${alert.title}":`, 'Condition stabilized by local district authority.');
    if (reason === null) return;
    try {
      await api.post(`/temporary-alerts/${alert.id}/resolve`, { resolution_notes: reason });
      fetchAlerts();
    } catch (err) {
      alert(`Failed to resolve alert: ${err.response?.data?.message || err.message}`);
    }
  };

  // Quick Action: Toggle Status
  const handleToggleStatus = async (alert) => {
    const nextStatus = alert.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await api.patch(`/temporary-alerts/${alert.id}/status`, { status: nextStatus });
      fetchAlerts();
    } catch (err) {
      alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
    }
  };

  // Quick Action: Delete Alert
  const handleDeleteAlert = async (alert) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${alert.title}"?`)) return;
    try {
      await api.delete(`/temporary-alerts/${alert.id}`);
      fetchAlerts();
    } catch (err) {
      alert(`Failed to delete alert: ${err.response?.data?.message || err.message}`);
    }
  };

  // Quick Action: Open Extend Modal
  const handleOpenExtend = (alert) => {
    setExtendingAlert(alert);
    setExtendHours(24);
    setExtendReason('');
    setExtendCustomDate('');
    setShowExtendModal(true);
  };

  // Submit Expiry Extension
  const handleSubmitExtend = async (e) => {
    e.preventDefault();
    if (!extendingAlert) return;
    setSubmitting(true);
    try {
      const payload = {
        extension_reason: extendReason || 'Extended by safety admin review'
      };
      if (extendCustomDate) {
        payload.new_valid_until = new Date(extendCustomDate).toISOString();
      } else {
        payload.hours = parseInt(extendHours, 10);
      }

      await api.post(`/temporary-alerts/${extendingAlert.id}/extend`, payload);
      setShowExtendModal(false);
      fetchAlerts();
    } catch (err) {
      alert(`Failed to extend alert: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'ACTIVE').length,
    draft: alerts.filter(a => a.status === 'DRAFT').length,
    resolved: alerts.filter(a => a.status === 'RESOLVED').length,
    expired: alerts.filter(a => a.status === 'EXPIRED').length,
    disabled: alerts.filter(a => a.status === 'DISABLED').length
  };

  // Time remaining format helper
  const formatTimeRemaining = (validUntil, status) => {
    if (status === 'RESOLVED') return 'Resolved';
    if (status === 'DISABLED') return 'Disabled';
    if (status === 'DRAFT') return 'Draft';
    if (!validUntil) return 'Indefinite';
    const diff = new Date(validUntil).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${mins}m remaining`;
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in text-slate-900">
      
      {/* ── Header Banner ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0a2540] via-[#0D47A1] to-[#1e3a8a] text-white p-6 rounded-3xl shadow-xl border border-blue-900/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 m-0">
              <Zap className="w-6 h-6 text-amber-400 animate-pulse" />
              Dynamic Temporary Safety Alert Zones
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-400/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Broadcast Engine
            </span>
          </div>
          <p className="text-xs font-semibold text-blue-100 m-0 mt-1">
            Create, manage, and broadcast dynamic temporary perimeter safety alert zones worldwide with geofence routing warnings
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchAlerts}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Safety Alert</span>
          </button>
        </div>
      </div>

      {/* ── Stats Metric Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          { label: 'Total Alerts', val: stats.total, color: 'text-slate-900', bg: 'bg-white', border: 'border-slate-200' },
          { label: 'Active Zones', val: stats.active, color: 'text-red-600', bg: 'bg-red-50/70', border: 'border-red-200', pulse: stats.active > 0 },
          { label: 'Drafts', val: stats.draft, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
          { label: 'Resolved', val: stats.resolved, color: 'text-emerald-700', bg: 'bg-emerald-50/70', border: 'border-emerald-200' },
          { label: 'Expired', val: stats.expired, color: 'text-amber-700', bg: 'bg-amber-50/70', border: 'border-amber-200' },
          { label: 'Disabled', val: stats.disabled, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' }
        ].map((s, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border ${s.border} ${s.bg} shadow-xs space-y-1`}>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{s.label}</span>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-black ${s.color}`}>{s.val}</span>
              {s.pulse && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Controls ───────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'ACTIVE', 'DRAFT', 'RESOLVED', 'EXPIRED', 'DISABLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  statusFilter === st
                    ? 'bg-[#0D47A1] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Alerts' : st}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, city, source..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs font-bold">
          <div>
            <label className="text-[10px] uppercase text-slate-400 font-black block mb-1">Severity Filter</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">🔴 Critical</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">🟢 Low</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase text-slate-400 font-black block mb-1">Alert Type Filter</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold"
            >
              <option value="ALL">All 18+ Types</option>
              {ALERT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Alerts Cards Grid ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-bold">Loading temporary safety alert zones...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 space-y-3">
          <AlertOctagon className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-black text-slate-800 m-0">No Temporary Alerts Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto m-0">
            {statusFilter !== 'ALL' || severityFilter !== 'ALL' || searchQuery
              ? 'No alerts match your search/filter criteria. Try resetting filters.'
              : 'There are currently no dynamic temporary safety alert zones active. Click "Create Safety Alert" to deploy one.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white font-black text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" /> Create First Alert
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => {
            const isCircle = alert.geometry_type === 'circle' || !alert.geometry_type;
            const isPolygon = alert.geometry_type === 'polygon';
            const sev = (alert.severity || 'HIGH').toUpperCase();
            const isAct = alert.status === 'ACTIVE';

            const typeMeta = ALERT_TYPES.find(t => t.value === alert.alert_type) || { label: alert.alert_type || 'Safety Hazard' };

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-3xl bg-white border transition-all duration-200 hover:shadow-lg flex flex-col justify-between space-y-4 ${
                  isAct ? 'border-red-300 ring-1 ring-red-100 shadow-xs' : 'border-slate-200'
                }`}
              >
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 line-clamp-1">
                      {typeMeta.label}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        alert.status === 'ACTIVE' ? 'bg-red-100 text-red-700 border border-red-200' :
                        alert.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' :
                        alert.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                        alert.status === 'EXPIRED' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {alert.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-white ${
                        sev === 'CRITICAL' ? 'bg-red-600' :
                        sev === 'HIGH' ? 'bg-orange-500' :
                        sev === 'MEDIUM' ? 'bg-amber-500' :
                        'bg-emerald-600'
                      }`}>
                        {sev}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 m-0 leading-snug">{alert.title}</h3>
                    <p className="text-xs text-slate-600 m-0 mt-1 line-clamp-2 leading-relaxed font-medium">
                      {alert.description || alert.advisory_message || 'No description provided.'}
                    </p>
                  </div>

                  {/* Badges and metadata */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-[11px] font-semibold text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{alert.city ? `${alert.city}, ` : ''}{alert.state || alert.country || 'Worldwide'}</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {isCircle ? `⭕ Radius: ${alert.radius_meters || 500}m` : `📐 Polygon (${alert.polygon_coordinates ? JSON.parse(typeof alert.polygon_coordinates === 'string' ? alert.polygon_coordinates : '[]').length : 0} pts)`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                      <span className="flex items-center gap-1 font-bold text-slate-500">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>{formatTimeRemaining(alert.valid_until, alert.status)}</span>
                      </span>
                      {alert.source_attribution && (
                        <span className="text-slate-500 truncate max-w-[130px]" title={alert.source_attribution}>
                          Auth: <strong className="text-slate-700">{alert.source_attribution}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleResolveAlert(alert)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-black flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        title="Mark alert resolved"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Resolve</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenExtend(alert)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-black flex items-center gap-1 cursor-pointer transition"
                      title="Extend expiry time"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Extend</span>
                    </button>

                    <button
                      onClick={() => handleToggleStatus(alert)}
                      className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                      title={alert.status === 'ACTIVE' ? 'Disable alert' : 'Activate alert'}
                    >
                      {alert.status === 'ACTIVE' ? <Ban className="w-3 h-3 text-red-500" /> : <Zap className="w-3 h-3 text-emerald-600" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(alert)}
                      className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer"
                      title="Edit Alert"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert)}
                      className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer"
                      title="Delete Alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT ALERT MODAL ──────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#0a2540] to-[#0D47A1] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white m-0">
                  {editingAlert ? `Edit Temporary Alert: ${editingAlert.title}` : 'Deploy Dynamic Temporary Safety Alert Zone'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Row 1: Title, Alert Type, Severity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Alert Title *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Flash Flood & Landslide Warning"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Alert Type (18+ Categories) *</label>
                  <select
                    value={formAlertType}
                    onChange={(e) => setFormAlertType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                  >
                    {ALERT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Severity Level *</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                  >
                    <option value="CRITICAL">🔴 Critical (Immediate Evacuate / High Threat)</option>
                    <option value="HIGH">🟠 High (Avoid Zone / Major Hazard)</option>
                    <option value="MEDIUM">🟡 Medium (Exercise Vigilance / Caution)</option>
                    <option value="LOW">🟢 Low (Advisory Notice)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Geometry Type Selection */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-black text-blue-950 uppercase">Perimeter Geometry</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormGeometryType('circle')}
                      className={`px-3 py-1 rounded-xl text-xs font-black cursor-pointer transition ${
                        formGeometryType === 'circle' ? 'bg-[#0D47A1] text-white shadow-xs' : 'bg-white text-slate-700 border'
                      }`}
                    >
                      ⭕ Circular Radius
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormGeometryType('polygon')}
                      className={`px-3 py-1 rounded-xl text-xs font-black cursor-pointer transition ${
                        formGeometryType === 'polygon' ? 'bg-[#0D47A1] text-white shadow-xs' : 'bg-white text-slate-700 border'
                      }`}
                    >
                      📐 Custom Polygon (Vertices)
                    </button>
                  </div>
                </div>

                {/* Circle Controls */}
                {formGeometryType === 'circle' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Center Latitude *</label>
                      <input
                        type="number"
                        step="any"
                        value={formLat}
                        onChange={(e) => setFormLat(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Center Longitude *</label>
                      <input
                        type="number"
                        step="any"
                        value={formLng}
                        onChange={(e) => setFormLng(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Radius (Meters): {formRadius}m</label>
                      <input
                        type="range"
                        min="100"
                        max="25000"
                        step="100"
                        value={formRadius}
                        onChange={(e) => setFormRadius(parseInt(e.target.value, 10))}
                        className="w-full cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  /* Polygon Controls */
                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">
                        Click on map below to place polygon vertices ({formPolygonCoords.length} points added, min 3)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFormPolygonCoords(prev => prev.slice(0, -1))}
                          disabled={formPolygonCoords.length === 0}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer disabled:opacity-50"
                        >
                          Undo Last Point
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormPolygonCoords([])}
                          disabled={formPolygonCoords.length === 0}
                          className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold text-[10px] cursor-pointer disabled:opacity-50"
                        >
                          Clear Points
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Google Maps Mini Drawing & Preview Map */}
                <div className="h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
                  <AdminGoogleMapDrawer
                    centerLat={parseFloat(formLat) || 11.0168}
                    centerLng={parseFloat(formLng) || 76.9558}
                    geometryType={formGeometryType}
                    radius={parseInt(formRadius, 10) || 1000}
                    polygonCoords={formPolygonCoords}
                    onSetCircleCenter={(lat, lng) => {
                      setFormLat(lat.toFixed(6));
                      setFormLng(lng.toFixed(6));
                    }}
                    onAddPolygonPoint={(pt) => {
                      setFormPolygonCoords(prev => [...prev, pt]);
                      setFormLat(pt[0].toFixed(6));
                      setFormLng(pt[1].toFixed(6));
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Description & Advisory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Description / Hazard Details *</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Provide specific situation details, causes, affected roads..."
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium h-20 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Safety Advisory Message *</label>
                  <textarea
                    value={formAdvisory}
                    onChange={(e) => setFormAdvisory(e.target.value)}
                    placeholder="Instructions for tourists (e.g. Seek higher ground, use bypass highway NH54)..."
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium h-20 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 4: Source Attribution & Location Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Source Attribution</label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    placeholder="e.g. State Disaster Management"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">City / Region</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. Nilgiris / Coimbatore"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">State / Province</label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    placeholder="e.g. Tamil Nadu"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Country</label>
                  <input
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Row 5: Validity Period & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Valid From</label>
                  <input
                    type="datetime-local"
                    value={formValidFrom}
                    onChange={(e) => setFormValidFrom(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Valid Until (Auto-Expiration)</label>
                  <input
                    type="datetime-local"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    <option value="ACTIVE">⚡ Active (Live Broadcast)</option>
                    <option value="DRAFT">📝 Draft (Not Broadcast)</option>
                    <option value="DISABLED">⛔ Disabled</option>
                  </select>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{editingAlert ? 'Save & Update Alert' : 'Deploy Alert Worldwide'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── EXTEND EXPIRY MODAL ────────────────────────────────────────────── */}
      {showExtendModal && extendingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900 m-0">Extend Alert Expiry</h3>
              </div>
              <button onClick={() => setShowExtendModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <span className="font-extrabold text-slate-900 block">{extendingAlert.title}</span>
              <p className="text-slate-500 m-0">
                Current expiry: <strong className="text-slate-800">{new Date(extendingAlert.valid_until).toLocaleString()}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmitExtend} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Extension Preset</label>
                <div className="grid grid-cols-4 gap-2">
                  {[6, 12, 24, 48].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setExtendHours(h);
                        setExtendCustomDate('');
                      }}
                      className={`py-2 rounded-xl text-xs font-extrabold cursor-pointer border transition ${
                        extendHours === h && !extendCustomDate
                          ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +{h} Hours
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Or Specific New Expiry Date</label>
                <input
                  type="datetime-local"
                  value={extendCustomDate}
                  onChange={(e) => setExtendCustomDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Extension Reason</label>
                <input
                  type="text"
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="e.g. Inclement weather sustained overnight"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                  <span>Confirm Extension</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
