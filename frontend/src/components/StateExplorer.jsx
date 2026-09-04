import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Heart, Star, Shield, ChevronRight, X, Loader2, AlertCircle, Globe, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getPlaceImage } from '../utils/placeImageHelper';

// State emoji flags & representative images for quick recognition
const STATE_META = {
  'Tamil Nadu': { emoji: '🏛️', color: 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400' },
  'Kerala': { emoji: '🌴', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  'Goa': { emoji: '🏖️', color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-400' },
  'Rajasthan': { emoji: '🏰', color: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400' },
  'Maharashtra': { emoji: '🌆', color: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400' },
  'Uttar Pradesh': { emoji: '🕌', color: 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400' },
  'Delhi': { emoji: '🏛️', color: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400' },
  'West Bengal': { emoji: '🎭', color: 'bg-pink-500/10 border-pink-500/20 text-pink-700 dark:text-pink-400' },
  'Himachal Pradesh': { emoji: '🏔️', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400' },
  'Uttarakhand': { emoji: '⛰️', color: 'bg-teal-500/10 border-teal-500/20 text-teal-700 dark:text-teal-400' },
  'Karnataka': { emoji: '🏯', color: 'bg-lime-500/10 border-lime-500/20 text-lime-700 dark:text-lime-400' },
  'Gujarat': { emoji: '🦁', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400' },
  'Punjab': { emoji: '🕌', color: 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400' },
  'Jammu & Kashmir': { emoji: '🏔️', color: 'bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-400' },
  'Assam': { emoji: '🦏', color: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' },
  'Odisha': { emoji: '🛕', color: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400' },
  'Madhya Pradesh': { emoji: '🐅', color: 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400' },
  'Andhra Pradesh': { emoji: '🛕', color: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400' },
  'Telangana': { emoji: '🏛️', color: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400' },
};

const getStateMeta = (stateName) =>
  STATE_META[stateName] || { emoji: '📍', color: 'bg-slate-500/10 border-slate-500/20 text-slate-700 dark:text-slate-400' };

const DestinationCard = ({ dest, darkMode, savedIds, onToggleSave, onDirections }) => {
  const navigate = useNavigate();
  const isSaved = savedIds.includes(dest.id);
  const [imgSrc, setImgSrc] = useState(() => getPlaceImage(dest));

  useEffect(() => {
    setImgSrc(getPlaceImage(dest));
  }, [dest]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white text-slate-900 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-slate-100">
        <img
          src={imgSrc}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          alt={dest.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgSrc(getPlaceImage(dest))}
          loading="lazy"
        />

        {/* Safety badge */}
        {dest.safetyScore && (
          <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black backdrop-blur-md flex items-center gap-1 shadow-sm">
            <Shield className="w-3 h-3" /> Safety: {dest.safetyScore}/100
          </div>
        )}

        {/* Save button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(dest); }}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
            isSaved ? 'bg-rose-600 text-white' : 'bg-slate-900/60 text-white hover:bg-slate-900'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-black m-0 leading-tight truncate text-slate-900">{dest.name}</h4>
            <p className="text-xs text-slate-500 font-semibold m-0 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-red-500 shrink-0" />
              <span className="truncate">{dest.city}, {dest.state}</span>
            </p>
          </div>
          {dest.rating && (
            <span className="flex items-center gap-0.5 text-amber-700 text-xs font-black bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0 border border-amber-200">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {dest.rating}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed m-0">
          {dest.description}
        </p>

        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {dest.category}
        </span>
      </div>

      {/* Actions */}
      <div className="px-3.5 pb-3.5 flex items-center gap-2 border-t border-slate-100 pt-2.5">
        <button
          onClick={() => navigate(`/places/${dest.id}`)}
          className="flex-1 py-2 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-black text-xs text-center transition-all cursor-pointer shadow-xs"
        >
          Explore Place
        </button>
        <button
          onClick={() => onDirections(dest)}
          className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 font-black text-xs flex items-center gap-1 cursor-pointer transition-all shadow-xs"
          title={`Directions to ${dest.name}`}
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const StateExplorer = ({ darkMode, currentGpsLocation }) => {
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [selectedState, setSelectedState] = useState(null);
  const [stateDestinations, setStateDestinations] = useState([]);
  const [stateLoading, setStateLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(6);
  const [savedIds, setSavedIds] = useState(() => {
    const saved = localStorage.getItem('rakshasetu_saved_places');
    return saved ? JSON.parse(saved).map(p => p.id) : [];
  });

  // Load states list
  useEffect(() => {
    const load = async () => {
      setStatesLoading(true);
      try {
        const res = await api.get('/places/states');
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list)) setStates(list);
      } catch (_) {
        // Fallback list if backend unavailable
        setStates([]);
      } finally {
        setStatesLoading(false);
      }
    };
    load();
  }, []);

  // Load destinations for selected state
  const handleSelectState = useCallback(async (stateName) => {
    if (selectedState === stateName) {
      setSelectedState(null);
      setStateDestinations([]);
      return;
    }
    setSelectedState(stateName);
    setStateLoading(true);
    setDisplayCount(6);
    try {
      const latParam = currentGpsLocation?.lat ? `&lat=${currentGpsLocation.lat}&lng=${currentGpsLocation.lng}` : '';
      const res = await api.get(`/places/by-state?state=${encodeURIComponent(stateName)}${latParam}`);
      const list = res.data?.data || res.data || [];
      setStateDestinations(Array.isArray(list) ? list : []);
    } catch (_) {
      setStateDestinations([]);
    } finally {
      setStateLoading(false);
    }
  }, [selectedState, currentGpsLocation]);

  const toggleSave = useCallback((dest) => {
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

  if (statesLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm font-semibold">Loading Indian states...</span>
      </div>
    );
  }

  if (states.length === 0) {
    return (
      <div className="py-6 text-center text-slate-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
        <p className="text-sm font-semibold">State data unavailable. Try again later.</p>
      </div>
    );
  }

  const visibleDestinations = stateDestinations.slice(0, displayCount);
  const hasMore = stateDestinations.length > displayCount;

  return (
    <div className="space-y-4">
      {/* State Pills Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {states.map(({ state, count, topDestination }) => {
          const meta = getStateMeta(state);
          const isSelected = selectedState === state;
          return (
            <button
              key={state}
              onClick={() => handleSelectState(state)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer hover:scale-105 ${
                isSelected
                  ? 'bg-[#0D47A1] border-blue-600 text-white shadow-lg scale-105'
                  : darkMode
                    ? 'bg-slate-800/60 border-slate-700 hover:border-blue-500/50 text-white'
                    : `${meta.color} hover:shadow-md`
              }`}
            >
              <span className="text-xl block mb-1">{meta.emoji}</span>
              <span className={`text-xs font-extrabold block leading-tight ${isSelected ? 'text-white' : ''}`}>
                {state}
              </span>
              <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-blue-200' : 'opacity-70'}`}>
                {count} {count === 1 ? 'destination' : 'destinations'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected State Destinations Panel */}
      {selectedState && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-base font-black m-0 flex items-center gap-2 text-slate-900">
                <Flag className="w-4 h-4 text-blue-600" />
                {getStateMeta(selectedState).emoji} {selectedState}
              </h4>
              <p className="text-xs m-0 mt-0.5 text-slate-500 font-semibold">
                {stateLoading ? 'Loading...' : `Showing ${visibleDestinations.length} of ${stateDestinations.length} destinations`}
              </p>
            </div>
            <button
              onClick={() => { setSelectedState(null); setStateDestinations([]); }}
              className="p-1.5 rounded-full cursor-pointer bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {stateLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm font-semibold">Fetching destinations...</span>
            </div>
          ) : stateDestinations.length === 0 ? (
            <div className="py-8 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-500 opacity-70" />
              <p className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                No destinations found for {selectedState}.
              </p>
            </div>
          ) : (
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

              {/* Load More */}
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
          )}
        </div>
      )}
    </div>
  );
};

export default StateExplorer;
