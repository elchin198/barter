import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Azərbaycan şəhərlərinin koordinatları
export const CITY_COORDINATES: Record<string, [number, number]> = {
  'Bakı': [40.3777, 49.8920],
  'Gəncə': [40.6830, 46.3606],
  'Sumqayıt': [40.5892, 49.6266],
  'Mingəçevir': [40.7639, 47.0593],
  'Naxçıvan': [39.2087, 45.4121],
  'Şəki': [41.1911, 47.1694],
  'Lənkəran': [38.7544, 48.8522],
  'Şirvan': [39.9482, 48.9203],
  'Şəmkir': [40.8297, 46.0164],
  'Zaqatala': [41.6514, 46.6400],
  'Quba': [41.3750, 48.5125],
  'Xaçmaz': [41.4628, 48.8050],
  'Göyçay': [40.6500, 47.7400],
};

// Center map on location
interface SetViewProps {
  center: [number, number];
  zoom: number;
}

function SetViewOnLoad({ center, zoom }: SetViewProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

// Location map props
interface LocationMapProps {
  markers?: Array<{
    id: number;
    position: [number, number];
    title: string;
    city?: string;
    imageUrl?: string;
  }>;
  center?: [number, number];
  zoom?: number;
  height?: string;
  width?: string;
  singleMarker?: boolean;
  interactive?: boolean;
}

export default function LocationMap({ 
  markers = [], 
  center = [40.3777, 49.8920], // Bakı default
  zoom = 10,
  height = '400px',
  width = '100%',
  singleMarker = false,
  interactive = true
}: LocationMapProps) {
  const { t } = useTranslation();
  const mapRef = useRef(null);

  return (
    <div style={{ height, width }} className="rounded-lg overflow-hidden border border-gray-200">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }} 
        scrollWheelZoom={interactive}
        dragging={interactive}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <SetViewOnLoad center={center} zoom={zoom} />
        
        {markers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={marker.position}
            icon={customIcon}
          >
            <Popup>
              <div className="flex flex-col gap-2 py-1">
                <h3 className="font-semibold text-sm">{marker.title}</h3>
                {marker.city && (
                  <p className="text-xs text-gray-600">{marker.city}</p>
                )}
                {marker.imageUrl && (
                  <div className="w-full h-20 overflow-hidden rounded-md mb-1">
                    <img 
                      src={marker.imageUrl} 
                      alt={marker.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {!singleMarker && (
                  <Button asChild size="sm" className="mt-1 w-full">
                    <Link to={`/items/${marker.id}`}>
                      {t('items.viewDetails')}
                    </Link>
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// Helper to get coordinates from city name
export function getCityCoordinates(cityName: string): [number, number] {
  return CITY_COORDINATES[cityName] || [40.3777, 49.8920]; // Default to Bakı if not found
}