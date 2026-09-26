import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Navigation, ExternalLink, Loader2, Shield, Radio, AlertTriangle, Globe, MapPin, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GeofenceEngine from '../utils/geofence';

// Robust native Google Maps SDK loader that avoids breaking library changes
let _touristGoogleScriptPromise = null;
function loadGoogleMapsSdk(apiKey) {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.google && window.google.maps) return Promise.resolve(window.google.maps);
  if (_touristGoogleScriptPromise) return _touristGoogleScriptPromise;

  _touristGoogleScriptPromise = new Promise((resolve, reject) => {
    try {
      const existingScript = document.getElementById('google-maps-sdk-script');
      if (existingScript) {
        if (window.google && window.google.maps) return resolve(window.google.maps);
        existingScript.addEventListener('load', () => resolve(window.google.maps));
        existingScript.addEventListener('error', (err) => reject(err));
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-sdk-script';
      script.type = 'text/javascript';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry,visualization&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google maps object missing'));
        }
      };
      script.onerror = (e) => {
        reject(e || new Error('Failed to load Google Maps script'));
      };
      document.head.appendChild(script);
    } catch (e) {
      reject(e);
    }
  });

  return _touristGoogleScriptPromise;
}

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

// Ray-Casting Point-in-Polygon containment calculation
export const isPointInPolygon = (point, polygon) => {
  const ptLat = parseFloat(point.lat ?? point[0]);
  const ptLng = parseFloat(point.lng ?? point[1]);

  if (!Array.isArray(polygon) || polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = parseFloat(polygon[i][0] ?? polygon[i].lat);
    const yi = parseFloat(polygon[i][1] ?? polygon[i].lng);
    const xj = parseFloat(polygon[j][0] ?? polygon[j].lat);
    const yj = parseFloat(polygon[j][1] ?? polygon[j].lng);

    const intersect = yi > ptLng !== yj > ptLng && ptLat < ((xj - xi) * (ptLng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

// Danger Zone Color & Style Resolver
export const getDangerZoneTheme = (zone) => {
  if (!zone || typeof zone !== 'object') {
    return { color: '#64748B', fillColor: '#94A3B8', label: 'Safety Warning Info', icon: '🛡️', bgBadge: 'bg-slate-100 text-slate-700 border-slate-300' };
  }

  const extractTypeStr = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val.type || val.name || val.danger_type || val.crime_type || '';
    return String(val);
  };

  const rawType = extractTypeStr(zone.danger_type) || extractTypeStr(zone.dangerType) || extractTypeStr(zone.crime_type) || extractTypeStr(zone.category) || extractTypeStr(zone.type);
  const type = rawType.toUpperCase();

  if (type.includes('CRIME') || type.includes('THEFT') || type.includes('DANGER')) {
    return { color: '#B91C1C', fillColor: '#EF4444', label: 'High Crime Area', icon: '⚠️', bgBadge: 'bg-red-100 text-red-950 border-red-300' };
  }
  if (type.includes('LANDSLIDE') || type.includes('MOUNTAIN')) {
    return { color: '#C2410C', fillColor: '#F97316', label: 'Landslide Risk Area', icon: '⛰️', bgBadge: 'bg-orange-100 text-orange-900 border-orange-300' };
  }
  if (type.includes('WILDLIFE') || type.includes('ANIMAL')) {
    return { color: '#15803D', fillColor: '#4ADE80', label: 'Wildlife Crossing Area', icon: '🐅', bgBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  }
  if (type.includes('FLOOD') || type.includes('WATER') || type.includes('CURRENT')) {
    return { color: '#0284C7', fillColor: '#38BDF8', label: 'Water Hazard / Flood Risk', icon: '🌊', bgBadge: 'bg-sky-100 text-sky-800 border-sky-300' };
  }
  if (type.includes('ACCIDENT') || type.includes('HAZARD') || type.includes('CURVE')) {
    return { color: '#D97706', fillColor: '#FBBF24', label: 'Accident Prone / Road Hazard', icon: '🚗', bgBadge: 'bg-amber-100 text-amber-800 border-amber-300' };
  }
  return { color: '#DC2626', fillColor: '#F87171', label: 'Safety Hazard', icon: '⚠️', bgBadge: 'bg-red-100 text-red-800 border-red-200' };
};

export const getTemporaryAlertTheme = (alert) => {
  if (!alert) return { color: '#DC2626', fillColor: '#F87171', icon: '⚠️', label: 'Temporary Safety Alert' };

  const type = (alert.alert_type || alert.alertType || '').toUpperCase();
  const title = alert.title || '';
  const sev = (alert.severity || 'HIGH').toUpperCase();

  if (type.includes('CYCLONE') || type.includes('TYPHOON')) {
    return { color: '#4C1D95', fillColor: '#8B5CF6', icon: '🌀', label: title || 'Cyclone Warning' };
  }
  if (type.includes('FLOOD') || type.includes('TSUNAMI') || type.includes('WATER') || type.includes('SURGE')) {
    return { color: '#1E3A8A', fillColor: '#3B82F6', icon: '🌊', label: title || 'Flood / Tsunami Hazard' };
  }
  if (type.includes('RAIN') || type.includes('DOWNPOUR') || type.includes('STORM') || type.includes('THUNDERSTORM')) {
    return { color: '#1D4ED8', fillColor: '#60A5FA', icon: '🌧️', label: title || 'Heavy Rain / Severe Weather' };
  }
  if (type.includes('LANDSLIDE') || type.includes('MOUNTAIN') || type.includes('ROCKFALL') || type.includes('AVALANCHE')) {
    return { color: '#C2410C', fillColor: '#F97316', icon: '⛰️', label: title || 'Landslide / Avalanche Risk' };
  }
  if (type.includes('FIRE') || type.includes('WILDFIRE')) {
    return { color: '#B91C1C', fillColor: '#EF4444', icon: '🔥', label: title || 'Wildfire Alert' };
  }
  if (type.includes('EARTHQUAKE') || type.includes('TREMOR')) {
    return { color: '#7C2D12', fillColor: '#EA580C', icon: '🌋', label: title || 'Earthquake Danger' };
  }
  if (type.includes('ROAD') || type.includes('BRIDGE') || type.includes('CLOSURE') || type.includes('BLOCK')) {
    return { color: '#D97706', fillColor: '#FBBF24', icon: '🚧', label: title || 'Road / Bridge Closure' };
  }
  if (type.includes('EVACUATION') || type.includes('EMERGENCY')) {
    return { color: '#991B1B', fillColor: '#EF4444', icon: '🚨', label: title || 'Emergency Evacuation Zone' };
  }
  if (type.includes('RESTRICTED') || type.includes('GOVERNMENT') || type.includes('ATTRACTION')) {
    return { color: '#475569', fillColor: '#94A3B8', icon: '🏛️', label: title || 'Restricted / Attraction Closure' };
  }
  if (sev === 'CRITICAL') {
    return { color: '#991B1B', fillColor: '#EF4444', icon: '🚨', label: title || 'Critical Safety Alert' };
  }
  return { color: '#DC2626', fillColor: '#F87171', icon: '⚠️', label: title || 'Temporary Safety Alert' };
};

// Dark Mode Map Styles for Google Maps
const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f3a2f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6ee7b7' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#475569' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f8fafc' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#38bdf8' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b2447' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#60a5fa' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#0b2447' }] }
];

const GOOGLE_ROADMAP_TILES = 'https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}';
const GOOGLE_SATELLITE_TILES = 'https://mt{s}.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}';
const SUBDOMAINS = ['0', '1', '2', '3'];

const TouristMap = ({
  location = { lat: 11.0168, lng: 76.9558 },
  movementTrail = [],
  destination = null,
  safeLocations = [],
  dangerZones = [],
  redAlerts = [],
  incidents = [],
  nearbyPlaces = [],
  temporaryAlerts = [],
  onSelectTemporaryAlert = null,
  showRoute = false,
  routeGeometry = null, // GeoJSON LineString { type: 'LineString', coordinates: [[lng, lat], ...] }
  gpsAccuracy = null,
  isLiveTracking = true,
  onMyLocationClick = null,
  onSelectDestination = null,
  isOffline = false,
  onViewportChange = null,
  onMapClick = null,
  darkMode = false
}) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const [engine, setEngine] = useState('leaflet'); // Default to rock-solid Google Maps tile engine
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'

  // Google Maps Instance Refs
  const gMapRef = useRef(null);
  const gMarkersRef = useRef([]);
  const gCirclesRef = useRef([]);
  const gPolygonsRef = useRef([]);
  const gPolylinesRef = useRef([]);
  const gInfoWindowRef = useRef(null);

  // Leaflet Instance Refs
  const lMapRef = useRef(null);
  const lTileLayerRef = useRef(null);
  const lMarkersRef = useRef([]);
  const lCirclesRef = useRef([]);
  const lPolygonsRef = useRef([]);
  const lPolylinesRef = useRef([]);

  const touristLat = parseFloat(location?.lat || 11.0168);
  const touristLng = parseFloat(location?.lng || 76.9558);

  const destLat = destination ? parseFloat(destination.latitude || destination.lat) : null;
  const destLng = destination ? parseFloat(destination.longitude || destination.lng) : null;
  const hasDest = destLat && destLng && isValidCoord(destLat, destLng);

  // 1. Detect & Optional Upgrade to Google SDK if a verified paid Google Cloud key is provided
  useEffect(() => {
    let cancelled = false;

    const rawKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || (typeof window !== 'undefined' && window.VITE_GOOGLE_MAPS_API_KEY) || '';
    const isRealBilledKey = Boolean(
      rawKey &&
      rawKey.trim().startsWith('AIzaSy') &&
      rawKey.trim().length >= 35 &&
      !rawKey.includes('YOUR_GOOGLE_MAPS_API_KEY') &&
      !rawKey.includes('RakshaSetu') &&
      !rawKey.includes('GeneralAccess')
    );

    // If no real Google Cloud key, remain on the high-performance Google tile engine
    if (!isRealBilledKey) {
      setEngine('leaflet');
      return;
    }

    // Handle Google Maps Authentication failure
    const prevAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      console.warn('[TouristMap] Google Maps SDK auth failed. Seamlessly activating Google Basemap engine.');
      if (!cancelled) setEngine('leaflet');
      if (typeof prevAuthFailure === 'function') prevAuthFailure();
    };

    if (window.google && window.google.maps) {
      setEngine('google');
      return;
    }

    loadGoogleMapsSdk(rawKey.trim())
      .then(() => {
        if (!cancelled) setEngine('google');
      })
      .catch((err) => {
        console.warn('[TouristMap] Google SDK load error, falling back to Google Basemap engine:', err.message);
        if (!cancelled) setEngine('leaflet');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 2A. GOOGLE MAPS ENGINE INITIALIZATION
  useEffect(() => {
    if (engine !== 'google' || !mapContainerRef.current || gMapRef.current) return;

    try {
      const initialCenter = { lat: touristLat, lng: touristLng };
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 15,
        mapTypeId: mapType === 'satellite' ? 'hybrid' : 'roadmap',
        gestureHandling: 'greedy',
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: true,
        fullscreenControl: true,
        styles: darkMode ? GOOGLE_MAPS_DARK_STYLE : []
      });

      gInfoWindowRef.current = new window.google.maps.InfoWindow();

      if (onViewportChange) {
        map.addListener('idle', () => {
          const bounds = map.getBounds();
          if (bounds) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            onViewportChange({
              minLat: sw.lat(),
              maxLat: ne.lat(),
              minLng: sw.lng(),
              maxLng: ne.lng()
            });
          }
        });
      }

      if (onMapClick) {
        map.addListener('click', (e) => {
          if (e.latLng) {
            onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }
        });
      }

      gMapRef.current = map;
    } catch {
      setEngine('leaflet');
    }
  }, [engine, darkMode, onViewportChange, onMapClick]);

  // Sync Google Map Dark Mode & Map Type
  useEffect(() => {
    if (engine === 'google' && gMapRef.current) {
      gMapRef.current.setOptions({
        styles: darkMode ? GOOGLE_MAPS_DARK_STYLE : [],
        mapTypeId: mapType === 'satellite' ? 'hybrid' : 'roadmap'
      });
    }
  }, [darkMode, mapType, engine]);

  // Google Maps Overlays Update
  useEffect(() => {
    if (engine !== 'google' || !gMapRef.current || !window.google?.maps) return;

    const map = gMapRef.current;
    const gmaps = window.google.maps;

    // Clear previous
    gMarkersRef.current.forEach(m => m.setMap(null));
    gCirclesRef.current.forEach(c => c.setMap(null));
    gPolygonsRef.current.forEach(p => p.setMap(null));
    gPolylinesRef.current.forEach(pl => pl.setMap(null));
    gMarkersRef.current = [];
    gCirclesRef.current = [];
    gPolygonsRef.current = [];
    gPolylinesRef.current = [];

    const bounds = new gmaps.LatLngBounds();
    let hasBoundsPoints = false;

    // A. Tourist Current GPS Location Marker
    if (isValidCoord(touristLat, touristLng)) {
      const userLatLng = { lat: touristLat, lng: touristLng };
      bounds.extend(userLatLng);
      hasBoundsPoints = true;

      const userMarker = new gmaps.Marker({
        position: userLatLng,
        map,
        title: 'Your Real-Time Location (Live GPS)',
        zIndex: 1000,
        icon: {
          path: gmaps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#1D4ED8',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3
        }
      });

      userMarker.addListener('click', () => {
        if (gInfoWindowRef.current) {
          gInfoWindowRef.current.setContent(`
            <div style="font-family:sans-serif; padding:6px; min-width:180px;">
              <div style="display:inline-block; padding:2px 8px; border-radius:12px; background:#1D4ED8; color:#fff; font-size:10px; font-weight:900; text-transform:uppercase;">
                You (Live GPS)
              </div>
              <h4 style="margin:4px 0 2px; font-size:12px; font-weight:900; color:#0f172a;">Your Real-Time Location</h4>
              <p style="margin:0; font-size:11px; color:#64748b; font-family:monospace;">Lat: ${touristLat.toFixed(5)}, Lng: ${touristLng.toFixed(5)}</p>
              <div style="margin-top:4px; font-size:10px; color:#059669; font-weight:700;">✓ RakshaSetu Sentinel Active</div>
            </div>
          `);
          gInfoWindowRef.current.open(map, userMarker);
        }
      });
      gMarkersRef.current.push(userMarker);

      if (gpsAccuracy && gpsAccuracy > 0 && gpsAccuracy <= 200) {
        const accCircle = new gmaps.Circle({
          center: userLatLng,
          radius: gpsAccuracy,
          map,
          fillColor: '#60A5FA',
          fillOpacity: 0.12,
          strokeColor: '#3B82F6',
          strokeWeight: 1,
          clickable: false
        });
        gCirclesRef.current.push(accCircle);
      }
    }

    // B. Destination & Route
    if (hasDest) {
      const destLatLng = { lat: destLat, lng: destLng };
      bounds.extend(destLatLng);
      hasBoundsPoints = true;

      const destMarker = new gmaps.Marker({
        position: destLatLng,
        map,
        title: destination.name || 'Destination',
        zIndex: 900,
        icon: {
          path: gmaps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#D97706',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });
      gMarkersRef.current.push(destMarker);
    }

    if (showRoute && routeGeometry?.coordinates && Array.isArray(routeGeometry.coordinates)) {
      const routePath = routeGeometry.coordinates
        .map(([lon, lat]) => {
          const nLat = parseFloat(lat);
          const nLon = parseFloat(lon);
          if (isValidCoord(nLat, nLon)) {
            bounds.extend({ lat: nLat, lng: nLon });
            hasBoundsPoints = true;
            return { lat: nLat, lng: nLon };
          }
          return null;
        })
        .filter(Boolean);

      if (routePath.length >= 2) {
        const routePoly = new gmaps.Polyline({
          path: routePath,
          map,
          strokeColor: '#0D47A1',
          strokeOpacity: 0.9,
          strokeWeight: 6,
          zIndex: 800
        });
        gPolylinesRef.current.push(routePoly);
      }
    }

    // C. Danger Zones
    (dangerZones || []).forEach(zone => {
      const zLat = parseFloat(zone.latitude);
      const zLng = parseFloat(zone.longitude);
      const isPolygon = zone.geometry_type === 'polygon';
      if (!isValidCoord(zLat, zLng) && !isPolygon) return;

      const theme = getDangerZoneTheme(zone);
      const radius = parseInt(zone.radius_meters || zone.radius || 500, 10);

      const zoneContent = `
        <div style="font-family:sans-serif; padding:6px; max-width:240px; color:#0f172a;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:4px; margin-bottom:4px;">
            <span style="padding:2px 6px; border-radius:10px; background:#FEE2E2; color:#991B1B; font-size:10px; font-weight:900;">
              ${theme.icon} ${theme.label}
            </span>
            <span style="padding:2px 4px; border-radius:4px; background:#DC2626; color:#fff; font-size:9px; font-weight:900;">
              ${zone.severity || 'HIGH'}
            </span>
          </div>
          <h4 style="margin:2px 0 4px; font-size:13px; font-weight:900;">${zone.name || 'Danger Zone'}</h4>
          <p style="margin:0 0 4px; font-size:11px; color:#334155;">${zone.description || zone.advisory_message || ''}</p>
          ${zone.safety_instructions ? `<div style="font-size:10px; color:#B91C1C;"><strong>Advice:</strong> ${zone.safety_instructions}</div>` : ''}
        </div>
      `;

      if (isPolygon && zone.polygon_coordinates) {
        const polyCoords = GeofenceEngine.normalizePolygonCoordinates(zone.polygon_coordinates);
        if (Array.isArray(polyCoords) && polyCoords.length >= 3) {
          const gPoly = new gmaps.Polygon({
            paths: polyCoords.map(pt => ({ lat: pt[0], lng: pt[1] })),
            map,
            fillColor: theme.fillColor,
            fillOpacity: 0.25,
            strokeColor: theme.color,
            strokeWeight: 2,
            zIndex: 300
          });
          gPoly.addListener('click', (e) => {
            if (gInfoWindowRef.current && e.latLng) {
              gInfoWindowRef.current.setContent(zoneContent);
              gInfoWindowRef.current.setPosition(e.latLng);
              gInfoWindowRef.current.open(map);
            }
          });
          gPolygonsRef.current.push(gPoly);
        }
      } else {
        const circle = new gmaps.Circle({
          center: { lat: zLat, lng: zLng },
          radius,
          map,
          fillColor: theme.fillColor,
          fillOpacity: 0.25,
          strokeColor: theme.color,
          strokeWeight: 2,
          zIndex: 300
        });
        circle.addListener('click', (e) => {
          if (gInfoWindowRef.current && e.latLng) {
            gInfoWindowRef.current.setContent(zoneContent);
            gInfoWindowRef.current.setPosition(e.latLng);
            gInfoWindowRef.current.open(map);
          }
        });
        gCirclesRef.current.push(circle);
      }
    });

    // D. Safe Locations
    (safeLocations || []).forEach(loc => {
      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);
      if (!isValidCoord(lat, lng)) return;
      const marker = new gmaps.Marker({
        position: { lat, lng },
        map,
        title: loc.name || 'Safe Location',
        icon: {
          path: gmaps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#059669',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });
      gMarkersRef.current.push(marker);
    });

    if (hasBoundsPoints && hasDest) {
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [engine, touristLat, touristLng, destLat, destLng, hasDest, showRoute, routeGeometry, dangerZones, temporaryAlerts, safeLocations]);

  // 2B. LEAFLET RESILIENT HIGH-FIDELITY ENGINE (Google Maps Tiles)
  useEffect(() => {
    if (engine !== 'leaflet' || !mapContainerRef.current) return;

    if (mapContainerRef.current) {
      if (lMapRef.current) {
        try { lMapRef.current.remove(); } catch {}
        lMapRef.current = null;
      }
      if (mapContainerRef.current._leaflet_id) {
        delete mapContainerRef.current._leaflet_id;
      }
    }

    const map = L.map(mapContainerRef.current, {
      center: [touristLat, touristLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: true
    });

    const tileUrl = mapType === 'satellite' ? GOOGLE_SATELLITE_TILES : GOOGLE_ROADMAP_TILES;
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: SUBDOMAINS,
      attribution: '&copy; Google Maps'
    }).addTo(map);

    lTileLayerRef.current = tileLayer;
    lMapRef.current = map;

    if (onViewportChange) {
      map.on('moveend', () => {
        const bounds = map.getBounds();
        onViewportChange({
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast()
        });
      });
    }

    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    const timer1 = setTimeout(() => {
      if (map) map.invalidateSize();
    }, 60);

    const timer2 = setTimeout(() => {
      if (map) map.invalidateSize();
    }, 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (lMapRef.current) {
        try { lMapRef.current.remove(); } catch {}
        lMapRef.current = null;
      }
    };
  }, [engine]);

  // Switch Leaflet Tile Layer on MapType Change
  useEffect(() => {
    if (engine !== 'leaflet' || !lMapRef.current) return;
    if (lTileLayerRef.current) {
      lMapRef.current.removeLayer(lTileLayerRef.current);
    }
    const tileUrl = mapType === 'satellite' ? GOOGLE_SATELLITE_TILES : GOOGLE_ROADMAP_TILES;
    lTileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: SUBDOMAINS,
      attribution: '&copy; Google Maps'
    }).addTo(lMapRef.current);
  }, [mapType, engine]);

  // Leaflet Overlays Update
  useEffect(() => {
    if (engine !== 'leaflet' || !lMapRef.current) return;
    const map = lMapRef.current;

    // Clear previous
    lMarkersRef.current.forEach(m => map.removeLayer(m));
    lCirclesRef.current.forEach(c => map.removeLayer(c));
    lPolygonsRef.current.forEach(p => map.removeLayer(p));
    lPolylinesRef.current.forEach(pl => map.removeLayer(pl));
    lMarkersRef.current = [];
    lCirclesRef.current = [];
    lPolygonsRef.current = [];
    lPolylinesRef.current = [];

    const boundsPoints = [];

    // A. Tourist Current GPS Location Marker (Radar Pin)
    if (isValidCoord(touristLat, touristLng)) {
      boundsPoints.push([touristLat, touristLng]);

      const touristIcon = L.divIcon({
        className: 'tourist-gps-pin',
        html: `
          <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:30px; height:30px; border-radius:50%; background:rgba(37,99,235,0.3); animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position:relative; width:16px; height:16px; border-radius:50%; background:#1D4ED8; border:3px solid #FFFFFF; box-shadow:0 2px 8px rgba(0,0,0,0.45);"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const userMarker = L.marker([touristLat, touristLng], { icon: touristIcon, zIndexOffset: 1000 }).addTo(map);
      userMarker.bindPopup(`
        <div style="font-family:sans-serif; padding:4px; min-width:180px;">
          <span style="display:inline-block; padding:2px 8px; border-radius:12px; background:#1D4ED8; color:#fff; font-size:10px; font-weight:900;">LIVE GPS</span>
          <h4 style="margin:4px 0 2px; font-size:12px; font-weight:900; color:#0f172a;">Your Real-Time Location</h4>
          <p style="margin:0; font-size:11px; color:#64748b; font-family:monospace;">Lat: ${touristLat.toFixed(5)}, Lng: ${touristLng.toFixed(5)}</p>
          <div style="margin-top:4px; font-size:10px; color:#059669; font-weight:700;">✓ RakshaSetu Sentinel Active</div>
        </div>
      `);
      lMarkersRef.current.push(userMarker);

      if (gpsAccuracy && gpsAccuracy > 0 && gpsAccuracy <= 200) {
        const accCircle = L.circle([touristLat, touristLng], {
          radius: gpsAccuracy,
          color: '#3B82F6',
          fillColor: '#60A5FA',
          fillOpacity: 0.12,
          weight: 1
        }).addTo(map);
        lCirclesRef.current.push(accCircle);
      }
    }

    // B. Destination Marker
    if (hasDest) {
      boundsPoints.push([destLat, destLng]);

      const destIcon = L.divIcon({
        className: 'dest-pin',
        html: `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
            <div style="width:24px; height:24px; background:#D97706; border:2px solid #FFFFFF; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; font-weight:900; box-shadow:0 2px 6px rgba(0,0,0,0.4);">🎯</div>
            <div style="width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:6px solid #D97706;"></div>
          </div>
        `,
        iconSize: [24, 30],
        iconAnchor: [12, 30]
      });

      const destMarker = L.marker([destLat, destLng], { icon: destIcon, zIndexOffset: 900 }).addTo(map);
      destMarker.bindPopup(`
        <div style="font-family:sans-serif; padding:4px; max-width:200px;">
          <span style="display:inline-block; padding:2px 6px; border-radius:4px; background:#FEF3C7; color:#92400E; font-size:10px; font-weight:900;">DESTINATION</span>
          <h4 style="margin:4px 0 2px; font-size:12px; font-weight:900;">${destination.name || 'Selected Place'}</h4>
          <p style="margin:0; font-size:10px; color:#475569;">${destination.address || ''}</p>
        </div>
      `);
      lMarkersRef.current.push(destMarker);
    }

    // C. Route Line
    if (showRoute && routeGeometry?.coordinates && Array.isArray(routeGeometry.coordinates)) {
      const latLngs = routeGeometry.coordinates
        .map(([lon, lat]) => [parseFloat(lat), parseFloat(lon)])
        .filter(([lat, lon]) => isValidCoord(lat, lon));

      if (latLngs.length >= 2) {
        latLngs.forEach(pt => boundsPoints.push(pt));
        const polyline = L.polyline(latLngs, {
          color: '#0D47A1',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round'
        }).addTo(map);
        lPolylinesRef.current.push(polyline);
      }
    }

    // D. Permanent Danger Zones
    (dangerZones || []).forEach(zone => {
      const zLat = parseFloat(zone.latitude);
      const zLng = parseFloat(zone.longitude);
      const isPolygon = zone.geometry_type === 'polygon';
      if (!isValidCoord(zLat, zLng) && !isPolygon) return;

      const theme = getDangerZoneTheme(zone);
      const radius = parseInt(zone.radius_meters || zone.radius || 500, 10);

      const zoneContent = `
        <div style="font-family:sans-serif; padding:6px; max-width:240px; color:#0f172a;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:4px; margin-bottom:4px;">
            <span style="padding:2px 6px; border-radius:10px; background:#FEE2E2; color:#991B1B; font-size:10px; font-weight:900;">
              ${theme.icon} ${theme.label}
            </span>
            <span style="padding:2px 4px; border-radius:4px; background:#DC2626; color:#fff; font-size:9px; font-weight:900;">
              ${(zone.severity || 'HIGH').toUpperCase()}
            </span>
          </div>
          <h4 style="margin:2px 0 4px; font-size:13px; font-weight:900;">${zone.name || 'Danger Zone'}</h4>
          <p style="margin:0 0 4px; font-size:11px; color:#334155; line-height:1.3;">${zone.description || zone.advisory_message || ''}</p>
          ${zone.safety_instructions ? `<div style="padding:4px 6px; border-radius:6px; background:#FEF2F2; font-size:10px; color:#991B1B;"><strong>Advice:</strong> ${zone.safety_instructions}</div>` : ''}
          <div style="margin-top:4px; font-size:9px; color:#64748B;">Radius: ${radius}m • Source: ${zone.source || 'RakshaSetu HQ'}</div>
        </div>
      `;

      if (isPolygon && zone.polygon_coordinates) {
        const polyCoords = GeofenceEngine.normalizePolygonCoordinates(zone.polygon_coordinates);
        if (Array.isArray(polyCoords) && polyCoords.length >= 3) {
          const poly = L.polygon(polyCoords, {
            color: theme.color,
            fillColor: theme.fillColor,
            fillOpacity: 0.28,
            weight: 2
          }).addTo(map);
          poly.bindPopup(zoneContent);
          lPolygonsRef.current.push(poly);
        }
      } else {
        const circle = L.circle([zLat, zLng], {
          radius,
          color: theme.color,
          fillColor: theme.fillColor,
          fillOpacity: 0.28,
          weight: 2
        }).addTo(map);
        circle.bindPopup(zoneContent);
        lCirclesRef.current.push(circle);
      }
    });

    // E. Dynamic Temporary Safety Alerts
    (temporaryAlerts || []).forEach(alert => {
      const aLat = parseFloat(alert.latitude);
      const aLng = parseFloat(alert.longitude);
      const isPolygon = (alert.geometry_type || '').toLowerCase() === 'polygon';
      if (!isValidCoord(aLat, aLng) && !isPolygon) return;

      const theme = getTemporaryAlertTheme(alert);
      const radius = parseInt(alert.radius_meters || 500, 10);

      const alertContent = `
        <div style="font-family:sans-serif; padding:6px; max-width:240px; color:#0f172a;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:4px; margin-bottom:4px;">
            <span style="padding:2px 6px; border-radius:8px; background:${theme.color}; color:#fff; font-size:10px; font-weight:900;">
              ${theme.icon} ${theme.label}
            </span>
            <span style="padding:2px 4px; border-radius:4px; background:#FEE2E2; color:#991B1B; font-size:9px; font-weight:900;">
              ${alert.severity || 'HIGH'}
            </span>
          </div>
          <h4 style="margin:2px 0 2px; font-size:12px; font-weight:900; color:${theme.color};">${alert.title}</h4>
          <p style="margin:0 0 4px; font-size:11px; color:#334155;">${alert.description || ''}</p>
          ${alert.safety_instruction ? `<div style="font-size:10px; color:#991B1B;"><strong>Advice:</strong> ${alert.safety_instruction}</div>` : ''}
        </div>
      `;

      if (isPolygon && alert.polygon_coordinates) {
        const polyCoords = GeofenceEngine.normalizePolygonCoordinates(alert.polygon_coordinates);
        if (Array.isArray(polyCoords) && polyCoords.length >= 3) {
          const poly = L.polygon(polyCoords, {
            color: theme.color,
            fillColor: theme.fillColor,
            fillOpacity: 0.35,
            weight: 3
          }).addTo(map);
          poly.bindPopup(alertContent);
          if (onSelectTemporaryAlert) poly.on('click', () => onSelectTemporaryAlert(alert));
          lPolygonsRef.current.push(poly);
        }
      } else {
        const circle = L.circle([aLat, aLng], {
          radius,
          color: theme.color,
          fillColor: theme.fillColor,
          fillOpacity: 0.35,
          weight: 2.5
        }).addTo(map);
        circle.bindPopup(alertContent);
        if (onSelectTemporaryAlert) circle.on('click', () => onSelectTemporaryAlert(alert));
        lCirclesRef.current.push(circle);
      }

      if (isValidCoord(aLat, aLng)) {
        const icon = L.divIcon({
          className: 'temp-alert-pin',
          html: `<div style="width:20px;height:20px;background:${theme.color};border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-size:11px;">${theme.icon}</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        const m = L.marker([aLat, aLng], { icon }).addTo(map);
        m.bindPopup(alertContent);
        if (onSelectTemporaryAlert) m.on('click', () => onSelectTemporaryAlert(alert));
        lMarkersRef.current.push(m);
      }
    });

    // F. Safe Locations
    (safeLocations || []).forEach(loc => {
      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);
      if (!isValidCoord(lat, lng)) return;
      const icon = L.divIcon({
        className: 'safe-loc-pin',
        html: `<div style="width:14px;height:14px;background:#059669;border:2px solid #FFFFFF;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.35);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      const m = L.marker([lat, lng], { icon }).addTo(map);
      m.bindPopup(`
        <div style="font-family:sans-serif; padding:4px;">
          <span style="font-size:9px; font-weight:900; color:#065F46;">🛡️ SAFE POINT</span>
          <h4 style="margin:2px 0; font-size:12px; font-weight:900;">${loc.name}</h4>
          <p style="margin:0; font-size:10px; color:#64748B;">${loc.address || ''}</p>
        </div>
      `);
      lMarkersRef.current.push(m);
    });

    // Fit bounds if destination active
    if (boundsPoints.length >= 2 && hasDest) {
      map.fitBounds(boundsPoints, { padding: [50, 50] });
    }
  }, [engine, touristLat, touristLng, destLat, destLng, hasDest, showRoute, routeGeometry, dangerZones, temporaryAlerts, safeLocations, onSelectTemporaryAlert]);

  // Recenter Handler
  const handleRecenter = () => {
    if (isValidCoord(touristLat, touristLng)) {
      if (engine === 'google' && gMapRef.current) {
        gMapRef.current.panTo({ lat: touristLat, lng: touristLng });
        gMapRef.current.setZoom(15);
      } else if (engine === 'leaflet' && lMapRef.current) {
        lMapRef.current.setView([touristLat, touristLng], 15, { animate: true });
      }
    }
    if (onMyLocationClick) {
      onMyLocationClick({ lat: touristLat, lng: touristLng });
    }
  };

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800 relative z-0 flex flex-col select-none" style={{ position: 'relative' }}>
      {engine === 'detecting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs rounded-2xl z-20 text-white">
          <div className="flex items-center gap-2 text-xs font-bold bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-700 shadow-xl">
            <MapPin className="w-4 h-4 animate-bounce text-blue-400" />
            Initializing Google Maps Basemap...
          </div>
        </div>
      )}

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" style={{ minHeight: '350px', height: '100%', width: '100%' }} />

      {/* Map Type Switcher (Map / Satellite) */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
        <button
          type="button"
          onClick={() => {
            setMapType('roadmap');
            if (gMapRef.current) gMapRef.current.setMapTypeId('roadmap');
          }}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${mapType === 'roadmap' ? 'bg-[#0D47A1] text-white shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => {
            setMapType('satellite');
            if (gMapRef.current) gMapRef.current.setMapTypeId('hybrid');
          }}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${mapType === 'satellite' ? 'bg-[#0D47A1] text-white shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Satellite
        </button>
      </div>

      {/* Recenter / My Location Floating Button */}
      <button
        type="button"
        onClick={handleRecenter}
        className="absolute bottom-6 right-6 z-[1000] p-3 rounded-2xl bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xl border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black"
        title="Recenter to my GPS location"
      >
        <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>My Location</span>
      </button>
    </div>
  );
};

export default TouristMap;
