import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { 
  Globe, 
  Lock, 
  MapPin, 
  AlertTriangle, 
  Eye 
} from 'lucide-react';

const PrivacySettings = ({ darkMode }) => {
  const [locationActive, setLocationActive] = useState(false);
  const [coords, setCoords] = useState({ latitude: null, longitude: null, last_active_at: null });
  const [adminRequests, setAdminRequests] = useState([]);
  const [msg, setMsg] = useState('');
  const { language, setLanguage, t } = useLanguage();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/location/status');
      if (res.data) {
        setLocationActive(res.data.location_sharing_active);
        setCoords({
          latitude: res.data.latitude,
          longitude: res.data.longitude,
          last_active_at: res.data.last_active_at
        });
        setAdminRequests(res.data.pending_admin_requests || []);
      }
    } catch (err) {
      console.warn('Could not fetch location status:', err?.message || err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/location/status')
      .then((res) => {
        if (active && res.data) {
          setLocationActive(res.data.location_sharing_active);
          setCoords({
            latitude: res.data.latitude,
            longitude: res.data.longitude,
            last_active_at: res.data.last_active_at
          });
          setAdminRequests(res.data.pending_admin_requests || []);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch location status:', err?.message || err);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleStartSharing = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await api.post('/location/permission', { location_sharing_active: true });
            await api.post('/location/update', {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            });
            setLocationActive(true);
            setCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              last_active_at: new Date().toISOString()
            });
            setMsg('Location sharing ENABLED.');
          } catch (err) {
            console.error('Failed to update location on server:', err?.message || err);
          }
        },
        () => setMsg('Geolocation permission denied by browser.')
      );
    }
  };

  const handleStopSharing = async () => {
    try {
      await api.post('/location/stop');
      setLocationActive(false);
      setMsg('Location sharing DISABLED.');
    } catch (err) {
      console.error('Failed to stop location sharing:', err?.message || err);
    }
  };

  const handleRespondRequest = async (requestId, status) => {
    try {
      await api.post('/location/respond-request', { requestId, status });
      setMsg(`Admin request ${status === 'approved' ? 'APPROVED' : 'DECLINED'}.`);
      fetchStatus();
    } catch (err) {
      console.error('Failed to respond to admin location request:', err?.message || err);
    }
  };

  return (
    <div className={`min-h-screen p-4 sm:p-8 ${darkMode ? 'bg-slate-900 text-white' : 'bg-[#F5F7FA] text-slate-900'}`}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0D47A1] text-white flex items-center justify-center shadow-md">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Privacy & Application Settings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage multi-language preferences, location sharing consent, and security settings.</p>
          </div>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs font-bold border border-blue-200 flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
          </div>
        )}

        {/* Language Selection Settings Card */}
        <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            <span className="font-extrabold text-sm uppercase">{t('settings.languageTitle', 'Application Language Preferences')}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('settings.languageSubtitle', 'Select your preferred language. This changes the entire application interface (Amazon-style) and persists across logins.')}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {[
              { name: 'English', flag: '🇬🇧', label: 'English' },
              { name: 'Hindi', flag: '🇮🇳', label: 'हिंदी (Hindi)' },
              { name: 'Tamil', flag: '🇮🇳', label: 'தமிழ் (Tamil)' },
              { name: 'Marathi', flag: '🇮🇳', label: 'मराठी (Marathi)' },
              { name: 'Telugu', flag: '🇮🇳', label: 'తెలుగు (Telugu)' },
              { name: 'Malayalam', flag: '🇮🇳', label: 'മലയാളം (Malayalam)' },
              { name: 'Kannada', flag: '🇮🇳', label: 'ಕನ್ನಡ (Kannada)' },
              { name: 'Bengali', flag: '🇮🇳', label: 'বাংলা (Bengali)' }
            ].map((langItem) => (
              <button
                key={langItem.name}
                onClick={() => {
                  setLanguage(langItem.name);
                  setMsg(`Application language changed to ${langItem.name}. Preference saved to profile.`);
                }}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  language === langItem.name
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                    : darkMode
                    ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg">{langItem.flag}</span>
                <span>{langItem.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location Status Card */}
        <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className={`w-5 h-5 ${locationActive ? 'text-emerald-500' : 'text-slate-400'}`} />
              <span className="font-extrabold text-sm uppercase">Location Sharing Status</span>
            </div>
            <span className={`px-3 py-1 rounded-full font-black text-xs uppercase ${
              locationActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}>
              {locationActive ? '📍 Sharing: ON' : '🔒 Sharing: OFF'}
            </span>
          </div>

          {!locationActive ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" /> Location sharing is currently disabled.
              </div>
              <p>Your location is NOT being broadcast to emergency dispatch or command centers. Turn on sharing to enable emergency alerts and safe route monitoring.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-sans block text-[10px]">Latitude</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{coords.latitude ? coords.latitude.toFixed(6) : 'Available'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-sans block text-[10px]">Longitude</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{coords.longitude ? coords.longitude.toFixed(6) : 'Available'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-sans block text-[10px]">Last Updated</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{coords.last_active_at ? new Date(coords.last_active_at).toLocaleTimeString() : 'Just Now'}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {!locationActive ? (
              <button
                onClick={handleStartSharing}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                Start Location Sharing
              </button>
            ) : (
              <button
                onClick={handleStopSharing}
                className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                Stop Location Sharing
              </button>
            )}
          </div>
        </div>

        {/* Pending Admin Location Requests Drawer */}
        {adminRequests.length > 0 && (
          <div className="p-6 rounded-3xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 space-y-4">
            <h2 className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Pending Admin Location Requests ({adminRequests.length})
            </h2>

            {adminRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 shadow-sm space-y-2 text-xs">
                <p className="font-bold text-slate-800 dark:text-white">{req.message}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Requested by Admin: <span className="font-semibold text-slate-700 dark:text-slate-300">{req.admin_name}</span> at {new Date(req.requested_at).toLocaleString()}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleRespondRequest(req.id, 'declined')}
                    className="w-1/2 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    DECLINE
                  </button>
                  <button
                    onClick={() => handleRespondRequest(req.id, 'approved')}
                    className="w-1/2 py-2 rounded-xl bg-[#0D47A1] font-extrabold text-white hover:bg-blue-800 cursor-pointer"
                  >
                    ALLOW LOCATION
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacySettings;
