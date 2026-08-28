import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Navigation, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Custom Leaflet Icons for marker types (Requirement 9)
const createCustomIcon = (colorUrl) => new L.Icon({
  iconUrl: colorUrl,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const touristIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png');
const destinationIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png');
const safeIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png');
const policeIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png');
const hospitalIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png');
const incidentIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png');
const hotelIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png');
const restaurantIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png');
const attractionIcon = createCustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-cyan.png');

// Auto-Pan to User Position when position updates
const MapAutoPan = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position && isValidCoord(position[0], position[1])) {
      map.flyTo(position, 14, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
};

// Map Auto-Bounds Fitter (Requirement 8)
const MapBoundsFitter = ({ allPoints }) => {
  const map = useMap();
  useEffect(() => {
    const validCoords = (allPoints || []).filter(p => isValidCoord(p[0], p[1]));
    if (validCoords.length > 1) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [allPoints, map]);
  return null;
};

// Recenter Target Button — rendered via portal into map container so it sits above Leaflet canvas
const TargetLocationButton = ({ onMyLocationClick, mapContainerRef, location }) => {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(() => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          // Fly the Leaflet map to real position
          map.flyTo([lat, lng], 15, { duration: 1.2 });
          // Also notify the parent to update its GPS state
          if (onMyLocationClick) onMyLocationClick({ lat, lng });
          setLoading(false);
        },
        () => {
          // Fallback if browser permission is blocked
          if (location && isValidCoord(location.lat, location.lng)) {
            map.flyTo([parseFloat(location.lat), parseFloat(location.lng)], 15, { duration: 1.2 });
            if (onMyLocationClick) onMyLocationClick({ lat: parseFloat(location.lat), lng: parseFloat(location.lng) });
          }
          setLoading(false);
        },
        { timeout: 6000, maximumAge: 10000 }
      );
    } else {
      if (location && isValidCoord(location.lat, location.lng)) {
        map.flyTo([parseFloat(location.lat), parseFloat(location.lng)], 15, { duration: 1.2 });
        if (onMyLocationClick) onMyLocationClick({ lat: parseFloat(location.lat), lng: parseFloat(location.lng) });
      }
      setLoading(false);
    }
  }, [map, onMyLocationClick, location]);

  if (!mapContainerRef?.current) return null;

  return createPortal(
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000 }}
      className="bg-white text-slate-900 px-3.5 py-2 rounded-2xl border border-slate-300 shadow-xl font-extrabold text-xs flex items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer disabled:opacity-70"
      title="Recenter Map on My Live GPS Location"
    >
      {loading
        ? <><Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" /><span>Locating...</span></>
        : <><Compass className="w-4 h-4 text-blue-600 shrink-0" /><span>⦿ My Location</span></>}
    </button>,
    mapContainerRef.current
  );
};

// Numeric Coordinate Validation (Requirement 5)
const isValidCoord = (lat, lng) => {
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

const TouristMap = ({
  location = { lat: 11.0168, lng: 76.9558 },
  destination = null,
  safeLocations = [],
  dangerZones = [],
  redAlerts = [],
  incidents = [],
  nearbyPlaces = [],
  showRoute = false,
  onMyLocationClick = null,
  onSelectDestination = null
}) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);

  const touristLat = parseFloat(location.lat || 11.0168);
  const touristLng = parseFloat(location.lng || 76.9558);
  const position = [touristLat, touristLng];

  const destLat = destination ? parseFloat(destination.latitude || destination.lat) : null;
  const destLng = destination ? parseFloat(destination.longitude || destination.lng) : null;
  const destPos = (destLat && destLng && isValidCoord(destLat, destLng)) ? [destLat, destLng] : null;

  // Collect all active valid points for bounds calculation
  const activePoints = [position];
  if (destPos) activePoints.push(destPos);

  (nearbyPlaces || []).forEach(p => {
    if (isValidCoord(p.latitude, p.longitude)) activePoints.push([parseFloat(p.latitude), parseFloat(p.longitude)]);
  });
  (safeLocations || []).forEach(p => {
    if (isValidCoord(p.latitude, p.longitude)) activePoints.push([parseFloat(p.latitude), parseFloat(p.longitude)]);
  });
  (dangerZones || []).forEach(p => {
    if (isValidCoord(p.latitude, p.longitude)) activePoints.push([parseFloat(p.latitude), parseFloat(p.longitude)]);
  });

  return (
    <div ref={mapContainerRef} className="w-full h-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 relative z-0 flex flex-col" style={{ position: 'relative' }}>
      <MapContainer center={position} zoom={14} scrollWheelZoom={true} className="w-full h-full flex-1">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapAutoPan position={position} />
        <MapBoundsFitter allPoints={activePoints} />
        <TargetLocationButton onMyLocationClick={onMyLocationClick} mapContainerRef={mapContainerRef} location={location} />

        {/* 1. Tourist's Current GPS Location (Blue Pin) */}
        {isValidCoord(touristLat, touristLng) && (
          <Marker position={position} icon={touristIcon}>
            <Popup>
              <div className="p-1 space-y-1">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-black uppercase">You (Live GPS)</span>
                <p className="font-extrabold text-xs text-slate-900 m-0">Current Tourist Location</p>
                <p className="text-[10px] text-slate-500 font-mono m-0">Lat: {touristLat.toFixed(4)}, Lng: {touristLng.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. Destination Marker (Gold Pin) */}
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

        {/* Route Polyline */}
        {showRoute && destPos && (
          <Polyline
            positions={[position, destPos]}
            pathOptions={{ color: '#0D47A1', weight: 4, dashArray: '8, 8', opacity: 0.85 }}
          />
        )}

        {/* 3. Red Alerts Overlay */}
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

        {/* 4. Danger & Safety Zones Overlay (Dynamic Colors) */}
        {(dangerZones || []).map((zone) => {
          const lat = parseFloat(zone.latitude);
          const lng = parseFloat(zone.longitude);
          if (!isValidCoord(lat, lng)) return null;

          let color = '#FBC02D';
          let fillColor = '#FFF59D';
          const sev = (zone.severity || 'moderate').toLowerCase();

          if (sev === 'critical' || sev === 'danger') {
            color = '#D32F2F'; // RED
            fillColor = '#EF9A9A';
          } else if (sev === 'high') {
            color = '#E65100'; // ORANGE
            fillColor = '#FFCC80';
          } else if (sev === 'low' || sev === 'safe') {
            color = '#388E3C'; // GREEN
            fillColor = '#A5D6A7';
          }

          return (
            <Circle
              key={`zone-${zone.id}`}
              center={[lat, lng]}
              radius={zone.radius_meters || 600}
              pathOptions={{ color, fillColor, fillOpacity: 0.3, weight: 2 }}
            >
              <Popup>
                <div className="p-1 space-y-1">
                  <span className="px-2 py-0.5 rounded text-white font-bold text-[10px] uppercase" style={{ backgroundColor: color }}>
                    ⚠️ {sev.toUpperCase()} RISK ZONE
                  </span>
                  <h4 className="font-extrabold text-xs text-slate-900 m-0">{zone.name}</h4>
                  <p className="text-[11px] text-slate-600 m-0 leading-snug">{zone.description || zone.advisory_message}</p>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* 5. Safe Locations (Police & Hospital Icons) */}
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

        {/* 6. Nearby Service Amenities (Hospitals, Police, Hotels, Restaurants, Attractions) */}
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

        {/* 7. Incident Locations */}
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

      </MapContainer>

      {/* Map Legend Footer Bar (Requirement 9) */}
      <div className="bg-slate-900 text-white p-2.5 text-[11px] font-semibold flex items-center justify-between overflow-x-auto gap-3 border-t border-slate-800">
        <div className="flex items-center gap-3 whitespace-nowrap">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> You (Live GPS)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Destination</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> Police</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Hospital</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Hotel</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> Restaurant</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Attraction</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Danger Zone</span>
        </div>
      </div>
    </div>
  );
};

export default TouristMap;
