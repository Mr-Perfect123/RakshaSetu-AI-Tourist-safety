import React, { useState } from 'react';
import {
  Sun, CloudRain, Wind, Droplets, RefreshCw, AlertTriangle,
  Compass, MapPin, Globe, Sparkles, Thermometer, Info, ChevronRight
} from 'lucide-react';

const WeatherCard = ({
  weather,
  loading = false,
  onRefresh,
  onOpenExplorer,
  darkMode = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing || loading || !onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  if (!weather && loading) {
    return (
      <div className={`p-6 rounded-3xl border shadow-sm transition-all animate-pulse ${
        darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200/80'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl mb-3"></div>
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className={`p-6 rounded-3xl border shadow-sm transition-all ${
        darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white/90 border-slate-200/80 text-slate-600'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌤️</span>
            <h3 className={`text-sm font-extrabold m-0 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Live Weather</h3>
          </div>
          {onOpenExplorer && (
            <button
              onClick={onOpenExplorer}
              className="text-xs font-bold text-[#0D47A1] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" /> Search
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-3">Weather information not loaded.</p>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0D47A1] dark:text-blue-300 text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Load Weather
          </button>
        )}
      </div>
    );
  }

  const {
    locationName = 'Current Location',
    temperature,
    feelsLike,
    humidity,
    windSpeed,
    precipitation,
    precipitationProbability,
    weatherCondition = 'Clear',
    icon = '🌤️',
    warnings = [],
    observedAt,
    isRepresentative = false
  } = weather;

  // Format observation time
  let updateTimeStr = 'Just now';
  if (observedAt) {
    try {
      const dt = new Date(observedAt);
      updateTimeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {}
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 ${
      darkMode
        ? 'bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-blue-950/40 border-slate-800/90 text-white'
        : 'bg-gradient-to-br from-white via-white to-blue-50/50 border-slate-200/80 text-slate-900'
    }`}>
      {/* Decorative subtle ambient circle */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="p-5 md:p-6 space-y-4">
        {/* Header: Title + Worldwide Explorer Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl select-none" role="img" aria-label="weather-icon">{icon}</span>
            <div>
              <h3 className={`text-xs font-extrabold uppercase tracking-wider m-0 ${
                darkMode ? 'text-blue-300' : 'text-[#0D47A1]'
              }`}>
                Real-Time Weather
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                <span className="truncate max-w-[180px] sm:max-w-[240px]">{locationName}</span>
                {isRepresentative && (
                  <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-[9px] font-bold shrink-0">
                    Regional Reference
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenExplorer && (
              <button
                onClick={onOpenExplorer}
                title="Search any city or country worldwide"
                className={`p-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  darkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700'
                    : 'bg-blue-50 hover:bg-blue-100 text-[#0D47A1] border border-blue-100'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Worldwide</span>
              </button>
            )}

            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                title="Refresh real-time weather"
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  darkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || loading ? 'animate-spin text-blue-500' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Weather Main Metrics */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight">
                {temperature !== null ? `${temperature}°C` : 'N/A'}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}>
                {weatherCondition}
              </span>
            </div>
            {feelsLike !== null && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium m-0 mt-0.5">
                Feels like <strong className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{feelsLike}°C</strong>
              </p>
            )}
          </div>

          <div className="text-right text-[11px] text-slate-400 font-medium">
            <span>Updated {updateTimeStr}</span>
          </div>
        </div>

        {/* Detailed Grid Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className={`p-2.5 rounded-2xl flex flex-col items-center justify-center text-center ${
            darkMode ? 'bg-slate-800/60' : 'bg-slate-50/80'
          }`}>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
              <Droplets className="w-3 h-3 text-cyan-500" /> Humidity
            </div>
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              {humidity !== null ? `${humidity}%` : 'Not available'}
            </span>
          </div>

          <div className={`p-2.5 rounded-2xl flex flex-col items-center justify-center text-center ${
            darkMode ? 'bg-slate-800/60' : 'bg-slate-50/80'
          }`}>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
              <Wind className="w-3 h-3 text-blue-500" /> Wind
            </div>
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              {windSpeed !== null ? `${windSpeed} km/h` : 'Not available'}
            </span>
          </div>

          <div className={`p-2.5 rounded-2xl flex flex-col items-center justify-center text-center ${
            darkMode ? 'bg-slate-800/60' : 'bg-slate-50/80'
          }`}>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
              <CloudRain className="w-3 h-3 text-indigo-500" /> Rain
            </div>
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              {precipitationProbability !== null ? `${precipitationProbability}%` : precipitation ? `${precipitation} mm` : '0%'}
            </span>
          </div>
        </div>

        {/* Rule-Based Weather Warnings Banner (Transparently labeled) */}
        {warnings && warnings.length > 0 && (
          <div className="space-y-2 pt-1">
            {warnings.map((w, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs font-semibold ${
                  w.severity === 'critical'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  w.severity === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                }`} />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold">{w.title}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {w.source || 'Weather-based warning'}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium opacity-90 m-0">{w.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherCard;
