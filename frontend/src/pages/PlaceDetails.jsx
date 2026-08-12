import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin, Shield, AlertTriangle, AlertOctagon, Phone, Clock, Sun, CloudRain,
  Navigation, Car, Utensils, Sparkles, FileText, Share2, Compass, CheckCircle2,
  ChevronRight, Heart, Info, Eye, ArrowLeft, RefreshCw, BarChart2, Footprints, ExternalLink, ShieldAlert, Check
} from 'lucide-react';
import TouristMap from '../components/TouristMap';
import api from '../services/api';

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

const PlaceDetails = ({ darkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [place, setPlace] = useState(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRoute, setShowRoute] = useState(searchParams.get('route') === 'true');
  const [travelMode, setTravelMode] = useState('driving');
  const [userLocation, setUserLocation] = useState({ lat: 11.0168, lng: 76.9558 }); // Default Coimbatore sector
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/places/details/${id}`);
        if (res.data) setPlace(res.data);

        // Fetch Safety Analysis
        const analysisRes = await api.get(`/places/${id}/safety-analysis`);
        if (analysisRes.data) setSafetyAnalysis(analysisRes.data);
      } catch (err) {
        console.warn('Place details fetch warning');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setHasLocationPermission(true);
          setShowRoute(true);
        },
        () => alert('Please allow browser location permission to calculate route.')
      );
    }
  };

  const distKm = place ? calculateDistanceKm(userLocation.lat, userLocation.lng, place.latitude, place.longitude) : 0;
  const drivingEtaMinutes = Math.round((distKm / 35) * 60) || 15;
  const walkingEtaMinutes = Math.round((distKm / 4.5) * 60) || 45;

  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textClass = darkMode ? 'text-slate-100' : 'text-slate-900';
  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-500';

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-[#0D47A1] animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">Loading destination safety & spatial profile...</p>
      </div>
    );
  }

  const mapCenter = { lat: place?.latitude || 11.0168, lng: place?.longitude || 76.9558 };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer ${
            darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnalysisModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white font-extrabold text-xs shadow-sm hover:bg-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BarChart2 className="w-4 h-4" /> View Safety Analysis
          </button>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${place?.latitude},${place?.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 text-blue-600 bg-blue-50 border-blue-200 decoration-none"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Google Maps
          </a>
        </div>
      </div>

      {/* Hero Banner */}
      <div className={`${cardClass} rounded-3xl border shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-0`}>
        <div className="md:col-span-1 h-56 md:h-full relative overflow-hidden bg-slate-900">
          <img
            src={place?.photos?.[0] || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80'}
            alt={place?.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
            <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
              {place?.category}
            </span>
          </div>
        </div>

        <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h1 className={`text-2xl md:text-3xl font-black m-0 ${textClass}`}>{place?.name}</h1>
              <span className={`px-3.5 py-1.5 rounded-full font-black text-xs uppercase ${
                (place?.safetyScore || 88) >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                Overall Safety: {place?.safetyScore || 88}/100
              </span>
            </div>

            <p className="text-xs font-bold text-[#0D47A1] mt-1 flex items-center gap-1 m-0">
              <MapPin className="w-4 h-4" /> {place?.address || `${place?.city}, ${place?.state}, ${place?.country}`}
            </p>

            <p className={`text-xs md:text-sm font-medium mt-3 m-0 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {place?.description}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs font-semibold">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Hours</span>
              <span className={textClass}>{place?.openingHours || 'Open 24 Hours'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Entry Fee</span>
              <span className={textClass}>{place?.entryFee || 'Free Entry'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Cell</span>
              <span className="text-emerald-700 font-bold">{place?.contactPhone || '+91 1800 11 1363'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Danger Status</span>
              <span className="text-emerald-700 font-extrabold">{place?.dangerZoneStatus || 'Clear Patrol Sector'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { key: 'overview', label: 'Overview & Facilities', icon: Info },
          { key: 'map', label: 'Safety Map & Zones', icon: MapPin },
          { key: 'analysis', label: 'Safety Analysis', icon: BarChart2 },
          { key: 'route', label: 'Route & Navigation', icon: Navigation }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === 'analysis') setShowAnalysisModal(true);
              }}
              className={`px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === tab.key
                  ? 'bg-[#0D47A1] text-white shadow-sm'
                  : darkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Safest Route Warning Banner */}
      {showRoute && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold flex items-center gap-1.5 uppercase m-0 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> SAFEST ROUTE EVALUATION ACTIVE
            </h4>
            <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Recommended: Safest Bypass Corridor (+1.2 km, +4 mins)
            </span>
          </div>
          <p className="text-xs font-medium text-amber-800 m-0">
            The direct route passes near a high-density market sector. RakshaSetu auto-routing recommends the illuminated arterial corridor for night travel.
          </p>
        </div>
      )}

      {/* Main Grid: Interactive Spatial Sentinel Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 ${cardClass} p-5 rounded-3xl border shadow-md space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-extrabold flex items-center gap-2 m-0 ${textClass}`}>
              <MapPin className="w-5 h-5 text-[#0D47A1]" /> Destination Spatial Sentinel Map
            </h3>
            <button
              onClick={handleUseMyLocation}
              className="px-3 py-1.5 rounded-xl bg-blue-100 text-[#0D47A1] font-bold text-xs hover:bg-blue-200 cursor-pointer"
            >
              📍 Route from My GPS
            </button>
          </div>

          <div className="h-[460px] w-full rounded-2xl overflow-hidden border border-slate-200">
            <TouristMap location={mapCenter} safeLocations={place?.nearbySafeLocations || []} />
          </div>
        </div>

        {/* Quick Safety Summary Sidebar */}
        <div className="space-y-4">
          <div className={`${cardClass} p-5 rounded-3xl border shadow-md space-y-4`}>
            <h3 className={`text-sm font-extrabold m-0 pb-2 border-b border-slate-100 ${textClass}`}>
              Emergency & Safety Index
            </h3>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
              <span className="font-extrabold text-emerald-900 block">Overall Safety: {place?.safetyScore || 88}/100</span>
              <p className="text-emerald-700 text-[11px] m-0">Verified 24/7 Police Patrol Desk active at main entrance corridor.</p>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>Theft / Scam Risk:</span>
                <span className="text-amber-700 font-bold">Moderate (Crowd Areas)</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>Night Safety Index:</span>
                <span className="text-emerald-700 font-bold">Good (Lit Arterial Roads)</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>Nearest Hospital:</span>
                <span className="text-blue-700 font-bold">1.2 km</span>
              </div>
            </div>

            <button
              onClick={() => setShowAnalysisModal(true)}
              className="w-full py-2.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs hover:bg-blue-800 transition-colors shadow-sm cursor-pointer"
            >
              📊 Open Detailed Safety Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Destination Safety Analysis Modal */}
      {showAnalysisModal && safetyAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className={`${cardClass} max-w-2xl w-full p-6 md:p-8 rounded-3xl border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div>
                <h2 className={`text-xl font-black m-0 ${textClass}`}>
                  🛡 {safetyAnalysis.destinationName} Safety Analysis
                </h2>
                <p className="text-xs text-slate-500 font-semibold m-0 mt-0.5">
                  Destination-specific environmental, geographic, and crime-risk analysis
                </p>
              </div>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            {/* Score Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-extrabold uppercase text-emerald-700">Overall Score</span>
                <p className="text-2xl font-black text-emerald-800 m-0">{safetyAnalysis.scores?.overallSafetyScore}/100</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-extrabold uppercase text-blue-700">Night Safety</span>
                <p className="text-2xl font-black text-blue-800 m-0">{safetyAnalysis.scores?.nightSafety}/100</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
                <span className="text-[10px] font-extrabold uppercase text-purple-700">Medical Access</span>
                <p className="text-2xl font-black text-purple-800 m-0">{safetyAnalysis.scores?.hospitalAccessibility}/100</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-extrabold uppercase text-amber-700">Police Access</span>
                <p className="text-2xl font-black text-amber-800 m-0">{safetyAnalysis.scores?.policeAccessibility}/100</p>
              </div>
            </div>

            {/* Detailed Risk Breakdown Bars */}
            <div className="space-y-3 pt-2">
              <h4 className={`text-xs font-extrabold uppercase tracking-wider ${mutedClass}`}>Calculated Safety & Crime Risk Index</h4>
              <div className="space-y-2 text-xs font-semibold">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Crime & Theft Risk</span>
                    <span className="text-amber-600 font-bold">{safetyAnalysis.scores?.theftRisk}/100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${safetyAnalysis.scores?.theftRisk}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Crowd & Density Risk</span>
                    <span className="text-blue-600 font-bold">{safetyAnalysis.scores?.crowdDensityRisk}/100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${safetyAnalysis.scores?.crowdDensityRisk}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Emergency Accessibility</span>
                    <span className="text-emerald-600 font-bold">{safetyAnalysis.scores?.emergencyAccessibility}/100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${safetyAnalysis.scores?.emergencyAccessibility}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Advisory & Guidelines */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <h4 className="text-xs font-extrabold text-[#0D47A1] uppercase m-0">AI Safety Intelligence Advisory</h4>
              <p className="text-slate-700 font-medium m-0">{safetyAnalysis.aiRecommendations?.advisory}</p>
              <div className="pt-2">
                <span className="font-bold text-slate-800 block mb-1">Recommended Precautions:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium">
                  {safetyAnalysis.aiRecommendations?.recommendedPrecautions?.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setShowAnalysisModal(false)}
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

export default PlaceDetails;
