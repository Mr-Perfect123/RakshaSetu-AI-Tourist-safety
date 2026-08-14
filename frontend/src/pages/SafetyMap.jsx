import React, { useState, useEffect } from 'react';
import { MapPin, Shield, AlertOctagon, AlertTriangle, ArrowLeft, Search, RefreshCw, Info, Phone, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import TouristMap from '../components/TouristMap';
import api from '../services/api';

const SafetyMap = ({ darkMode }) => {
  const [destinationQuery, setDestinationQuery] = useState('Coimbatore');
  const [location, setLocation] = useState({ lat: 11.0168, lng: 76.9558 }); // Default Coimbatore sector
  const [dangerZones, setDangerZones] = useState([]);
  const [safeLocations, setSafeLocations] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [nearbyPlaces, setNearbyPlaces] = useState([]);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const zoneRes = await api.get('/zones');
      const zoneList = zoneRes.data?.data || zoneRes.data || [];
      if (Array.isArray(zoneList)) setDangerZones(zoneList);

      const safeRes = await api.get('/admin/safe-locations');
      const safeList = safeRes.data?.data || safeRes.data || [];
      if (Array.isArray(safeList)) setSafeLocations(safeList);

      const nearbyRes = await api.get(`/places/nearby?lat=${location.lat}&lng=${location.lng}&category=all`);
      const nearbyList = nearbyRes.data?.data || nearbyRes.data || [];
      if (Array.isArray(nearbyList)) setNearbyPlaces(nearbyList);
    } catch (err) {
      console.warn('Map data load error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [location.lat, location.lng]);

  const handleMyLocationClick = (leafletMapInstance) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLocation({ lat, lng });
          setDestinationQuery('');
          if (leafletMapInstance) {
            leafletMapInstance.flyTo([lat, lng], 15, { duration: 1.2 });
          }
        },
        () => console.warn('Geolocation unavailable')
      );
    }
  };

  // Search Destination query logic
  useEffect(() => {
    if (!destinationQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/places/search?query=${encodeURIComponent(destinationQuery)}`);
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list)) setSearchResults(list);
      } catch (e) {
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [destinationQuery]);

  const handleSelectDestination = (place) => {
    setLocation({ lat: place.latitude, lng: place.longitude });
    setDestinationQuery(place.name);
    setSearchResults([]);
  };

  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textClass = darkMode ? 'text-slate-100' : 'text-slate-900';
  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Bar — Frosted Glass Container for High Text Visibility */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
      } backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <Link to="/" className={`p-2.5 rounded-xl border decoration-none ${
            darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className={`text-xl sm:text-2xl font-black m-0 flex items-center gap-2 ${
              darkMode ? 'text-blue-400' : 'text-blue-900'
            }`}>
              <Shield className="w-7 h-7 text-blue-600" /> Tourist Safety Map Sentinel
            </h1>
            <p className={`text-xs font-semibold m-0 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Interactive spatial safety overlays: 🟢 Safe, 🟡 Moderate, 🟠 High Risk, 🔴 Danger Zones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-extrabold flex-wrap">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">🟢 Safe Area</span>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">🟡 Moderate</span>
          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-300">🟠 High Risk</span>
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-900 border border-red-300">🔴 Danger Zone</span>
        </div>
      </div>

      {/* Search & Location Controller Bar */}
      <div className={`${cardClass} p-4 rounded-3xl border shadow-xs relative`}>
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search ANY destination (e.g. Coimbatore, Taj Mahal, Connaught Place Delhi, Goa, Manali)..."
            value={destinationQuery}
            onChange={(e) => setDestinationQuery(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-2xl border text-xs font-semibold focus:ring-2 focus:outline-none ${
              darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
          {isSearching && (
            <div className="absolute right-4 top-3.5 text-xs text-blue-600 font-bold flex items-center gap-1">
              <Activity className="w-4 h-4 animate-spin" /> Resolving...
            </div>
          )}
        </div>

        {/* Dropdown Suggestions */}
        {searchResults.length > 0 && (
          <div className={`absolute top-16 left-4 right-4 z-30 rounded-2xl border shadow-xl overflow-hidden ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            {searchResults.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectDestination(p)}
                className="p-3 border-b border-slate-100 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-extrabold text-[#0D47A1] block">{p.name}</span>
                  <span className="text-[11px] text-slate-500">{p.address}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Score: {p.safetyScore || 88}/100
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Map + Active Zone Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 ${cardClass} p-5 rounded-3xl border shadow-md space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-extrabold flex items-center gap-2 m-0 ${textClass}`}>
              <MapPin className="w-5 h-5 text-[#0D47A1]" /> Live Spatial Safety Map
            </h3>
            <span className="text-xs text-slate-500 font-semibold">Click any zone circle to view crime index & precautions</span>
          </div>

          <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-slate-200">
            <TouristMap
              location={location}
              safeLocations={safeLocations}
              dangerZones={dangerZones}
              nearbyPlaces={nearbyPlaces}
              onMyLocationClick={handleMyLocationClick}
            />
          </div>
        </div>

        {/* Zone Details Sidebar */}
        <div className="space-y-4">
          <div className={`${cardClass} p-5 rounded-3xl border shadow-md space-y-4`}>
            <h3 className={`text-sm font-extrabold m-0 pb-2 border-b border-slate-100 ${textClass}`}>
              Active Monitored Danger Zones ({dangerZones.length})
            </h3>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {dangerZones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    selectedZone?.id === zone.id
                      ? 'bg-red-50 border-red-300 ring-2 ring-red-400/20'
                      : darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{zone.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      zone.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      Risk Score: {zone.risk_score || 85}/100
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium m-0 line-clamp-2">{zone.description}</p>
                  <span className="text-[10px] font-bold text-red-600 uppercase block pt-1">
                    Crime Type: {zone.crime_type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clicked Zone Information Modal */}
      {selectedZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className={`${cardClass} max-w-xl w-full p-6 rounded-3xl border shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-6 h-6 text-red-600" />
                <h3 className={`text-base font-black m-0 ${textClass}`}>{selectedZone.name}</h3>
              </div>
              <button
                onClick={() => setSelectedZone(null)}
                className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold text-center">
              <div className="p-3 rounded-2xl bg-red-50 text-red-900 border border-red-200">
                <span className="text-[10px] uppercase text-red-600 block">Risk Score</span>
                <span className="text-xl font-black">{selectedZone.risk_score || 85}/100</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200">
                <span className="text-[10px] uppercase text-amber-600 block">Severity Level</span>
                <span className="text-base font-extrabold uppercase">{selectedZone.severity}</span>
              </div>
            </div>

            <div className="text-xs space-y-2 font-medium text-slate-700">
              <div>
                <strong className="text-slate-900 block">Primary Reason / Crime Category:</strong>
                <span>{selectedZone.crime_type}</span>
              </div>
              <div>
                <strong className="text-slate-900 block">Time-Specific Risk:</strong>
                <span>{selectedZone.time_risk_description || 'High theft risk between 09:00 PM and 04:00 AM.'}</span>
              </div>
              <div>
                <strong className="text-slate-900 block">Recommended Precautions:</strong>
                <span>{selectedZone.precautions || selectedZone.advisory_message}</span>
              </div>
              {selectedZone.safe_alternatives && (
                <div>
                  <strong className="text-emerald-700 block">Recommended Safer Bypass:</strong>
                  <span>{selectedZone.safe_alternatives}</span>
                </div>
              )}
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setSelectedZone(null)}
                className="px-6 py-2.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyMap;
