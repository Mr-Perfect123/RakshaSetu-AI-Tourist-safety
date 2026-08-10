import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const touristIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const policeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Auto-pan component: moves map center when location changes
const MapAutoPan = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.flyTo(position, map.getZoom(), { duration: 1.5 });
    }
  }, [position, map]);

  return null;
};

const TouristMap = ({ location = { lat: 28.6120, lng: 77.2050 }, safeLocations = [] }) => {
  const position = [parseFloat(location.lat), parseFloat(location.lng)];

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 relative z-0">
      <MapContainer center={position} zoom={14} scrollWheelZoom={true} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-pan to tourist's real GPS location when it updates */}
        <MapAutoPan position={position} />

        {/* Current Tourist GPS Pin */}
        <Marker position={position} icon={touristIcon}>
          <Popup>
            <div className="p-1">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-primary text-[10px] font-bold uppercase">Your Location</span>
              <p className="font-bold text-xs text-slate-800 mt-1">Live GPS Position</p>
              <p className="text-[10px] text-slate-500 font-mono">Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</p>
            </div>
          </Popup>
        </Marker>

        <Circle
          center={position}
          radius={300}
          pathOptions={{ color: '#0D47A1', fillColor: '#1565C0', fillOpacity: 0.15 }}
        />

        {/* Nearby Police & Hospitals */}
        {safeLocations.map((loc) => {
          const icon = loc.type === 'police_station' ? policeIcon : hospitalIcon;
          return (
            <Marker key={loc.id} position={[parseFloat(loc.latitude), parseFloat(loc.longitude)]} icon={icon}>
              <Popup>
                <div className="p-1">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] uppercase text-slate-700">
                    {loc.type.replace('_', ' ')}
                  </span>
                  <p className="font-bold text-xs text-slate-800 mt-1">{loc.name}</p>
                  <p className="text-[11px] text-slate-600">{loc.address}</p>
                  <p className="text-xs font-bold text-primary mt-1">📞 {loc.phone}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default TouristMap;
