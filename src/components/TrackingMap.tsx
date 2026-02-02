import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom outpost icon
const outpostIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface Outpost {
  id: string;
  position: [number, number];
  name: string;
  type: "tracker" | "camera" | "sensor";
}

export interface TrackingZone {
  id: string;
  name: string;
  coordinates: [number, number][];
  color: string;
}

interface TrackingMapProps {
  center?: [number, number];
  zoom?: number;
  outposts: Outpost[];
  zones: TrackingZone[];
  onAddOutpost?: (position: [number, number]) => void;
  onAddZone?: (coordinates: [number, number][]) => void;
  isAddingOutpost?: boolean;
}

function MapClickHandler({ isAddingOutpost, onAddOutpost }: { 
  isAddingOutpost: boolean; 
  onAddOutpost?: (position: [number, number]) => void 
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      if (isAddingOutpost && onAddOutpost) {
        onAddOutpost([e.latlng.lat, e.latlng.lng]);
      }
    }
  });

  useEffect(() => {
    if (isAddingOutpost) {
      map.getContainer().style.cursor = "crosshair";
    } else {
      map.getContainer().style.cursor = "";
    }
    
    return () => {
      map.getContainer().style.cursor = "";
    };
  }, [isAddingOutpost, map]);

  return null;
}

export function TrackingMap({
  center = [-25.7479, 28.2293], // Default: Pretoria, South Africa
  zoom = 13,
  outposts,
  zones,
  onAddOutpost,
  isAddingOutpost = false,
}: TrackingMapProps) {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler isAddingOutpost={isAddingOutpost} onAddOutpost={onAddOutpost} />

        {/* Render existing zones as polygons */}
        {zones.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.coordinates}
            pathOptions={{ 
              color: zone.color, 
              fillColor: zone.color,
              fillOpacity: 0.2,
              weight: 2
            }}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold">{zone.name}</h4>
                <p className="text-sm text-gray-600">Tracking Zone</p>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Render outposts */}
        {outposts.map((outpost) => (
          <Marker key={outpost.id} position={outpost.position} icon={outpostIcon}>
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold">{outpost.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{outpost.type}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {outpost.position[0].toFixed(4)}, {outpost.position[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
