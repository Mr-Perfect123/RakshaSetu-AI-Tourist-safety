import React, { useState, useEffect } from 'react';
import { ShieldCheck, Phone, MapPin, Star, ArrowLeft, Building2, Hospital, Search, Navigation, ExternalLink, CalendarCheck, Map, Clock, Coffee, Utensils, Hotel as HotelIcon, Landmark, Fuel, ShoppingBag, ShieldAlert } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import TouristMap from '../components/TouristMap';
import api from '../services/api';
import axios from 'axios';

const CATEGORIES = [
  { key: 'all', label: 'All Places', icon: MapPin },
  { key: 'hotel', label: 'Hotels', icon: HotelIcon },
  { key: 'restaurant', label: 'Restaurants', icon: Utensils },
  { key: 'cafe', label: 'Cafes', icon: Coffee },
  { key: 'hospital', label: 'Hospitals', icon: Hospital },
  { key: 'police', label: 'Police', icon: ShieldCheck },
  { key: 'pharmacy', label: 'Pharmacies', icon: Building2 },
  { key: 'attraction', label: 'Attractions', icon: Landmark },
  { key: 'atm', label: 'ATMs', icon: ExternalLink },
  { key: 'fuel', label: 'Fuel Stations', icon: Fuel },
  { key: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { key: 'emergency', label: 'Emergency', icon: ShieldAlert }
];

const NearbyHelp = ({ darkMode }) => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [location, setLocation] = useState({ lat: 11.0168, lng: 76.9558 }); // Default Coimbatore sector
  const [locationName, setLocationName] = useState('Coimbatore, Tamil Nadu');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Geolocate the user and reverse-geocode to get location name
  const handleGeolocate = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          
          try {
            const res = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
              {
                headers: { 'User-Agent': 'RakshaSetu-AI-Tourist-Protection-Engine/1.0' },
                timeout: 3500
              }
            );
            if (res.data && res.data.display_name) {
              const addr = res.data.address || {};
              const city = addr.city || addr.town || addr.village || addr.suburb || 'Your Location';
              const state = addr.state || '';
              setLocationName(`${city}${state ? ', ' + state : ''}`);
            } else {
              setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          } catch (e) {
            setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.warn('Geolocation permission error or timeout:', error);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // Run geolocation on initial component mount
  useEffect(() => {
    handleGeolocate();
  }, []);

  // Fetch Nearby Places based on Location & Category
  const fetchNearby = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/places/nearby?lat=${location.lat}&lng=${location.lng}&category=${selectedCategory}&query=${encodeURIComponent(searchQuery)}`
      );
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) {
        setPlaces(list);
        if (list.length > 0) setSelectedPlace(list[0]);
      }
    } catch (err) {
      console.warn('Nearby fetch warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby();
  }, [location, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNearby();
  };

  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textClass = darkMode ? 'text-slate-100' : 'text-slate-900';
  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Header — Frosted Glass Container for High Text Visibility */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
      } backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <Link to="/" className={`p-2.5 rounded-xl border decoration-none ${
            darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div>
            <h1 className={`text-xl sm:text-2xl font-black m-0 flex items-center gap-2 ${
              darkMode ? 'text-blue-400' : 'text-blue-900'
            }`}>
              <Building2 className="w-7 h-7 text-blue-600" /> Smart Nearby Places Discovery
            </h1>
            <p className={`text-xs font-semibold m-0 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Location-aware hotels, restaurants, cafes, emergency police & medical desks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black flex items-center gap-1.5 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span> GPS Centered: {locationName}
          </span>
          <button
            onClick={handleGeolocate}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Recenter Map to My Coordinates"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>My Location</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Search Input */}
      <div className={`${cardClass} p-4 rounded-3xl border shadow-sm space-y-3`}>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search nearby hotels, restaurants, cafes, hospitals, police, ATMs (e.g. Radisson, Saravana Bhavan, City Hospital)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-12 pr-28 py-3 rounded-2xl border text-xs font-semibold focus:ring-2 focus:outline-none ${
              darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-[#0D47A1]'
            }`}
          />
          <button
            type="submit"
            className="absolute right-2 top-2 px-4 py-1.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-800 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-xs'
                    : darkMode
                    ? 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split View: Results List + Interactive Leaflet Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className={`text-xs font-extrabold uppercase tracking-wider ${mutedClass}`}>
              Found {places.length} verified places nearby
            </span>
            {loading && <span className="text-xs text-blue-600 font-bold animate-pulse">Retrieving places...</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {places.map((place) => (
              <div
                key={place.id}
                onClick={() => setSelectedPlace(place)}
                className={`${cardClass} p-4 rounded-2xl border shadow-xs hover:shadow-md transition-all space-y-3 cursor-pointer ${
                  selectedPlace?.id === place.id ? 'ring-2 ring-[#0D47A1]' : ''
                }`}
              >
                {/* Place Image */}
                <div className="h-36 w-full rounded-xl overflow-hidden bg-slate-100 relative">
                  <img
                    src={place.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                    alt={place.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white font-bold text-[10px] uppercase backdrop-blur-xs">
                    {place.category}
                  </span>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px]">
                    {place.distanceKm} km away
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-extrabold m-0 truncate ${textClass}`}>{place.name}</h3>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{place.rating}</span>
                      <span className="text-[10px] text-slate-400">({place.reviewsCount || 85})</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 m-0 line-clamp-2 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{place.address}</span>
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] font-semibold">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      place.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      <Clock className="w-3 h-3 inline mr-1" /> {place.openStatusText || 'Open Now'}
                    </span>
                    <span className="text-slate-400 font-mono">Lat: {place.latitude?.toFixed(4)}, Lng: {place.longitude?.toFixed(4)}</span>
                  </div>
                </div>

                {/* Action Buttons Bar */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-4 gap-1.5 text-[11px] font-bold">
                  <a
                    href={`tel:${place.phone}`}
                    className="py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-center decoration-none"
                  >
                    📞 Call
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 text-center decoration-none"
                  >
                    🚗 Route
                  </a>
                  <button
                    onClick={() => setSelectedPlace(place)}
                    className="py-1.5 rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 text-center cursor-pointer"
                  >
                    🗺 Map
                  </button>
                  <Link
                    to="/vehicles"
                    className="py-1.5 rounded-lg bg-[#0D47A1] text-white hover:bg-blue-800 text-center decoration-none"
                  >
                    🚕 Book
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaflet Map Sidebar Column */}
        <div className="space-y-4">
          <div className={`${cardClass} p-4 rounded-3xl border shadow-xs flex flex-col h-[580px]`}>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className={`text-sm font-bold flex items-center gap-2 m-0 ${textClass}`}>
                <Map className="w-4 h-4 text-[#0D47A1]" /> Place Discovery Map
              </h3>
              {selectedPlace && (
                <span className="text-[10px] font-bold text-blue-600 truncate max-w-[140px]">
                  Focus: {selectedPlace.name}
                </span>
              )}
            </div>

            <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-200">
              <TouristMap
                location={selectedPlace ? { lat: selectedPlace.latitude, lng: selectedPlace.longitude } : location}
                safeLocations={places}
              />
            </div>

            {selectedPlace && (
              <div className="mt-3 p-3 rounded-2xl bg-blue-50 border border-blue-100 text-xs space-y-1">
                <span className="font-extrabold text-[#0D47A1] block">{selectedPlace.name}</span>
                <p className="text-slate-600 text-[11px] m-0">{selectedPlace.address}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-emerald-700 font-bold">{selectedPlace.phone}</span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0D47A1] font-bold hover:underline"
                  >
                    Open Directions →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyHelp;
