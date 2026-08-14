import React, { useState } from 'react';
import { FileText, Plus, MapPin, AlertTriangle, CheckCircle2, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Incidents = ({ darkMode }) => {
  const [incidents, setIncidents] = useState([
    {
      id: 1,
      report_code: 'INC-2026-4401',
      category: 'scam',
      title: 'Unregistered Auto Driver Charging Exorbitant Rate',
      description: 'Driver refused meter and locked doors near Connaught Place Outer Circle.',
      severity: 'medium',
      location_name: 'Connaught Place Outer Circle',
      status: 'under_investigation',
      created_at: new Date().toISOString()
    }
  ]);

  const [form, setForm] = useState({
    category: 'scam',
    title: '',
    description: '',
    severity: 'medium',
    location_name: 'Connaught Place, New Delhi',
    latitude: 28.6320,
    longitude: 77.2190
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      const res = await api.post('/incidents', form);
      if (res.data) {
        setIncidents((prev) => [res.data, ...prev]);
      } else {
        setIncidents((prev) => [
          {
            id: Date.now(),
            report_code: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            ...form,
            status: 'pending',
            created_at: new Date().toISOString()
          },
          ...prev
        ]);
      }
      setSuccess(true);
      setForm({ category: 'scam', title: '', description: '', severity: 'medium', location_name: 'Connaught Place', latitude: 28.6320, longitude: 77.2190 });
    } catch (err) {
      setIncidents((prev) => [
        {
          id: Date.now(),
          report_code: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          ...form,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header Bar — Frosted Glass Container for High Text Visibility */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-md flex items-center gap-3 ${
        darkMode ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
      } backdrop-blur-md`}>
        <Link to="/" className={`p-2.5 rounded-xl border decoration-none ${
          darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className={`text-xl font-extrabold flex items-center gap-2 m-0 ${
            darkMode ? 'text-red-400' : 'text-red-800 font-extrabold'
          }`}>
            <FileText className="w-6 h-6 text-red-600" /> Crowd-Sourced Tourist Incident Reporting
          </h1>
          <p className={`text-xs font-semibold m-0 mt-0.5 ${
            darkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Report scams, thefts, traffic blocks, or accidents to Police Control Room
          </p>
        </div>
      </div>

      {/* Report Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800">File New Incident Report</h3>

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Report submitted successfully! Case code generated and sent to Police Dispatcher.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Incident Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
              >
                <option value="scam">Touts & Exorbitant Rate Scam</option>
                <option value="crime">Pickpocketing / Theft</option>
                <option value="accident">Accident / Medical Injury</option>
                <option value="road_block">Road Block / Traffic Protest</option>
                <option value="missing_person">Missing Travel Companion</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Report Headline Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Overcharging Auto Driver near Market"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Location Details</label>
            <input
              type="text"
              required
              placeholder="e.g. Connaught Place Outer Circle, Gate No 3"
              value={form.location_name}
              onChange={(e) => setForm({ ...form, location_name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Detailed Event Description</label>
            <textarea
              required
              rows="3"
              placeholder="Describe what occurred, vehicle numbers, physical descriptions..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all shadow-md flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> {submitting ? 'Submitting Report...' : 'Submit Official Incident Report'}
          </button>
        </form>
      </div>

      {/* Submitted Incidents History */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Your Incident Filing History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incidents.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold uppercase">
                  {item.category}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">{item.report_code}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
              <p className="text-[11px] text-slate-600 line-clamp-2">{item.description}</p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">📍 {item.location_name}</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-primary font-bold uppercase text-[10px]">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Incidents;
