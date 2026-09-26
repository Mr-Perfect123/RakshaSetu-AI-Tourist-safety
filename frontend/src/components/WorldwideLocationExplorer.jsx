import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe, Search, MapPin, Wind, Droplets, CloudRain, Sun,
  Navigation, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck,
  Compass, ArrowRight, Loader2, ShieldAlert, Info, X, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { WORLDWIDE_CONTINENTS } from '../utils/worldwideRegionsData';

const WorldwideLocationExplorer = ({ darkMode = false, currentGpsLocation = null }) => {
  const navigate = useNavigate();
  const [selectedContinent, setSelectedContinent] = useState(WORLDWIDE_CONTINENTS[0]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef(null);

  // Weather state
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  // Active Safety Alerts state
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Debounced search across worldwide locations
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/weather/search?query=${encodeURIComponent(searchQuery.trim())}`);
        const list = res.data?.data || res.data || [];
        setSearchResults(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('Worldwide location search error', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery]);

  // Load weather and active alerts for selected target
  const handleSelectLocation = useCallback(async (loc) => {
    setSelectedLocation(loc);
    setWeatherLoading(true);
    setWeatherError(null);
    setAlertsLoading(true);

    // 1. Fetch Real-time Live Weather from Open-Meteo
    try {
      const isRep = loc.isRepresentative || false;
      const res = await api.get(
        `/weather/current?lat=${loc.latitude || loc.lat}&lng=${loc.longitude || loc.lng}&name=${encodeURIComponent(loc.name || loc.fullName || '')}&country=${encodeURIComponent(loc.country || '')}&state=${encodeURIComponent(loc.state || '')}&representative=${isRep ? 'true' : 'false'}`
      );
      setWeatherData(res.data?.data || res.data);
    } catch (err) {
      setWeatherError('Current weather observation temporarily unavailable.');
    } finally {
      setWeatherLoading(false);
    }

    // 2. Fetch Active Safety Alerts
    try {
      const alertsRes = await api.get('/temporary-alerts/active');
      const allActive = alertsRes.data?.data || alertsRes.data || [];
      const qName = (loc.name || '').toLowerCase();
      const qState = (loc.state || '').toLowerCase();
      const qCountry = (loc.country || '').toLowerCase();

      const matching = allActive.filter(a => {
        const aLoc = (a.locationName || '').toLowerCase();
        const aState = (a.stateRegion || '').toLowerCase();
        const aCountry = (a.country || '').toLowerCase();
        return (
          (qName && (aLoc.includes(qName) || qName.includes(aLoc))) ||
          (qState && (aState.includes(qState) || aLoc.includes(qState))) ||
          (qCountry && aCountry.includes(qCountry))
        );
      });
      setActiveAlerts(matching);
    } catch (_) {
      setActiveAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const handleCountryClick = (country) => {
    setSelectedCountry(country);
    handleSelectLocation({
      name: country.capital ? `${country.capital}, ${country.name}` : country.name,
      fullName: `${country.name} (Representative)`,
      country: country.name,
      state: country.capital || '',
      latitude: country.coordinates.lat,
      longitude: country.coordinates.lng,
      isRepresentative: true,
      representativeType: 'Country Reference Point'
    });
  };

  const handleCityClick = (city, countryName) => {
    handleSelectLocation({
      name: city.name,
      fullName: `${city.name}, ${city.state || ''}, ${countryName}`,
      country: countryName,
      state: city.state || '',
      latitude: city.lat,
      longitude: city.lng,
      isRepresentative: false,
      representativeType: 'Exact Location'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-3xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border-slate-800'} shadow-lg text-white`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black tracking-wider uppercase">
                🌍 Worldwide Location Explorer
              </span>
              <span className="text-xs text-slate-300">Continent → Country → Region → City</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black m-0 tracking-tight">
              Explore Global Destinations, Weather & Safety Alerts
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real coordinates, live Open-Meteo worldwide weather, and real-time temporary tourist safety alerts across all continents.
            </p>
          </div>

          {/* Search Any Location Worldwide */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any country, city, or destination..."
              className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 text-white placeholder:text-slate-400 text-xs font-semibold backdrop-blur-md outline-none transition-all"
            />
            {isSearching && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 absolute right-3 top-1/2 -translate-y-1/2" />
            )}
            {searchQuery && !isSearching && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl p-2 space-y-1 backdrop-blur-md max-h-72 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSearchResults([]);
                      setSearchQuery('');
                      handleSelectLocation(item);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-blue-600/30 text-left flex items-start justify-between gap-2 transition-all cursor-pointer"
                  >
                    <div>
                      <h5 className="text-xs font-black text-white m-0 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        {item.name}
                      </h5>
                      <p className="text-[10px] text-slate-300 m-0 mt-0.5">{item.fullName}</p>
                    </div>
                    {item.isRepresentative && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                        {item.representativeType || 'Regional'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Continents Tabs */}
        <div className="flex items-center gap-2 pt-5 overflow-x-auto scrollbar-none">
          {WORLDWIDE_CONTINENTS.map((cont) => {
            const isSelected = selectedContinent.id === cont.id;
            return (
              <button
                key={cont.id}
                onClick={() => {
                  setSelectedContinent(cont);
                  setSelectedCountry(null);
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-black tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg scale-102 ring-2 ring-blue-400'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/10'
                }`}
              >
                <span className="text-base">{cont.emoji}</span>
                <span>{cont.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Continent View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`text-base font-black m-0 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <span>{selectedContinent.emoji}</span>
              <span>Countries in {selectedContinent.name}</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium m-0 mt-0.5">
              {selectedContinent.description}
            </p>
          </div>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {selectedContinent.countries.map((country) => {
            const isSelected = selectedCountry?.code === country.code;
            return (
              <div
                key={country.code}
                className={`rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-md ring-1 ring-blue-500'
                    : darkMode
                      ? 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h5 className={`text-sm font-black m-0 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {country.name}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold m-0 mt-0.5">
                      Capital: {country.capital}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCountryClick(country)}
                    className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] cursor-pointer shadow-xs"
                  >
                    Weather
                  </button>
                </div>

                {/* Popular Cities & Destinations */}
                <div className="space-y-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Popular Destinations
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {country.popularCities.slice(0, 4).map((city, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCityClick(city, country.name)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                      >
                        <MapPin className="w-2.5 h-2.5 text-red-500" />
                        <span>{city.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Location Live Weather & Safety View */}
      {selectedLocation && (
        <div className={`rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-5 md:p-6 space-y-5 shadow-xl`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-lg font-black m-0 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {selectedLocation.name}
                  </h3>
                  {selectedLocation.isRepresentative ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-200 dark:border-amber-800">
                      Representative Regional Hub
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-200 dark:border-emerald-800">
                      Exact Location Coordinates
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold m-0 mt-0.5">
                  {selectedLocation.fullName || `${selectedLocation.name}, ${selectedLocation.country}`} • Coordinates: {Number(selectedLocation.latitude || selectedLocation.lat).toFixed(4)}°, {Number(selectedLocation.longitude || selectedLocation.lng).toFixed(4)}°
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/map?lat=${selectedLocation.latitude || selectedLocation.lat}&lng=${selectedLocation.longitude || selectedLocation.lng}&zoom=11`)}
                className="px-3.5 py-2 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5" /> Plan Route & Map
              </button>
              <button
                onClick={() => { setSelectedLocation(null); setWeatherData(null); setActiveAlerts([]); }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weather Section */}
          <div className={`p-4 md:p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border-blue-100'} space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌧️</span>
                <div>
                  <h4 className={`text-sm font-black m-0 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {selectedLocation.isRepresentative
                      ? `Representative regional weather for ${selectedLocation.name}`
                      : `Live Weather in ${selectedLocation.name}`}
                  </h4>
                  {selectedLocation.isRepresentative && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 m-0">
                      Regional representative observation. Individual microclimates may vary.
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleSelectLocation(selectedLocation)}
                disabled={weatherLoading}
                className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {weatherLoading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Fetching Open-Meteo live weather data...</span>
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
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black">{weatherData.feelsLike !== null ? `${weatherData.feelsLike}°C` : '--'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Thermal Index</span>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                  <span className="text-xs text-slate-500 font-bold block">Humidity</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black">{weatherData.humidity !== null ? `${weatherData.humidity}%` : '--'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Relative Humidity</span>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                  <span className="text-xs text-slate-500 font-bold block">Wind Speed</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black">{weatherData.windSpeed !== null ? `${weatherData.windSpeed} km/h` : '--'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{weatherData.windDirection ? `Dir: ${weatherData.windDirection}°` : 'Surface Wind'}</span>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white/80 border-slate-200'} col-span-2 sm:col-span-1`}>
                  <span className="text-xs text-slate-500 font-bold block">Precipitation</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black">{weatherData.precipitation !== null ? `${weatherData.precipitation} mm` : '0 mm'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Rain Intensity</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Active Safety Alerts for Worldwide Location */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-black m-0 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Active Safety Alerts for {selectedLocation.name}
              </h4>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                activeAlerts.length > 0
                  ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200'
                  : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
              }`}>
                {activeAlerts.length} Active {activeAlerts.length === 1 ? 'Alert' : 'Alerts'}
              </span>
            </div>

            {alertsLoading ? (
              <div className="py-4 flex items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Checking active safety alerts...</span>
              </div>
            ) : activeAlerts.length === 0 ? (
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-emerald-50/60 border-emerald-200'} flex items-center gap-3 text-xs`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className={darkMode ? 'text-slate-300' : 'text-emerald-800'}>
                  No active temporary safety alerts or emergency closures reported for {selectedLocation.name}.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {activeAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-2xl border border-rose-300 bg-rose-50/90 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase">
                          ⚠️ {alert.alertType}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200">
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
        </div>
      )}
    </div>
  );
};

export default WorldwideLocationExplorer;
