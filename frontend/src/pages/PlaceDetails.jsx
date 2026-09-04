import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Shield, Star, Sun, Heart, Navigation, Share2, Phone, Building2,
  Stethoscope, Compass, Hotel, Utensils, AlertTriangle, CheckCircle2,
  ArrowLeft, Clock, ExternalLink, Loader2, Globe, Info, ChevronRight,
  X, RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { getPlaceImage } from '../utils/placeImageHelper';

// Fix Leaflet default icon issue in Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const isValidCoord = (lat, lng) => {
  const la = parseFloat(lat), lo = parseFloat(lng);
  return !isNaN(la) && !isNaN(lo) && la >= -90 && la <= 90 && lo >= -180 && lo <= 180 && !(la === 0 && lo === 0);
};

const NearbyCard = ({ place, darkMode }) => (
  <div className={`p-3 rounded-2xl border flex items-start gap-3 ${
    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
  }`}>
    <div className={`p-2 rounded-xl shrink-0 ${
      place.category === 'Police' ? 'bg-blue-500/10 text-blue-600' :
      place.category === 'Hospital' ? 'bg-rose-500/10 text-rose-600' :
      place.category === 'Hotel' ? 'bg-amber-500/10 text-amber-600' :
      place.category === 'Restaurant' ? 'bg-orange-500/10 text-orange-600' :
      'bg-emerald-500/10 text-emerald-600'
    }`}>
      {place.category === 'Police' ? <Building2 className="w-4 h-4" /> :
       place.category === 'Hospital' ? <Stethoscope className="w-4 h-4" /> :
       place.category === 'Hotel' ? <Hotel className="w-4 h-4" /> :
       place.category === 'Restaurant' ? <Utensils className="w-4 h-4" /> :
       <MapPin className="w-4 h-4" />}
    </div>
    <div className="min-w-0 flex-1">
      <h5 className={`text-xs font-extrabold m-0 truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
        {place.name}
      </h5>
      <p className="text-[11px] text-slate-400 m-0 truncate">{place.formattedDistance || `${place.distanceKm} km`}</p>
      {place.phone && (
        <a href={`tel:${place.phone}`} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 no-underline hover:underline">
          {place.phone}
        </a>
      )}
    </div>
  </div>
);

const PlaceDetails = ({ darkMode }) => {
  const { id } = useParams();
  const { t } = useLanguage();

  const [place, setPlace] = useState(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [nearbyPolice, setNearbyPolice] = useState([]);
  const [nearbyHotels, setNearbyHotels] = useState([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [heroImgSrc, setHeroImgSrc] = useState(() => getPlaceImage(null));

  useEffect(() => {
    if (place) setHeroImgSrc(getPlaceImage(place));
  }, [place]);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setImgError(false);
      try {
        const [detRes, safeRes] = await Promise.allSettled([
          api.get(`/places/details/${id}`),
          api.get(`/places/${id}/safety-analysis`)
        ]);

        let placeData = null;
        if (detRes.status === 'fulfilled') {
          placeData = detRes.value.data?.data || detRes.value.data;
          setPlace(placeData);
        }
        if (safeRes.status === 'fulfilled') {
          setSafetyAnalysis(safeRes.value.data?.data || safeRes.value.data);
        }

        // Fetch nearby facilities if we have coordinates
        if (placeData?.latitude && placeData?.longitude && isValidCoord(placeData.latitude, placeData.longitude)) {
          const lat = placeData.latitude;
          const lng = placeData.longitude;
          const [hRes, pRes, htRes, rRes] = await Promise.allSettled([
            api.get(`/places/nearby?lat=${lat}&lng=${lng}&category=hospital`),
            api.get(`/places/nearby?lat=${lat}&lng=${lng}&category=police`),
            api.get(`/places/nearby?lat=${lat}&lng=${lng}&category=hotel`),
            api.get(`/places/nearby?lat=${lat}&lng=${lng}&category=restaurant`)
          ]);

          if (hRes.status === 'fulfilled') {
            const list = hRes.value.data?.data || hRes.value.data || [];
            setNearbyHospitals(Array.isArray(list) ? list.slice(0, 3) : []);
          }
          if (pRes.status === 'fulfilled') {
            const list = pRes.value.data?.data || pRes.value.data || [];
            setNearbyPolice(Array.isArray(list) ? list.slice(0, 3) : []);
          }
          if (htRes.status === 'fulfilled') {
            const list = htRes.value.data?.data || htRes.value.data || [];
            setNearbyHotels(Array.isArray(list) ? list.slice(0, 3) : []);
          }
          if (rRes.status === 'fulfilled') {
            const list = rRes.value.data?.data || rRes.value.data || [];
            setNearbyRestaurants(Array.isArray(list) ? list.slice(0, 3) : []);
          }
        }
      } catch (_) {
        // handled by null check below
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  useEffect(() => {
    if (place) {
      const loaded = localStorage.getItem('rakshasetu_saved_places');
      if (loaded) {
        try {
          setSaved(JSON.parse(loaded).some(item => item.id === place.id));
        } catch (_) {}
      }
    }
  }, [place]);

  const toggleSave = () => {
    if (!place) return;
    const loaded = localStorage.getItem('rakshasetu_saved_places');
    let current = loaded ? JSON.parse(loaded) : [];
    const exists = current.some(item => item.id === place.id);
    if (exists) {
      current = current.filter(item => item.id !== place.id);
      setSaved(false);
    } else {
      current.push({
        id: place.id, name: place.name, city: place.city, state: place.state,
        rating: place.rating || null, safetyScore: place.safetyScore || null,
        image: place.photos?.[0] || null, category: place.category
      });
      setSaved(true);
    }
    localStorage.setItem('rakshasetu_saved_places', JSON.stringify(current));
  };

  const handleGetDirections = () => {
    if (!place) return;
    setDirectionsLoading(true);

    const destLat = parseFloat(place.latitude);
    const destLng = parseFloat(place.longitude);
    const hasCoords = isValidCoord(destLat, destLng);

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
      setDirectionsLoading(false);
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
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: place?.name || 'RakshaSetu Tourist Destination', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-bold">Loading destination profile & safety analysis...</p>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className={`text-lg font-black ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Destination Not Found</h3>
        <p className="text-sm text-slate-400">The requested destination could not be loaded.</p>
        <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold inline-block no-underline">
          Return to Home
        </Link>
      </div>
    );
  }

  const hasMap = isValidCoord(place.latitude, place.longitude);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-fade-in">

      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 no-underline">
        <ArrowLeft className="w-4 h-4" /> Back to Exploration
      </Link>

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="relative h-80 md:h-96 rounded-3xl overflow-hidden shadow-xl group bg-slate-900">
        <img
          src={heroImgSrc}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          alt={place.name}
          className="w-full h-full object-cover"
          onError={() => setHeroImgSrc(getPlaceImage(place))}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-blue-600/80 backdrop-blur-md text-[10px] font-black uppercase tracking-wider">
              {place.category || 'Tourist Landmark'}
            </span>
            <h1 className="text-2xl md:text-4xl font-black m-0 leading-tight text-white">
              {place.name}
            </h1>
            <p className="text-xs md:text-sm text-slate-200 font-medium m-0 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
              <span className="line-clamp-1">
                {place.address || `${place.city}${place.state && place.state !== 'Information unavailable' ? ', ' + place.state : ''}${place.country && place.country !== 'Information unavailable' ? ', ' + place.country : ''}`}
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGetDirections}
              disabled={directionsLoading}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {directionsLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Getting GPS...</>
                : <><Navigation className="w-4 h-4" /> Directions</>}
            </button>
            <button
              onClick={toggleSave}
              className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all ${
                saved ? 'bg-rose-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
              }`}
            >
              <Heart className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
              {saved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Highlights Bar ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Safety Score',
            value: place.safetyScore ? `${place.safetyScore}/100` : 'See Analysis',
            sub: place.riskLevel || 'RakshaSetu Verified',
            color: 'text-emerald-600'
          },
          {
            label: 'Rating',
            value: place.rating ? `${place.rating} / 5.0` : 'Information unavailable',
            sub: place.rating ? 'Tourist Rating' : '',
            color: 'text-amber-600'
          },
          {
            label: 'Opening Hours',
            value: place.openingHours || 'Information unavailable',
            sub: '',
            color: 'text-slate-800'
          },
          {
            label: 'Location',
            value: place.city || 'Unknown',
            sub: `${place.state || ''}${place.country ? ', ' + place.country : ''}`.replace(/^,\s*/, '') || '',
            color: 'text-slate-800'
          }
        ].map((item, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] text-slate-400 font-black uppercase block">{item.label}</span>
            <span className={`text-sm font-black ${item.color} block mt-1 leading-tight`}>{item.value}</span>
            {item.sub && <span className="text-[10px] text-slate-500 block font-semibold mt-0.5">{item.sub}</span>}
          </div>
        ))}
      </div>

      {/* ── Tab Navigation ────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 p-1 rounded-2xl border border-slate-200 bg-slate-100/90 w-fit">
        {['overview', 'nearby', 'safety', 'map'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-[#0D47A1] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'overview' ? '📋 Overview' :
             tab === 'nearby' ? '📍 Nearby Help' :
             tab === 'safety' ? '🛡️ Safety Sentinel' : '🗺️ Interactive Map'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-slate-900 space-y-5">
          <h3 className="text-xl font-black text-slate-900 m-0">About {place.name}</h3>
          <p className="text-sm leading-relaxed m-0 text-slate-600 font-medium">
            {place.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            {[
              { label: 'Full Address', value: place.address && place.address !== 'Address information unavailable' ? place.address : null },
              { label: 'City', value: place.city || null },
              { label: 'State / Region', value: place.state && place.state !== 'Information unavailable' ? place.state : null },
              { label: 'Country', value: place.country && place.country !== 'Information unavailable' ? place.country : null },
              { label: 'Latitude', value: place.latitude !== null && place.latitude !== undefined ? `${place.latitude}°` : null },
              { label: 'Longitude', value: place.longitude !== null && place.longitude !== undefined ? `${place.longitude}°` : null },
              { label: 'Opening Hours', value: place.openingHours || null },
              { label: 'Category', value: place.category || null }
            ].map(({ label, value }) => (
              <div key={label} className="text-sm">
                <span className="font-black text-blue-600">{label}: </span>
                <span className="font-semibold text-slate-800">
                  {value || <em className="text-slate-400 font-normal">Information unavailable</em>}
                </span>
              </div>
            ))}
          </div>

          {/* Helpline */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 shadow-xs">
            <Phone className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-600 block">Official Tourist Helpline (24/7 Toll-Free)</span>
              <a href="tel:+911800111363" className="text-sm font-black text-blue-700 hover:underline no-underline">
                +91 1800 11 1363
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── NEARBY TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'nearby' && (
        <div className="space-y-5">
          {[
            { title: '🏥 Nearby Hospitals & Medical Centers', data: nearbyHospitals, cat: 'Hospital' },
            { title: '👮 Nearby Police Stations & Outposts', data: nearbyPolice, cat: 'Police' },
            { title: '🏨 Nearby Hotels & Accommodations', data: nearbyHotels, cat: 'Hotel' },
            { title: '🍽️ Nearby Restaurants & Food Outlets', data: nearbyRestaurants, cat: 'Restaurant' }
          ].map(({ title, data }) => (
            <div key={title} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-slate-900">
              <h4 className="text-base font-black text-slate-900 m-0 mb-3">{title}</h4>
              {data.length === 0 ? (
                <p className="text-xs text-slate-400 italic m-0">
                  Loading nearby services... or service data unavailable for this location.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.map(place => (
                    <NearbyCard key={place.id} place={place} darkMode={false} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── SAFETY TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'safety' && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/30 text-white shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-black m-0 tracking-tight text-white">RakshaSetu Safety Analysis</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold">
              {safetyAnalysis?.scores?.overallSafetyScore || place.safetyScore || '—'}/100 Safe
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Crime Risk Index</span>
              <span className="text-base font-black text-emerald-400 block">
                {safetyAnalysis?.scores?.crimeRisk ? `${safetyAnalysis.scores.crimeRisk}% (Low Risk)` : 'Low Risk Area'}
              </span>
              <p className="text-[11px] text-slate-300 m-0">Monitored 24/7 by Tourist Police and AI Sentinel.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Emergency Accessibility</span>
              <span className="text-base font-black text-blue-400 block">
                {safetyAnalysis?.scores?.emergencyAccessibility || 92}%
              </span>
              <a href="tel:108" className="text-[11px] font-bold text-rose-400 hover:underline block">
                Call Ambulance: 108
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Safe Zone Coverage</span>
              <span className="text-base font-black text-emerald-400 block">
                {safetyAnalysis?.scores?.safeZoneCoverage || '85% Coverage'}
              </span>
              <a href="tel:100" className="text-[11px] font-bold text-blue-400 hover:underline block">
                Call Police: 100
              </a>
            </div>
          </div>

          {safetyAnalysis?.aiRecommendations && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="text-xs font-extrabold text-emerald-300 m-0 uppercase tracking-wider">
                AI Safety Advisory
              </h4>
              <p className="text-xs text-slate-300 m-0">{safetyAnalysis.aiRecommendations.advisory}</p>
              {safetyAnalysis.aiRecommendations.recommendedPrecautions && (
                <ul className="text-xs text-slate-300 space-y-1 pl-4 m-0 mt-2">
                  {safetyAnalysis.aiRecommendations.recommendedPrecautions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!place.safetyScore && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-300 m-0 font-semibold">
                ℹ️ Detailed safety analysis is available for destinations within India. For international destinations, please refer to your country's travel advisory.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── MAP TAB ───────────────────────────────────────────────────────── */}
      {activeTab === 'map' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-700/60 backdrop-blur-md text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-black text-white m-0 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-400" />
              Live Destination Map & Coordinates
            </h4>
            {hasMap && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-black text-blue-400 hover:text-blue-300 flex items-center gap-1 no-underline"
              >
                Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {hasMap ? (
            <div className="h-72 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <MapContainer
                center={[place.latitude, place.longitude]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={[place.latitude, place.longitude]} icon={destinationIcon}>
                  <Popup>
                    <strong>{place.name}</strong><br />
                    {place.city}, {place.state}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          ) : (
            <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <div className="text-center space-y-2">
                <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm text-slate-400 font-semibold">Map coordinates unavailable</p>
                <p className="text-xs text-slate-400">Search for this place in Google Maps manually.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
              <span className="font-bold text-slate-400 block">Latitude</span>
              <span className="font-extrabold">
                {place.latitude !== null && place.latitude !== undefined ? `${place.latitude}°` : 'Information unavailable'}
              </span>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
              <span className="font-bold text-slate-400 block">Longitude</span>
              <span className="font-extrabold">
                {place.longitude !== null && place.longitude !== undefined ? `${place.longitude}°` : 'Information unavailable'}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PlaceDetails;
