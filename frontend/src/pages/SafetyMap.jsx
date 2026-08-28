import React, { useState, useEffect } from 'react';
import { 
  Map, Navigation, Shield, Compass, Search, Layers, AlertCircle, RefreshCw, 
  Phone, Stethoscope, Building2, Utensils, Hotel, CheckSquare, Square, Eye
} from 'lucide-react';
import TouristMap from '../components/TouristMap';
import api from '../services/api';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const SafetyMap = ({ darkMode }) => {
  const { t } = useLanguage();

  // Location States (Default live GPS coords)
  const [gpsLocation, setGpsLocation] = useState({ lat: 11.0168, lng: 76.9558 });
  const [mapCenter, setMapCenter] = useState({ lat: 11.0168, lng: 76.9558 });
  const [addressText, setAddressText] = useState('Detecting current GPS location...');
  const [locLoading, setLocLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedDestination, setSearchedDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  // Raw API Datasets
  const [dangerZones, setDangerZones] = useState([]);
  const [safeLocations, setSafeLocations] = useState([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [nearbyPolice, setNearbyPolice] = useState([]);
  const [nearbyHotels, setNearbyHotels] = useState([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [dataUnavailable, setDataUnavailable] = useState(false);

  // Layer Toggle Controls (Requirements 1 & 11)
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

  // Initial Geolocation Fetch
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const coords = { lat, lng };
          setGpsLocation(coords);
          setMapCenter(coords);

          try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
              headers: { 'User-Agent': 'RakshaSetu/1.0' },
              timeout: 3000
            });
            if (res.data?.display_name) setAddressText(res.data.display_name);
          } catch {}
        },
        () => setAddressText('Coimbatore Sector, Tamil Nadu, India')
      );
    }
  }, []);

  // Parallel End-to-End Multi-Category API Data Fetching (Requirement 2 & 13)
  useEffect(() => {
    const fetchMapLayersData = async () => {
      setDataLoading(true);
      setDataUnavailable(false);
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
          setDangerZones(Array.isArray(list) ? list : []);
        }

        if (sRes.status === 'fulfilled') {
          const list = sRes.value.data?.data || sRes.value.data || [];
          setSafeLocations(Array.isArray(list) ? list : []);
        }

        if (hRes.status === 'fulfilled') {
          const list = hRes.value.data?.data || hRes.value.data || [];
          setNearbyHospitals(Array.isArray(list) ? list : []);
        }

        if (pRes.status === 'fulfilled') {
          const list = pRes.value.data?.data || pRes.value.data || [];
          setNearbyPolice(Array.isArray(list) ? list : []);
        }

        if (htRes.status === 'fulfilled') {
          const list = htRes.value.data?.data || htRes.value.data || [];
          setNearbyHotels(Array.isArray(list) ? list : []);
        }

        if (rRes.status === 'fulfilled') {
          const list = rRes.value.data?.data || rRes.value.data || [];
          setNearbyRestaurants(Array.isArray(list) ? list : []);
        }

        if (aRes.status === 'fulfilled') {
          const list = aRes.value.data?.data || aRes.value.data || [];
          setNearbyAttractions(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        setDataUnavailable(true);
      } finally {
        setDataLoading(false);
      }
    };

    fetchMapLayersData();
  }, [mapCenter]);

  // Recenter GPS Target Handler — can receive coords directly from button or trigger its own geolocation
  const handleRecenterMyLocation = (coordsOrMap) => {
    // If the button already resolved GPS and passed coords object, just update state
    if (coordsOrMap && typeof coordsOrMap === 'object' && 'lat' in coordsOrMap && 'lng' in coordsOrMap) {
      setGpsLocation(coordsOrMap);
      setMapCenter(coordsOrMap);
      setSearchedDestination(null);
      setRouteInfo(null);
      return;
    }
    // Fallback: trigger geolocation ourselves (used by the sidebar "Target" button)
    setLocLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setGpsLocation(coords);
          setMapCenter(coords);
          setSearchedDestination(null);
          setRouteInfo(null);
          setLocLoading(false);
        },
        () => setLocLoading(false)
      );
    } else {
      setLocLoading(false);
    }
  };


  // Search Location Handler
  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLocLoading(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'RakshaSetu/1.0' },
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

        // Calculate OSRM driving route
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
    } catch (e) {
    } finally {
      setLocLoading(false);
    }
  };

  const toggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Combine and Filter Nearby Places based on active Layer Checkboxes (Requirement 1 & 3)
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

  // Dynamic Live Marker Counts per Layer (Requirement 11)
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
    <div className="max-w-7xl mx-auto space-y-6 pb-24 animate-fade-in">
      
      {/* Top Header & Location Search Bar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-slate-900">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 m-0">
            <Map className="w-7 h-7 text-emerald-600" />
            {t('nav.safetyMap', 'Tourist Safety Map')}
          </h2>
          <p className="text-xs text-slate-500 font-semibold m-0 mt-1">
            Interactive spatial map with live GPS, safety layer toggles, and route navigation.
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

      {/* Route & Distance Info Banner if route calculated */}
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

      {/* Main Map Container & Layer Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Layer Controls Side Panel with Dynamic Record Counts (Requirement 1 & 11) */}
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

          {/* Data Loading Spinner */}
          {dataLoading && (
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching live layer data...
            </div>
          )}
        </div>

        {/* Main Leaflet Map View */}
        <div className="lg:col-span-3 h-[600px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl relative">
          <TouristMap
            location={gpsLocation}
            destination={searchedDestination}
            dangerZones={filteredDangerZones}
            safeLocations={filteredSafeLocations}
            nearbyPlaces={activeNearbyPlaces}
            showRoute={Boolean(searchedDestination)}
            onMyLocationClick={handleRecenterMyLocation}
            onSelectDestination={(dest) => {
              setSearchedDestination(dest);
              setMapCenter({ lat: dest.lat, lng: dest.lng });
            }}
          />
        </div>

      </div>

    </div>
  );
};

export default SafetyMap;
