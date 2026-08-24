import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix standard marker icon issue in Leaflet + Vite
const sosIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const safeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const touristIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const SosLiveMap = ({ activeSosList = [], safeLocations = [], liveTourists = [] }) => {
  // Center on active tourist if online, fallback to Delhi
  const center = liveTourists && liveTourists.length > 0 && liveTourists[0].latitude
    ? [parseFloat(liveTourists[0].latitude), parseFloat(liveTourists[0].longitude)]
    : [28.6139, 77.2090];

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-md border border-slate-200 relative z-0">
      <MapContainer center={center} zoom={13} scrollWheelZoom={true} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Active Emergency SOS Markers */}
        {(activeSosList || []).map((sos) => {
          const lat = parseFloat(sos.latitude || 28.6139);
          const lng = parseFloat(sos.longitude || 77.2090);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <React.Fragment key={sos.id || sos.sos_code || Math.random()}>
              <Marker position={[lat, lng]} icon={sosIcon}>
                <Popup>
                  <div className="p-1">
                    <div className="text-danger font-bold text-xs uppercase mb-1">🚨 ACTIVE EMERGENCY SOS</div>
                    <div className="text-sm font-semibold text-slate-800">{sos.tourist_name || 'John Doe Tourist'}</div>
                    <div className="text-xs text-slate-500 mt-1">{sos.address || 'GPS Coordinates Broadcast'}</div>
                    <div className="text-xs font-bold text-primary mt-2">Code: {sos.sos_code}</div>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[lat, lng]}
                radius={400}
                pathOptions={{ color: '#D32F2F', fillColor: '#D32F2F', fillOpacity: 0.25 }}
              />
            </React.Fragment>
          );
        })}

        {/* Verified Safe Locations (Police & Hospitals) */}
        {(safeLocations || []).map((loc) => {
          const lat = parseFloat(loc.latitude || 28.6139);
          const lng = parseFloat(loc.longitude || 77.2090);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker key={loc.id || Math.random()} position={[lat, lng]} icon={safeIcon}>
              <Popup>
                <div className="p-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">{loc.type}</span>
                  <div className="text-sm font-bold text-slate-800 mt-1">{loc.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{loc.address}</div>
                  <div className="text-xs font-semibold text-primary mt-1">📞 {loc.phone}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Live Active Tourists (Blue Markers) */}
        {(liveTourists || []).map((t) => {
          const lat = parseFloat(t.latitude);
          const lng = parseFloat(t.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker key={`tourist-${t.userId}`} position={[lat, lng]} icon={touristIcon}>
              <Popup>
                <div className="p-1.5 space-y-1">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">Online Tourist</span>
                  <div className="text-xs font-bold text-slate-800">{t.touristName || `Tourist #${t.userId}`}</div>
                  <div className="text-[10px] text-slate-500">User ID: {t.userId}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Coords: {lat.toFixed(4)}, {lng.toFixed(4)}</div>
                  <div className="text-[9px] text-slate-400">Speed: {t.speed || 0} km/h | Updated: {new Date(t.timestamp).toLocaleTimeString()}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default SosLiveMap;
