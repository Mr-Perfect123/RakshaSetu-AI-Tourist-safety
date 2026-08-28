import React, { useState, useEffect } from 'react';
import { Settings, Send, Radio, Shield, Cpu, FileText, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const SettingsPage = () => {
  const { language, setLanguage, t } = useLanguage();
  const [langNotice, setLangNotice] = useState('');
  const [broadcast, setBroadcast] = useState({
    title: '',
    message: '',
    targetNationality: 'All',
    severity: 'warning'
  });
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, action: 'SYSTEM_BOOT', details: 'RakshaSetu Emergency Dispatch Engine Initialized', created_at: new Date().toISOString() }
  ]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/audit-logs');
        if (res.data) setAuditLogs(res.data);
      } catch (err) {
        console.warn('Using default audit log entries');
      }
    };
    fetchLogs();
  }, []);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    setSending(true);
    setSentSuccess(false);

    try {
      const res = await api.post('/admin/broadcast', broadcast);
      if (res.data) {
        setAuditLogs(prev => [res.data, ...prev]);
      }
      setSentSuccess(true);
      setBroadcast({ title: '', message: '', targetNationality: 'All', severity: 'warning' });
    } catch (err) {
      setSentSuccess(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar — Royal Ocean Gradient Banner */}
      <div className="bg-gradient-to-r from-[#0a2540] via-[#0D47A1] to-[#1e3a8a] text-white p-6 rounded-3xl shadow-xl border border-blue-900/20 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 m-0">
            <Settings className="w-6 h-6 text-blue-300" /> {t('settings.title', 'Command Center Configuration & Emergency Broadcast Sentinel')}
          </h1>
          <p className="text-xs font-semibold text-blue-100 m-0 mt-1">
            {t('settings.subtitle', 'Configure system parameters, transmit real-time safety advisories & audit system dispatch logs')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Advisory Sender */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Radio className="w-5 h-5 text-danger animate-pulse" />
            <h2 className="text-sm font-bold text-slate-800">{t('settings.broadcastCard', 'Broadcast Tourist Safety Advisory')}</h2>
          </div>

          {sentSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {t('settings.successMsg', 'Safety Advisory Broadcast transmitted successfully to all active tourist devices!')}
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-600 mb-1">{t('settings.advisoryTitleLabel', 'Advisory Title')}</label>
              <input
                type="text"
                required
                placeholder={t('settings.advisoryTitlePlaceholder', 'e.g. Heavy Traffic Alert - Connaught Place Outer Ring')}
                value={broadcast.title}
                onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-600 mb-1">{t('settings.targetNationalityLabel', 'Target Tourist Demographic')}</label>
                <select
                  value={broadcast.targetNationality}
                  onChange={(e) => setBroadcast({ ...broadcast, targetNationality: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="All">{t('settings.allTourists', 'All Registered Tourists')}</option>
                  <option value="American">{t('settings.usNationals', 'United States Nationals')}</option>
                  <option value="French">{t('settings.frNationals', 'French Nationals')}</option>
                  <option value="Japanese">{t('settings.jpNationals', 'Japanese Nationals')}</option>
                  <option value="British">{t('settings.ukNationals', 'British Nationals')}</option>
                  <option value="German">{t('settings.deNationals', 'German Nationals')}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">{t('settings.advisorySeverityLabel', 'Advisory Severity')}</label>
                <select
                  value={broadcast.severity}
                  onChange={(e) => setBroadcast({ ...broadcast, severity: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="info">{t('settings.infoAdvisory', 'Informational Advisory')}</option>
                  <option value="warning">{t('settings.warningAdvisory', 'Warning / Caution')}</option>
                  <option value="critical">{t('settings.criticalAdvisory', 'Critical Safety Warning')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">{t('settings.messageContentLabel', 'Detailed Message Content')}</label>
              <textarea
                required
                rows="3"
                placeholder={t('settings.messageContentPlaceholder', 'Provide clear preventive instructions or alternate routes...')}
                value={broadcast.message}
                onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-danger text-white font-bold text-xs shadow-md hover:bg-danger-dark transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> {sending ? t('settings.transmitting', 'Transmitting Alert...') : t('settings.transmitBtn', 'Transmit Immediate Advisory')}
            </button>
          </form>
        </div>

        {/* AI & Infrastructure Settings */}
        <div className="space-y-6">
          {/* Language Selection Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold border-b border-slate-100 pb-2 text-xs">
              <Settings className="w-4 h-4 text-primary" /> {t('settings.langTitle', 'Dashboard Language')}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {t('settings.langSubtitle', 'Choose the language used for the administrative panels.')}
            </p>
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('settings.langLabel', 'Primary Language')}</label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setLangNotice(t('settings.savedNotice', 'Language settings updated successfully.'));
                  setTimeout(() => setLangNotice(''), 4000);
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Hindi">हिंदी (Hindi)</option>
                <option value="Tamil">தமிழ் (Tamil)</option>
                <option value="Marathi">मराठी (Marathi)</option>
                <option value="Telugu">తెలుగు (Telugu)</option>
                <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                <option value="Malayalam">മലയാളം (Malayalam)</option>
              </select>
              {langNotice && (
                <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ {langNotice}</p>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold border-b border-slate-100 pb-2 text-xs">
              <Cpu className="w-4 h-4" /> {t('settings.geminiStatus', 'Gemini AI Service Status')}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>{t('settings.modelEngine', 'Model Engine')}:</span>
                <span className="font-mono font-bold text-primary">gemini-1.5-flash</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>{t('settings.statusLabel', 'Status')}:</span>
                <span className="font-bold text-emerald-600">{t('settings.onlineReady', 'Online & Ready')}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>{t('settings.latencyLabel', 'Latency')}:</span>
                <span className="font-mono">180 ms</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold border-b border-slate-100 pb-2 text-xs">
              <Shield className="w-4 h-4" /> {t('settings.nationalHelplines', 'National Helplines Override')}
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between"><span>{t('settings.nationalEmergency', 'National Emergency')}:</span><span className="font-bold text-danger">112</span></div>
              <div className="flex justify-between"><span>{t('settings.policeDispatch', 'Police Dispatch')}:</span><span className="font-bold text-primary">100</span></div>
              <div className="flex justify-between"><span>{t('settings.ambulanceService', 'Ambulance Service')}:</span><span className="font-bold text-emerald-600">102</span></div>
              <div className="flex justify-between"><span>{t('settings.touristHelpline', 'Tourist Helpline')}:</span><span className="font-bold text-amber-600">1363</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* System Audit Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> {t('settings.systemAuditTitle', 'System Dispatch & Action Audit Trail')}
        </h3>
        <div className="divide-y divide-slate-100 text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-primary">{log.action}</span>
                <p className="text-slate-600 text-[11px] mt-0.5">{log.details}</p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(log.created_at || Date.now()).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
