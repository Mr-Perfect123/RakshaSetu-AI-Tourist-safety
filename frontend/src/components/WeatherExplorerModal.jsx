import React, { useState, useEffect, useRef } from 'react';
import {
  Search, X, Globe, MapPin, Wind, Droplets, CloudRain, Sun,
  Navigation, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck,
  Compass, ArrowRight, Loader2
} from 'lucide-react';
import api from '../services/api';

const POPULAR_SEARCH_PRESETS = [
  { name: 'Munnar', query: 'Munnar, Kerala', country: 'India' },
  { name: 'Ooty', query: 'Ooty, Tamil Nadu', country: 'India' },
  { name: 'Kuttalam', query: 'Courtallam, Tamil Nadu', country: 'India' },
  { name: 'Kerala', query: 'Kerala, India', country: 'India', isRep: true },
  { name: 'Tamil Nadu', query: 'Tamil Nadu, India', country: 'India', isRep: true },
  { name: 'Paris', query: 'Paris, France', country: 'France' },
  { name: 'Tokyo', query: 'Tokyo, Japan', country: 'Japan' },
  { name: 'Dubai', query: 'Dubai, UAE', country: 'UAE' },
  { name: 'California', query: 'California, United States', country: 'USA', isRep: true },
  { name: 'London', query: 'London, United Kingdom', country: 'UK' }
];

const WeatherExplorerModal = ({
  isOpen,
  onClose,
  onSelectWeather,
  userLocation,
  darkMode = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [weatherDetails, setWeatherDetails] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  const debounceTimerRef = useRef(null);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/weather/search?query=${encodeURIComponent(searchQuery.trim())}`);
        const list = res.data?.data || res.data || [];
        setSuggestions(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('Weather search error', err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery]);

  // Load weather when a location is selected
  const handleSelectLocation = async (loc) => {
    setSelectedLocation(loc);
    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const res = await api.get(
        `/weather/current?lat=${loc.latitude}&lng=${loc.longitude}&name=${encodeURIComponent(loc.name || loc.fullName || '')}&country=${encodeURIComponent(loc.country || '')}&state=${encodeURIComponent(loc.state || '')}&representative=${loc.isRepresentative ? 'true' : 'false'}`
      );
      const wData = res.data?.data || res.data;
      setWeatherDetails(wData);
      if (onSelectWeather) {
        onSelectWeather(wData);
      }
    } catch (err) {
      setWeatherError(err.response?.data?.message || err.message || 'Could not fetch weather for selected location.');
    } finally {
      setWeatherLoading(false);
    }
  };

  // Use GPS location
  const handleUseGpsLocation = () => {
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            handleSelectLocation({
              name: 'My GPS Location',
              fullName: 'Current GPS Coordinates',
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              isRepresentative: false
            });
          },
          (err) => {
            setWeatherError('Could not access current GPS location. Please use location search.');
          }
        );
      } else {
        setWeatherError('Geolocation is not supported in this browser.');
      }
      return;
    }

    handleSelectLocation({
      name: 'My GPS Location',
      fullName: 'Current GPS Coordinates',
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      isRepresentative: false
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-[#0D47A1] dark:text-blue-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black m-0">Worldwide Weather Explorer</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium m-0">
                Check real-time conditions for any destination, city, state, or country worldwide
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Search Input Box */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any place worldwide (e.g. Paris, Tokyo, Ooty, Munnar, Kerala, California)..."
              className={`w-full pl-11 pr-10 py-3 rounded-2xl border text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0D47A1] ${
                darkMode
                  ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            {isSearching ? (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Location Permission "My Location" Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleUseGpsLocation}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                darkMode
                  ? 'bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-900'
                  : 'bg-blue-50 hover:bg-blue-100 text-[#0D47A1] border border-blue-200'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-blue-500" />
              <span>Weather at my current GPS location</span>
            </button>
          </div>

          {/* Autocomplete Suggestions List */}
          {suggestions.length > 0 && (
            <div className={`rounded-2xl border shadow-sm overflow-hidden divide-y ${
              darkMode ? 'bg-slate-800/90 border-slate-700 divide-slate-700/60' : 'bg-white border-slate-200 divide-slate-100'
            }`}>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Matching Worldwide Locations ({suggestions.length})
              </div>
              {suggestions.map((loc) => (
                <button
                  key={loc.id || `${loc.latitude}-${loc.longitude}`}
                  onClick={() => {
                    handleSelectLocation(loc);
                    setSuggestions([]);
                  }}
                  className={`w-full p-3 text-left flex items-center justify-between transition-all cursor-pointer ${
                    darkMode ? 'hover:bg-slate-700/60 text-slate-200' : 'hover:bg-blue-50 text-slate-800'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs">{loc.name}</span>
                      {loc.isRepresentative && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-[9px] font-bold">
                          {loc.representativeType || 'Regional Reference'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 truncate max-w-md">
                      {loc.fullName || `${loc.state ? loc.state + ', ' : ''}${loc.country}`}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {/* Quick Presets Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Popular Worldwide Hubs & States
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SEARCH_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setSearchQuery(preset.query);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    darkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{preset.name}</span>
                  {preset.isRep && (
                    <span className="text-[9px] px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      Region
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Weather Details Result Section */}
          {weatherLoading && (
            <div className="p-8 text-center space-y-2">
              <Loader2 className="w-8 h-8 text-[#0D47A1] dark:text-blue-400 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Retrieving real-time weather conditions...</p>
            </div>
          )}

          {weatherError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{weatherError}</span>
            </div>
          )}

          {weatherDetails && !weatherLoading && (
            <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
              darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-blue-50/60 border-blue-100'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{weatherDetails.icon || '🌤️'}</span>
                    <div>
                      <h3 className="text-sm sm:text-base font-black m-0">{weatherDetails.locationName}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                        {weatherDetails.state ? `${weatherDetails.state}, ` : ''}{weatherDetails.country || ''}
                      </p>
                    </div>
                  </div>
                  {weatherDetails.isRepresentative && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium m-0 mt-1 flex items-center gap-1">
                      <span>ℹ️</span> Displaying representative regional weather for this territory.
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-3xl font-black text-[#0D47A1] dark:text-blue-400">
                    {weatherDetails.temperature !== null ? `${weatherDetails.temperature}°C` : 'N/A'}
                  </span>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 m-0">
                    {weatherDetails.weatherCondition}
                  </p>
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Feels Like</span>
                  <span className="text-xs font-black">{weatherDetails.feelsLike !== null ? `${weatherDetails.feelsLike}°C` : 'N/A'}</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Humidity</span>
                  <span className="text-xs font-black">{weatherDetails.humidity !== null ? `${weatherDetails.humidity}%` : 'N/A'}</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Wind Speed</span>
                  <span className="text-xs font-black">{weatherDetails.windSpeed !== null ? `${weatherDetails.windSpeed} km/h` : 'N/A'}</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Precipitation</span>
                  <span className="text-xs font-black">{weatherDetails.precipitation !== null ? `${weatherDetails.precipitation} mm` : '0 mm'}</span>
                </div>
              </div>

              {/* Weather Warnings if any */}
              {weatherDetails.warnings && weatherDetails.warnings.length > 0 && (
                <div className="space-y-1.5">
                  {weatherDetails.warnings.map((w, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold block">{w.title}</span>
                        <span className="text-[11px] font-medium opacity-90">{w.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <span>Real-time worldwide observations powered by Open-Meteo Engine</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-800 transition-all cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeatherExplorerModal;
