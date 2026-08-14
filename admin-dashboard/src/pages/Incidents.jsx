import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle, Eye, CheckCircle2, MapPin, Clock, Search, Activity, RefreshCw } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/incidents');
      if (res.data && Array.isArray(res.data)) {
        setIncidents(res.data);
      }
    } catch (err) {
      console.warn('API incidents fetch failed, using fallback feed');
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
        return [
          {
            id: report.id || Date.now(),
            report_code: report.report_code || `INC-${Date.now().toString().slice(-6)}`,
            category: report.category || 'general_safety',
            title: report.title || data.title || 'Tourist Incident Report',
            description: report.description || data.description || 'Reported by tourist app user.',
            reporter_name: data.touristName || report.reporter_name || 'Tourist User',
            reporter_phone: data.touristPhone || report.reporter_phone || '',
            severity: report.severity || 'medium',
            location_name: report.location_name || report.locationName || 'GPS Target Area',
            status: report.status || 'under_investigation',
            created_at: report.created_at || new Date().toISOString()
          },
          ...prev
        ];
      });
    };

    socket.on('new_incident_report', handleNewIncident);

    return () => {
      socket.off('new_incident_report', handleNewIncident);
    };
  }, []);

  const handleStatusUpdate = async (id, status) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
    try {
      await api.patch(`/incidents/${id}/status`, { status });
    } catch (e) {}
  };

  const filteredIncidents = incidents.filter((i) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (i.title || '').toLowerCase().includes(term) ||
      (i.category || '').toLowerCase().includes(term) ||
      (i.location_name || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar — Frosted Glass Container for High Text Visibility */}
      <div className="bg-slate-900/90 border border-slate-700 text-white backdrop-blur-md p-5 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2 m-0">
            <FileText className="w-6 h-6 text-red-400" /> Tourist Incident Reports & Verification Desk
          </h1>
          <p className="text-xs font-semibold text-slate-300 m-0 mt-0.5">
            Live crowd-sourced crime, scam, harassment, and road hazard reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary w-64"
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

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Activity className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading incident report queue...</p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No Incident Reports Logged</p>
          <p className="text-xs text-slate-500 mt-1">All clear. Listening to real-time tourist submissions via WebSocket.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredIncidents.map((item) => (
            <div key={item.id} className="bg-white/85 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                  item.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.category || 'Safety Issue'} ({item.severity || 'Medium'})
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">{item.report_code || `INC-${item.id}`}</span>
              </div>

              <h3 className="text-sm font-extrabold text-slate-800 m-0">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium m-0">{item.description}</p>

              <div className="text-[11px] text-slate-500 font-semibold space-y-1 pt-1">
                <div>👤 Reported By: <strong className="text-slate-800">{item.reporter_name || 'Tourist User'}</strong></div>
                <div>📍 Location: <strong className="text-slate-800">{item.location_name || 'GPS Target Area'}</strong></div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  item.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  Status: {item.status}
                </span>

                <div className="flex items-center gap-2">
                  {item.status !== 'resolved' && (
                    <button
                      onClick={() => handleStatusUpdate(item.id, 'resolved')}
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {item.status !== 'under_investigation' && item.status !== 'resolved' && (
                    <button
                      onClick={() => handleStatusUpdate(item.id, 'under_investigation')}
                      className="px-3 py-1 rounded-lg bg-primary text-white font-bold text-[11px] hover:bg-blue-800 transition-colors cursor-pointer"
                    >
                      Investigate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Incidents;
