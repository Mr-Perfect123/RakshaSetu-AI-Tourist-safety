import React, { useState, useEffect } from 'react';
import { AlertOctagon, PhoneCall, Sparkles, FileText, Shield, MapPin, Mic, Radio, Heart, Activity, CheckCircle, Navigation, MessageSquare, Search, Car, Utensils, Lock, Eye, EyeOff, Trash2, Sun, CloudRain, ExternalLink, Compass } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TouristMap from '../components/TouristMap';
import api from '../services/api';
import socket from '../services/socket';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = ({ tourist, darkMode }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

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
  const [isSearching, setIsSearching] = useState(false);
  const [searchedDestination, setSearchedDestination] = useState(null);

  // Location States (Separate live GPS position from searched map location)
  const [currentGpsLocation, setCurrentGpsLocation] = useState({ lat: 11.0168, lng: 76.9558 }); // Default sector
  const [mapLocation, setMapLocation] = useState({ lat: 11.0168, lng: 76.9558 });
  const [locationName, setLocationName] = useState('Kattur, Coimbatore, Tamil Nadu, India');
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Weather & Telemetry States
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  // Nearby Services States
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyCategory, setNearbyCategory] = useState('all');
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // SOS & Position States
  const [sosActive, setSosActive] = useState(false);
  const [activeSosCode, setActiveSosCode] = useState('');
  const [safeLocations, setSafeLocations] = useState([
    { id: 1, name: 'Central Police Station Connaught Place', type: 'police_station', latitude: 11.0180, longitude: 76.9580, phone: '+911123363364', address: 'Central Sector Corridor' },
    { id: 2, name: 'District Emergency Medical Post', type: 'hospital', latitude: 11.0140, longitude: 76.9530, phone: '+911123365555', address: 'Medical Sector Road' }
  ]);
  const [sosLoading, setSosLoading] = useState(false);

  // Initial Location Setup
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const p = { lat, lng };
          setCurrentGpsLocation(p);
          setMapLocation(p);
        },
        () => console.warn('Default sector location loaded.')
      );
    }
  }, []);

  // Fetch Weather Telemetry
  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError('');
      try {
        const res = await api.get(`/places/weather?lat=${currentGpsLocation.lat}&lng=${currentGpsLocation.lng}`);
        const data = res.data?.data || res.data;
        if (data) {
          setWeatherData(data);
          if (data.fullAddress || data.locationName) {
            setLocationName(data.fullAddress || data.locationName);
          }
        }
      } catch (e) {
        setWeatherError('Weather information temporarily unavailable.');
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, [currentGpsLocation]);

  // Fetch Live Nearby Services Sorted by Distance
  useEffect(() => {
    const fetchNearby = async () => {
      setNearbyLoading(true);
      try {
        const res = await api.get(`/places/nearby?lat=${currentGpsLocation.lat}&lng=${currentGpsLocation.lng}&category=${nearbyCategory}`);
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list)) {
          setNearbyPlaces(list);
        }
      } catch (err) {
        console.warn('Nearby places fetch warning');
      } finally {
        setNearbyLoading(false);
      }
    };
    fetchNearby();
  }, [currentGpsLocation, nearbyCategory]);

  // Dynamic Destination Search Trigger (Queries ANY city/place globally)
  useEffect(() => {
    let active = true;
    if (!destinationQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const latParam = currentGpsLocation ? `&lat=${currentGpsLocation.lat}&lng=${currentGpsLocation.lng}` : '';
        const res = await api.get(`/places/search?query=${encodeURIComponent(destinationQuery)}${latParam}`);
        const list = res.data?.data || res.data || [];
        if (active && Array.isArray(list)) setSearchResults(list);
      } catch (e) {
        console.warn('Search query fallback');
      } finally {
        if (active) setIsSearching(false);
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [destinationQuery, currentGpsLocation]);

  // Target Button Recenter Logic (Returns camera to live GPS)
  const handleRecenterMyLocation = (leafletMapInstance) => {
    setLocationUpdating(true);
    setLocationError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const newPos = { lat, lng };
          setCurrentGpsLocation(newPos);
          setMapLocation(newPos);
          setSearchedDestination(null);
          setLastLocationTime(new Date().toLocaleTimeString());
          setLocationUpdating(false);

          if (leafletMapInstance) {
            leafletMapInstance.flyTo([lat, lng], 15, { duration: 1.2 });
          }

          socket.emit('tourist_location_update', {
            userId: tourist?.id || 4,
            latitude: lat,
            longitude: lng,
            touristName: tourist?.full_name || 'Tourist',
            battery: 98
          });
        },
        (err) => {
          setLocationUpdating(false);
          setLocationError('Unable to access your current location.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationUpdating(false);
      setLocationError('Unable to access your current location.');
    }
  };

  // Location Permission Request Logic
  const requestLocationPermission = (allow) => {
    localStorage.setItem('rakshasetu_location_permission_prompted', 'true');
    setPermissionAsked(true);

    if (allow) {
      localStorage.setItem('rakshasetu_location_granted', 'true');
      localStorage.setItem('rakshasetu_location_sharing_active', 'true');
      setLocationGranted(true);
      setLocationSharingEnabled(true);
      handleRecenterMyLocation(null);
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
          const newPos = { lat, lng };
          setCurrentGpsLocation(newPos);
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
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) setSafeLocations(list);
      } catch (err) {}
    };
    fetchResponders();
  }, []);

  const handleTriggerSos = async (triggerType = 'one_tap') => {
    setSosLoading(true);
    try {
      const res = await api.post('/sos/trigger', {
        latitude: currentGpsLocation.lat,
        longitude: currentGpsLocation.lng,
        address: locationName,
        triggerType
      });

      const dataObj = res.data?.data || res.data;
      if (dataObj) {
        setSosActive(true);
        setActiveSosCode(dataObj.sos_code || `SOS-${Date.now().toString().slice(-5)}`);
        socket.emit('trigger_sos_event', {
          ...dataObj,
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
        latitude: currentGpsLocation.lat,
        longitude: currentGpsLocation.lng,
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
            <div className="space-y-2">
              <h3 className={`text-lg font-black text-center ${textClass}`}>{t('dashboard.locationPermission', 'Location Protection Permission')}</h3>
              <p className={`text-xs font-semibold ${subtextClass}`}>
                {t('dashboard.locationPermissionDesc', 'RakshaSetu needs your location to provide:')}
              </p>
              <ul className="text-xs font-medium space-y-1 text-slate-600 dark:text-slate-300 pl-4 list-disc">
                <li>{t('dashboard.liveSafetyMonitoring', 'live safety monitoring')}</li>
                <li>{t('dashboard.routeNavigation', 'route navigation')}</li>
                <li>{t('dashboard.nearbyEmergencyServices', 'nearby emergency services')}</li>
                <li>{t('dashboard.dangerZoneAlerts', 'danger-zone alerts')}</li>
                <li>{t('dashboard.sosAssistance', 'SOS assistance')}</li>
              </ul>
              <p className="text-xs font-extrabold text-[#0D47A1] text-center pt-1 m-0">{t('dashboard.allowSharingPrompt', 'Allow location sharing?')}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => requestLocationPermission(false)}
                className="py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer text-center"
              >
                {t('dashboard.denyBtn', 'Deny')}
              </button>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="py-2.5 rounded-xl border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-50 cursor-pointer text-center"
              >
                {t('nav.privacy', 'Privacy Settings')}
              </button>
              <button
                onClick={() => requestLocationPermission(true)}
                className="py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-extrabold hover:bg-blue-800 cursor-pointer shadow-md text-center"
              >
                {t('dashboard.allowBtn', 'Allow')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Welcome & Destination Search Bar — Frosted Glass Container for High Text Visibility */}
      <div className={`p-6 rounded-3xl border shadow-md space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
      } backdrop-blur-md`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className={`text-xl sm:text-2xl font-black m-0 ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>
              {t('dashboard.welcome', 'Namaste')}, {tourist?.full_name || 'Traveler'} 👋
            </h1>
            <p className={`text-xs font-semibold m-0 flex items-center gap-2 mt-0.5 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <span>{t('dashboard.exploreIndia', 'Explore India safely with RakshaSetu AI Tourist Protection')}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                locationSharingEnabled ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-slate-200 text-slate-800 border border-slate-300'
              }`}>
                📍 {t('dashboard.locationSharing', 'Location Sharing')}: {locationSharingEnabled ? 'ON' : 'OFF'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {locationSharingEnabled && (
              <button
                onClick={handleStopSharing}
                className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 cursor-pointer"
              >
                {t('dashboard.stopSharing', 'Stop Location Sharing')}
              </button>
            )}
            <button
              onClick={() => setShowPrivacyModal(!showPrivacyModal)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-blue-600" /> {t('dashboard.privacyControls', 'Privacy Controls')}
            </button>
          </div>
        </div>

        {/* Dynamic Destination Search Input (Queries ANY place globally) */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder={t('dashboard.searchPlaceholder', 'Search ANY destination, city, landmark, hotel, beach (e.g. Coimbatore, Delhi, Taj Mahal, Goa, Ooty)...')}
            value={destinationQuery}
            onChange={(e) => setDestinationQuery(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-2xl border text-xs font-semibold focus:ring-2 focus:outline-none ${
              darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-[#0D47A1]'
            }`}
          />

          {isSearching && (
            <div className="absolute right-4 top-3.5 text-xs text-blue-600 font-bold flex items-center gap-1">
              <Activity className="w-4 h-4 animate-spin" /> {t('dashboard.geocoding', 'Geocoding...')}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className={`absolute top-14 left-0 right-0 z-30 rounded-2xl border shadow-xl overflow-hidden max-h-96 overflow-y-auto ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              {searchResults.map((place) => (
                <div
                  key={place.id}
                  className="p-3.5 border-b border-slate-100 hover:bg-blue-50/60 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-[#0D47A1]">{place.name}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[9px] uppercase">{place.category || 'Attraction'}</span>
                      </div>
                      <span className="text-xs text-slate-600 font-medium block mt-0.5">{place.address || `${place.city}, ${place.state}, ${place.country}`}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setMapLocation({ lat: place.latitude, lng: place.longitude });
                          setSearchedDestination(place);
                          setSearchResults([]);
                          setDestinationQuery(place.name);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[#0D47A1] text-[#0D47A1] font-extrabold text-xs hover:bg-blue-50 cursor-pointer"
                      >
                        {t('dashboard.selectMap', '🗺 Select on Map')}
                      </button>
                      <button
                        onClick={() => {
                          navigate(`/places/${place.id}`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs hover:bg-blue-800 cursor-pointer shadow-xs"
                      >
                        View Full Details ➔
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Panic SOS Section */}
      <div className={`${cardClass} p-6 md:p-8 rounded-3xl border shadow-md text-center space-y-6`}>
        <div>
          <span className={`px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
            darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-[#0D47A1]'
          }`}>
            {t('dashboard.deskTitle', '24/7 National Tourist Protection Desk')}
          </span>
          <h2 className={`text-2xl md:text-3xl font-extrabold mt-2.5 mb-1 ${textClass}`}>
            {t('dashboard.panicTitle', 'Emergency Distress Panic Response')}
          </h2>
          <p className={`text-xs md:text-sm font-medium max-w-xl mx-auto mt-1 ${subtextClass}`}>
            {t('dashboard.panicSubtitle', 'Tap the button below in case of imminent threat, harassment, medical distress, or crime. Instantly dispatches nearest police units and emergency contacts.')}
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
            <span className="text-3xl font-black tracking-widest uppercase text-white drop-shadow-md">{t('dashboard.emergencySos', 'SOS')}</span>
            <span className="text-[11px] font-bold text-white/95 uppercase font-mono mt-1 tracking-wider">{t('dashboard.pressEmergency', 'Press for Emergency')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Real GPS Interactive Map & Live Weather/Safety Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 ${cardClass} p-4 rounded-2xl border shadow-xs flex flex-col h-[520px]`}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className={`text-sm font-bold flex items-center gap-2 m-0 ${textClass}`}>
              <MapPin className="w-4 h-4 text-[#0D47A1]" /> {t('dashboard.sentinelMap', 'Live Spatial Sentinel Map')}
            </h3>
            <div className="flex items-center gap-2">
              {searchedDestination && (
                <button
                  onClick={() => {
                    setSearchedDestination(null);
                    setMapLocation(currentGpsLocation);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-[10px] cursor-pointer"
                >
                  {t('dashboard.clearSearch', 'Clear Search Destination ✕')}
                </button>
              )}
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> {t('dashboard.gpsActive', 'Live GPS Active')}
              </span>
            </div>
          </div>

          <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-200 relative">
            <TouristMap
              location={mapLocation}
              destination={searchedDestination}
              safeLocations={safeLocations}
              nearbyPlaces={nearbyPlaces}
              onMyLocationClick={handleRecenterMyLocation}
            />

            {/* Google Maps style detail panel overlay */}
            {searchedDestination && (
              <div className="absolute top-4 left-4 z-[1000] w-72 sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left flex flex-col max-h-[90%] pointer-events-auto">
                {/* Photo */}
                <div className="h-32 bg-slate-100 dark:bg-slate-800 relative">
                  <img
                    src={searchedDestination.photos?.[0] || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80'}
                    alt={searchedDestination.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setSearchedDestination(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer font-bold text-xs border-none"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-blue-600 text-white text-[9px] font-black uppercase">
                    {searchedDestination.category || 'Attraction'}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3 overflow-y-auto flex-1">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white m-0">{searchedDestination.name}</h4>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">{searchedDestination.address}</span>
                  </div>

                  {searchedDestination.distanceKm !== undefined && searchedDestination.distanceKm !== null && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                      📍 {searchedDestination.distanceKm} km away (~{Math.round((searchedDestination.distanceKm / 35) * 60)} mins)
                    </span>
                  )}

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold m-0 leading-relaxed line-clamp-3">
                    {searchedDestination.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 dark:border-slate-800 pt-2 font-semibold">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Timing / Hours</span>
                      <span className="text-slate-700 dark:text-slate-200 block truncate">{searchedDestination.openingHours || 'Open 24 Hours'}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Entry Cost</span>
                      <span className="text-slate-700 dark:text-slate-200 block truncate">{searchedDestination.entryFee || 'Free Entry'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => navigate(`/places/${searchedDestination.id}`)}
                      className="w-full py-2 bg-[#0D47A1] hover:bg-blue-800 text-white font-extrabold text-[10px] uppercase text-center rounded-xl flex items-center justify-center gap-1 cursor-pointer border-none shadow-xs"
                    >
                      <Info className="w-3.5 h-3.5"/> Full Safety Profile & Details ➔
                    </button>
                    <div className="flex gap-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${searchedDestination.latitude},${searchedDestination.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px] uppercase text-center rounded-xl flex items-center justify-center gap-1 decoration-none"
                      >
                        <Navigation className="w-3 h-3 text-[#0D47A1]"/> Route
                      </a>
                      <Link
                        to={`/travel?from=Coimbatore&to=${encodeURIComponent(searchedDestination.name)}`}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase text-center rounded-xl flex items-center justify-center gap-1 decoration-none"
                      >
                        <Car className="w-3 h-3"/> Book Travel
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weather & Safety Telemetry Widget */}
        <div className={`${cardClass} p-5 rounded-2xl border shadow-xs flex flex-col justify-between h-[520px]`}>
          <div className="space-y-3 overflow-y-auto pr-1">
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
              <h3 className={`text-sm font-extrabold m-0 ${textClass}`}>{t('dashboard.weatherSafetyIndex', 'Weather & Safety Index')}</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">🟢 SAFE (92/100)</span>
            </div>

            {locationUpdating && (
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold animate-pulse flex items-center justify-center gap-2">
                <Activity className="w-4 h-4 animate-spin" /> {t('dashboard.updatingLocation', 'Updating location...')}
              </div>
            )}

            {locationError && (
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold text-center border border-amber-200">
                {locationError}
              </div>
            )}

            {/* Current Geocoded Location Box */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">{t('dashboard.currentLocationLabel', 'CURRENT LOCATION')}</span>
              <p className="font-bold text-slate-900 m-0 leading-snug">{weatherData?.fullAddress || locationName}</p>
              <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-semibold text-slate-600 border-t border-slate-200/60 mt-1">
                <span>{t('dashboard.cityLabel', 'City')}: <strong className="text-slate-800">{weatherData?.city || 'Coimbatore'}</strong></span>
                <span>{t('dashboard.stateLabel', 'State')}: <strong className="text-slate-800">{weatherData?.state || 'Tamil Nadu'}</strong></span>
                <span>{t('dashboard.countryLabel', 'Country')}: <strong className="text-slate-800">{weatherData?.country || 'India'}</strong></span>
              </div>
              <p className="font-mono text-[10px] text-[#0D47A1] m-0 pt-0.5">
                Lat: {currentGpsLocation.lat.toFixed(4)}, Lng: {currentGpsLocation.lng.toFixed(4)}
              </p>
            </div>

            {/* Live Weather Box */}
            {weatherError ? (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200 text-center">
                {weatherError}
              </div>
            ) : weatherData ? (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-blue-900">{t('dashboard.weatherLabel', 'WEATHER')}</span>
                    <p className="text-xs font-bold text-slate-800 m-0">{weatherData.condition}</p>
                  </div>
                  <span className="text-2xl font-black text-[#0D47A1]">{weatherData.temperatureC}°C</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 font-medium pt-1 border-t border-blue-200/60">
                  <span>{t('dashboard.feelsLike', 'Feels like')}: <strong>{weatherData.feelsLikeC}°C</strong></span>
                  <span>{t('dashboard.humidity', 'Humidity')}: <strong>{weatherData.humidity}%</strong></span>
                  <span>{t('dashboard.wind', 'Wind')}: <strong>{weatherData.windKmH} km/h</strong></span>
                  <span>{t('dashboard.visibility', 'Visibility')}: <strong>{weatherData.visibilityKm} km</strong></span>
                </div>
                <div className="text-[10px] text-slate-400 text-right pt-0.5">
                  {t('dashboard.updatedLabel', 'Updated')}: {weatherData.updatedAt || t('dashboard.justNow', 'Just now')}
                </div>
              </div>
            ) : null}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => handleRecenterMyLocation(null)}
              className="w-full py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Compass className="w-4 h-4 text-white" /> ⦿ {t('dashboard.myLocationBtn', 'MY LOCATION')}
            </button>
          </div>
        </div>
      </div>

      {/* Nearby Tourist Safety & Emergency Services Section */}
      <div className={`${cardClass} p-6 rounded-3xl border shadow-md space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
          <div>
            <h2 className={`text-lg font-black m-0 text-[#0D47A1] flex items-center gap-2`}>
              <Navigation className="w-5 h-5 text-blue-600" /> {t('dashboard.nearbyTitleSec', 'Nearby Safety & Tourist Services')}
            </h2>
            <p className={`text-xs font-medium m-0 ${mutedClass}`}>
              {t('dashboard.liveGpsDesc', 'Calculated live from your current GPS position')} ({currentGpsLocation.lat.toFixed(4)}, {currentGpsLocation.lng.toFixed(4)})
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold pb-1">
            {[
              { id: 'all', label: t('dashboard.allServices', 'All Services') },
              { id: 'police', label: t('dashboard.policeCat', '👮 Police') },
              { id: 'hospital', label: t('dashboard.hospitalCat', '🏥 Hospitals') },
              { id: 'pharmacy', label: t('dashboard.pharmacyCat', '💊 Pharmacies') },
              { id: 'hotel', label: t('dashboard.hotelCat', '🏨 Hotels') },
              { id: 'restaurant', label: t('dashboard.restaurantCat', '🍽 Restaurants') },
              { id: 'fuel', label: t('dashboard.fuelCat', '⛽ Fuel') },
              { id: 'atm', label: t('dashboard.atmCat', '🏧 ATMs') },
              { id: 'transport', label: t('dashboard.transportCat', '🚆 Transport') }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setNearbyCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                  nearbyCategory === cat.id
                    ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {nearbyLoading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
            <Activity className="w-4 h-4 animate-spin text-blue-600" /> {t('dashboard.calculatingDistances', 'Calculating distances to nearby services...')}
          </div>
        ) : nearbyPlaces.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-slate-500">
            {t('dashboard.noNearbyServices', 'No nearby services found for category')} "{nearbyCategory}". {t('dashboard.trySelectingAnother', 'Try selecting another category or pressing My Location.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyPlaces.map(place => (
              <div key={place.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-extrabold text-[10px] uppercase">{place.category}</span>
                      <h3 className="text-sm font-extrabold text-slate-900 mt-1 m-0">{place.name}</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs shrink-0">
                      📍 {place.formattedDistance || `${place.distanceKm} km`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium m-0 leading-relaxed line-clamp-2">{place.address}</p>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1 border-t border-slate-200/60">
                    <span className="text-emerald-700 font-bold">🟢 {place.openStatusText || t('dashboard.openNow', 'Open Now')}</span>
                    <span>📞 {place.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <a
                    href={`tel:${place.phone}`}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-colors cursor-pointer decoration-none shadow-xs text-center"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> {t('dashboard.callBtn', 'Call')}
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-800 transition-colors cursor-pointer decoration-none shadow-xs text-center"
                  >
                    <Navigation className="w-3.5 h-3.5" /> {t('dashboard.directionsBtn', 'Directions')}
                  </a>
                  <button
                    onClick={() => {
                      setMapLocation({ lat: place.latitude, lng: place.longitude });
                      setSearchedDestination(place);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer shrink-0"
                    title={t('dashboard.viewOnMap', 'View on Map')}
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
          <h4 className={`text-sm font-extrabold m-0 ${textClass}`}>{t('dashboard.vehicleBooking', 'Vehicle Booking')}</h4>
          <p className={`text-xs font-semibold m-0 ${mutedClass}`}>{t('dashboard.verifiedCabs', 'Verified cabs, bikes & SUVs')}</p>
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
          <h4 className={`text-sm font-extrabold m-0 ${textClass}`}>{t('dashboard.foodDining', 'Food & Dining')}</h4>
          <p className={`text-xs font-semibold m-0 ${mutedClass}`}>{t('dashboard.hygienicDining', 'Hygienic local dining & delivery')}</p>
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
          <h4 className={`text-sm font-extrabold m-0 ${textClass}`}>{t('dashboard.aiAssistant', 'AI Assistant')}</h4>
          <p className={`text-xs font-semibold m-0 ${mutedClass}`}>{t('dashboard.languagesMode', '15 Languages & Emergency Mode')}</p>
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
          <h4 className={`text-sm font-extrabold m-0 ${textClass}`}>{t('dashboard.reportIncident', 'Report Incident')}</h4>
          <p className={`text-xs font-semibold m-0 ${mutedClass}`}>{t('dashboard.reportScam', 'Report scam, theft or hazard')}</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
