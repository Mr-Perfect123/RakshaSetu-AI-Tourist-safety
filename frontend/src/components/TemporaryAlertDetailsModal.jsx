import React from 'react';
import {
  AlertOctagon, X, ShieldAlert, MapPin, Calendar, Clock,
  ExternalLink, CheckCircle2, AlertTriangle, ShieldCheck, Info
} from 'lucide-react';

const TemporaryAlertDetailsModal = ({
  alert,
  isOpen,
  onClose,
  darkMode = false
}) => {
  if (!isOpen || !alert) return null;

  const {
    title = 'Temporary Safety Advisory',
    alert_type = 'Other',
    severity = 'high',
    status = 'ACTIVE',
    location_name = 'Monitored Sector',
    country,
    state,
    city,
    description,
    safety_instruction,
    source_type = 'Official Authority',
    source_name = 'District Administration',
    source_url,
    is_verified = true,
    starts_at,
    expires_at
  } = alert;

  const formatTime = (ts) => {
    if (!ts) return 'Indefinite / Ongoing';
    try {
      const d = new Date(ts);
      return d.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return ts;
    }
  };

  const severityColor =
    severity === 'critical'
      ? 'bg-red-600 text-white'
      : severity === 'high'
      ? 'bg-orange-600 text-white'
      : severity === 'moderate'
      ? 'bg-amber-500 text-white'
      : 'bg-blue-600 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/75 backdrop-blur-md animate-fadeIn">
      <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header Ribbon Banner */}
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25">
                  Temporary Safety Alert
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${severityColor}`}>
                  {severity} Risk
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white m-0 mt-0.5">{alert_type}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Location & Title */}
          <div className="space-y-1">
            <h3 className="text-base font-black m-0">{title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>{location_name}</span>
              {(city || state || country) && (
                <span className="opacity-80">
                  • {[city, state, country].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {description && (
            <div className={`p-4 rounded-2xl border ${
              darkMode ? 'bg-slate-800/60 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Advisory Notice
              </h4>
              <p className="text-xs font-medium leading-relaxed m-0">{description}</p>
            </div>
          )}

          {/* Safety Instructions */}
          {safety_instruction && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5 m-0">
                <AlertTriangle className="w-3.5 h-3.5" /> Safety Instructions for Tourists
              </h4>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 leading-relaxed m-0">
                {safety_instruction}
              </p>
            </div>
          )}

          {/* Timeframe & Validity */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-3 rounded-2xl border ${
              darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
            }`}>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                <Clock className="w-3 h-3 text-blue-500" /> Active From
              </div>
              <span className="font-extrabold text-[11px] block">{formatTime(starts_at)}</span>
            </div>

            <div className={`p-3 rounded-2xl border ${
              darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
            }`}>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                <Calendar className="w-3 h-3 text-orange-500" /> Valid Until
              </div>
              <span className="font-extrabold text-[11px] block text-orange-600 dark:text-orange-400">
                {formatTime(expires_at)}
              </span>
            </div>
          </div>

          {/* Source Attribution & Verification */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
            darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <span className="font-extrabold block text-slate-800 dark:text-slate-200">
                  {source_name || source_type}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {is_verified ? 'Verified Safety Source' : 'Advisory Source'} • Status: <strong className="text-green-600 dark:text-green-400">ACTIVE</strong>
                </span>
              </div>
            </div>

            {source_url && (
              <a
                href={source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0D47A1] dark:text-blue-300 font-bold text-[11px] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            RakshaSetu Tourist Protection Command
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-800 transition-all cursor-pointer shadow-md"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemporaryAlertDetailsModal;
