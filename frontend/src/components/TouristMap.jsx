import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass } from 'lucide-react';

// Custom Leaflet Icons for marker types
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

const MapAutoPan = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.flyTo(position, 14, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
};

const TargetLocationButton = ({ onMyLocationClick }) => {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => {
        if (onMyLocationClick) onMyLocationClick(map);
      }}
      className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-md text-slate-900 px-3.5 py-2 rounded-2xl border border-slate-300 shadow-xl font-extrabold text-xs flex items-center gap-2 hover:bg-slate-100 transition-all cursor-pointer"
      title="Recenter Map on My Live GPS Location"
    >
      <Compass className="w-4 h-4 text-blue-600 shrink-0" />
      <span>⦿ My Location</span>
    </button>
  );
};

const TouristMap = ({
  location = { lat: 27.1751, lng: 78.0421 },
  destination = null,
  safeLocations = [],
  dangerZones = [],
  redAlerts = [],
  incidents = [],
  nearbyPlaces = [],
  showRoute = false,
  onMyLocationClick = null
}) => {
  const position = [parseFloat(location.lat), parseFloat(location.lng)];
  const destPos = destination ? [parseFloat(destination.latitude || destination.lat), parseFloat(destination.longitude || destination.lng)] : null;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 relative z-0 flex flex-col">
      <MapContainer center={position} zoom={14} scrollWheelZoom={true} className="w-full h-full flex-1">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapAutoPan position={position} />
        <TargetLocationButton onMyLocationClick={onMyLocationClick} />

        {/* 1. Tourist's Current GPS Location (Blue) */}
        <Marker position={position} icon={touristIcon}>
          <Popup>
            <div className="p-1">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">Your Location</span>
              <p className="font-bold text-xs text-slate-800 mt-1 m-0">Live Tourist GPS Position</p>
              <p className="text-[10px] text-slate-500 font-mono m-0">Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</p>
            </div>
          </Popup>
        </Marker>

        {/* 2. Destination Marker (Gold) */}
        {destPos && (
          <Marker position={destPos} icon={destinationIcon}>
            <Popup>
              <div className="p-1">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">Destination</span>
                <p className="font-bold text-xs text-slate-800 mt-1 m-0">{destination.name}</p>
                <p className="text-[10px] text-slate-500 m-0">{destination.address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline from Tourist Location to Destination */}
        {showRoute && destPos && (
          <Polyline
            positions={[position, destPos]}
            pathOptions={{ color: '#0D47A1', weight: 4, dashArray: '8, 8', opacity: 0.8 }}
          />
        )}

        {/* 3. Red Alerts Overlay (Dark Red Pulsing Circles) */}
        {(redAlerts || []).map((alert) => (
          <Circle
            key={`alert-${alert.id}`}
            center={[parseFloat(alert.latitude), parseFloat(alert.longitude)]}
            radius={alert.radius_meters || 1000}
            pathOptions={{ color: '#D32F2F', fillColor: '#D32F2F', fillOpacity: 0.3, weight: 2 }}
          >
            <Popup>
              <div className="p-1">
                <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] uppercase">🚨 CRITICAL RED ALERT</span>
                <p className="font-bold text-xs text-slate-900 mt-1 m-0">{alert.title}</p>
                <p className="text-[11px] text-slate-600 m-0">{alert.description}</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* 4. Danger Zones Overlay (Dynamic Severity Risk Colors) */}
        {(dangerZones || []).map((zone) => {
          let color = '#FBC02D'; // default yellow
          let fillColor = '#FFF59D';
          const sev = (zone.severity || 'moderate').toLowerCase();

          if (sev === 'critical') {
            color = '#D32F2F'; // RED
            fillColor = '#EF9A9A';
          } else if (sev === 'high') {
            color = '#E65100'; // ORANGE
            fillColor = '#FFCC80';
          } else if (sev === 'moderate') {
            color = '#FBC02D'; // YELLOW
            fillColor = '#FFF59D';
          } else if (sev === 'low' || sev === 'safe') {
            color = '#388E3C'; // GREEN
            fillColor = '#A5D6A7';
          }

          return (
            <Circle
              key={`zone-${zone.id}`}
              center={[parseFloat(zone.latitude), parseFloat(zone.longitude)]}
              radius={zone.radius_meters || 500}
              pathOptions={{ color, fillColor, fillOpacity: 0.25, weight: 1.5 }}
            >
              <Popup>
                <div className="p-1">
                  <span className={`px-2 py-0.5 rounded text-white font-bold text-[10px] uppercase`} style={{ backgroundColor: color }}>
                    ⚠️ {sev.toUpperCase()} RISK ZONE
                  </span>
                  <p className="font-bold text-xs text-slate-800 mt-2 m-0">{zone.name}</p>
                  <p className="text-[11px] text-slate-600 m-0 mt-1">{zone.description || zone.advisory_message}</p>
                  {zone.crime_type && <p className="text-[10px] text-slate-500 font-bold m-0 mt-1">Incident: {zone.crime_type}</p>}
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* 5. Safe Locations & Police/Hospitals */}
        {(safeLocations || []).map((loc) => {
          const icon = loc.type === 'police_station' ? policeIcon : loc.type === 'hospital' ? hospitalIcon : safeIcon;
          return (
            <Marker key={`safe-${loc.id}`} position={[parseFloat(loc.latitude), parseFloat(loc.longitude)]} icon={icon}>
              <Popup>
                <div className="p-1">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] uppercase text-slate-700">
                    {(loc.type || 'safe_location').replace('_', ' ')}
                  </span>
                  <p className="font-bold text-xs text-slate-800 mt-1 m-0">{loc.name || loc.station_name || loc.hospital_name}</p>
                  <p className="text-[11px] text-slate-600 m-0">{loc.address}</p>
                  <p className="text-xs font-bold text-[#0D47A1] mt-1 m-0">📞 {loc.phone || loc.emergency_helpline}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 6. Nearby Service Amenities (Hotels, Restaurants, Pharmacies, ATMs, Fuel) */}
        {(nearbyPlaces || []).map((place) => {
          const catLower = (place.category || '').toLowerCase();
          const icon = catLower.includes('police')
            ? policeIcon
            : catLower.includes('hospital') || catLower.includes('pharmacy')
              ? hospitalIcon
              : catLower.includes('hotel')
                ? hotelIcon
                : restaurantIcon;

          return (
            <Marker key={`nearby-${place.id}`} position={[parseFloat(place.latitude), parseFloat(place.longitude)]} icon={icon}>
              <Popup>
                <div className="p-1 max-w-xs space-y-1">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px] uppercase">{place.category}</span>
                  <h4 className="font-extrabold text-xs text-slate-900 m-0">{place.name}</h4>
                  <p className="text-[11px] text-slate-600 m-0 leading-tight">{place.address}</p>
                  <div className="text-[10px] font-bold text-[#0D47A1] flex justify-between pt-1">
                    <span>📍 {place.formattedDistance || `${place.distanceKm} km`}</span>
                    <span>📞 {place.phone}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 7. Incident Locations (Orange Markers) */}
        {(incidents || []).map((inc) => (
          <Marker key={`inc-${inc.id}`} position={[parseFloat(inc.latitude), parseFloat(inc.longitude)]} icon={incidentIcon}>
            <Popup>
              <div className="p-1">
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold text-[10px] uppercase">INCIDENT REPORT</span>
                <p className="font-bold text-xs text-slate-800 mt-1 m-0">{inc.title}</p>
                <p className="text-[11px] text-slate-600 m-0">{inc.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Footer Bar */}
      <div className="bg-slate-900 text-white p-2.5 text-[11px] font-semibold flex items-center justify-between overflow-x-auto gap-3 border-t border-slate-800">
        <div className="flex items-center gap-3 whitespace-nowrap">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> You (Live GPS)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Destination</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> Police</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Hospital</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Hotel</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> Restaurant</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Danger Zone</span>
        </div>
      </div>
    </div>
  );
};

export default TouristMap;
