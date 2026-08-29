import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Navigation, ExternalLink, Loader2, Shield, Radio, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Numeric Coordinate Validation
export const isValidCoord = (lat, lng) => {
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  return (
    !isNaN(parsedLat) &&
    !isNaN(parsedLng) &&
    parsedLat >= -90 && parsedLat <= 90 &&
    parsedLng >= -180 && parsedLng <= 180 &&
    !(parsedLat === 0 && parsedLng === 0)
  );
};

// Haversine Distance Calculation (in meters)
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (!isValidCoord(lat1, lon1) || !isValidCoord(lat2, lon2)) return 0;
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format distance nicely
export const formatDistance = (meters) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

// Custom Standard Leaflet Icons
const createCustomIcon = (colorUrl) => new L.Icon({
  iconUrl: colorUrl,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png');
const safeIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png');
const policeIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png');
const hospitalIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png');
const incidentIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png');
const hotelIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png');
const restaurantIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png');
const attractionIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-cyan.png');

// Live GPS Radar DivIcon
const liveGpsDivIcon = new L.DivIcon({
  className: 'live-gps-radar-marker',
  html: `
    <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
      <div style="position:absolute; width:34px; height:34px; border-radius:50%; background:rgba(37,99,235,0.3); animation:livePulse 2s infinite ease-out;"></div>
      <div style="position:relative; z-index:2; width:18px; height:18px; border-radius:50%; background:#1D4ED8; border:3px solid #FFFFFF; box-shadow:0 0 10px rgba(29,78,216,0.6); display:flex; align-items:center; justify-content:center;">
        <div style="width:6px; height:6px; border-radius:50%; background:#FFFFFF;"></div>
      </div>
    </div>
    <style>
      @keyframes livePulse {
        0% { transform: scale(0.6); opacity: 1; }
        100% { transform: scale(1.6); opacity: 0; }
      }
    </style>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18]
});

// Danger Zone Color & Style Resolver
export const getDangerZoneTheme = (zone) => {
  const type = (zone.danger_type || zone.dangerType || zone.crime_type || '').toUpperCase();
  const sev = (zone.severity || 'high').toLowerCase();

  // All 20 Extensible Categories
  if (type === 'HIGH_CRIME') {
    return { color: '#B91C1C', fillColor: '#EF4444', label: 'High Crime Area', icon: '⚠️', bgBadge: 'bg-red-100 text-red-950 border-red-300' };
  }
  if (type === 'THEFT') {
    return { color: '#DC2626', fillColor: '#F87171', label: 'Theft / Pickpocketing', icon: '🎒', bgBadge: 'bg-red-100 text-red-800 border-red-200' };
  }
  if (type === 'NO_NETWORK') {
    const isUnverified = (zone.confidence === 'UNVERIFIED' || zone.confidence === 'LOW');
    return { 
      color: '#7C3AED', 
      fillColor: '#A78BFA', 
      label: isUnverified ? 'Limited/Unverified Network Coverage' : 'No Network Coverage', 
      icon: '📵', 
      bgBadge: 'bg-purple-100 text-purple-800 border-purple-300' 
    };
  }
  if (type === 'WILDLIFE') {
    return { color: '#15803D', fillColor: '#4ADE80', label: 'Wildlife Zone', icon: '🐅', bgBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  }
  if (type === 'ACCIDENT_PRONE') {
    return { color: '#EA580C', fillColor: '#FDBA74', label: 'Accident-Prone', icon: '🚗', bgBadge: 'bg-orange-100 text-orange-800 border-orange-300' };
  }
  if (type === 'ROAD_HAZARD') {
    return { color: '#D97706', fillColor: '#FCD34D', label: 'Road Hazard', icon: '🚧', bgBadge: 'bg-amber-100 text-amber-800 border-amber-300' };
  }
  if (type === 'HILL_CURVE') {
    return { color: '#B45309', fillColor: '#FBBF24', label: 'Hill Curve / Blind Turn', icon: '⛰️', bgBadge: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
  }
  if (type === 'FLOOD_RISK') {
    return { color: '#0284C7', fillColor: '#7DD3FC', label: 'Flood Risk Area', icon: '🌊', bgBadge: 'bg-sky-100 text-sky-800 border-sky-300' };
  }
  if (type === 'LANDSLIDE_RISK') {
    return { color: '#854D0E', fillColor: '#F59E0B', label: 'Landslide Risk', icon: '⛰️', bgBadge: 'bg-amber-100 text-amber-900 border-amber-400' };
  }
  if (type === 'FIRE_RISK') {
    return { color: '#C2410C', fillColor: '#F97316', label: 'Fire Risk Sector', icon: '🔥', bgBadge: 'bg-orange-100 text-orange-900 border-orange-400' };
  }
  if (type === 'EXTREME_WEATHER') {
    return { color: '#1E3A8A', fillColor: '#3B82F6', label: 'Extreme Weather Zone', icon: '⛈️', bgBadge: 'bg-blue-100 text-blue-900 border-blue-400' };
  }
  if (type === 'DANGEROUS_TERRAIN') {
    return { color: '#78350F', fillColor: '#B45309', label: 'Dangerous Terrain', icon: '🏔️', bgBadge: 'bg-amber-900/10 text-amber-900 border-amber-700' };
  }
  if (type === 'WATER_DANGER') {
    return { color: '#0D9488', fillColor: '#2DD4BF', label: 'Water Danger', icon: '🏊', bgBadge: 'bg-teal-100 text-teal-800 border-teal-300' };
  }
  if (type === 'DROWNING_RISK') {
    return { color: '#2563EB', fillColor: '#60A5FA', label: 'Drowning Risk Area', icon: '🌊', bgBadge: 'bg-blue-100 text-blue-800 border-blue-300' };
  }
  if (type === 'POLICE_ALERT') {
    return { color: '#1E293B', fillColor: '#64748B', label: 'Police Safety Alert', icon: '👮', bgBadge: 'bg-slate-100 text-slate-800 border-slate-300' };
  }
  if (type === 'MEDICAL_RISK') {
    return { color: '#E11D48', fillColor: '#F43F5E', label: 'Medical Emergency Risk', icon: '🚑', bgBadge: 'bg-rose-100 text-rose-800 border-rose-300' };
  }
  if (type === 'RIOT_OR_UNREST') {
    return { color: '#991B1B', fillColor: '#F87171', label: 'Riot / Unrest Zone', icon: '📢', bgBadge: 'bg-red-200 text-red-950 border-red-400' };
  }
  if (type === 'CONSTRUCTION_HAZARD') {
    return { color: '#CA8A04', fillColor: '#FDE047', label: 'Construction Hazard', icon: '🏗️', bgBadge: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
  }
  if (type === 'RESTRICTED_AREA') {
    return { color: '#475569', fillColor: '#94A3B8', label: 'Restricted Sector', icon: '⛔', bgBadge: 'bg-slate-200 text-slate-800 border-slate-400' };
  }

  // Fallbacks by Severity
  if (sev === 'critical') {
    return { color: '#B91C1C', fillColor: '#EF4444', label: 'Critical Hazard Zone', icon: '🚨', bgBadge: 'bg-red-100 text-red-900 border-red-400' };
  }
  if (sev === 'high') {
    return { color: '#DC2626', fillColor: '#F87171', label: 'High Risk Hazard', icon: '⚠️', bgBadge: 'bg-red-100 text-red-800 border-red-300' };
  }
  if (sev === 'moderate') {
    return { color: '#EA580C', fillColor: '#FB923C', label: 'Moderate Risk', icon: '⚠️', bgBadge: 'bg-orange-100 text-orange-800 border-orange-300' };
  }
  return { color: '#64748B', fillColor: '#94A3B8', label: 'Safety Warning Info', icon: '🛡️', bgBadge: 'bg-slate-100 text-slate-700 border-slate-300' };
};

// Map Auto-Pan Controller with Follow-Me support
const MapViewController = ({ position, followMe }) => {
  const map = useMap();
  useEffect(() => {
    if (followMe && position && isValidCoord(position[0], position[1])) {
      map.flyTo(position, map.getZoom() || 15, { duration: 0.8 });
    }
  }, [position, followMe, map]);
  return null;
};

// Map Auto-Bounds Fitter (only on initial batch load)
const MapBoundsFitter = ({ allPoints, shouldFit }) => {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (!shouldFit || hasFittedRef.current) return;
    const validCoords = (allPoints || []).filter(p => isValidCoord(p[0], p[1]));
    if (validCoords.length > 1) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      hasFittedRef.current = true;
    }
  }, [allPoints, shouldFit, map]);
  return null;
};

const MapViewportListener = ({ onViewportChange }) => {
  const map = useMapEvents({
    moveend() {
      const bounds = map.getBounds();
      onViewportChange({
        minLat: bounds.getSouthWest().lat,
        maxLat: bounds.getNorthEast().lat,
        minLng: bounds.getSouthWest().lng,
        maxLng: bounds.getNorthEast().lng,
        zoom: map.getZoom()
      });
    }
  });
  return null;
};

const MapClickListener = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

// Map Top Controls Overlay Bar (My Location, Follow Me, GPS Status)
const MapControlsOverlay = ({
  onRecenter,
  followMe,
  setFollowMe,
  gpsAccuracy,
  isLiveTracking,
  toggleLiveTracking,
  isOffline
}) => {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleRecenterClick = () => {
    setLocating(true);
    if (onRecenter) {
      onRecenter(map);
    }
    setTimeout(() => setLocating(false), 800);
  };

  return (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000 }} className="flex flex-col items-end gap-2 pointer-events-auto">
      {/* Action Buttons Row */}
      <div className="flex items-center gap-2">
        {/* Follow Me Toggle */}
        <button
          type="button"
          onClick={() => setFollowMe(!followMe)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-black shadow-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            followMe
              ? 'bg-blue-600 text-white border-blue-700'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
          title={followMe ? 'Follow Me mode is ON (Auto-centering)' : 'Follow Me mode is OFF'}
        >
          <Radio className={`w-3.5 h-3.5 ${followMe ? 'animate-pulse text-white' : 'text-slate-400'}`} />
          <span>{followMe ? 'Following' : 'Free Pan'}</span>
        </button>

        {/* My Location Center Button */}
        <button
          type="button"
          onClick={handleRecenterClick}
          disabled={locating}
          className="bg-white text-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-300 shadow-lg font-black text-xs flex items-center gap-1.5 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer disabled:opacity-70"
          title="Recenter Map on My Live GPS Position"
        >
          {locating ? (
            <><Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" /><span>Locating...</span></>
          ) : (
            <><Compass className="w-3.5 h-3.5 text-blue-600" /><span>⦿ My Location</span></>
          )}
        </button>
      </div>

      {/* Badges Bar */}
      <div className="flex items-center gap-1.5">
        {gpsAccuracy !== null && gpsAccuracy !== undefined && (
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border shadow-xs ${
            gpsAccuracy <= 20
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : gpsAccuracy <= 60
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}>
            🎯 GPS: ±{Math.round(gpsAccuracy)}m
          </span>
        )}

        {isOffline && (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500 text-white border border-amber-600 shadow-xs">
            📶 Offline Safety Mode
          </span>
        )}
      </div>
    </div>
  );
};

const TouristMap = ({
  location = { lat: 11.0168, lng: 76.9558 },
  movementTrail = [],
  destination = null,
  safeLocations = [],
  dangerZones = [],
  redAlerts = [],
  incidents = [],
  nearbyPlaces = [],
  showRoute = false,
  gpsAccuracy = null,
  isLiveTracking = true,
  onMyLocationClick = null,
  onSelectDestination = null,
  isOffline = false,
  onViewportChange = null,
  onMapClick = null
}) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const [followMe, setFollowMe] = useState(false);

  const touristLat = parseFloat(location?.lat || 11.0168);
  const touristLng = parseFloat(location?.lng || 76.9558);
  const position = [touristLat, touristLng];

  const destLat = destination ? parseFloat(destination.latitude || destination.lat) : null;
  const destLng = destination ? parseFloat(destination.longitude || destination.lng) : null;
  const destPos = (destLat && destLng && isValidCoord(destLat, destLng)) ? [destLat, destLng] : null;

  // Active points for initial bounds
  const activePoints = useMemo(() => {
    const pts = [position];
    if (destPos) pts.push(destPos);
    (dangerZones || []).forEach(z => {
      if (isValidCoord(z.latitude, z.longitude)) pts.push([parseFloat(z.latitude), parseFloat(z.longitude)]);
    });
    return pts;
  }, [position, destPos, dangerZones]);

  // Recenter handler helper
  const handleRecenter = useCallback((mapInstance) => {
    if (mapInstance && isValidCoord(touristLat, touristLng)) {
      mapInstance.flyTo(position, 15, { duration: 1.0 });
    }
    if (onMyLocationClick) {
      onMyLocationClick({ lat: touristLat, lng: touristLng });
    }
  }, [touristLat, touristLng, position, onMyLocationClick]);

  return (
    <div ref={mapContainerRef} className="w-full h-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 relative z-0 flex flex-col" style={{ position: 'relative' }}>
      <MapContainer center={position} zoom={15} scrollWheelZoom={true} className="w-full h-full flex-1">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewController position={position} followMe={followMe} />
        <MapBoundsFitter allPoints={activePoints} shouldFit={!followMe && Boolean(destination)} />
        {onViewportChange && <MapViewportListener onViewportChange={onViewportChange} />}
        {onMapClick && <MapClickListener onMapClick={onMapClick} />}

        {/* 1. Tourist's Live Movement Trail (Polyline) */}
        {movementTrail && movementTrail.length > 1 && (
          <Polyline
            positions={movementTrail.filter(pt => isValidCoord(pt[0], pt[1]))}
            pathOptions={{
              color: '#2563EB',
              weight: 4,
              opacity: 0.75,
              lineCap: 'round',
              lineJoin: 'round',
              dashArray: null
            }}
          />
        )}

        {/* 2. Tourist GPS Accuracy Circle */}
        {isValidCoord(touristLat, touristLng) && gpsAccuracy && gpsAccuracy > 0 && gpsAccuracy <= 150 && (
          <Circle
            center={position}
            radius={gpsAccuracy}
            pathOptions={{
              color: '#3B82F6',
              fillColor: '#60A5FA',
              fillOpacity: 0.12,
              weight: 1,
              dashArray: '3, 6'
            }}
          />
        )}

        {/* 3. Tourist Live Position Marker (Radar Pulse) */}
        {isValidCoord(touristLat, touristLng) && (
          <Marker position={position} icon={liveGpsDivIcon}>
            <Popup>
              <div className="p-1 space-y-1 min-w-[170px]">
                <div className="flex items-center justify-between gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span> You (Live GPS)
                  </span>
                  {gpsAccuracy && (
                    <span className="text-[10px] font-bold text-slate-500">±{Math.round(gpsAccuracy)}m</span>
                  )}
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 m-0 pt-0.5">Your Real-Time Location</h4>
                <p className="text-[10px] text-slate-500 font-mono m-0">
                  Lat: {touristLat.toFixed(5)}, Lng: {touristLng.toFixed(5)}
                </p>
                <div className="pt-1 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Sentinel Active
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 4. Destination Marker & Navigation Route */}
        {destPos && (
          <Marker position={destPos} icon={destinationIcon}>
            <Popup>
              <div className="p-1 space-y-1 max-w-xs">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-black uppercase">Destination</span>
                <h4 className="font-extrabold text-xs text-slate-900 m-0">{destination.name}</h4>
                <p className="text-[11px] text-slate-600 m-0 leading-snug">{destination.address}</p>
                <button
                  onClick={() => navigate(`/places/${destination.id || 'details'}`)}
                  className="mt-1 w-full py-1 rounded bg-[#0D47A1] text-white text-[10px] font-extrabold cursor-pointer"
                >
                  View Details Page
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {showRoute && destPos && (
          <Polyline
            positions={[position, destPos]}
            pathOptions={{ color: '#0D47A1', weight: 4, dashArray: '8, 8', opacity: 0.85 }}
          />
        )}

        {/* 5. Danger Zones System (Structured with Theme & Haversine Distance) */}
        {(dangerZones || []).map((zone) => {
          const lat = parseFloat(zone.latitude);
          const lng = parseFloat(zone.longitude);
          if (!isValidCoord(lat, lng)) return null;

          const theme = getDangerZoneTheme(zone);
          const radius = parseInt(zone.radius_meters || zone.radius || 500, 10);
          const distToCenter = calculateDistanceMeters(touristLat, touristLng, lat, lng);
          const isInside = distToCenter <= radius;
          const warningDist = parseInt(zone.warning_distance_meters || zone.warningDistance || 200, 10);
          const isApproaching = distToCenter > radius && distToCenter <= radius + warningDist;

          let polyCoords = null;
          if (zone.polygon_coordinates) {
            try {
              const parsed = typeof zone.polygon_coordinates === 'string' ? JSON.parse(zone.polygon_coordinates) : zone.polygon_coordinates;
              if (Array.isArray(parsed) && parsed.length > 0) {
                polyCoords = parsed.map(pt => [parseFloat(pt[0]), parseFloat(pt[1])]);
              }
            } catch (err) {
              console.warn('Failed to parse polygon coordinates', err);
            }
          }

          const pathOptions = {
            color: theme.color,
            fillColor: theme.fillColor,
            fillOpacity: isInside ? 0.45 : isApproaching ? 0.35 : 0.25,
            weight: isInside ? 3 : 2,
            dashArray: isApproaching ? '4, 6' : null
          };

          const popupContent = (
            <Popup>
              <div className="p-1 space-y-2 max-w-xs text-slate-900">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${theme.bgBadge} flex items-center gap-1`}>
                    <span>{theme.icon}</span>
                    <span>{theme.label}</span>
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    (zone.severity || '').toLowerCase() === 'critical' ? 'bg-red-600 text-white' :
                    (zone.severity || '').toLowerCase() === 'high' ? 'bg-red-500 text-white' :
                    'bg-amber-500 text-white'
                  }`}>
                    {zone.severity || 'High'} Risk
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-slate-950 m-0 leading-tight">
                    {zone.name}
                  </h4>
                  <p className="text-[11px] text-slate-700 m-0 mt-1 leading-snug">
                    {zone.description || zone.advisory_message}
                  </p>
                </div>

                {/* Safety Advice */}
                {(zone.safety_instructions || zone.precautions) && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-0.5">
                    <span className="font-extrabold text-slate-900 block text-[10px] uppercase text-blue-900">Safety Instructions:</span>
                    <p className="m-0 leading-tight font-medium">{zone.safety_instructions || zone.precautions}</p>
                  </div>
                )}

                {/* Proximity Telemetry */}
                <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-[10px] font-bold text-slate-700">
                  <span>Size/Radius: {radius}m</span>
                  <span className={isInside ? 'text-red-700 font-black' : isApproaching ? 'text-amber-700 font-black' : 'text-slate-600'}>
                    {isInside ? `🚨 Inside (${formatDistance(distToCenter)})` : `📍 ${formatDistance(distToCenter)} away`}
                  </span>
                </div>

                {/* Source & Confidence Transparency */}
                {(zone.source || zone.confidence) && (
                  <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 flex flex-col gap-0.5">
                    {zone.source && (
                      <span>
                        Source: {zone.source_url ? (
                          <a href={zone.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold inline-flex items-center gap-0.5">
                            {zone.source} <ExternalLink className="w-2.5 h-2.5 inline" />
                          </a>
                        ) : (
                          <span className="font-bold text-slate-600">{zone.source}</span>
                        )}
                      </span>
                    )}
                    {zone.confidence && (
                      <span>Confidence: <strong className="text-slate-700">{zone.confidence}</strong></span>
                    )}
                    {zone.last_verified && (
                      <span>Last Verified: <span className="font-mono">{new Date(zone.last_verified).toLocaleDateString()}</span></span>
                    )}
                  </div>
                )}

                {zone.is_sample_data ? (
                  <div className="text-[9px] text-slate-400 italic">
                    * Sample safety perimeter for demo & testing purposes
                  </div>
                ) : null}
              </div>
            </Popup>
          );

          if (polyCoords) {
            return (
              <Polygon
                key={`zone-poly-${zone.id || zone.zone_code}`}
                positions={polyCoords}
                pathOptions={pathOptions}
              >
                {popupContent}
              </Polygon>
            );
          }

          return (
            <Circle
              key={`zone-circle-${zone.id || zone.zone_code}`}
              center={[lat, lng]}
              radius={radius}
              pathOptions={pathOptions}
            >
              {popupContent}
            </Circle>
          );
        })}

        {/* 6. Red Alerts Overlay */}
        {(redAlerts || []).map((alert) => {
          const lat = parseFloat(alert.latitude);
          const lng = parseFloat(alert.longitude);
          if (!isValidCoord(lat, lng)) return null;

          return (
            <Circle
              key={`alert-${alert.id}`}
              center={[lat, lng]}
              radius={alert.radius_meters || 1000}
              pathOptions={{ color: '#D32F2F', fillColor: '#D32F2F', fillOpacity: 0.35, weight: 2 }}
            >
              <Popup>
                <div className="p-1">
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] uppercase">🚨 CRITICAL RED ALERT</span>
                  <p className="font-bold text-xs text-slate-900 mt-1 m-0">{alert.title}</p>
                  <p className="text-[11px] text-slate-600 m-0">{alert.description}</p>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* 7. Safe Locations (Police & Hospital) */}
        {(safeLocations || []).map((loc) => {
          const lat = parseFloat(loc.latitude);
          const lng = parseFloat(loc.longitude);
          if (!isValidCoord(lat, lng)) return null;

          const icon = loc.type === 'police_station' ? policeIcon : loc.type === 'hospital' ? hospitalIcon : safeIcon;
          return (
            <Marker key={`safe-${loc.id}`} position={[lat, lng]} icon={icon}>
              <Popup>
                <div className="p-1 space-y-1 max-w-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] uppercase text-slate-800">
                    {(loc.type || 'safe_location').replace('_', ' ')}
                  </span>
                  <h4 className="font-extrabold text-xs text-slate-900 m-0">{loc.name || loc.station_name || loc.hospital_name}</h4>
                  <p className="text-[11px] text-slate-600 m-0 leading-snug">{loc.address}</p>
                  <p className="text-xs font-bold text-[#0D47A1] m-0">📞 {loc.phone || loc.emergency_helpline || '112'}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 8. Nearby Amenities (Hospitals, Police, Hotels, Restaurants, Attractions) */}
        {(nearbyPlaces || []).map((place) => {
          const lat = parseFloat(place.latitude);
          const lng = parseFloat(place.longitude);
          if (!isValidCoord(lat, lng)) return null;

          const catLower = (place.category || '').toLowerCase();
          let icon = attractionIcon;

          if (catLower.includes('police')) icon = policeIcon;
          else if (catLower.includes('hospital') || catLower.includes('pharmacy')) icon = hospitalIcon;
          else if (catLower.includes('hotel') || catLower.includes('lodge')) icon = hotelIcon;
          else if (catLower.includes('restaurant') || catLower.includes('food')) icon = restaurantIcon;
          else if (catLower.includes('attraction') || catLower.includes('landmark') || catLower.includes('park')) icon = attractionIcon;

          return (
            <Marker key={`nearby-${place.id}`} position={[lat, lng]} icon={icon}>
              <Popup>
                <div className="p-1 max-w-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-extrabold text-[10px] uppercase">{place.category}</span>
                    <span className="text-[10px] font-bold text-amber-600">⭐ {place.rating || 4.8}</span>
                  </div>

                  <h4 className="font-black text-xs text-slate-900 m-0 leading-tight">{place.name}</h4>
                  <p className="text-[11px] text-slate-600 m-0 leading-snug">{place.address}</p>

                  <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-emerald-600 font-extrabold">📍 {place.formattedDistance || `${place.distanceKm} km`}</span>
                    <span>📞 {place.phone || '1800 11 1363'}</span>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    {onSelectDestination && (
                      <button
                        onClick={() => onSelectDestination({ lat, lng, name: place.name, address: place.address })}
                        className="flex-1 py-1 rounded bg-[#0D47A1] text-white text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Navigation className="w-3 h-3" /> Route
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/places/${place.id || 'details'}`)}
                      className="flex-1 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" /> Details
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 9. Incident Reports */}
        {(incidents || []).map((inc) => {
          const lat = parseFloat(inc.latitude);
          const lng = parseFloat(inc.longitude);
          if (!isValidCoord(lat, lng)) return null;

          return (
            <Marker key={`inc-${inc.id}`} position={[lat, lng]} icon={incidentIcon}>
              <Popup>
                <div className="p-1 space-y-1">
                  <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold text-[10px] uppercase">INCIDENT REPORT</span>
                  <h4 className="font-bold text-xs text-slate-800 m-0">{inc.title}</h4>
                  <p className="text-[11px] text-slate-600 m-0">{inc.description}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Floating Overlay Controls on Top Right (Inside MapContainer so useMap() has context) */}
        <MapControlsOverlay
          onRecenter={handleRecenter}
          followMe={followMe}
          setFollowMe={setFollowMe}
          gpsAccuracy={gpsAccuracy}
          isLiveTracking={isLiveTracking}
          isOffline={isOffline}
        />
      </MapContainer>

      {/* Comprehensive Map Legend Footer */}
      <div className="bg-slate-900 text-white p-2.5 text-[11px] font-semibold flex items-center justify-between overflow-x-auto gap-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-3.5 whitespace-nowrap">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span> You (Live GPS)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> 🔴 High Crime / Theft
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> 📵 No Network
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> 🐅 Wildlife Zone
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> 🚗 Accident-Prone
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 🚧 Road / Hill Curve
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> 👮 Police
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> 🏥 Hospital
          </span>
        </div>
      </div>
    </div>
  );
};

export default TouristMap;
