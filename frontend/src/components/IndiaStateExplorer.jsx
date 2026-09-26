import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MapPin, Navigation, Heart, Star, Shield, ChevronRight, X,
  Loader2, AlertCircle, Globe, Flag, Search, CloudRain, Wind,
  Droplets, Thermometer, ShieldAlert, ExternalLink, RefreshCw,
  Eye, Compass, Info, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { INDIAN_STATES, INDIAN_UNION_TERRITORIES, ALL_INDIAN_REGIONS } from '../utils/indiaStatesData';
import { getPlaceImage, FALLBACK_PLACE_IMAGE } from '../utils/placeImageHelper';

const REGION_FILTERS = [
  { id: 'ALL', label: 'All (36)' },
  { id: 'STATES', label: 'States (28)' },
  { id: 'UTS', label: 'Union Territories (8)' },
  { id: 'South India', label: 'South' },
  { id: 'North India', label: 'North' },
  { id: 'West India', label: 'West' },
  { id: 'East India', label: 'East' },
  { id: 'Northeast India', label: 'Northeast' },
  { id: 'Central India', label: 'Central' }
];

const DestinationCard = ({ dest, darkMode, savedIds, onToggleSave, onDirections }) => {
  const navigate = useNavigate();
  const isSaved = savedIds.includes(dest.id);
  const [imgSrc, setImgSrc] = useState(() => getPlaceImage(dest));

  useEffect(() => {
    setImgSrc(getPlaceImage(dest));
  }, [dest]);

  return (
    <div className={`rounded-2xl border ${darkMode ? 'border-slate-800 bg-slate-900/80 text-white' : 'border-slate-200 bg-white text-slate-900'} overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 group flex flex-col justify-between`}>
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={imgSrc}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          alt={dest.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => { if (imgSrc !== FALLBACK_PLACE_IMAGE) setImgSrc(FALLBACK_PLACE_IMAGE); }}
          loading="lazy"
        />

        {/* Safety badge */}
        {dest.safetyScore && (
          <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-black backdrop-blur-md flex items-center gap-1 shadow-sm">
            <Shield className="w-3 h-3" /> Safety: {dest.safetyScore}/100
          </div>
        )}

        {/* Save button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(dest); }}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
            isSaved ? 'bg-rose-600 text-white' : 'bg-slate-900/60 text-white hover:bg-slate-900'
          }`}
          title={isSaved ? 'Remove from saved' : 'Save place'}
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className={`text-sm font-black m-0 leading-tight truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{dest.name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold m-0 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-red-500 shrink-0" />
              <span className="truncate">{dest.city || dest.address || 'Tourist Spot'}, {dest.state}</span>
            </p>
          </div>
          {dest.rating && (
            <span className="flex items-center gap-0.5 text-amber-700 dark:text-amber-300 text-xs font-black bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md shrink-0 border border-amber-200 dark:border-amber-800">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {dest.rating}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed m-0">
          {dest.description}
        </p>

        {dest.category && (
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {dest.category}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className={`px-3.5 pb-3.5 flex items-center gap-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'} pt-2.5`}>
        <button
          onClick={() => navigate(`/places/${dest.id}`)}
          className="flex-1 py-2 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-black text-xs text-center transition-all cursor-pointer shadow-xs"
        >
          Explore Place
        </button>
        <button
          onClick={() => onDirections(dest)}
          className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-200 dark:border-emerald-800 font-black text-xs flex items-center gap-1 cursor-pointer transition-all shadow-xs"
          title={`Directions to ${dest.name}`}
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const IndiaStateExplorer = ({ darkMode = false, currentGpsLocation = null, onSelectLocation = null }) => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);
  
  // State weather & alerts state
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  
  const [stateAlerts, setStateAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // State destinations
  const [stateDestinations, setStateDestinations] = useState([]);
  const [destinationsLoading, setDestinationsLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(6);

  const [savedIds, setSavedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('rakshasetu_saved_places');
      return saved ? JSON.parse(saved).map(p => p.id) : [];
    } catch (_) {
      return [];
    }
  });

  // Filtered List of States/UTs
  const filteredRegions = useMemo(() => {
    let list = ALL_INDIAN_REGIONS;

    if (selectedFilter === 'STATES') {
      list = INDIAN_STATES;
    } else if (selectedFilter === 'UTS') {
      list = INDIAN_UNION_TERRITORIES;
    } else if (selectedFilter !== 'ALL') {
      list = ALL_INDIAN_REGIONS.filter(r => r.region === selectedFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(r => 
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.capital.toLowerCase().includes(q) ||
        r.popularCities.some(c => c.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedFilter, searchQuery]);

  // Load weather and alerts when a region is selected
  const handleSelectRegion = useCallback(async (region) => {
    if (selectedRegion?.code === region.code) {
      setSelectedRegion(null);
      setWeatherData(null);
      setStateAlerts([]);
      setStateDestinations([]);
      return;
    }

    setSelectedRegion(region);
    setWeatherLoading(true);
    setWeatherError(null);
    setAlertsLoading(true);
    setDestinationsLoading(true);
    setDisplayCount(6);

    // 1. Fetch Representative Regional Weather
    try {
      const res = await api.get(
        `/weather/current?lat=${region.coordinates.lat}&lng=${region.coordinates.lng}&name=${encodeURIComponent(region.capital + ', ' + region.name)}&state=${encodeURIComponent(region.name)}&country=India&representative=true`
      );
      setWeatherData(res.data?.data || res.data);
    } catch (err) {
      console.warn('Weather fetch error for region', err);
      setWeatherError('Regional weather observation temporarily unavailable.');
    } finally {
      setWeatherLoading(false);
    }

    // 2. Fetch Active Safety Alerts in this State
    try {
      const alertsRes = await api.get('/temporary-alerts/active');
      const allActive = alertsRes.data?.data || alertsRes.data || [];
      const matching = allActive.filter(a => {
        const aLoc = (a.locationName || '').toLowerCase();
        const aState = (a.stateRegion || '').toLowerCase();
        const rName = region.name.toLowerCase();
        return aState.includes(rName) || aLoc.includes(rName) || region.popularCities.some(c => aLoc.includes(c.toLowerCase()));
      });
      setStateAlerts(matching);
    } catch (_) {
      setStateAlerts([]);
    } finally {
      setAlertsLoading(false);
    }

    // 3. Fetch Destinations in this State
    try {
      const latParam = currentGpsLocation?.lat ? `&lat=${currentGpsLocation.lat}&lng=${currentGpsLocation.lng}` : '';
      const destRes = await api.get(`/places/by-state?state=${encodeURIComponent(region.name)}${latParam}`);
      const list = destRes.data?.data || destRes.data || [];
      setStateDestinations(Array.isArray(list) ? list : []);
    } catch (_) {
      setStateDestinations([]);
    } finally {
      setDestinationsLoading(false);
    }
  }, [selectedRegion, currentGpsLocation]);

  const refreshWeather = async () => {
    if (!selectedRegion) return;
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const res = await api.get(
        `/weather/current?lat=${selectedRegion.coordinates.lat}&lng=${selectedRegion.coordinates.lng}&name=${encodeURIComponent(selectedRegion.capital + ', ' + selectedRegion.name)}&state=${encodeURIComponent(selectedRegion.name)}&country=India&representative=true`
      );
      setWeatherData(res.data?.data || res.data);
    } catch (err) {
      setWeatherError('Failed to refresh weather.');
    } finally {
      setWeatherLoading(false);
    }
  };

  const toggleSave = useCallback((dest) => {
    try {
      const saved = localStorage.getItem('rakshasetu_saved_places');
      let list = saved ? JSON.parse(saved) : [];
      const exists = list.some(p => p.id === dest.id);
      if (exists) {
        list = list.filter(p => p.id !== dest.id);
      } else {
        list.push(dest);
      }
      localStorage.setItem('rakshasetu_saved_places', JSON.stringify(list));
      setSavedIds(list.map(p => p.id));
    } catch (_) {}
  }, []);

  const handleDirections = useCallback((dest) => {
    if (!dest) return;
    const destLat = parseFloat(dest.latitude);
    const destLng = parseFloat(dest.longitude);
    const hasCoords = !isNaN(destLat) && !isNaN(destLng) && !(destLat === 0 && destLng === 0);

    const openMaps = (originLat, originLng) => {
      let url;
      if (hasCoords) {
        url = originLat && originLng
          ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`
          : `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
      } else {
        const d = encodeURIComponent(`${dest.name}, ${dest.address || `${dest.city}, ${dest.state}`}`);
        url = originLat && originLng
          ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${d}&travelmode=driving`
          : `https://www.google.com/maps/dir/?api=1&destination=${d}&travelmode=driving`;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => openMaps(pos.coords.latitude, pos.coords.longitude),
        () => openMaps(null, null),
        { timeout: 4000, maximumAge: 30000 }
      );
    } else {
      openMaps(null, null);
    }
  }, []);

  const visibleDestinations = stateDestinations.slice(0, displayCount);
  const hasMore = stateDestinations.length > displayCount;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-3xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-blue-900/50'} shadow-lg text-white`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-black tracking-wider uppercase">
                🇮🇳 Bharat Geographic Explorer
              </span>
              <span className="text-xs text-blue-200">28 States & 8 Union Territories</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black m-0 tracking-tight">
              Explore Indian States & Union Territories
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Select any State or UT to view representative regional weather, active temporary safety alerts, and curated tourist destinations.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search State, UT, or City..."
              className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 text-white placeholder:text-slate-400 text-xs font-semibold backdrop-blur-md outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 pb-1 scrollbar-none">
          {REGION_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === f.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Indian States and UTs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {filteredRegions.map((region) => {
          const isSelected = selectedRegion?.code === region.code;
          return (
            <button
              key={region.code}
              onClick={() => handleSelectRegion(region)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer hover:scale-102 flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#0D47A1] border-blue-600 text-white shadow-xl scale-102 ring-2 ring-blue-400'
                  : darkMode
                    ? 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50 text-white'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md text-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xl">{region.emoji}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-blue-800 text-white'
                      : region.type === 'Union Territory'
                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {region.code}
                  </span>
                </div>
                <h4 className={`text-xs font-black leading-tight ${isSelected ? 'text-white' : darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {region.name}
                </h4>
                <p className={`text-[10px] font-semibold mt-0.5 truncate ${isSelected ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                  Cap: {region.capital.split(' ')[0]}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className={`text-[9px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {region.region.replace(' India', '')}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {region.type === 'State' ? 'State' : 'UT'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {filteredRegions.length === 0 && (
        <div className="py-12 text-center text-slate-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60 text-amber-500" />
          <p className="text-sm font-semibold">No States or Union Territories matching "{searchQuery}".</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedFilter('ALL'); }}
            className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Selected State / UT Detail & Weather & Alerts Panel */}
      {selectedRegion && (
        <div className={`rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-5 md:p-6 space-y-6 shadow-xl`}>
          
          {/* Panel Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl p-2 rounded-2xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700">{selectedRegion.emoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-xl font-black m-0 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {selectedRegion.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-[10px] font-black border border-blue-200 dark:border-blue-800">
                    {selectedRegion.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold m-0 mt-0.5 flex items-center gap-2">
                  <span>Capital: <strong>{selectedRegion.capital}</strong></span>
                  <span>•</span>
                  <span>Region: <strong>{selectedRegion.region}</strong></span>
                  <span>•</span>
                  <span>Ref: {selectedRegion.coordinates.lat.toFixed(2)}°N, {selectedRegion.coordinates.lng.toFixed(2)}°E</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/map?lat=${selectedRegion.coordinates.lat}&lng=${selectedRegion.coordinates.lng}&zoom=8`)}
                className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" /> View on Map
              </button>
              <button
                onClick={() => { setSelectedRegion(null); setWeatherData(null); setStateAlerts([]); setStateDestinations([]); }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0 italic">
            "{selectedRegion.description}"
          </p>

          {/* Representative State Weather Card */}
          <div className={`p-4 md:p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border-blue-100'} space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌤️</span>
                <div>
                  <h4 className={`text-sm font-black m-0 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Representative regional weather for {selectedRegion.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium m-0">
                    Observation hub: {selectedRegion.capital} ({selectedRegion.coordinates.lat.toFixed(2)}°N, {selectedRegion.coordinates.lng.toFixed(2)}°E). Microclimates vary by district.
                  </p>
                </div>
              </div>
              <button
                onClick={refreshWeather}
                disabled={weatherLoading}
                className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer disabled:opacity-50"
                title="Refresh Weather"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {weatherLoading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-xs font-semibold">Fetching Open-Meteo live weather...</span>
              </div>
            ) : weatherError ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{weatherError}</span>
              </div>
            ) : weatherData ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                  <span className="text-xs text-slate-500 font-bold block">Temperature</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black">{weatherData.temperature}°C</span>
                    <span className="text-lg">{weatherData.weatherIcon || '☀️'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{weatherData.condition}</span>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                  <span className="text-xs text-slate-500 font-bold block">Feels Like</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                    <span className="text-lg font-black">{weatherData.feelsLike !== null ? `${weatherData.feelsLike}°C` : '--'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Thermal Comfort</span>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                  <span className="text-xs text-slate-500 font-bold block">Humidity</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Droplets className="w-4 h-4 text-cyan-500" />
                    <span className="text-lg font-black">{weatherData.humidity !== null ? `${weatherData.humidity}%` : '--'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Relative Humidity</span>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                  <span className="text-xs text-slate-500 font-bold block">Wind Speed</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Wind className="w-4 h-4 text-teal-500" />
                    <span className="text-lg font-black">{weatherData.windSpeed !== null ? `${weatherData.windSpeed} km/h` : '--'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{weatherData.windDirection ? `Dir: ${weatherData.windDirection}°` : 'Surface Wind'}</span>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white/80 border-slate-200'} col-span-2 sm:col-span-1`}>
                  <span className="text-xs text-slate-500 font-bold block">Precipitation</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CloudRain className="w-4 h-4 text-blue-500" />
                    <span className="text-lg font-black">{weatherData.precipitation !== null ? `${weatherData.precipitation} mm` : '0 mm'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Rain Intensity</span>
                </div>
              </div>
            ) : null}

            {weatherData?.warnings && weatherData.warnings.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {weatherData.warnings.map((w, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <strong>{w.title}</strong>: {w.message}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-500/20">
                      {w.source}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Safety Alerts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-black m-0 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Active Safety Alerts in {selectedRegion.name}
              </h4>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                stateAlerts.length > 0
                  ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}>
                {stateAlerts.length} Active {stateAlerts.length === 1 ? 'Alert' : 'Alerts'}
              </span>
            </div>

            {alertsLoading ? (
              <div className="py-4 flex items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Checking active safety alert zones...</span>
              </div>
            ) : stateAlerts.length === 0 ? (
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-emerald-50/60 border-emerald-200'} flex items-center gap-3 text-xs`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className={darkMode ? 'text-slate-300' : 'text-emerald-800'}>
                  No active temporary safety alerts or emergency tourist closures currently reported in {selectedRegion.name}.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {stateAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-2xl border border-rose-300 bg-rose-50/90 dark:bg-rose-950/30 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase">
                          ⚠️ {alert.alertType || 'ALERT'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-700">
                          Severity: {alert.severity}
                        </span>
                        <h5 className="text-xs font-black m-0">{alert.title}</h5>
                      </div>
                      <p className="text-xs text-rose-800 dark:text-rose-300 m-0">
                        {alert.description}
                      </p>
                      {alert.safetyInstruction && (
                        <p className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold m-0 flex items-center gap-1">
                          <Info className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>Safety Instruction: {alert.safetyInstruction}</span>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/map?lat=${alert.latitude}&lng=${alert.longitude}&alertId=${alert.id}&zoom=12`)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs"
                    >
                      View Safety Area
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tourist Destinations in Selected State */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-black m-0 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Compass className="w-4 h-4 text-blue-600" />
                Tourist Destinations in {selectedRegion.name}
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {stateDestinations.length > 0
                  ? `Showing ${visibleDestinations.length} of ${stateDestinations.length}`
                  : `${selectedRegion.popularCities.length} Key Hubs`}
              </span>
            </div>

            {destinationsLoading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-xs font-semibold">Loading destinations...</span>
              </div>
            ) : stateDestinations.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleDestinations.map(dest => (
                    <DestinationCard
                      key={dest.id}
                      dest={dest}
                      darkMode={darkMode}
                      savedIds={savedIds}
                      onToggleSave={toggleSave}
                      onDirections={handleDirections}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setDisplayCount(c => c + 6)}
                      className="px-6 py-2 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs shadow-sm cursor-pointer transition-all inline-flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Load More ({stateDestinations.length - displayCount} remaining)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Key tourist destinations & cities in {selectedRegion.name}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedRegion.popularCities.map((city, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate(`/map?search=${encodeURIComponent(city + ', ' + selectedRegion.name)}`)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span>{city}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IndiaStateExplorer;
