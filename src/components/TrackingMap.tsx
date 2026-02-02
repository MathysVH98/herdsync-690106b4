import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, FeatureGroup, Marker, Popup, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

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

  useEffect(() => {
    if (!isAddingOutpost || !onAddOutpost) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onAddOutpost([e.latlng.lat, e.latlng.lng]);
    };

    map.on("click", handleClick);
    map.getContainer().style.cursor = "crosshair";

    return () => {
      map.off("click", handleClick);
      map.getContainer().style.cursor = "";
    };
  }, [isAddingOutpost, onAddOutpost, map]);

  return null;
}

export function TrackingMap({
  center = [-25.7479, 28.2293], // Default: Pretoria, South Africa
  zoom = 13,
  outposts,
  zones,
  onAddOutpost,
  onAddZone,
  isAddingOutpost = false,
}: TrackingMapProps) {
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  const handleCreated = (e: any) => {
    const { layer, layerType } = e;

    if (layerType === "polygon" || layerType === "rectangle") {
      const coordinates = layer.getLatLngs()[0].map((latlng: L.LatLng) => [
        latlng.lat,
        latlng.lng,
      ]) as [number, number][];
      onAddZone?.(coordinates);
    }
  };

  return (
    <div className="map-container h-full w-full">
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

        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onCreated={handleCreated}
            draw={{
              rectangle: {
                shapeOptions: {
                  color: "#2d5a27",
                  fillOpacity: 0.2,
                },
              },
              polygon: {
                allowIntersection: false,
                shapeOptions: {
                  color: "#2d5a27",
                  fillOpacity: 0.2,
                },
              },
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
            }}
          />
        </FeatureGroup>

        {/* Render existing zones */}
        {zones.map((zone) => (
          <FeatureGroup key={zone.id}>
            {/* Zone polygons would be rendered here */}
          </FeatureGroup>
        ))}

        {/* Render outposts */}
        {outposts.map((outpost) => (
          <Marker key={outpost.id} position={outpost.position} icon={outpostIcon}>
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold text-foreground">{outpost.name}</h4>
                <p className="text-sm text-muted-foreground capitalize">{outpost.type}</p>
                <p className="text-xs text-muted-foreground mt-1">
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
