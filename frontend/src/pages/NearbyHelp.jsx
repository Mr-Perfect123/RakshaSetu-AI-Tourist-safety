import React, { useState, useEffect } from 'react';
import { Stethoscope, Building2, PhoneCall, MapPin, Search, Star, ExternalLink, RefreshCw, Hotel, Utensils, Shield, Compass, Navigation, AlertCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const NearbyHelp = ({ darkMode }) => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [currentGps, setCurrentGps] = useState({ lat: 11.0168, lng: 76.9558 });
  const [currentCityName, setCurrentCityName] = useState('Detecting GPS location...');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial GPS Location Fetch
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const coords = { lat, lng };
          setCurrentGps(coords);

          try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
              headers: { 'User-Agent': 'RakshaSetu/1.0' },
              timeout: 3000
            });
            if (res.data?.address) {
              const addr = res.data.address;
              const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Sector';
              const state = addr.state || '';
              setCurrentCityName(`${city}, ${state}`);
            }
          } catch {
            setCurrentCityName('Coimbatore, Tamil Nadu');
          }
        },
        () => setCurrentCityName('Location Active')
      );
    }
  }, []);

  // Fetch Nearby Places based on Live GPS & Category
  const fetchNearbyServices = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/places/nearby?lat=${currentGps.lat}&lng=${currentGps.lng}&category=${selectedCategory}&query=${encodeURIComponent(query)}`);
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) setPlaces(list);
    } catch (e) {
      console.warn('Nearby services fetch warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyServices();
  }, [currentGps, selectedCategory, query]);

  const categories = [
    { id: 'all', label: 'All Services', icon: Shield },
    { id: 'hospital', label: 'Hospitals', icon: Stethoscope },
    { id: 'police', label: 'Police', icon: Building2 },
    { id: 'pharmacy', label: 'Pharmacies', icon: Shield },
    { id: 'hotel', label: 'Hotels', icon: Hotel },
    { id: 'restaurant', label: 'Restaurants', icon: Utensils },
    { id: 'fuel', label: 'Fuel Stations', icon: Compass },
    { id: 'atm', label: 'ATMs', icon: Shield }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24 animate-fade-in">
      
      {/* Header Banner */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 m-0">
            <Building2 className="w-7 h-7 text-blue-600" />
            {t('dashboard.nearbyTitleSec', 'Nearby Safety & Tourist Services')}
          </h2>
          <p className={`text-xs font-medium m-0 mt-1 flex items-center gap-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            Live services near: <strong className="text-slate-700 dark:text-slate-200">{currentCityName}</strong>
          </p>
        </div>

        <button
          onClick={fetchNearbyServices}
          className={`px-4 py-2 rounded-2xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Nearby
        </button>
      </div>

      {/* Category Pills & Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nearby hospital, police station, hotel, restaurant..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl border text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#0D47A1] border-[#0D47A1] text-white shadow-md'
                    : darkMode
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-400 font-bold">Calculating verified nearby services for your GPS location...</p>
        </div>
      ) : places.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${
          darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-500" />
          <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-300">No services found in this category.</h3>
          <p className="text-xs max-w-sm mx-auto mt-1">Try selecting "All Services" or clearing your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {places.map((place) => (
            <div
              key={place.id}
              className={`p-5 rounded-3xl border shadow-xs hover:shadow-lg transition-all space-y-3 flex flex-col justify-between ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-wider">
                    {place.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-xs font-bold whitespace-nowrap">
                    ⭐ {place.rating || 4.8}
                  </span>
                </div>

                <h4 className="text-base font-extrabold m-0 leading-snug">{place.name}</h4>

                <p className="text-xs text-slate-400 font-medium m-0 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{place.address}</span>
                </p>

                <div className="flex items-center gap-3 text-xs pt-1">
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    📍 {place.formattedDistance || `${place.distanceKm} km away`}
                  </span>
                  <span className="text-slate-400 font-bold">•</span>
                  <span className="text-slate-500 dark:text-slate-300 font-bold">{place.openStatusText || 'Open 24/7'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200/20 grid grid-cols-2 gap-2">
                <a
                  href={`tel:${place.phone || '112'}`}
                  className="py-2 px-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs text-center decoration-none flex items-center justify-center gap-1"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </a>

                <Link
                  to="/safety-map"
                  className="py-2 px-3 rounded-2xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs text-center decoration-none flex items-center justify-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5" /> Map & Route
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyHelp;
