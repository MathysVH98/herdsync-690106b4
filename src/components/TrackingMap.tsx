import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
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
  zonePoints?: [number, number][];
  onMapClick?: (position: [number, number]) => void;
  isAddingOutpost?: boolean;
  isDrawingZone?: boolean;
}

function getThemeHsl(cssVar: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();
  return raw ? `hsl(${raw})` : fallback;
}

function buildPopupEl(title: string, subtitle: string, meta?: string) {
  const root = document.createElement("div");
  root.className = "p-2";

  const h = document.createElement("h4");
  h.className = "font-semibold";
  h.style.color = "#1a1a1a";
  h.textContent = title;

  const sub = document.createElement("p");
  sub.className = "text-sm";
  sub.style.color = "#666";
  sub.textContent = subtitle;

  root.appendChild(h);
  root.appendChild(sub);

  if (meta) {
    const m = document.createElement("p");
    m.className = "text-xs mt-1";
    m.style.color = "#888";
    m.textContent = meta;
    root.appendChild(m);
  }

  return root;
}

export function TrackingMap({
  center = [-25.7479, 28.2293],
  zoom = 13,
  outposts,
  zones,
  zonePoints = [],
  onMapClick,
  isAddingOutpost = false,
  isDrawingZone = false,
}: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const outpostsLayerRef = useRef<L.LayerGroup | null>(null);
  const drawingLayerRef = useRef<L.LayerGroup | null>(null);
  const primaryColorRef = useRef<string>("hsl(120 30% 20%)");
  const onMapClickRef = useRef<typeof onMapClick>(onMapClick);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Expose flyTo for external search
  const flyTo = useCallback((lat: number, lng: number, zoomLevel?: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], zoomLevel ?? 15, { duration: 1.5 });
    }
  }, []);

  // Attach flyTo to window for external access
  useEffect(() => {
    (window as any).__trackingMapFlyTo = flyTo;
    return () => {
      delete (window as any).__trackingMapFlyTo;
    };
  }, [flyTo]);

  useEffect(() => {
    if (mapRef.current) return;
    if (!containerRef.current) return;

    primaryColorRef.current = getThemeHsl("--primary", "hsl(120 30% 20%)");

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(center, zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    zonesLayerRef.current = L.layerGroup().addTo(map);
    outpostsLayerRef.current = L.layerGroup().addTo(map);
    drawingLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep view in sync
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom);
  }, [center, zoom]);

  // Toggle click mode
  useEffect(() => {
    const map = mapRef.current;
    const container = map?.getContainer();
    if (!map || !container) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!isAddingOutpost && !isDrawingZone) return;
      onMapClickRef.current?.([e.latlng.lat, e.latlng.lng]);
    };

    map.on("click", handleClick);
    container.style.cursor = (isAddingOutpost || isDrawingZone) ? "crosshair" : "";

    return () => {
      map.off("click", handleClick);
      container.style.cursor = "";
    };
  }, [isAddingOutpost, isDrawingZone]);

  // Render drawing preview (zone points being placed)
  useEffect(() => {
    const layer = drawingLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    if (zonePoints.length > 0) {
      // Draw markers for each point
      zonePoints.forEach((point, index) => {
        const marker = L.circleMarker(point as L.LatLngExpression, {
          radius: 6,
          color: primaryColorRef.current,
          fillColor: primaryColorRef.current,
          fillOpacity: 0.8,
        });
        marker.bindTooltip(`Point ${index + 1}`);
        marker.addTo(layer);
      });

      // Draw line connecting points
      if (zonePoints.length >= 2) {
        const polyline = L.polyline(zonePoints as L.LatLngExpression[], {
          color: primaryColorRef.current,
          weight: 2,
          dashArray: "5, 5",
        });
        polyline.addTo(layer);
      }

      // Draw preview polygon if we have 3+ points
      if (zonePoints.length >= 3) {
        const previewPolygon = L.polygon(zonePoints as L.LatLngExpression[], {
          color: primaryColorRef.current,
          fillColor: primaryColorRef.current,
          fillOpacity: 0.1,
          weight: 2,
          dashArray: "5, 5",
        });
        previewPolygon.addTo(layer);
      }
    }
  }, [zonePoints]);

  // Render zones
  useEffect(() => {
    const layer = zonesLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    zones.forEach((zone) => {
      const color = zone.color || primaryColorRef.current;

      const polygon = L.polygon(zone.coordinates as L.LatLngExpression[], {
        color,
        fillColor: color,
        fillOpacity: 0.2,
        weight: 2,
      });

      polygon.bindPopup(buildPopupEl(zone.name, "Tracking zone"));
      polygon.addTo(layer);
    });
  }, [zones]);

  // Render outposts
  useEffect(() => {
    const layer = outpostsLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    outposts.forEach((outpost) => {
      const marker = L.marker(outpost.position as L.LatLngExpression, { icon: outpostIcon });
      marker.bindPopup(
        buildPopupEl(
          outpost.name,
          outpost.type,
          `${outpost.position[0].toFixed(4)}, ${outpost.position[1].toFixed(4)}`
        )
      );
      marker.addTo(layer);
    });
  }, [outposts]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-xl overflow-hidden border border-border"
      aria-label="Tracking map"
    />
  );
}
