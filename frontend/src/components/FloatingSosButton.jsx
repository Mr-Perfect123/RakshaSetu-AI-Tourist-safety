import React, { useState } from 'react';
import { AlertOctagon, ShieldAlert, CheckCircle, X, PhoneCall, Loader2 } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import { useLanguage } from '../context/LanguageContext';

const FloatingSosButton = ({ tourist, darkMode }) => {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [sosCode, setSosCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendSos = async () => {
    setLoading(true);
    setErrorMessage('');
    
    // Default coordinates fallback if geolocation fails
    let lat = 11.0168;
    let lng = 76.9558;

    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (err) {
        console.warn('Using default coordinates for SOS dispatch');
      }
    }

    const resolvedAddress = localStorage.getItem('rakshasetu_user_city') || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    try {
      const payload = {
        latitude: lat,
        longitude: lng,
        address: resolvedAddress,
        triggerType: 'one_tap_sos',
        description: 'Tourist triggered emergency SOS alert from RakshaSetu Mobile App.'
      };

      const res = await api.post('/sos/trigger', payload);
      const data = res.data?.data || res.data;

      const generatedCode = data?.sos_code || data?.id ? `SOS-${data.id}` : `SOS-${Date.now().toString().slice(-6)}`;
      setSosCode(generatedCode);
      setSosSent(true);

      // Emit live socket event for immediate admin command center alert
      try {
        socket.emit('trigger_sos_event', {
          id: data?.id || Date.now(),
          sos_code: generatedCode,
          sosCode: generatedCode,
          touristId: tourist?.id || 4,
          touristName: tourist?.full_name || 'Tourist User',
          tourist_name: tourist?.full_name || 'Tourist User',
          touristPhone: tourist?.phone || '+91 98765 43210',
          phone: tourist?.phone || '+91 98765 43210',
          touristEmail: tourist?.email || '',
          nationality: tourist?.nationality || 'India',
          latitude: lat,
          longitude: lng,
          address: resolvedAddress,
          trigger_type: 'one_tap_sos',
          status: 'active',
          created_at: new Date().toISOString()
        });
      } catch (e) {}

    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Could not send SOS alert. Please call 112 directly.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSosSent(false);
    setErrorMessage('');
  };

  return (
    <>
      {/* Floating SOS Trigger Button */}
      <div className="fixed bottom-16 md:bottom-6 right-4 z-40">
        <button
          onClick={() => setShowModal(true)}
          className="group relative flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-red-600 to-rose-700 text-white font-extrabold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-white/20 animate-pulse"
          title="Emergency SOS Panic Trigger"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center animate-spin-slow">
            <AlertOctagon className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-black tracking-wider uppercase pr-1">
            {t('dashboard.emergencySos', 'SOS')}
          </span>
        </button>
      </div>

      {/* Confirmation & Active Emergency Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/20">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
                <h3 className="text-lg font-black tracking-tight m-0">
                  {t('sos.sosTitle', 'Emergency SOS')}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!sosSent ? (
              <div className="py-5 space-y-4">
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300">
                  <p className="text-sm font-bold text-center mb-1">
                    {t('sos.confirmQuestion', 'Do you want to send an emergency alert?')}
                  </p>
                  <p className="text-xs text-center opacity-90 leading-relaxed">
                    {t('sos.sosWarning', 'This will instantly broadcast your live GPS coordinates, timestamp, and profile to nearby police stations, medical emergency teams, and registered emergency contacts.')}
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-semibold text-center">
                    {errorMessage}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleCloseModal}
                    disabled={loading}
                    className={`flex-1 py-3 rounded-2xl font-extrabold text-xs border transition-all ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t('sos.cancelBtn', 'Cancel')}
                  </button>

                  <button
                    onClick={handleSendSos}
                    disabled={loading}
                    className="flex-1 py-3 rounded-2xl font-extrabold text-xs bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Alert...</span>
                      </>
                    ) : (
                      <>
                        <AlertOctagon className="w-4 h-4" />
                        <span>{t('sos.sendSosBtn', 'SEND SOS')}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <a
                    href="tel:112"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Call National Helpline 112 Directly
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-500 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {t('sos.sosActiveTitle', 'EMERGENCY SOS DISPATCHED')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {t('sos.firstRespondersNotified', 'First Responders & Emergency Contacts Notified.')}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">Tracking SOS Reference</span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400 tracking-wider">{sosCode}</span>
                </div>

                <button
                  onClick={handleCloseModal}
                  className="w-full py-3 rounded-2xl bg-[#0D47A1] text-white font-extrabold text-xs shadow-md"
                >
                  Return to App
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingSosButton;
