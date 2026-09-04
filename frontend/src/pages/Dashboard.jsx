import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Shield, MapPin, Navigation, Compass, AlertTriangle, Phone, Stethoscope,
  Building2, Utensils, Hotel, Car, Ticket, MessageSquare, Heart, Star, Sun, CloudRain,
  TrendingUp, RefreshCw, ChevronRight, Zap, CheckCircle2, AlertCircle, ArrowUpRight,
  X, Globe, Flag, ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TouristMap from '../components/TouristMap';
import StateExplorer from '../components/StateExplorer';
import api from '../services/api';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { getPlaceImage } from '../utils/placeImageHelper';

const Dashboard = ({ tourist, darkMode }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ── Location & Weather ───────────────────────────────────────────────────────
  const [currentGpsLocation, setCurrentGpsLocation] = useState({ lat: 11.0168, lng: 76.9558 });
  const [addressText, setAddressText] = useState(() => localStorage.getItem('rakshasetu_user_city') || 'Coimbatore, Tamil Nadu');
  const [weatherData, setWeatherData] = useState(null);
  const [safetyScore] = useState(92);
  const [riskLevel] = useState('Safe (Green)');

  // ── Search ───────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const searchRef = useRef(null);
  const abortRef = useRef(null);

  // ── Category Counts ──────────────────────────────────────────────────────────
  const [categoryCounts, setCategoryCounts] = useState({
    'Adventure': 0, 'Nature & Parks': 0, 'Heritage & Forts': 0,
    'Beaches & Lakes': 0, 'Wildlife & Safaris': 0, 'Local Food & Street': 0,
    'Culture & Temples': 0, 'Family & Shopping': 0
  });

  // ── Category Modal ───────────────────────────────────────────────────────────
  const [categoryModal, setCategoryModal] = useState({ isOpen: false, categoryName: '', items: [], loading: false });
  const [categoryPageSize, setCategoryPageSize] = useState(6);

  // ── Data Lists ───────────────────────────────────────────────────────────────
  const [exploreDestinations, setExploreDestinations] = useState([]);
  const [dangerZones, setDangerZones] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyCategory, setNearbyCategory] = useState('all');
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(() => {
    const saved = localStorage.getItem('rakshasetu_saved_places');
    return saved ? JSON.parse(saved).map(p => p.id) : [];
  });

  // ── Explore Section Tabs ─────────────────────────────────────────────────────
  const [exploreTab, setExploreTab] = useState('featured'); // 'featured' | 'states'

  // ── Init: Geolocation + Weather + Category Counts + Danger Zones ────────────
  useEffect(() => {
    // Fetch danger zones
    api.get('/zones')
      .then(res => {
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list)) setDangerZones(list);
      })
      .catch(() => {});

    // Fetch category counts
    api.get('/places/category-counts')
      .then(res => {
        const payload = res.data?.data || res.data;
        if (payload && typeof payload === 'object') setCategoryCounts(payload);
      })
      .catch(() => {});

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const coords = { lat, lng };
          setCurrentGpsLocation(coords);
          try {
            const res = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
              { headers: { 'User-Agent': 'RakshaSetu/2.0' }, timeout: 3500 }
            );
            if (res.data?.address) {
              const addr = res.data.address;
              const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state_district || 'Local Area';
              const state = addr.state || '';
              const clean = `${city}${state ? `, ${state}` : ''}`;
              setAddressText(clean);
              localStorage.setItem('rakshasetu_user_city', clean);
            } else if (res.data?.display_name) {
              const clean = res.data.display_name.split(',').slice(0, 3).join(', ');
              setAddressText(clean);
              localStorage.setItem('rakshasetu_user_city', clean);
            }
          } catch (_) {
            if (!localStorage.getItem('rakshasetu_user_city')) {
              setAddressText('Coimbatore, Tamil Nadu');
            }
          }
          try {
            const wRes = await api.get(`/places/weather?lat=${lat}&lng=${lng}`);
            if (wRes.data?.data) setWeatherData(wRes.data.data);
          } catch (_) {}
        },
        () => {
          const savedCity = localStorage.getItem('rakshasetu_user_city') || 'Coimbatore, Tamil Nadu';
          setAddressText(savedCity);
        },
        { timeout: 5000, maximumAge: 30000, enableHighAccuracy: false }
      );
    }
  }, []);

  // ── Fetch Explore Destinations ───────────────────────────────────────────────
  useEffect(() => {
    api.get(`/places/search?lat=${currentGpsLocation.lat}&lng=${currentGpsLocation.lng}`)
      .then(res => {
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) setExploreDestinations(list);
      })
      .catch(() => {});
  }, [currentGpsLocation]);

  // ── Fetch Nearby Places ──────────────────────────────────────────────────────
  useEffect(() => {
    setNearbyLoading(true);
    api.get(`/places/nearby?lat=${currentGpsLocation.lat}&lng=${currentGpsLocation.lng}&category=${nearbyCategory}`)
      .then(res => {
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list)) setNearbyPlaces(list);
      })
      .catch(() => {})
      .finally(() => setNearbyLoading(false));
  }, [currentGpsLocation, nearbyCategory]);

  // ── Debounced Google Places Autocomplete Search (300ms) with AbortController ────────────
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      // Cancel previous request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setIsSearching(true);
      setHasSearched(true);
      try {
        const res = await api.get(
          `/places/autocomplete?input=${encodeURIComponent(searchQuery)}&lat=${currentGpsLocation.lat}&lng=${currentGpsLocation.lng}`,
          { signal: abortRef.current.signal }
        );
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list)) {
          const formatted = list.map(item => ({
            id: item.placeId || item.id || (item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : 'place'),
            placeId: item.placeId,
            name: item.name,
            address: item.formattedAddress || item.fullDescription || item.address,
            city: item.city || item.formattedAddress?.split(',')[0] || 'Worldwide',
            state: item.state || '',
            country: item.country || '',
            category: item.types?.[0] ? item.types[0].replace(/_/g, ' ') : (item.source === 'google' ? 'Google Place' : 'Destination'),
            photos: item.photos || [],
            safetyScore: item.safetyScore || 88,
            source: item.source
          }));
          setSearchSuggestions(formatted);
        }
      } catch (e) {
        if (e.name !== 'AbortError' && e.name !== 'CanceledError') setSearchSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentGpsLocation]);


  // ── Category Modal Handler ───────────────────────────────────────────────────
  const handleOpenCategory = useCallback(async (catName) => {
    setSelectedCategory(catName);
    setCategoryPageSize(6);
    setCategoryModal({ isOpen: true, categoryName: catName, items: [], loading: true });
    try {
      const res = await api.get(
        `/places/search?category=${encodeURIComponent(catName)}&lat=${currentGpsLocation.lat}&lng=${currentGpsLocation.lng}`
      );
      const list = res.data?.data || res.data || [];
      setCategoryModal(prev => ({ ...prev, items: Array.isArray(list) ? list : [], loading: false }));
    } catch (_) {
      setCategoryModal(prev => ({ ...prev, loading: false }));
    }
  }, [currentGpsLocation]);

  // ── Save/Unsave ──────────────────────────────────────────────────────────────
  const toggleSavePlace = useCallback((place) => {
    const saved = localStorage.getItem('rakshasetu_saved_places');
    let list = saved ? JSON.parse(saved) : [];
    const exists = list.some(p => p.id === place.id);
    if (exists) { list = list.filter(p => p.id !== place.id); }
    else { list.push(place); }
    localStorage.setItem('rakshasetu_saved_places', JSON.stringify(list));
    setSavedIds(list.map(p => p.id));
  }, []);

  // ── Directions ───────────────────────────────────────────────────────────────
  const handleGetDirections = useCallback((place) => {
    if (!place) return;
    const destLat = parseFloat(place.latitude);
    const destLng = parseFloat(place.longitude);
    const hasCoords = !isNaN(destLat) && !isNaN(destLng) && !(destLat === 0 && destLng === 0);

    const openMaps = (originLat, originLng) => {
      let url;
      if (hasCoords) {
        url = originLat && originLng
          ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`
          : `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
      } else {
        const dest = encodeURIComponent(`${place.name}, ${place.address || `${place.city}, ${place.state}`}`);
        url = originLat && originLng
          ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${dest}&travelmode=driving`
          : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
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

  // ── Handle search Enter key ──────────────────────────────────────────────────
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (searchSuggestions.length > 0) {
        const first = searchSuggestions[0];
        setSearchQuery('');
        setSearchSuggestions([]);
        navigate(`/places/${first.id}`);
      }
    }
    if (e.key === 'Escape') {
      setSearchQuery('');
      setSearchSuggestions([]);
    }
  };

  // ── Quick Actions ────────────────────────────────────────────────────────────
  const quickActions = [
    { label: t('nav.sosButton', 'Emergency SOS'), path: '/contacts', icon: AlertTriangle, color: 'from-red-600 to-rose-700' },
    { label: t('nav.safetyMap', 'Safety Map'), path: '/safety-map', icon: Shield, color: 'from-emerald-600 to-teal-700' },
    { label: t('nav.nearbyHelp', 'Nearby Help'), path: '/nearby', icon: Building2, color: 'from-blue-600 to-indigo-700' },
    { label: 'Hospitals', path: '/nearby?category=hospital', icon: Stethoscope, color: 'from-rose-500 to-pink-600' },
    { label: 'Police', path: '/nearby?category=police', icon: Building2, color: 'from-[#0D47A1] to-blue-800' },
    { label: t('nav.vehicleBooking', 'Book Ride'), path: '/vehicles', icon: Car, color: 'from-amber-500 to-orange-600' },
    { label: t('nav.travelBooking', 'Travel'), path: '/travel', icon: Ticket, color: 'from-purple-600 to-indigo-700' },
    { label: t('nav.aiAssistant', 'AI Tourist'), path: '/ai', icon: Zap, color: 'from-teal-500 to-emerald-600' }
  ];

  const activityCategories = [
    { name: 'Adventure', icon: '🧗', type: 'Adventure', countKey: 'Adventure', unit: 'Activities', color: 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400' },
    { name: 'Nature & Parks', icon: '🌿', type: 'Nature', countKey: 'Nature & Parks', unit: 'Places', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
    { name: 'Heritage & Forts', icon: '🏰', type: 'Heritage', countKey: 'Heritage & Forts', unit: 'Monuments', color: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400' },
    { name: 'Beaches & Lakes', icon: '🏖️', type: 'Beach', countKey: 'Beaches & Lakes', unit: 'Beaches', color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-400' },
    { name: 'Wildlife & Safaris', icon: '🐅', type: 'Wildlife', countKey: 'Wildlife & Safaris', unit: 'Parks', color: 'bg-lime-500/10 border-lime-500/20 text-lime-700 dark:text-lime-400' },
    { name: 'Local Food & Street', icon: '🍲', type: 'Food', countKey: 'Local Food & Street', unit: 'Outlets', color: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400' },
    { name: 'Culture & Temples', icon: '🛕', type: 'Culture', countKey: 'Culture & Temples', unit: 'Sites', color: 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400' },
    { name: 'Family & Shopping', icon: '🛍️', type: 'Shopping', countKey: 'Family & Shopping', unit: 'Malls', color: 'bg-pink-500/10 border-pink-500/20 text-pink-700 dark:text-pink-400' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 animate-fade-in">

      {/* ── 1. HERO GLOBAL SEARCH BANNER ────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-visible p-6 md:p-10 bg-gradient-to-r from-[#0a2540] via-[#0D47A1] to-[#1e3a8a] text-white shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-black mb-2 backdrop-blur-md">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>RakshaSetu AI Tourist Safety Network</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight m-0 text-white">
              Where would you like to explore safely?
            </h1>
            <p className="text-xs md:text-sm text-blue-100 font-medium m-0 mt-1">
              Search destinations worldwide — Ooty, Taj Mahal, Paris, Eiffel Tower, Tokyo, Dubai, and beyond.
            </p>
          </div>
        </div>

        {/* ── Global Search Input ─────────────────────────────────────────── */}
        <div className="relative z-30" ref={searchRef}>
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search any city, monument, hill station, country... (e.g. Ooty, Taj Mahal, Paris, Dubai, Tokyo)"
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white text-slate-900 text-sm font-bold shadow-lg border-2 border-transparent focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
              autoComplete="off"
              aria-label="Search tourist destinations worldwide"
            />
            {searchQuery ? (
              <button
                onClick={() => { setSearchQuery(''); setSearchSuggestions([]); setHasSearched(false); }}
                className="absolute right-3.5 top-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* ── Search Dropdown Panel ────────────────────────────────────── */}
          {searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[999] pointer-events-auto animate-fade-in max-h-80 overflow-y-auto divide-y divide-slate-100">
              {isSearching ? (
                <div className="p-6 text-center text-slate-500 flex items-center justify-center gap-2 font-bold text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  Searching Google Places worldwide...

                </div>
              ) : searchSuggestions.length === 0 && hasSearched ? (
                <div className="p-6 text-center text-slate-500 space-y-1">
                  <p className="text-sm font-black text-slate-700 m-0">No matching destinations found for "{searchQuery}"</p>
                  <p className="text-xs text-slate-400 m-0 font-medium">Try searching for a city, state, monument, or country name.</p>
                </div>
              ) : (
                searchSuggestions.map((place) => (
                  <SearchResultRow
                    key={place.id}
                    place={place}
                    darkMode={false}
                    onSelect={() => {
                      setSearchQuery('');
                      setSearchSuggestions([]);
                      navigate(`/places/${place.id}`);
                    }}
                    onDirections={() => {
                      setSearchQuery('');
                      setSearchSuggestions([]);
                      handleGetDirections(place);
                    }}
                    onSave={() => toggleSavePlace(place)}
                    isSaved={savedIds.includes(place.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Category Quick Filters ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          {['All', 'Adventure', 'Nature', 'Heritage', 'Beach', 'Wildlife', 'Food', 'Culture', 'Shopping'].map((cat) => (
            <button
              key={cat}
              onClick={() => handleOpenCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-blue-900 shadow-md scale-105'
                  : 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. WEATHER & SAFETY INDEX CARD ──────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white/95 border border-slate-200/90 shadow-sm backdrop-blur-md text-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-0.5">
              Live Location Sentinel
            </span>
            <h3 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500 shrink-0" />
              <span className="truncate">{addressText}</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200 whitespace-nowrap shadow-xs">
              🛡️ Safety: {safetyScore}/100
            </span>
            <span className="px-3.5 py-1.5 rounded-2xl bg-blue-50 text-blue-700 text-xs font-black border border-blue-200 whitespace-nowrap shadow-xs">
              {riskLevel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          {[
            { label: 'Temperature', value: weatherData?.temperature ? `${weatherData.temperature}°C` : '28°C', icon: Sun, color: 'text-amber-600' },
            { label: 'Condition', value: weatherData?.condition || 'Clear & Pleasant', icon: CloudRain, color: 'text-blue-600' },
            { label: 'Humidity', value: weatherData?.humidity ? `${weatherData.humidity}%` : '62%', icon: null, color: 'text-slate-800' },
            { label: 'Wind Speed', value: weatherData?.windSpeed ? `${weatherData.windSpeed} km/h` : '12 km/h', icon: null, color: 'text-slate-800' }
          ].map((item, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">{item.label}</span>
              <span className={`text-sm font-black ${item.color} flex items-center gap-1`}>
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. QUICK ACTIONS GRID ───────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white/95 border border-slate-200/90 shadow-sm backdrop-blur-md text-slate-900 space-y-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> {t('dashboard.quickActions', 'Quick Actions')}
          </h3>
          <p className="text-xs text-slate-500 font-semibold m-0 mt-0.5">Instant one-tap emergency, safety navigation and travel booking tools</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                to={action.path}
                className={`p-3.5 rounded-2xl bg-gradient-to-br ${action.color} text-white shadow-sm hover:shadow-md hover:scale-105 transition-all text-center flex flex-col items-center justify-center gap-2 no-underline border border-white/20`}
              >
                <Icon className="w-5 h-5 stroke-[2.5]" />
                <span className="text-[11px] font-black leading-tight text-white">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── 4. EXPLORE DESTINATIONS — Featured + By State ─────────────────── */}
      <div className="p-6 rounded-3xl bg-white/95 border border-slate-200/90 shadow-sm backdrop-blur-md text-slate-900 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight m-0 flex items-center gap-2">
              <Compass className="w-6 h-6 text-blue-600" />
              {t('dashboard.exploreTitle', 'Explore Destinations')}
            </h3>
            <p className="text-xs text-slate-500 font-semibold m-0 mt-0.5">Verified destinations with live safety ratings and GPS telemetry</p>
          </div>
          <Link to="/safety-map" className="px-4 py-2 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white text-xs font-black shadow-sm flex items-center gap-1.5 no-underline transition-all">
            View Live Map <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1.5 p-1 rounded-2xl border border-slate-200 bg-slate-100/90 w-fit">
          <button
            onClick={() => setExploreTab('featured')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              exploreTab === 'featured'
                ? 'bg-[#0D47A1] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⭐ Featured Destinations
          </button>
          <button
            onClick={() => setExploreTab('states')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              exploreTab === 'states'
                ? 'bg-[#0D47A1] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flag className="w-3.5 h-3.5" /> Explore by Indian State
          </button>
        </div>

        {exploreTab === 'featured' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exploreDestinations.slice(0, 6).map((dest) => (
              <FeaturedDestinationCard
                key={dest.id}
                dest={dest}
                darkMode={darkMode}
                isSaved={savedIds.includes(dest.id)}
                onSave={() => toggleSavePlace(dest)}
                onDirections={() => handleGetDirections(dest)}
              />
            ))}
          </div>
        ) : (
          <StateExplorer
            darkMode={darkMode}
            currentGpsLocation={currentGpsLocation}
          />
        )}
      </div>

      {/* ── 5. THINGS TO DO — ACTIVITY CATEGORIES ──────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white/95 border border-slate-200/90 shadow-sm backdrop-blur-md text-slate-900 space-y-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight m-0">
            {t('dashboard.thingsToDo', 'Things to Do & Experience')}
          </h3>
          <p className="text-xs text-slate-500 font-semibold m-0 mt-0.5">
            {t('dashboard.thingsToDoSub', 'Curated activities by category with live safety ratings')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {activityCategories.map((act, idx) => {
            const count = categoryCounts[act.countKey] !== undefined ? categoryCounts[act.countKey] : 0;
            return (
              <button
                key={idx}
                className={`p-4 rounded-2xl border ${act.color} hover:scale-105 transition-all cursor-pointer flex items-center gap-3 text-left w-full shadow-xs`}
                onClick={() => handleOpenCategory(act.type)}
              >
                <span className="text-2xl">{act.icon}</span>
                <div>
                  <h4 className="text-xs font-black m-0 text-slate-900">{act.name}</h4>
                  <span className="text-[10px] text-slate-600 block font-bold mt-0.5">
                    {count > 0 ? `${count} ${act.unit}` : `Browse ${act.unit}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 6. CATEGORY MODAL ──────────────────────────────────────────────── */}
      {categoryModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-4xl max-h-[88vh] rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col bg-white text-slate-900">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-black m-0 flex items-center gap-2 text-slate-900">
                  <Compass className="w-5 h-5 text-blue-600" />
                  {categoryModal.categoryName} Destinations
                </h3>
                <p className="text-xs m-0 text-slate-500 font-semibold">
                  {categoryModal.loading
                    ? 'Loading...'
                    : `Showing 1–${Math.min(categoryPageSize, categoryModal.items.length)} of ${categoryModal.items.length} verified destinations`}
                </p>
              </div>
              <button
                onClick={() => setCategoryModal({ isOpen: false, categoryName: '', items: [], loading: false })}
                className="p-2 rounded-full cursor-pointer bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 overflow-y-auto flex-1">
              {categoryModal.loading ? (
                <div className="flex items-center justify-center py-12 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm font-bold text-slate-400">Loading destinations...</span>
                </div>
              ) : categoryModal.items.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 text-amber-500 opacity-60" />
                  <h4 className="text-sm font-black m-0 text-slate-700">
                    No destinations in this category yet.
                  </h4>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryModal.items.slice(0, categoryPageSize).map((item) => (
                      <CategoryModalCard
                        key={item.id}
                        item={item}
                        darkMode={false}
                        isSaved={savedIds.includes(item.id)}
                        onSave={() => toggleSavePlace(item)}
                        onDirections={() => { setCategoryModal(p => ({ ...p, isOpen: false })); handleGetDirections(item); }}
                        onView={() => { setCategoryModal(p => ({ ...p, isOpen: false })); navigate(`/places/${item.id}`); }}
                      />
                    ))}
                  </div>

                  {categoryModal.items.length > categoryPageSize && (
                    <div className="flex justify-center pt-2 pb-4">
                      <button
                        onClick={() => setCategoryPageSize(prev => prev + 6)}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md hover:scale-102 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Load More
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 7. SAFETY AROUND YOU MAP ────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white/95 border border-slate-200/90 shadow-sm backdrop-blur-md text-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" /> {t('dashboard.safetyAroundYou', 'Safety Around You')}
            </h3>
            <p className="text-xs text-slate-500 font-semibold m-0 mt-0.5">
              {t('dashboard.safetyAroundYouSub', 'Interactive crime-risk heatmap and safe zone radar')}
            </p>
          </div>
          <Link to="/safety-map" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center gap-1 no-underline transition-all">
            Full Interactive Map <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
          <TouristMap location={currentGpsLocation} dangerZones={dangerZones} darkMode={false} />
        </div>
      </div>

      {/* ── 8. NEARBY SAFETY & TOURIST SERVICES ─────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight m-0">
              {t('dashboard.nearbyTitleSec', 'Nearby Safety & Tourist Services')}
            </h3>
            <p className="text-xs text-slate-500 font-semibold m-0 mt-0.5">
              {t('dashboard.liveGpsDesc', 'Calculated live from your current GPS coordinates')}
            </p>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
            {['all', 'police', 'hospital', 'restaurant', 'hotel', 'pharmacy', 'fuel'].map((cat) => (
              <button
                key={cat}
                onClick={() => setNearbyCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black capitalize transition-all cursor-pointer ${
                  nearbyCategory === cat
                    ? 'bg-[#0D47A1] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {nearbyLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-semibold">Fetching nearby services for your GPS location...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyPlaces.slice(0, 6).map((place) => (
              <div
                key={place.id}
                className={`p-4 rounded-3xl border shadow-xs space-y-3 ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {place.category}
                    </span>
                    <h4 className={`text-sm font-extrabold m-0 mt-1.5 leading-snug ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {place.name}
                    </h4>
                  </div>
                  <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md whitespace-nowrap">
                    ⭐ {place.rating || 4.8}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-medium m-0 flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{place.address}</span>
                </p>

                <div className="pt-2 border-t border-slate-200/20 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    📍 {place.formattedDistance || `${place.distanceKm} km`}
                  </span>
                  <a
                    href={`tel:${place.phone || '112'}`}
                    className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs no-underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sub-components & Fallback Image Helper ───────────────────────────────────

const FeaturedDestinationCard = ({ dest, darkMode, isSaved, onSave, onDirections }) => {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(() => getPlaceImage(dest));

  useEffect(() => {
    setImgSrc(getPlaceImage(dest));
  }, [dest]);

  return (
    <div className={`rounded-3xl border overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between ${
      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div>
        <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={imgSrc}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            alt={dest.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgSrc(getPlaceImage(dest))}
            loading="lazy"
          />
          <button
            onClick={onSave}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
              isSaved ? 'bg-rose-600 text-white' : 'bg-slate-900/60 text-white hover:bg-slate-900'
            }`}
            aria-label={isSaved ? 'Remove from saved' : 'Save destination'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
          </button>
          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-[10px] font-black backdrop-blur-md flex items-center gap-1">
            <Shield className="w-3 h-3" /> {dest.safetyScore ? `Safety: ${dest.safetyScore}/100` : 'RakshaSetu Verified'}
          </div>
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h4 className={`text-base font-black m-0 leading-tight truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {dest.name}
              </h4>
              <p className="text-xs text-slate-400 font-medium m-0 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-red-500" /> {dest.city}, {dest.state}{dest.country && dest.country !== 'India' ? `, ${dest.country}` : ''}
              </p>
            </div>
            {dest.rating && (
              <span className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-md shrink-0">
                <Star className="w-3 h-3 fill-amber-500" /> {dest.rating}
              </span>
            )}
          </div>
          <p className={`text-xs line-clamp-2 leading-relaxed m-0 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {dest.description}
          </p>
        </div>
      </div>

      <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-200/20 mt-2">
        <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
          {dest.distanceKm ? `${dest.distanceKm} km away` : dest.category}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onDirections}
            className="p-2 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
            title="Get directions"
          >
            <Navigation className="w-4 h-4" />
          </button>
          <Link
            to={`/places/${dest.id}`}
            className="px-4 py-2 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs shadow-sm no-underline"
          >
            Explore
          </Link>
        </div>
      </div>
    </div>
  );
};

const CategoryModalCard = ({ item, darkMode, isSaved, onSave, onDirections, onView }) => {
  const [imgSrc, setImgSrc] = useState(() => getPlaceImage(item));

  useEffect(() => {
    setImgSrc(getPlaceImage(item));
  }, [item]);

  return (
    <div className={`p-4 rounded-3xl border shadow-xs hover:shadow-lg transition-all space-y-3 flex flex-col justify-between ${
      darkMode ? 'bg-slate-800/60 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
    }`}>
      <div className="space-y-2">
        <div className="h-36 rounded-2xl overflow-hidden relative bg-slate-100 dark:bg-slate-700">
          <img
            src={imgSrc}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImgSrc(getPlaceImage(item))}
            loading="lazy"
          />
          {item.safetyScore && (
            <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
              Safety: {item.safetyScore}/100
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-black m-0 truncate">{item.name}</h4>
            <p className="text-xs text-slate-400 m-0 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-red-500" />
              <span className="truncate">{item.city}, {item.state}</span>
            </p>
          </div>
          {item.rating && (
            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md shrink-0">
              ⭐ {item.rating}
            </span>
          )}
        </div>

        <p className={`text-xs line-clamp-2 m-0 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {item.description}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-200/20 flex items-center justify-between">
        <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
          {item.distanceKm ? `${item.distanceKm} km away` : item.category}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onDirections}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1"
          >
            <Navigation className="w-3 h-3" /> Directions
          </button>
          <button
            onClick={onView}
            className="px-3 py-1.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs shadow-xs cursor-pointer hover:bg-blue-900"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};

// Compact search result row
const SearchResultRow = ({ place, darkMode, onSelect, onDirections, onSave, isSaved }) => {
  const [imgSrc, setImgSrc] = useState(() => getPlaceImage(place));

  useEffect(() => {
    setImgSrc(getPlaceImage(place));
  }, [place]);

  return (
    <div
      className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1" onClick={onSelect}>
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
          <img
            src={imgSrc}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            alt={place.name}
            className="w-full h-full object-cover"
            onError={() => setImgSrc(getPlaceImage(place))}
          />
        </div>

        <div className="min-w-0">
          <h4 className="text-sm font-black m-0 text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
            {place.name}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium m-0 truncate">
            {place.address || `${place.city}${place.state ? ', ' + place.state : ''}${place.country ? ', ' + place.country : ''}`}
          </p>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
            {place.category || 'Attraction'}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
        {place.safetyScore && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
            Safety: {place.safetyScore}/100
          </span>
        )}
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            className={`p-1 rounded-lg cursor-pointer ${isSaved ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}
            title={isSaved ? 'Remove from saved' : 'Save'}
          >
            <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500' : ''}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDirections(); }}
            className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 cursor-pointer"
            title="Get directions"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        </div>
        {place.distanceKm && (
          <span className="text-[10px] font-bold text-slate-400">{place.distanceKm} km</span>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
