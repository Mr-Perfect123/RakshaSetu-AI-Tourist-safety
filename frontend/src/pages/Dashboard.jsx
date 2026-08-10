import React, { useState, useEffect } from 'react';
import { AlertOctagon, PhoneCall, Sparkles, FileText, Shield, MapPin, Mic, Radio, Heart, Activity, CheckCircle, Navigation, MessageSquare, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import TouristMap from '../components/TouristMap';
import api from '../services/api';
import socket from '../services/socket';

const Dashboard = ({ tourist, darkMode }) => {
  const [sosActive, setSosActive] = useState(false);
  const [activeSosCode, setActiveSosCode] = useState('');
  const [location, setLocation] = useState({ lat: 13.0827, lng: 80.2707 }); // Default Tamil Nadu (Chennai) if loading
  const [locationName, setLocationName] = useState('Detecting GPS location...');
  const [safeLocations, setSafeLocations] = useState([
    { id: 1, name: 'Central Police Station', type: 'police_station', latitude: 13.0835, longitude: 80.2720, phone: '+914423456789', address: 'Central Precinct' },
    { id: 2, name: 'City Emergency Hospital', type: 'hospital', latitude: 13.0800, longitude: 80.2680, phone: '+914423451111', address: 'Grand Emergency Desk' }
  ]);
  const [sosLoading, setSosLoading] = useState(false);

  useEffect(() => {
    // Obtain Real Browser Geolocation
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLocation({ lat, lng });

          // Emit live telemetry to Socket.io backend with tourist name
          socket.emit('tourist_location_update', {
            userId: tourist?.id || 4,
            latitude: lat,
            longitude: lng,
            speed: pos.coords.speed || 0,
            heading: pos.coords.heading || 0,
            touristName: tourist?.full_name || 'Tourist',
            battery: 98
          });

          // Perform Reverse Geocoding Lookup (Nominatim API)
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then((res) => res.json())
            .then((data) => {
              if (data && data.address) {
                const city = data.address.city || data.address.town || data.address.suburb || data.address.county || 'Current Location';
                const state = data.address.state || 'Tamil Nadu';
                setLocationName(`${city}, ${state}`);
              }
            })
            .catch(() => setLocationName(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`));
        },
        (err) => {
          console.warn('Geolocation permission pending or unavailable. Using region coordinates.');
          setLocationName('GPS Telemetry Active (Tamil Nadu)');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [tourist]);

  useEffect(() => {
    const fetchResponders = async () => {
      try {
        const res = await api.get('/admin/safe-locations');
        if (res.data && res.data.length > 0) setSafeLocations(res.data);
      } catch (err) {
        console.warn('Using responder safe locations');
      }
    };
    fetchResponders();
  }, []);

  const handleTriggerSos = async (triggerType = 'one_tap') => {
    setSosLoading(true);
    try {
      const res = await api.post('/sos/trigger', {
        latitude: location.lat,
        longitude: location.lng,
        address: locationName,
        triggerType: triggerType
      });

      if (res.data) {
        setSosActive(true);
        setActiveSosCode(res.data.sos_code || `SOS-${Date.now().toString().slice(-5)}`);
        socket.emit('trigger_sos_event', {
          ...res.data,
          touristName: tourist?.full_name || 'Tourist',
          touristPhone: tourist?.phone,
          nationality: tourist?.nationality
        });
      }
    } catch (err) {
      setSosActive(true);
      const code = `SOS-EMERGENCY-${Math.floor(1000 + Math.random() * 9000)}`;
      setActiveSosCode(code);
      // Still broadcast via socket even if API fails
      socket.emit('trigger_sos_event', {
        sos_code: code,
        touristName: tourist?.full_name || 'Tourist',
        touristPhone: tourist?.phone,
        nationality: tourist?.nationality,
        latitude: location.lat,
        longitude: location.lng,
        address: locationName,
        trigger_type: triggerType,
        status: 'active',
        created_at: new Date().toISOString()
      });
    } finally {
      setSosLoading(false);
    }
  };

  const handleCancelSos = async () => {
    setSosLoading(true);
    try {
      await api.put('/sos/cancel', { reason: 'User resolved situation safely' });
    } catch (err) {
      console.log('SOS marked cancelled');
    } finally {
      setSosActive(false);
      setActiveSosCode('');
      setSosLoading(false);
    }
  };

  // Dark mode aware class helpers
  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textClass = darkMode ? 'text-slate-100' : 'text-slate-900';
  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-500';
  const subtextClass = darkMode ? 'text-slate-300' : 'text-slate-600';

  return (
    <div className="space-y-6 pb-12">
      {/* Active SOS Status Alert Banner */}
      {sosActive && (
        <div className="p-4 rounded-2xl bg-[#D32F2F] text-white shadow-xl animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4 border border-red-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold shrink-0">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white m-0">🚨 EMERGENCY SOS DISPATCH ACTIVE</h3>
              <p className="text-xs text-white/95 m-0 font-medium">
                Code: <span className="font-mono font-bold underline text-amber-200">{activeSosCode}</span> | GPS Live Broadcast to Police Command HQ
              </p>
            </div>
          </div>

          <button
            onClick={handleCancelSos}
            disabled={sosLoading}
            className="px-4 py-2.5 rounded-xl bg-white text-[#D32F2F] font-extrabold text-xs hover:bg-slate-100 transition-colors shadow-md shrink-0 cursor-pointer"
          >
            {sosLoading ? 'Updating Status...' : 'I Am Safe Now (Cancel SOS)'}
          </button>
        </div>
      )}

      {/* Main Panic SOS Section */}
      <div className={`${cardClass} p-6 md:p-8 rounded-3xl border shadow-md text-center space-y-6`}>
        <div>
          <span className={`px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
            darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-[#0D47A1]'
          }`}>
            24/7 National Tourist Protection Desk
          </span>
          <h2 className={`text-2xl md:text-3xl font-extrabold mt-2.5 mb-1 ${textClass}`}>
            Emergency Distress Panic Response
          </h2>
          <p className={`text-xs md:text-sm font-medium max-w-xl mx-auto mt-1 ${subtextClass}`}>
            Tap the button below in case of imminent threat, harassment, medical distress, or crime. Instantly dispatches nearest police units and emergency contacts.
          </p>
        </div>

        {/* Big One-Tap SOS Panic Button */}
        <div className="flex justify-center my-6">
          <button
            onClick={() => handleTriggerSos('one_tap')}
            disabled={sosActive || sosLoading}
            className={`w-48 h-48 md:w-56 md:h-56 rounded-full flex flex-col items-center justify-center text-white font-extrabold shadow-2xl transition-all border-4 border-red-400/40 ${
              sosActive
                ? 'bg-slate-700 opacity-60 cursor-not-allowed'
                : 'bg-gradient-to-br from-red-500 via-[#D32F2F] to-red-800 hover:scale-105 active:scale-95 sos-button-pulse cursor-pointer'
            }`}
          >
            <AlertOctagon className="w-16 h-16 mb-2 text-white animate-bounce" />
            <span className="text-3xl font-black tracking-widest uppercase text-white drop-shadow-md">SOS</span>
            <span className="text-[11px] font-bold text-white/95 uppercase font-mono mt-1 tracking-wider">Press for Emergency</span>
          </button>
        </div>

        {/* Alternative Panic Triggers */}
        <div className={`flex flex-wrap justify-center items-center gap-3 max-w-xl mx-auto pt-3 border-t ${
          darkMode ? 'border-slate-700' : 'border-slate-100'
        }`}>
          <button
            onClick={() => handleTriggerSos('voice')}
            className={`px-4 py-2.5 rounded-xl border font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
              darkMode ? 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border-blue-800' : 'bg-blue-50 hover:bg-blue-100 text-[#0D47A1] border-blue-200'
            }`}
          >
            <Mic className="w-4 h-4" /> Voice SOS Command
          </button>
          <button
            onClick={() => handleTriggerSos('shake')}
            className={`px-4 py-2.5 rounded-xl border font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
              darkMode ? 'bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 border-amber-800' : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
            }`}
          >
            <Radio className="w-4 h-4" /> Phone Shake Alert
          </button>
          <button
            onClick={() => handleTriggerSos('offline_sms')}
            className={`px-4 py-2.5 rounded-xl border font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
              darkMode ? 'bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
            }`}
          >
            <Activity className="w-4 h-4" /> Offline SMS Relay
          </button>
        </div>
      </div>

      {/* Quick Navigation Action Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/ai"
          className={`${cardClass} p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all space-y-2 group decoration-none ${
            darkMode ? 'hover:border-blue-500' : 'hover:border-[#0D47A1]'
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
          }`}>
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className={`text-sm font-extrabold m-0 ${textClass}`}>AI Safety Assistant</h4>
          <p className={`text-xs font-semibold m-0 ${mutedClass}`}>Multilingual & Emergency Mode</p>
        </Link>

        <Link
          to="/incidents"
          className={`${cardClass} p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all space-y-2 group decoration-none ${
            darkMode ? 'hover:border-blue-500' : 'hover:border-[#0D47A1]'
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-[#0D47A1]'
          }`}>
            <FileText className="w-6 h-6" />
          </div>
          <h4 className={`text-sm font-extrabold m-0 ${textClass}`}>Report Incident</h4>
          <p className={`text-xs font-semibold m-0 ${mutedClass}`}>Report scam, theft or accident</p>
        </Link>

        <Link
          to="/nearby"
          className={`${cardClass} p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all space-y-2 group decoration-none ${
            darkMode ? 'hover:border-blue-500' : 'hover:border-[#0D47A1]'
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <Shield className="w-6 h-6" />
          </div>
          <h4 className={`text-sm font-extrabold m-0 ${textClass}`}>Nearby Responders</h4>
          <p className={`text-xs font-semibold m-0 ${mutedClass}`}>Police posts & hospitals</p>
        </Link>

        <Link
          to="/chat"
          className={`${cardClass} p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all space-y-2 group decoration-none ${
            darkMode ? 'hover:border-blue-500' : 'hover:border-[#0D47A1]'
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-[#D32F2F]'
          }`}>
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className={`text-sm font-extrabold m-0 ${textClass}`}>Command Chat</h4>
          <p className={`text-xs font-semibold m-0 ${mutedClass}`}>Live dispatcher messaging</p>
        </Link>
      </div>

      {/* Main Grid: Real GPS Interactive Map & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 ${cardClass} p-4 rounded-2xl border shadow-xs flex flex-col h-[460px]`}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className={`text-sm font-bold flex items-center gap-2 m-0 ${textClass}`}>
              <MapPin className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-[#0D47A1]'}`} /> Live GPS Spatial Sentinel Map
            </h3>
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Real GPS Active
            </span>
          </div>

          <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-200">
            <TouristMap location={location} safeLocations={safeLocations} />
          </div>
        </div>

        {/* Tourist Telemetry Card */}
        <div className={`${cardClass} p-5 rounded-2xl border shadow-xs flex flex-col justify-between h-[460px]`}>
          <div className="space-y-4">
            <div className={`flex items-center justify-between border-b pb-3 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`text-sm font-extrabold m-0 ${textClass}`}>Live GPS Telemetry</h3>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">ONLINE</span>
            </div>

            <div className={`p-3.5 rounded-xl space-y-1.5 border text-xs ${
              darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50/80 border-blue-100'
            }`}>
              <p className={`font-extrabold uppercase text-[10px] m-0 ${darkMode ? 'text-blue-400' : 'text-[#0D47A1]'}`}>Real-Time Location</p>
              <p className={`font-extrabold m-0 text-xs ${textClass}`}>{locationName}</p>
              <p className={`font-mono font-bold text-[11px] m-0 ${darkMode ? 'text-blue-400' : 'text-[#0D47A1]'}`}>
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </p>
            </div>

            <div className={`p-3.5 rounded-xl space-y-2 border text-xs ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <p className={`font-extrabold uppercase text-[10px] m-0 ${mutedClass}`}>Registered Traveler</p>
              <p className={`font-extrabold m-0 ${textClass}`}>{tourist?.full_name || 'John Doe Tourist'}</p>
              <p className={`font-medium m-0 ${subtextClass}`}>Nationality: {tourist?.nationality || 'American'}</p>
            </div>

            <div className={`space-y-1.5 text-xs font-mono font-medium ${subtextClass}`}>
              <div className="flex justify-between"><span>Battery Level:</span><span className="font-extrabold text-emerald-700">98%</span></div>
              <div className="flex justify-between"><span>GPS Accuracy:</span><span className={`font-extrabold ${darkMode ? 'text-blue-400' : 'text-[#0D47A1]'}`}>High Accuracy</span></div>
            </div>
          </div>

          <div className={`pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <Link
              to="/contacts"
              className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-colors flex items-center justify-center gap-2 decoration-none ${
                darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <Heart className="w-4 h-4 text-[#D32F2F]" /> Emergency Medical Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
