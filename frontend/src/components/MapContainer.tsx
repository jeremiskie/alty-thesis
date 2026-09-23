import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Property } from '../types';

// Fix default leaflet marker icon issue in Webpack/Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
}

// Controller component to re-center the map when property selection changes
const MapRecenter: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
};

export const PropertyMap: React.FC<MapProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
}) => {
  const validProperties = properties.filter((p) => p.lat !== null && p.lng !== null);
  const defaultCenter: [number, number] = validProperties.length > 0 && validProperties[0].lat && validProperties[0].lng
    ? [validProperties[0].lat, validProperties[0].lng]
    : [14.5995, 120.9842]; // Default Manila coordinates

  const activeCenter = selectedProperty?.lat && selectedProperty?.lng
    ? { lat: selectedProperty.lat, lng: selectedProperty.lng }
    : validProperties.length > 0 && validProperties[0].lat && validProperties[0].lng
    ? { lat: validProperties[0].lat, lng: validProperties[0].lng }
    : null;

  return (
    <div className="h-full w-full relative min-h-[400px]">
      <MapContainer center={defaultCenter} zoom={12} className="h-full w-full rounded-xl z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {activeCenter && <MapRecenter lat={activeCenter.lat} lng={activeCenter.lng} />}
        {validProperties.map((prop) => (
          <Marker
            key={prop.listing_id}
            position={[prop.lat!, prop.lng!]}
            eventHandlers={{
              click: () => onSelectProperty(prop),
            }}
          >
            <Popup>
              <div className="p-1 max-w-xs">
                <h4 className="font-bold text-sm">{prop.title}</h4>
                <p className="text-xs text-gray-600">{prop.village_name}</p>
                <p className="text-sm font-semibold text-emerald-600 mt-1">
                  ₱{prop.price_total.toLocaleString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};