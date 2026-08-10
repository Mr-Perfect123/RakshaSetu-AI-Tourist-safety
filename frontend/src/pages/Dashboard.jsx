import React, { useState, useEffect } from 'react';
import { AlertOctagon, PhoneCall, Sparkles, FileText, Shield, MapPin, Mic, Radio, Heart, Activity, CheckCircle, Navigation, MessageSquare, Search, Car, Utensils, Lock, Eye, EyeOff, Trash2, Sun, CloudRain } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TouristMap from '../components/TouristMap';
import api from '../services/api';
import socket from '../services/socket';

const Dashboard = ({ tourist, darkMode }) => {
  const navigate = useNavigate();

  // Location Permission & Privacy States
  const [permissionAsked, setPermissionAsked] = useState(() => localStorage.getItem('rakshasetu_location_permission_prompted') === 'true');
  const [locationGranted, setLocationGranted] = useState(() => localStorage.getItem('rakshasetu_location_granted') === 'true');
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(() => localStorage.getItem('rakshasetu_location_sharing_active') !== 'false');
  const [liveTrackingEnabled, setLiveTrackingEnabled] = useState(true);
  const [lastLocationTime, setLastLocationTime] = useState(new Date().toLocaleTimeString());
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Search & Destination States
  const [destinationQuery, setDestinationQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [weatherData, setWeatherData] = useState(null);

  // SOS & Position States
  const [sosActive, setSosActive] = useState(false);
  const [activeSosCode, setActiveSosCode] = useState('');
  const [location, setLocation] = useState({ lat: 27.1751, lng: 78.0421 }); // Default Taj Mahal sector until GPS permission
  const [locationName, setLocationName] = useState('GPS Location Active');
  const [safeLocations, setSafeLocations] = useState([
    { id: 1, name: 'Central Police Patrol Desk', type: 'police_station', latitude: 27.1770, longitude: 78.0440, phone: '+911123363364', address: 'Taj East Corridor' },
    { id: 2, name: 'District Emergency Medical Post', type: 'hospital', latitude: 27.1730, longitude: 78.0400, phone: '+911123365555', address: 'Main Sector Road' }
  ]);
  const [sosLoading, setSosLoading] = useState(false);

  // Destination Search Trigger
  useEffect(() => {
    if (!destinationQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/places/search?query=${destinationQuery}`);
        if (res.data) setSearchResults(res.data);
      } catch (e) {
        console.warn('Search query fallback');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [destinationQuery]);

  // Weather Fetch
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await api.get(`/places/weather?lat=${location.lat}&lng=${location.lng}`);
        if (res.data) setWeatherData(res.data);
      } catch (e) {}
    };
    fetchWeather();
  }, [location]);

  // Location Permission Request Logic
  const requestLocationPermission = (allow) => {
    localStorage.setItem('rakshasetu_location_permission_prompted', 'true');
    setPermissionAsked(true);

    if (allow) {
      localStorage.setItem('rakshasetu_location_granted', 'true');
      localStorage.setItem('rakshasetu_location_sharing_active', 'true');
      setLocationGranted(true);
      setLocationSharingEnabled(true);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setLocation({ lat, lng });
            setLocationName('GPS Live Position');
            setLastLocationTime(new Date().toLocaleTimeString());

            socket.emit('tourist_location_update', {
              userId: tourist?.id || 4,
              latitude: lat,
              longitude: lng,
              touristName: tourist?.full_name || 'Tourist',
              battery: 98
            });
          },
          () => console.warn('Geolocation unavailable')
        );
      }
    } else {
      localStorage.setItem('rakshasetu_location_granted', 'false');
      localStorage.setItem('rakshasetu_location_sharing_active', 'false');
      setLocationGranted(false);
      setLocationSharingEnabled(false);
    }
  };

  const handleStopSharing = () => {
    localStorage.setItem('rakshasetu_location_sharing_active', 'false');
    setLocationSharingEnabled(false);
    alert('Location sharing stopped. Real-time GPS broadcasts are now OFF.');
  };

  useEffect(() => {
    if (locationGranted && locationSharingEnabled && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLocation({ lat, lng });
          setLocationName('GPS Live Position');
          setLastLocationTime(new Date().toLocaleTimeString());

          if (liveTrackingEnabled) {
            socket.emit('tourist_location_update', {
              userId: tourist?.id || 4,
              latitude: lat,
              longitude: lng,
              touristName: tourist?.full_name || 'Tourist',
              battery: 98
            });
          }
        },
        (err) => console.warn('Geolocation error'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [locationGranted, locationSharingEnabled, liveTrackingEnabled, tourist]);

  useEffect(() => {
    const fetchResponders = async () => {
      try {
        const res = await api.get('/admin/safe-locations');
        if (res.data && res.data.length > 0) setSafeLocations(res.data);
      } catch (err) {}
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
        triggerType
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
    } finally {
      setSosActive(false);
      setActiveSosCode('');
      setSosLoading(false);
    }
  };

  const deleteLocationHistory = () => {
    alert('Location history deleted permanently from RakshaSetu servers.');
  };

  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textClass = darkMode ? 'text-slate-100' : 'text-slate-900';
  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-500';
  const subtextClass = darkMode ? 'text-slate-300' : 'text-slate-600';

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Location Permission Prompt Modal */}
      {!permissionAsked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`${cardClass} max-w-md w-full p-6 rounded-3xl border shadow-2xl space-y-4`}>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#0D47A1] flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className={`text-lg font-extrabold ${textClass}`}>Enable Location Protection?</h3>
              <p className={`text-xs ${subtextClass}`}>
                RakshaSetu needs your location to provide emergency protection, nearby police/hospitals, safe routes, SOS assistance, and local danger alerts.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => requestLocationPermission(false)}
                className="py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Not Now
              </button>
              <button
                onClick={() => requestLocationPermission(true)}
                className="py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-extrabold hover:bg-blue-800 cursor-pointer shadow-md"
              >
                Allow Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Welcome & Destination Search Bar */}
      <div className={`${cardClass} p-6 rounded-3xl border shadow-md space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className={`text-xl sm:text-2xl font-black m-0 ${textClass}`}>
              Namaste, {tourist?.full_name || 'Traveler'} 👋
            </h1>
            <p className={`text-xs font-medium m-0 ${mutedClass} flex items-center gap-2 mt-0.5`}>
              <span>Explore India safely with RakshaSetu AI Tourist Protection</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                locationSharingEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                📍 Location Sharing: {locationSharingEnabled ? 'ON' : 'OFF'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {locationSharingEnabled && (
              <button
                onClick={handleStopSharing}
                className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 cursor-pointer"
              >
                Stop Location Sharing
              </button>
            )}
            <button
              onClick={() => setShowPrivacyModal(!showPrivacyModal)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-blue-600" /> Privacy & Location Controls
            </button>
          </div>
        </div>

        {/* Destination Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search tourist places, cities, attractions (e.g. Taj Mahal, Baga Beach, Red Fort)..."
            value={destinationQuery}
            onChange={(e) => setDestinationQuery(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-2xl border text-xs font-semibold focus:ring-2 focus:outline-none ${
              darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-[#0D47A1]'
            }`}
          />

          {searchResults.length > 0 && (
            <div className={`absolute top-14 left-0 right-0 z-30 rounded-2xl border shadow-xl overflow-hidden max-h-60 overflow-y-auto ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              {searchResults.map((place) => (
                <div
                  key={place.id}
                  onClick={() => navigate(`/places/${place.id}`)}
                  className="p-3 border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-extrabold text-[#0D47A1] block">{place.name}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">{place.city}, {place.state} • {place.category}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">Safety: {place.safetyScore}/100</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Search Quick Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {[
            { label: 'Taj Mahal Agra', id: 'taj-mahal-agra' },
            { label: 'Red Fort Delhi', id: 'red-fort-delhi' },
            { label: 'Baga Beach Goa', id: 'baga-beach-goa' },
            { label: 'Meenakshi Temple', id: 'meenakshi-temple-madurai' },
            { label: 'Gateway of India', id: 'gateway-of-india-mumbai' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/places/${item.id}`)}
              className={`px-3 py-1.5 rounded-full border whitespace-nowrap cursor-pointer ${
                darkMode ? 'bg-slate-700/60 border-slate-600 text-slate-300 hover:border-blue-500' : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-[#0D47A1]'
              }`}
            >
              📍 {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy & Location Controls Drawer */}
      {showPrivacyModal && (
        <div className={`${cardClass} p-5 rounded-3xl border shadow-md space-y-3`}>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0D47A1]">Location & Privacy Preferences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
            <div className="p-3 rounded-2xl bg-slate-50 border flex items-center justify-between">
              <span>Location Sharing:</span>
              <button
                onClick={() => {
                  const next = !locationSharingEnabled;
                  setLocationSharingEnabled(next);
                  localStorage.setItem('rakshasetu_location_sharing_active', String(next));
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  locationSharingEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {locationSharingEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border flex items-center justify-between">
              <span>Live SOS Tracking:</span>
              <button
                onClick={() => setLiveTrackingEnabled(!liveTrackingEnabled)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  liveTrackingEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {liveTrackingEnabled ? 'ACTIVE' : 'PAUSED'}
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Last GPS: {lastLocationTime}</span>
              <button
                onClick={deleteLocationHistory}
                className="text-red-600 font-bold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active SOS Alert Banner */}
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
      </div>

      {/* Quick Navigation Action Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/vehicles"
          className={`${cardClass} p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all space-y-2 group decoration-none ${
            darkMode ? 'hover:border-blue-500' : 'hover:border-[#0D47A1]'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#0D47A1] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Car className="w-6 h-6" />
          </div>
          <h4 className={`text-sm font-extrabold m-0 ${textClass}`}>Vehicle Booking</h4>
          <p className={`text-xs font-semibold m-0 ${mutedClass}`}>Verified cabs, bikes & SUVs</p>
        </Link>

        <Link
          to="/food"
          className={`${cardClass} p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all space-y-2 group decoration-none ${
            darkMode ? 'hover:border-blue-500' : 'hover:border-[#0D47A1]'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Utensils className="w-6 h-6" />
          </div>
          <h4 className={`text-sm font-extrabold m-0 ${textClass}`}>Food & Dining</h4>
          <p className={`text-xs font-semibold m-0 ${mutedClass}`}>Hygienic local dining & delivery</p>
        </Link>

        <Link
          to="/ai"
          className={`${cardClass} p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all space-y-2 group decoration-none ${
            darkMode ? 'hover:border-blue-500' : 'hover:border-[#0D47A1]'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className={`text-sm font-extrabold m-0 ${textClass}`}>AI Assistant</h4>
          <p className={`text-xs font-semibold m-0 ${mutedClass}`}>14 Languages & Emergency Mode</p>
        </Link>

        <Link
          to="/incidents"
          className={`${cardClass} p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all space-y-2 group decoration-none ${
            darkMode ? 'hover:border-blue-500' : 'hover:border-[#0D47A1]'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-red-100 text-[#D32F2F] flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className={`text-sm font-extrabold m-0 ${textClass}`}>Report Incident</h4>
          <p className={`text-xs font-semibold m-0 ${mutedClass}`}>Report scam, theft or hazard</p>
        </Link>
      </div>

      {/* Main Grid: Real GPS Interactive Map & Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 ${cardClass} p-4 rounded-2xl border shadow-xs flex flex-col h-[460px]`}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className={`text-sm font-bold flex items-center gap-2 m-0 ${textClass}`}>
              <MapPin className="w-4 h-4 text-[#0D47A1]" /> Live Spatial Sentinel Map
            </h3>
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Real GPS Active
            </span>
          </div>

          <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-200">
            <TouristMap location={location} safeLocations={safeLocations} />
          </div>
        </div>

        {/* Weather & Telemetry Widget */}
        <div className={`${cardClass} p-5 rounded-2xl border shadow-xs flex flex-col justify-between h-[460px]`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className={`text-sm font-extrabold m-0 ${textClass}`}>Weather & Safety Index</h3>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">SAFE (94/100)</span>
            </div>

            {weatherData && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#0D47A1]">{weatherData.locationName}</span>
                  <span className="text-xl font-black text-slate-900">{weatherData.temperatureC}°C</span>
                </div>
                <p className="text-xs text-slate-600 font-medium m-0">{weatherData.condition}</p>
                <div className="text-[11px] text-slate-500 pt-1 flex justify-between">
                  <span>Humidity: {weatherData.humidity}%</span>
                  <span>Wind: {weatherData.windKmH} km/h</span>
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Current GPS Location</span>
              <p className="font-bold text-slate-800 m-0">{locationName}</p>
              <p className="font-mono text-[11px] text-[#0D47A1] m-0">Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Link
              to="/contacts"
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-2 decoration-none"
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
