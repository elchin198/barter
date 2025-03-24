import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import * as L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ExternalLink, MapPin } from 'lucide-react';

// Custom marker icons
const blueIcon = new L.Icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: '/marker-icon-green.png',
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
  cityName?: string;
  className?: string;
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

  const [isGoogleMapsOpen, setIsGoogleMapsOpen] = useState(false);
  
  // Open in Google Maps
  const openInGoogleMaps = () => {
    // For individual marker
    if (markers.length === 1 && singleMarker) {
      const [lat, lng] = markers[0].position;
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    } 
    // For city center
    else {
      const [lat, lng] = center;
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }
  };

  return (
    <div style={{ height, width }} className="rounded-lg overflow-hidden border border-gray-200 relative">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }} 
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ZoomControl position="bottomright" />
        <SetViewOnLoad center={center} zoom={zoom} />
        
        {markers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={marker.position}
            icon={singleMarker ? greenIcon : blueIcon}
          >
            <Popup>
              <div className="flex flex-col gap-2 py-1">
                <h3 className="font-semibold text-sm">{marker.title}</h3>
                {marker.city && (
                  <p className="text-xs text-gray-600 flex items-center">
                    <MapPin className="h-3 w-3 mr-1 text-blue-500" />
                    {marker.city}
                  </p>
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
                <div className="flex gap-2 mt-1">
                  {!singleMarker && (
                    <Button asChild size="sm" className="flex-1">
                      <Link to={`/items/${marker.id}`}>
                        {t('items.viewDetails', 'Ətraflı')}
                      </Link>
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://www.google.com/maps/search/?api=1&query=${marker.position[0]},${marker.position[1]}`, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t('map.googleMaps', 'Google Maps')}
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Google Maps button */}
      {interactive && (
        <Button 
          variant="outline" 
          size="sm" 
          className="absolute top-3 right-3 z-[1000] bg-white shadow-md flex items-center gap-2"
          onClick={openInGoogleMaps}
        >
          <ExternalLink className="h-3 w-3" />
          {t('map.openInGoogleMaps', 'Google Maps-da aç')}
        </Button>
      )}
    </div>
  );
}

// Helper to get coordinates from city name
export function getCityCoordinates(cityName: string): [number, number] {
  return CITY_COORDINATES[cityName] || [40.3777, 49.8920]; // Default to Bakı if not found
}