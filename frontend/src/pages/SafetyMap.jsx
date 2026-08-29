import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Map, Navigation, Shield, Compass, Search, Layers, AlertCircle, RefreshCw, 
  Phone, Stethoscope, Building2, Utensils, Hotel, CheckSquare, Square, Eye,
  AlertTriangle, AlertOctagon, X, CheckCircle2, Radio, BellRing, WifiOff, PhoneCall, Loader2
} from 'lucide-react';
import TouristMap, { calculateDistanceMeters, formatDistance, isValidCoord, getDangerZoneTheme } from '../components/TouristMap';
import api from '../services/api';
import socket from '../services/socket';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const SafetyMap = ({ darkMode }) => {
  const { t } = useLanguage();

  // ── Live Geolocation & Movement State ──────────────────────────────────────────
  const [gpsLocation, setGpsLocation] = useState({ lat: 11.0168, lng: 76.9558 });
  const [mapCenter, setMapCenter] = useState({ lat: 11.0168, lng: 76.9558 });
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [movementTrail, setMovementTrail] = useState([]);
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'error'
  const [permissionErrorMessage, setPermissionErrorMessage] = useState('');
  const [addressText, setAddressText] = useState('Detecting current GPS location...');
  const [locLoading, setLocLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // ── Search & Navigation States ────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedDestination, setSearchedDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  // ── Raw API Datasets ──────────────────────────────────────────────────────────
  const [dangerZones, setDangerZones] = useState(() => {
    try {
      const cached = localStorage.getItem('rakshasetu_cached_danger_zones');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [safeLocations, setSafeLocations] = useState([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [nearbyPolice, setNearbyPolice] = useState([]);
  const [nearbyHotels, setNearbyHotels] = useState([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [nearbyAttractions, setNearbyAttractions] = useState([]);

  // ── Geofence State Machine & Alerts ───────────────────────────────────────────
  const zoneStatesRef = useRef({}); // { [zoneId]: 'OUTSIDE' | 'APPROACHING' | 'INSIDE' }
  const [activeEmergencyZone, setActiveEmergencyZone] = useState(null); // Inside Danger Zone (Big Modal)
  const [approachingAlert, setApproachingAlert] = useState(null); // Approaching Toast
  const [exitAlert, setExitAlert] = useState(null); // Exited Toast
  const [minimizedDangerBanner, setMinimizedDangerBanner] = useState(null); // Persistent banner after modal dismiss
  const [sosLoading, setSosLoading] = useState(false);
  const [sosSuccessData, setSosSuccessData] = useState(null);

  // ── Layer Toggle Controls ─────────────────────────────────────────────────────
  const [layers, setLayers] = useState({
    safetyZones: true,
    dangerZones: true,
    highRiskZones: true,
    safeZones: true,
    hospitals: true,
    police: true,
    restaurants: true,
    hotels: true,
    attractions: true
  });

  // Watcher ID Ref for cleanup
  const watchIdRef = useRef(null);

  // ── Offline / Online Listener ─────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Geofencing Evaluator ──────────────────────────────────────────────────────
  const evaluateGeofences = useCallback((curLat, curLng, zonesList) => {
    if (!isValidCoord(curLat, curLng) || !Array.isArray(zonesList) || zonesList.length === 0) return;

    let currentlyInsideZone = null;

    zonesList.forEach(zone => {
      if (!zone.is_active && zone.is_active !== undefined) return;
      const zLat = parseFloat(zone.latitude);
      const zLng = parseFloat(zone.longitude);
      if (!isValidCoord(zLat, zLng)) return;

      const dist = calculateDistanceMeters(curLat, curLng, zLat, zLng);
      const radius = parseInt(zone.radius_meters || zone.radius || 500, 10);
      const warningDist = parseInt(zone.warning_distance_meters || zone.warningDistance || 200, 10);

      const zoneId = zone.id || zone.zone_code || `${zLat}-${zLng}`;
      const prevState = zoneStatesRef.current[zoneId] || 'OUTSIDE';
      let newState = 'OUTSIDE';

      if (dist <= radius) {
        newState = 'INSIDE';
      } else if (dist <= radius + warningDist) {
        newState = 'APPROACHING';
      } else {
        newState = 'OUTSIDE';
      }

      // State Transition Logic
      if (newState !== prevState) {
        zoneStatesRef.current[zoneId] = newState;

        if (newState === 'INSIDE') {
          // ENTERED DANGER ZONE -> Trigger Big Emergency Popup
          const distanceInside = Math.max(10, Math.round(radius - dist));
          setActiveEmergencyZone({ zone, dist, distanceInside });
          setMinimizedDangerBanner({ zone, dist, distanceInside });
          setApproachingAlert(null); // Clear approaching if jumped into inside
        } else if (newState === 'APPROACHING' && prevState === 'OUTSIDE') {
          // APPROACHING -> Trigger warning toast
          setApproachingAlert({ zone, dist: Math.round(dist) });
          // Auto-dismiss approaching toast after 8 seconds
          setTimeout(() => setApproachingAlert(prev => (prev?.zone?.id === zone.id ? null : prev)), 8000);
        } else if (prevState === 'INSIDE' && newState !== 'INSIDE') {
          // EXITED DANGER ZONE -> Trigger exit notification
          setActiveEmergencyZone(null);
          setMinimizedDangerBanner(null);
          setExitAlert({ zone });
          setTimeout(() => setExitAlert(null), 7000);
        }
      }

      if (newState === 'INSIDE') {
        currentlyInsideZone = { zone, dist, distanceInside: Math.max(10, Math.round(radius - dist)) };
      }
    });

    if (currentlyInsideZone && !activeEmergencyZone && !minimizedDangerBanner) {
      setMinimizedDangerBanner(currentlyInsideZone);
    }
  }, [activeEmergencyZone, minimizedDangerBanner]);

  // ── Continuous Geolocation Stream (watchPosition) ─────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationPermissionStatus('error');
      setPermissionErrorMessage('Geolocation API is not supported by your browser.');
      return;
    }

    const onPositionSuccess = (pos) => {
      setLocationPermissionStatus('granted');
      setPermissionErrorMessage('');
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy || 10;
      setGpsAccuracy(accuracy);

      const coords = { lat, lng };
      setGpsLocation(coords);

      // Append to movement trail if accuracy is reasonable and moved > 3m
      setMovementTrail(prev => {
        if (accuracy > 100) return prev; // Filter out inaccurate GPS spikes
        if (prev.length === 0) return [[lat, lng]];
        const last = prev[prev.length - 1];
        const dist = calculateDistanceMeters(last[0], last[1], lat, lng);
        if (dist >= 3) {
          // Keep last 300 points for smooth performance
          const nextTrail = [...prev, [lat, lng]];
          return nextTrail.slice(-300);
        }
        return prev;
      });

      // Run geofencing check
      evaluateGeofences(lat, lng, dangerZones);
    };

    const onPositionError = (err) => {
      if (err.code === 1) { // PERMISSION_DENIED
        setLocationPermissionStatus('denied');
        setPermissionErrorMessage('Location permission was denied. Please allow location access in your browser settings to enable live GPS tracking and safety geofencing.');
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        setLocationPermissionStatus('error');
        setPermissionErrorMessage('GPS position unavailable. Check your device location settings.');
      } else if (err.code === 3) { // TIMEOUT
        // Non-fatal, keep trying
      }
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      onPositionSuccess,
      onPositionError,
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    // Initial reverse geocode
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: { 'User-Agent': 'RakshaSetu/2.0' },
            timeout: 3500
          });
          if (res.data?.display_name) {
            setAddressText(res.data.display_name.split(',').slice(0, 3).join(', '));
          }
        } catch {}
      },
      () => {}
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [evaluateGeofences, dangerZones]);

  // ── Parallel API Data Fetching with Local Caching ─────────────────────────────
  useEffect(() => {
    const fetchMapLayersData = async () => {
      setDataLoading(true);
      try {
        const [zRes, sRes, hRes, pRes, htRes, rRes, aRes] = await Promise.allSettled([
          api.get('/zones'),
          api.get('/admin/safe-locations'),
          api.get(`/places/nearby?lat=${mapCenter.lat}&lng=${mapCenter.lng}&category=hospital`),
          api.get(`/places/nearby?lat=${mapCenter.lat}&lng=${mapCenter.lng}&category=police`),
          api.get(`/places/nearby?lat=${mapCenter.lat}&lng=${mapCenter.lng}&category=hotel`),
          api.get(`/places/nearby?lat=${mapCenter.lat}&lng=${mapCenter.lng}&category=restaurant`),
          api.get(`/places/nearby?lat=${mapCenter.lat}&lng=${mapCenter.lng}&category=attraction`)
        ]);

        if (zRes.status === 'fulfilled') {
          const list = zRes.value.data?.data || zRes.value.data || [];
          if (Array.isArray(list) && list.length > 0) {
            setDangerZones(list);
            localStorage.setItem('rakshasetu_cached_danger_zones', JSON.stringify(list));
            // Trigger geofence evaluation with fresh data
            evaluateGeofences(gpsLocation.lat, gpsLocation.lng, list);
          }
        }

        if (sRes.status === 'fulfilled') {
          const list = sRes.value.data?.data || sRes.value.data || [];
          setSafeLocations(Array.isArray(list) ? list : []);
        }
        if (hRes.status === 'fulfilled') setNearbyHospitals(Array.isArray(hRes.value.data?.data || hRes.value.data) ? (hRes.value.data?.data || hRes.value.data) : []);
        if (pRes.status === 'fulfilled') setNearbyPolice(Array.isArray(pRes.value.data?.data || pRes.value.data) ? (pRes.value.data?.data || pRes.value.data) : []);
        if (htRes.status === 'fulfilled') setNearbyHotels(Array.isArray(htRes.value.data?.data || htRes.value.data) ? (htRes.value.data?.data || htRes.value.data) : []);
        if (rRes.status === 'fulfilled') setNearbyRestaurants(Array.isArray(rRes.value.data?.data || rRes.value.data) ? (rRes.value.data?.data || rRes.value.data) : []);
        if (aRes.status === 'fulfilled') setNearbyAttractions(Array.isArray(aRes.value.data?.data || aRes.value.data) ? (aRes.value.data?.data || aRes.value.data) : []);
      } catch {
        setIsOffline(true);
      } finally {
        setDataLoading(false);
      }
    };

    fetchMapLayersData();
  }, [mapCenter, evaluateGeofences, gpsLocation]);

  // ── Recenter Live GPS ─────────────────────────────────────────────────────────
  const handleRecenterMyLocation = (coordsOrMap) => {
    if (coordsOrMap && typeof coordsOrMap === 'object' && 'lat' in coordsOrMap && 'lng' in coordsOrMap) {
      setGpsLocation(coordsOrMap);
      setMapCenter(coordsOrMap);
      setSearchedDestination(null);
      setRouteInfo(null);
      return;
    }

    setLocLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setGpsLocation(coords);
          setMapCenter(coords);
          setGpsAccuracy(pos.coords.accuracy || 10);
          setSearchedDestination(null);
          setRouteInfo(null);
          setLocLoading(false);
        },
        () => setLocLoading(false),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocLoading(false);
    }
  };

  // ── Emergency SOS Trigger from Inside Danger Zone ─────────────────────────────
  const handleTriggerDangerSos = async () => {
    if (!activeEmergencyZone?.zone) return;
    setSosLoading(true);
    const z = activeEmergencyZone.zone;

    try {
      const payload = {
        latitude: gpsLocation.lat,
        longitude: gpsLocation.lng,
        address: addressText || `Lat: ${gpsLocation.lat.toFixed(4)}, Lng: ${gpsLocation.lng.toFixed(4)}`,
        triggerType: 'danger_zone_sos',
        dangerZoneId: z.id,
        dangerType: z.danger_type || z.crime_type || 'GENERAL_HAZARD',
        severity: z.severity || 'high',
        event: 'DANGER_ZONE_SOS',
        description: `Tourist entered active danger zone '${z.name}' (${z.danger_type || z.crime_type}) and requested emergency dispatch.`
      };

      const res = await api.post('/sos/trigger', payload);
      const data = res.data?.data || res.data;
      const sosCode = data?.sos_code || `SOS-${Date.now().toString().slice(-6)}`;
      setSosSuccessData({ sosCode, zoneName: z.name });

      // Emit live socket event
      try {
        socket.emit('trigger_sos_event', {
          id: data?.id || Date.now(),
          sos_code: sosCode,
          dangerZoneId: z.id,
          dangerType: z.danger_type || z.crime_type,
          severity: z.severity,
          latitude: gpsLocation.lat,
          longitude: gpsLocation.lng,
          address: payload.address,
          status: 'active',
          created_at: new Date().toISOString()
        });
      } catch {}

    } catch (err) {
      alert(err.response?.data?.message || 'Emergency broadcast failed. Please call 112 directly.');
    } finally {
      setSosLoading(false);
    }
  };

  // ── Search Destination ────────────────────────────────────────────────────────
  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLocLoading(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'RakshaSetu/2.0' },
        timeout: 3500
      });

      if (res.data?.[0]) {
        const item = res.data[0];
        const dest = {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          name: item.display_name.split(',')[0],
          address: item.display_name
        };
        setSearchedDestination(dest);
        setMapCenter({ lat: dest.lat, lng: dest.lng });

        // OSRM Driving Route
        try {
          const osrm = await axios.get(`https://router.project-osrm.org/route/v1/driving/${gpsLocation.lng},${gpsLocation.lat};${dest.lng},${dest.lat}?overview=full`, { timeout: 3000 });
          if (osrm.data?.routes?.[0]) {
            const r = osrm.data.routes[0];
            setRouteInfo({
              distanceKm: Math.round((r.distance / 1000) * 10) / 10,
              durationMins: Math.round(r.duration / 60)
            });
          }
        } catch {}
      }
    } catch {
    } finally {
      setLocLoading(false);
    }
  };

  const toggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter nearby places by active layers
  const activeNearbyPlaces = [];
  if (layers.hospitals) activeNearbyPlaces.push(...nearbyHospitals);
  if (layers.police) activeNearbyPlaces.push(...nearbyPolice);
  if (layers.hotels) activeNearbyPlaces.push(...nearbyHotels);
  if (layers.restaurants) activeNearbyPlaces.push(...nearbyRestaurants);
  if (layers.attractions) activeNearbyPlaces.push(...nearbyAttractions);

  // Filter Danger & Safety Zones
  const filteredDangerZones = dangerZones.filter((z) => {
    if (!layers.safetyZones) return false;
    const sev = (z.severity || '').toLowerCase();
    if ((sev === 'critical' || sev === 'danger') && !layers.dangerZones) return false;
    if (sev === 'high' && !layers.highRiskZones) return false;
    if ((sev === 'low' || sev === 'safe') && !layers.safeZones) return false;
    return true;
  });

  const filteredSafeLocations = layers.safeZones ? safeLocations : [];

  const layerCounts = {
    safetyZones: dangerZones.length + safeLocations.length,
    dangerZones: dangerZones.filter(z => (z.severity || '').toLowerCase() === 'critical' || (z.severity || '').toLowerCase() === 'danger').length,
    highRiskZones: dangerZones.filter(z => (z.severity || '').toLowerCase() === 'high').length,
    safeZones: safeLocations.length + dangerZones.filter(z => (z.severity || '').toLowerCase() === 'safe' || (z.severity || '').toLowerCase() === 'low').length,
    hospitals: nearbyHospitals.length,
    police: nearbyPolice.length,
    restaurants: nearbyRestaurants.length,
    hotels: nearbyHotels.length,
    attractions: nearbyAttractions.length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24 animate-fade-in relative">
      
      {/* ── 1. Top Header & Search ─────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 m-0">
              <Map className="w-7 h-7 text-emerald-600" />
              {t('nav.safetyMap', 'Tourist Safety & Danger Zone Sentinel')}
            </h2>
            {isOffline && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black flex items-center gap-1">
                <WifiOff className="w-3 h-3 text-amber-700" /> Offline Geofencing
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-semibold m-0 mt-1 flex items-center gap-2">
            <span>Live GPS telemetry with automated Haversine geofencing & 3-level danger alerts.</span>
            {gpsAccuracy && <span className="text-blue-700 font-black">GPS Accuracy: ±{Math.round(gpsAccuracy)}m</span>}
          </p>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchLocation} className="w-full md:w-auto flex items-center gap-2">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location, monument, or city..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={locLoading}
            className="px-5 py-2.5 rounded-2xl bg-[#0D47A1] hover:bg-blue-900 text-white font-black text-xs shadow-md cursor-pointer whitespace-nowrap transition-all"
          >
            {locLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* ── Permission Denied Warning Banner ───────────────────────────────── */}
      {locationPermissionStatus === 'denied' && (
        <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 flex items-start gap-3 shadow-md">
          <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-black text-red-900 m-0">Location Access Required for Live Safety Sentinel</h4>
            <p className="m-0 mt-0.5 font-semibold text-red-800">{permissionErrorMessage}</p>
          </div>
          <button
            onClick={() => handleRecenterMyLocation()}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer"
          >
            Grant Location
          </button>
        </div>
      )}

      {/* ── Approaching Danger Zone Toast (Level 1) ─────────────────────────── */}
      {approachingAlert && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl flex items-center justify-between gap-3 animate-fade-in border border-amber-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 animate-bounce">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-black uppercase tracking-wider">
                  ⚠️ Approaching Hazard Zone
                </span>
                <span className="text-xs font-black">~{formatDistance(approachingAlert.dist)} away</span>
              </div>
              <h4 className="text-sm font-black m-0 mt-0.5 text-white">{approachingAlert.zone.name}</h4>
              <p className="text-xs text-amber-100 m-0 font-medium leading-tight">
                {approachingAlert.zone.safety_instructions || approachingAlert.zone.advisory_message || 'Stay alert and keep your belongings secure.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setApproachingAlert(null)}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Exited Danger Zone Notification (Level 3) ───────────────────────── */}
      {exitAlert && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-lg flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs font-black">
              ✓ You have safely exited the danger zone: <strong>{exitAlert.zone.name}</strong>
            </span>
          </div>
          <button
            onClick={() => setExitAlert(null)}
            className="p-1 rounded-lg hover:bg-emerald-700 text-emerald-200 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Minimized Persistent Danger Banner ──────────────────────────────── */}
      {minimizedDangerBanner && !activeEmergencyZone && (
        <div className="p-3.5 rounded-2xl bg-red-600 text-white shadow-xl flex items-center justify-between gap-3 animate-pulse border-2 border-red-400">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 text-white shrink-0" />
            <div>
              <span className="text-xs font-black block">
                🚨 ACTIVE HAZARD ZONE: {minimizedDangerBanner.zone.name} ({minimizedDangerBanner.zone.danger_type || 'THEFT'})
              </span>
              <span className="text-[11px] text-red-100 font-medium">
                Distance inside perimeter: ~{minimizedDangerBanner.distanceInside}m. Exercise high vigilance.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveEmergencyZone(minimizedDangerBanner)}
              className="px-3 py-1.5 rounded-xl bg-white text-red-700 font-black text-xs shadow-md cursor-pointer hover:bg-red-50"
            >
              View Instructions
            </button>
            <button
              onClick={handleTriggerDangerSos}
              className="px-3 py-1.5 rounded-xl bg-black text-white font-black text-xs shadow-md cursor-pointer hover:bg-slate-900 flex items-center gap-1"
            >
              <PhoneCall className="w-3 h-3 text-red-400" /> SOS
            </button>
          </div>
        </div>
      )}

      {/* ── Route & Distance Info Banner ────────────────────────────────────── */}
      {searchedDestination && routeInfo && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0a2540] via-[#0D47A1] to-[#1e3a8a] text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <Navigation className="w-6 h-6 text-emerald-400 animate-pulse" />
            <div>
              <h4 className="text-sm font-black m-0 text-white">Route to {searchedDestination.name}</h4>
              <p className="text-xs text-blue-100 m-0">Distance: {routeInfo.distanceKm} km • Est. Time: {routeInfo.durationMins} mins</p>
            </div>
          </div>
          <button
            onClick={() => { setSearchedDestination(null); setRouteInfo(null); }}
            className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-black text-white cursor-pointer transition-all"
          >
            Clear Route
          </button>
        </div>
      )}

      {/* ── Main Map Container & Layer Control Panel ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Layer Controls Side Panel */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 lg:col-span-1 text-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 m-0 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" /> {t('safety.safetyLayers', 'Map Control Layers')}
            </h3>
            <button
              onClick={handleRecenterMyLocation}
              className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black flex items-center gap-1 cursor-pointer hover:bg-blue-100 transition-all"
              title="Recenter Map to Live GPS"
            >
              <Compass className="w-3.5 h-3.5" /> Target
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { key: 'safetyZones', label: 'Safety Zones Overview', count: layerCounts.safetyZones, color: 'text-emerald-700 font-bold' },
              { key: 'dangerZones', label: '🔴 Danger Zones (Red)', count: layerCounts.dangerZones, color: 'text-red-600 font-bold' },
              { key: 'highRiskZones', label: '🟠 High Risk Zones (Orange)', count: layerCounts.highRiskZones, color: 'text-amber-600 font-bold' },
              { key: 'safeZones', label: '🟢 Safe Zones (Green)', count: layerCounts.safeZones, color: 'text-emerald-600 font-bold' },
              { key: 'hospitals', label: '🏥 Hospitals', count: layerCounts.hospitals, color: 'text-rose-600 font-bold' },
              { key: 'police', label: '👮 Police Stations', count: layerCounts.police, color: 'text-blue-600 font-bold' },
              { key: 'restaurants', label: '🍴 Restaurants', count: layerCounts.restaurants, color: 'text-amber-700 font-bold' },
              { key: 'hotels', label: '🏨 Hotels & Lodges', count: layerCounts.hotels, color: 'text-purple-600 font-bold' },
              { key: 'attractions', label: '🎡 Attractions', count: layerCounts.attractions, color: 'text-teal-600 font-bold' }
            ].map((item) => {
              const isChecked = layers[item.key];
              return (
                <button
                  key={item.key}
                  onClick={() => toggleLayer(item.key)}
                  className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between font-bold transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-blue-50/80 border-blue-200 text-blue-950 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200/80 text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={item.color}>{item.label}</span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      ({item.count})
                    </span>
                  </div>
                  {isChecked ? <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Active Status Badge */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
            <div className="flex items-center justify-between font-bold">
              <span>Trail Points:</span>
              <span className="font-mono text-blue-700">{movementTrail.length} recorded</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span>Active Hazard Zones:</span>
              <span className="font-mono text-red-700">{dangerZones.length} monitored</span>
            </div>
          </div>

          {dataLoading && (
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching live layer data...
            </div>
          )}
        </div>

        {/* Main Leaflet Map View with Polyline Trail & Live GPS */}
        <div className="lg:col-span-3 h-[620px] rounded-3xl overflow-hidden border border-slate-200 shadow-xl relative">
          <TouristMap
            location={gpsLocation}
            movementTrail={movementTrail}
            destination={searchedDestination}
            dangerZones={filteredDangerZones}
            safeLocations={filteredSafeLocations}
            nearbyPlaces={activeNearbyPlaces}
            showRoute={Boolean(searchedDestination)}
            gpsAccuracy={gpsAccuracy}
            isLiveTracking={isLiveTracking}
            isOffline={isOffline}
            onMyLocationClick={handleRecenterMyLocation}
            onSelectDestination={(dest) => {
              setSearchedDestination(dest);
              setMapCenter({ lat: dest.lat, lng: dest.lng });
            }}
          />
        </div>

      </div>

      {/* ── 9. BIG EMERGENCY POPUP (Level 2 Modal) ─────────────────────────── */}
      {activeEmergencyZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl p-6 shadow-2xl bg-white border-2 border-red-500 text-slate-900 space-y-5">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 shrink-0 animate-bounce">
                  <AlertOctagon className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black uppercase tracking-wider">
                    ⚠️ DANGER ZONE ALERT
                  </span>
                  <h3 className="text-lg font-black text-slate-900 m-0 mt-0.5">
                    YOU HAVE ENTERED A HIGH-RISK AREA
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveEmergencyZone(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!sosSuccessData ? (
              <>
                {/* Zone Information Card */}
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">Danger Type</span>
                      <h4 className="text-sm font-black text-slate-900 m-0">
                        {activeEmergencyZone.zone.danger_type || activeEmergencyZone.zone.crime_type || 'General Hazard'}
                      </h4>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-red-600 text-white font-black text-xs uppercase shadow-xs">
                      {activeEmergencyZone.zone.severity || 'HIGH'} RISK
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 m-0 font-medium leading-relaxed">
                    {activeEmergencyZone.zone.description || activeEmergencyZone.zone.advisory_message}
                  </p>
                </div>

                {/* Safety Instructions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 m-0 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" /> Mandatory Safety Instructions
                  </h4>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                    <p className="m-0 font-bold text-slate-900">
                      • {activeEmergencyZone.zone.safety_instructions || 'Keep your phone and wallet secure in inner pockets.'}
                    </p>
                    <p className="m-0 font-medium">
                      • {activeEmergencyZone.zone.recommended_action || 'Avoid isolated alleys and move toward a well-lit main public area.'}
                    </p>
                    <p className="m-0 font-medium">
                      • Stay with other pedestrians and do not accept unauthorized guide/cab solicitations.
                    </p>
                  </div>
                </div>

                {/* Telemetry Footer */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Location</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {addressText || `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}`}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Distance Inside Zone</span>
                    <span className="font-black text-red-600 block">
                      ~{activeEmergencyZone.distanceInside} meters
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveEmergencyZone(null)}
                    className="flex-1 py-3 rounded-2xl border border-slate-300 text-slate-700 font-extrabold text-xs hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    I UNDERSTAND
                  </button>

                  <button
                    onClick={handleTriggerDangerSos}
                    disabled={sosLoading}
                    className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
                  >
                    {sosLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Broadcasting...</span></>
                    ) : (
                      <><AlertOctagon className="w-4 h-4" /><span>🚨 DISPATCH SOS</span></>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* SOS Success Confirmation State */
              <div className="py-4 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h4 className="text-base font-black text-emerald-700 m-0">
                    EMERGENCY SOS DISPATCHED
                  </h4>
                  <p className="text-xs text-slate-600 font-medium m-0 mt-1">
                    First responders, tourist police desk, and registered emergency contacts have received your live GPS coordinates inside <strong>{sosSuccessData.zoneName}</strong>.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-100 border font-mono text-xs font-black text-blue-900">
                  Tracking Code: {sosSuccessData.sosCode}
                </div>
                <button
                  onClick={() => { setActiveEmergencyZone(null); setSosSuccessData(null); }}
                  className="w-full py-3 rounded-2xl bg-[#0D47A1] text-white font-black text-xs shadow-md"
                >
                  Return to Safety Map
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default SafetyMap;
