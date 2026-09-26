import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, ZoomIn, ZoomOut, Layers } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || (typeof window !== 'undefined' && window.VITE_GOOGLE_MAPS_API_KEY) || 'AIzaSyRakshaSetuMapKey_GeneralAccess2026';

let _drawerGoogleScriptPromise = null;
function loadDrawerGoogleSdk(apiKey) {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.google && window.google.maps) return Promise.resolve(window.google.maps);
  if (_drawerGoogleScriptPromise) return _drawerGoogleScriptPromise;

  _drawerGoogleScriptPromise = new Promise((resolve, reject) => {
    try {
      if (!apiKey || apiKey.includes('YOUR_GOOGLE_MAPS_API_KEY')) {
        return reject(new Error('MISSING_KEY'));
      }
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey.trim())}&libraries=places,geometry,visualization&loading=async`;
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

  return _drawerGoogleScriptPromise;
}

const GOOGLE_ROADMAP_TILES = 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
const GOOGLE_SATELLITE_TILES = 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
const SUBDOMAINS = ['0', '1', '2', '3'];

export default function AdminGoogleMapDrawer({
  centerLat = 11.0168,
  centerLng = 76.9558,
  geometryType = 'circle',
  radius = 1000,
  polygonCoords = [],
  onSetCircleCenter,
  onAddPolygonPoint
}) {
  const mapContainerRef = useRef(null);
  const [engine, setEngine] = useState('detecting'); // 'google' | 'leaflet' | 'detecting'
  const [mapType, setMapType] = useState('roadmap');

  // Google Maps Refs
  const gMapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const polygonRef = useRef(null);
  const vertexMarkersRef = useRef([]);
  const clickListenerRef = useRef(null);

  // Leaflet Refs
  const lMapRef = useRef(null);
  const lTileLayerRef = useRef(null);
  const lCenterMarkerRef = useRef(null);
  const lCircleRef = useRef(null);
  const lPolygonRef = useRef(null);
  const lVertexMarkersRef = useRef([]);

  const latNum = parseFloat(centerLat) || 11.0168;
  const lngNum = parseFloat(centerLng) || 76.9558;

  // 1. Engine Detection
  useEffect(() => {
    let cancelled = false;

    const prevAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      console.warn('[Admin Drawer Map] Google SDK unauthenticated, switching to Google Tiles.');
      if (!cancelled) setEngine('leaflet');
      if (typeof prevAuthFailure === 'function') prevAuthFailure();
    };

    if (window.google && window.google.maps) {
      setEngine('google');
      return;
    }

    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.includes('YOUR_GOOGLE_MAPS_API_KEY')) {
      setEngine('leaflet');
      return;
    }

    loadDrawerGoogleSdk(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (!cancelled) setEngine('google');
      })
      .catch(() => {
        if (!cancelled) setEngine('leaflet');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 2A. Initialize Google Maps
  useEffect(() => {
    if (engine !== 'google' || !mapContainerRef.current || gMapRef.current) return;

    try {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: latNum, lng: lngNum },
        zoom: 13,
        mapTypeId: mapType === 'satellite' ? 'hybrid' : 'roadmap',
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true
      });
      gMapRef.current = map;
    } catch {
      setEngine('leaflet');
    }
  }, [engine]);

  // Google Maps Click Listener
  useEffect(() => {
    if (engine !== 'google' || !gMapRef.current || !window.google) return;
    if (clickListenerRef.current) {
      window.google.maps.event.removeListener(clickListenerRef.current);
    }

    clickListenerRef.current = gMapRef.current.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (geometryType === 'circle') {
        if (onSetCircleCenter) onSetCircleCenter(lat, lng);
      } else if (geometryType === 'polygon') {
        if (onAddPolygonPoint) onAddPolygonPoint([lat, lng]);
      }
    });

    return () => {
      if (clickListenerRef.current) {
        window.google.maps.event.removeListener(clickListenerRef.current);
      }
    };
  }, [engine, geometryType, onSetCircleCenter, onAddPolygonPoint]);

  // Google Maps Shape Rendering
  useEffect(() => {
    if (engine !== 'google' || !gMapRef.current || !window.google) return;
    const map = gMapRef.current;

    // Clean up
    if (markerRef.current) markerRef.current.setMap(null);
    if (circleRef.current) circleRef.current.setMap(null);
    if (polygonRef.current) polygonRef.current.setMap(null);
    vertexMarkersRef.current.forEach(m => m.setMap(null));
    vertexMarkersRef.current = [];

    if (geometryType === 'circle') {
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        markerRef.current = new window.google.maps.Marker({
          position: { lat: latNum, lng: lngNum },
          map,
          title: 'Selected Hazard Center',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        });

        circleRef.current = new window.google.maps.Circle({
          center: { lat: latNum, lng: lngNum },
          radius: Number(radius) || 1000,
          map,
          strokeColor: '#DC2626',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#EF4444',
          fillOpacity: 0.25
        });
      }
    } else if (geometryType === 'polygon' && Array.isArray(polygonCoords) && polygonCoords.length > 0) {
      const path = polygonCoords.map(pt => ({
        lat: Number(pt[0] ?? pt.lat),
        lng: Number(pt[1] ?? pt.lng)
      })).filter(pt => !isNaN(pt.lat) && !isNaN(pt.lng));

      polygonRef.current = new window.google.maps.Polygon({
        paths: path,
        map,
        strokeColor: '#7C3AED',
        strokeOpacity: 0.9,
        strokeWeight: 2.5,
        fillColor: '#8B5CF6',
        fillOpacity: 0.28
      });

      path.forEach((pt, idx) => {
        const vMarker = new window.google.maps.Marker({
          position: pt,
          map,
          label: {
            text: `${idx + 1}`,
            color: '#FFFFFF',
            fontSize: '10px',
            fontWeight: 'bold'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#7C3AED',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        });
        vertexMarkersRef.current.push(vMarker);
      });
    }
  }, [engine, geometryType, latNum, lngNum, radius, polygonCoords]);

  // 2B. Initialize Leaflet High-Fidelity Engine
  useEffect(() => {
    if (engine !== 'leaflet' || !mapContainerRef.current) return;

    if (lMapRef.current) {
      lMapRef.current.remove();
      lMapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [latNum, lngNum],
      zoom: 13,
      zoomControl: true
    });

    const tileUrl = mapType === 'satellite' ? GOOGLE_SATELLITE_TILES : GOOGLE_ROADMAP_TILES;
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: SUBDOMAINS,
      attribution: '&copy; Google Maps'
    }).addTo(map);

    lTileLayerRef.current = tileLayer;
    lMapRef.current = map;

    map.on('click', (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      if (geometryType === 'circle') {
        if (onSetCircleCenter) onSetCircleCenter(lat, lng);
      } else if (geometryType === 'polygon') {
        if (onAddPolygonPoint) onAddPolygonPoint([lat, lng]);
      }
    });

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (lMapRef.current) {
        lMapRef.current.remove();
        lMapRef.current = null;
      }
    };
  }, [engine]);

  // Leaflet Tile Type Toggle
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

  // Leaflet Center Pan
  useEffect(() => {
    if (engine !== 'leaflet' || !lMapRef.current) return;
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      lMapRef.current.setView([latNum, lngNum], lMapRef.current.getZoom(), { animate: true });
    }
  }, [latNum, lngNum, engine]);

  // Leaflet Shape Rendering
  useEffect(() => {
    if (engine !== 'leaflet' || !lMapRef.current) return;
    const map = lMapRef.current;

    // Clean up old
    if (lCenterMarkerRef.current) map.removeLayer(lCenterMarkerRef.current);
    if (lCircleRef.current) map.removeLayer(lCircleRef.current);
    if (lPolygonRef.current) map.removeLayer(lPolygonRef.current);
    lVertexMarkersRef.current.forEach(m => map.removeLayer(m));
    lVertexMarkersRef.current = [];

    if (geometryType === 'circle') {
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        const markerIcon = L.divIcon({
          className: 'custom-circle-pin',
          html: '<div style="width:16px;height:16px;background:#EF4444;border:2px solid #FFFFFF;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        lCenterMarkerRef.current = L.marker([latNum, lngNum], { icon: markerIcon }).addTo(map);

        lCircleRef.current = L.circle([latNum, lngNum], {
          radius: Number(radius) || 1000,
          color: '#DC2626',
          fillColor: '#EF4444',
          fillOpacity: 0.25,
          weight: 2
        }).addTo(map);
      }
    } else if (geometryType === 'polygon' && Array.isArray(polygonCoords) && polygonCoords.length > 0) {
      const path = polygonCoords.map(pt => [
        Number(pt[0] ?? pt.lat),
        Number(pt[1] ?? pt.lng)
      ]).filter(pt => !isNaN(pt[0]) && !isNaN(pt[1]));

      if (path.length > 0) {
        lPolygonRef.current = L.polygon(path, {
          color: '#7C3AED',
          fillColor: '#8B5CF6',
          fillOpacity: 0.28,
          weight: 2.5
        }).addTo(map);

        path.forEach((pt, idx) => {
          const vIcon = L.divIcon({
            className: 'custom-vertex-pin',
            html: `<div style="width:20px;height:20px;background:#7C3AED;color:#fff;border:2px solid #FFFFFF;border-radius:50%;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${idx + 1}</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          const vm = L.marker(pt, { icon: vIcon }).addTo(map);
          lVertexMarkersRef.current.push(vm);
        });
      }
    }
  }, [engine, geometryType, latNum, lngNum, radius, polygonCoords]);

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900" style={{ height: '340px' }}>
      {engine === 'detecting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs z-10 text-white">
          <div className="flex items-center gap-2 text-xs font-bold bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-700">
            <MapPin className="w-4 h-4 animate-bounce text-blue-400" />
            Initializing Google Maps Basemap...
          </div>
        </div>
      )}

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Layer Toggle (Map / Satellite) */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200 text-[11px] font-bold text-slate-700">
        <button
          type="button"
          onClick={() => {
            setMapType('roadmap');
            if (gMapRef.current) gMapRef.current.setMapTypeId('roadmap');
          }}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${mapType === 'roadmap' ? 'bg-[#0D47A1] text-white' : 'hover:bg-slate-100'}`}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => {
            setMapType('satellite');
            if (gMapRef.current) gMapRef.current.setMapTypeId('hybrid');
          }}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${mapType === 'satellite' ? 'bg-[#0D47A1] text-white' : 'hover:bg-slate-100'}`}
        >
          Satellite
        </button>
      </div>

      {/* Live Helper Tooltip */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none bg-slate-950/85 text-white backdrop-blur border border-slate-700 rounded-xl px-4 py-1.5 text-xs font-bold shadow-lg flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-amber-400" />
        {geometryType === 'circle'
          ? 'Click anywhere on map to position hazard center'
          : `Click map to append vertex points (${polygonCoords.length} added)`}
      </div>
    </div>
  );
}
