import { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Locate, Search, Layers, Globe } from "lucide-react";
import { toast } from "sonner";

const icon = L.divIcon({
  className: "",
  html: '<div style="background:hsl(217 91% 60%);width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px hsl(217 91% 60%),0 4px 8px rgba(0,0,0,0.3);"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const MAHARASHTRA_BOUNDS = L.latLngBounds([14.5, 71.0], [23.0, 82.0]);
const MAHARASHTRA_CENTER = [19.75, 75.71];

const TILES = {
  map: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://osm.org/copyright">OSM</a>',
    label: "Map",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    label: "Satellite",
  },
};

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], map.getZoom() || 13);
  }, [lat, lng, map]);
  return null;
}

export function MapPicker({ value, onChange, defaultCenter = MAHARASHTRA_CENTER }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [layer, setLayer] = useState("map");
  const lat = value?.lat != null ? Number(value.lat) : null;
  const lng = value?.lng != null ? Number(value.lng) : null;
  const debounceRef = useRef(null);

  const center = useMemo(() => (lat != null && lng != null ? [lat, lng] : defaultCenter), [lat, lng, defaultCenter]);

  const reverseGeocode = async (la, ln) => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${la}&lon=${ln}&zoom=16`, {
        headers: { "Accept-Language": "en" },
      });
      const j = await r.json();
      return j.display_name || "";
    } catch { return ""; }
  };

  const pick = async (la, ln) => {
    if (!MAHARASHTRA_BOUNDS.contains([la, ln])) return;
    onChange({ lat: la, lng: ln, address: value?.address || "" });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const addr = await reverseGeocode(la, ln);
      if (addr) onChange({ lat: la, lng: ln, address: addr });
    }, 400);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const la = p.coords.latitude, ln = p.coords.longitude;
        if (!MAHARASHTRA_BOUNDS.contains([la, ln])) {
          setBusy(false);
          return toast.error("Location is outside Maharashtra");
        }
        pick(la, ln);
        setBusy(false);
        toast.success("Location captured");
      },
      () => { toast.error("Location permission denied"); setBusy(false); },
    );
  };

  const search = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q + " Maharashtra India")}`);
      const j = await r.json();
      if (j[0]) {
        const la = parseFloat(j[0].lat), ln = parseFloat(j[0].lon);
        if (!MAHARASHTRA_BOUNDS.contains([la, ln])) {
          toast.error("Result is outside Maharashtra");
        } else {
          onChange({ lat: la, lng: ln, address: j[0].display_name });
          toast.success("Location found");
        }
      } else {
        toast.error("No results for that address");
      }
    } catch { toast.error("Address search failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={search} className="flex gap-2" data-testid="map-search-form">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search address, e.g. 'Nashik, Maharashtra'"
            className="pl-8 h-9"
            data-testid="map-search-input"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={busy} data-testid="map-search-btn">Search</Button>
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={busy} data-testid="map-use-loc-btn">
          <Locate className="h-3.5 w-3.5" />
        </Button>
      </form>
      <div className="relative overflow-hidden rounded-md border border-border" style={{ height: 220 }}>
        <MapContainer
          center={center}
          zoom={lat && lng ? 14 : 7}
          minZoom={6}
          maxZoom={18}
          maxBounds={MAHARASHTRA_BOUNDS}
          maxBoundsViscosity={1.0}
          scrollWheelZoom
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            key={layer}
            attribution={TILES[layer].attribution}
            url={TILES[layer].url}
          />
          <ClickHandler onPick={pick} />
          <Recenter lat={lat} lng={lng} />
          {lat != null && lng != null && (
            <Marker
              position={[lat, lng]}
              icon={icon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const p = e.target.getLatLng();
                  pick(p.lat, p.lng);
                },
              }}
            />
          )}
        </MapContainer>
        {/* Layer toggle */}
        <div className="absolute right-2 top-2 z-[1000] flex overflow-hidden rounded-md border border-border shadow-md">
          <button
            type="button"
            onClick={() => setLayer("map")}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium transition-colors ${
              layer === "map" ? "bg-background text-foreground" : "bg-background/60 text-muted-foreground hover:bg-background/80"
            }`}
            data-testid="map-layer-btn"
          >
            <Globe className="h-3 w-3" /> Map
          </button>
          <button
            type="button"
            onClick={() => setLayer("satellite")}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium transition-colors ${
              layer === "satellite" ? "bg-background text-foreground" : "bg-background/60 text-muted-foreground hover:bg-background/80"
            }`}
            data-testid="satellite-layer-btn"
          >
            <Layers className="h-3 w-3" /> Satellite
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {lat != null && lng != null ? (
          <span className="font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
        ) : (
          <span>Click the map, drag marker, or search an address</span>
        )}
      </div>
    </div>
  );
}
