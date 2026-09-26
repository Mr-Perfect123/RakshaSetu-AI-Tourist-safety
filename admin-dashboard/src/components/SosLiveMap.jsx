import React, { useMemo } from 'react';
import AdminGoogleMap from './AdminGoogleMap';

const SosLiveMap = ({ activeSosList = [], safeLocations = [], liveTourists = [] }) => {
  // Center on first live tourist if available, otherwise Delhi
  const center = useMemo(() => {
    if (liveTourists.length > 0 && liveTourists[0].latitude) {
      return { lat: parseFloat(liveTourists[0].latitude), lng: parseFloat(liveTourists[0].longitude) };
    }
    return { lat: 28.6139, lng: 77.2090 };
  }, [liveTourists]);

  // Build markers for SOS emergencies
  const sosMarkers = useMemo(() => activeSosList.map((sos) => {
    const lat = parseFloat(sos.latitude || 28.6139);
    const lng = parseFloat(sos.longitude || 77.2090);
    if (isNaN(lat) || isNaN(lng)) return null;
    return {
      lat, lng,
      color: '#DC2626',
      scale: 10,
      zIndex: 999,
      title: `🚨 SOS – ${sos.tourist_name || 'Tourist'}`,
      infoHtml: `
        <div style="font-family:sans-serif;padding:6px;min-width:180px;">
          <div style="padding:2px 8px;border-radius:12px;background:#DC2626;color:#fff;font-size:10px;font-weight:900;display:inline-block;margin-bottom:4px;">🚨 ACTIVE EMERGENCY SOS</div>
          <div style="font-size:13px;font-weight:900;color:#0f172a;">${sos.tourist_name || 'Tourist'}</div>
          <div style="font-size:11px;color:#64748b;margin:2px 0;">${sos.address || 'GPS Coordinates Broadcast'}</div>
          <div style="font-size:11px;font-weight:700;color:#1D4ED8;">Code: ${sos.sos_code || 'N/A'}</div>
        </div>
      `
    };
  }).filter(Boolean), [activeSosList]);

  // Circles for SOS radius
  const sosCircles = useMemo(() => activeSosList.map((sos) => {
    const lat = parseFloat(sos.latitude || 28.6139);
    const lng = parseFloat(sos.longitude || 77.2090);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng, radius: 400, strokeColor: '#D32F2F', fillColor: '#D32F2F', fillOpacity: 0.2 };
  }).filter(Boolean), [activeSosList]);

  // Safe location markers (Police/Hospitals)
  const safeMarkers = useMemo(() => safeLocations.map((loc) => {
    const lat = parseFloat(loc.latitude);
    const lng = parseFloat(loc.longitude);
    if (isNaN(lat) || isNaN(lng)) return null;
    return {
      lat, lng,
      color: '#059669',
      scale: 7,
      title: loc.name || 'Safe Location',
      infoHtml: `
        <div style="font-family:sans-serif;padding:4px;max-width:200px;">
          <span style="padding:2px 6px;border-radius:4px;background:#D1FAE5;color:#065F46;font-size:9px;font-weight:900;">${loc.type || 'SAFE POINT'}</span>
          <div style="font-size:12px;font-weight:900;color:#0f172a;margin:2px 0;">${loc.name}</div>
          <div style="font-size:11px;color:#64748b;">${loc.address || ''}</div>
          <div style="font-size:11px;font-weight:700;color:#1D4ED8;">📞 ${loc.phone || ''}</div>
        </div>
      `
    };
  }).filter(Boolean), [safeLocations]);

  // Live tourist markers
  const touristMarkers = useMemo(() => liveTourists.map((t) => {
    const lat = parseFloat(t.latitude);
    const lng = parseFloat(t.longitude);
    if (isNaN(lat) || isNaN(lng)) return null;
    return {
      lat, lng,
      color: '#1D4ED8',
      scale: 7,
      zIndex: 500,
      title: t.touristName || `Tourist #${t.userId}`,
      infoHtml: `
        <div style="font-family:sans-serif;padding:6px;max-width:200px;">
          <span style="padding:2px 6px;border-radius:4px;background:#DBEAFE;color:#1E40AF;font-size:9px;font-weight:900;">Online Tourist</span>
          <div style="font-size:12px;font-weight:900;color:#0f172a;margin:2px 0;">${t.touristName || `Tourist #${t.userId}`}</div>
          <div style="font-size:10px;color:#64748b;font-family:monospace;">Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
          <div style="font-size:10px;color:#94a3b8;">Speed: ${t.speed || 0} km/h</div>
        </div>
      `
    };
  }).filter(Boolean), [liveTourists]);

  const allMarkers = useMemo(() => [...sosMarkers, ...safeMarkers, ...touristMarkers], [sosMarkers, safeMarkers, touristMarkers]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-md border border-slate-200 relative z-0">
      <AdminGoogleMap
        center={center}
        zoom={13}
        height="100%"
        markers={allMarkers}
        circles={sosCircles}
        scrollWheel={true}
      />
    </div>
  );
};

export default SosLiveMap;
