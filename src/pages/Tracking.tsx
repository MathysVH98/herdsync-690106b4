import { useState } from "react";
import { Layout } from "@/components/Layout";
import { TrackingMap, Outpost, TrackingZone } from "@/components/TrackingMap";
import { LocationSearch } from "@/components/LocationSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MapPin, 
  Plus, 
  Radio, 
  Camera, 
  Wifi,
  Layers,
  Target,
  Trash2,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockOutposts: Outpost[] = [
  { id: "1", position: [-25.7450, 28.2250], name: "North Gate Tracker", type: "tracker" },
  { id: "2", position: [-25.7510, 28.2350], name: "Cattle Pen Camera", type: "camera" },
  { id: "3", position: [-25.7480, 28.2200], name: "Water Point Sensor", type: "sensor" },
];

const mockZones: TrackingZone[] = [
  { 
    id: "1", 
    name: "Main Grazing Area", 
    coordinates: [[-25.7400, 28.2200], [-25.7400, 28.2350], [-25.7520, 28.2350], [-25.7520, 28.2200]], 
    color: "hsl(var(--primary))" 
  },
];

const outpostTypeIcons = {
  tracker: Radio,
  camera: Camera,
  sensor: Wifi,
};

export default function Tracking() {
  const [outposts, setOutposts] = useState<Outpost[]>(mockOutposts);
  const [zones, setZones] = useState<TrackingZone[]>(mockZones);
  const [isAddingOutpost, setIsAddingOutpost] = useState(false);
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [zonePoints, setZonePoints] = useState<[number, number][]>([]);
  const [pendingOutpost, setPendingOutpost] = useState<[number, number] | null>(null);
  const [pendingZone, setPendingZone] = useState<[number, number][] | null>(null);
  const [newOutpostName, setNewOutpostName] = useState("");
  const [newOutpostType, setNewOutpostType] = useState<"tracker" | "camera" | "sensor">("tracker");
  const [newZoneName, setNewZoneName] = useState("");
  const { toast } = useToast();

  const handleMapClick = (position: [number, number]) => {
    if (isAddingOutpost) {
      setPendingOutpost(position);
      setIsAddingOutpost(false);
    } else if (isDrawingZone) {
      setZonePoints(prev => [...prev, position]);
    }
  };

  const finishZoneDrawing = () => {
    if (zonePoints.length >= 3) {
      setPendingZone(zonePoints);
      setIsDrawingZone(false);
    } else {
      toast({
        title: "Not Enough Points",
        description: "A zone needs at least 3 points to form a polygon.",
        variant: "destructive",
      });
    }
  };

  const confirmAddZone = () => {
    if (!pendingZone || !newZoneName) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for the zone.",
        variant: "destructive",
      });
      return;
    }

    const newZone: TrackingZone = {
      id: Date.now().toString(),
      name: newZoneName,
      coordinates: pendingZone,
      color: "hsl(var(--primary))",
    };

    setZones([...zones, newZone]);
    setPendingZone(null);
    setZonePoints([]);
    setNewZoneName("");

    toast({
      title: "Zone Created",
      description: `${newZone.name} has been added to the map.`,
    });
  };

  const confirmAddOutpost = () => {
    if (!pendingOutpost || !newOutpostName) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for the outpost.",
        variant: "destructive",
      });
      return;
    }

    const newOutpost: Outpost = {
      id: Date.now().toString(),
      position: pendingOutpost,
      name: newOutpostName,
      type: newOutpostType,
    };

    setOutposts([...outposts, newOutpost]);
    setPendingOutpost(null);
    setNewOutpostName("");
    setNewOutpostType("tracker");

    toast({
      title: "Outpost Added",
      description: `${newOutpost.name} has been placed on the map.`,
    });
  };

  const removeZone = (id: string) => {
    const zone = zones.find(z => z.id === id);
    setZones(zones.filter(z => z.id !== id));
    toast({
      title: "Zone Removed",
      description: `${zone?.name} has been removed.`,
    });
  };

  const removeOutpost = (id: string) => {
    const outpost = outposts.find(o => o.id === id);
    setOutposts(outposts.filter(o => o.id !== id));
    toast({
      title: "Outpost Removed",
      description: `${outpost?.name} has been removed.`,
    });
  };

  return (
    <Layout>
      <div className="relative space-y-6 h-full">
        {/* Under Development Overlay */}
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
          {/* Blur overlay */}
          <div className="absolute inset-0 backdrop-blur-[2px] bg-background/30" />
          
          {/* Cross tape - top-left to bottom-right */}
          <div 
            className="absolute bg-warning text-warning-foreground font-bold text-lg tracking-widest py-3 text-center shadow-lg"
            style={{
              width: '150%',
              left: '-25%',
              top: '35%',
              transform: 'rotate(-35deg)',
              transformOrigin: 'center',
            }}
          >
            🚧 UNDER DEVELOPMENT • COMING SOON • UNDER DEVELOPMENT • COMING SOON • UNDER DEVELOPMENT 🚧
          </div>
          
          {/* Cross tape - top-right to bottom-left */}
          <div 
            className="absolute bg-warning text-warning-foreground font-bold text-lg tracking-widest py-3 text-center shadow-lg"
            style={{
              width: '150%',
              left: '-25%',
              top: '55%',
              transform: 'rotate(35deg)',
              transformOrigin: 'center',
            }}
          >
            🚧 UNDER DEVELOPMENT • COMING SOON • UNDER DEVELOPMENT • COMING SOON • UNDER DEVELOPMENT 🚧
          </div>
        </div>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">
              Land Tracking
            </h1>
            <p className="text-muted-foreground mt-1">
              Define tracking zones and place outpost markers on your land
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant={isAddingOutpost ? "destructive" : "outline"}
              onClick={() => {
                setIsAddingOutpost(!isAddingOutpost);
                setIsDrawingZone(false);
              }}
            >
              {isAddingOutpost ? (
                <>Cancel</>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Add Outpost
                </>
              )}
            </Button>
            <Button 
              variant={isDrawingZone ? "destructive" : "outline"}
              onClick={() => {
                setIsDrawingZone(!isDrawingZone);
                setIsAddingOutpost(false);
                if (isDrawingZone) {
                  setZonePoints([]);
                }
              }}
            >
              {isDrawingZone ? (
                <>Cancel</>
              ) : (
                <>
                  <Layers className="w-4 h-4 mr-2" />
                  Draw Zone
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Location Search */}
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Search Location</h3>
          </div>
          <LocationSearch 
            onLocationSelect={(lat, lng, name) => {
              toast({
                title: "Location Found",
                description: `Navigated to ${name.split(",")[0]}`,
              });
            }}
          />
        </div>

        {isAddingOutpost && (
          <div className="bg-accent/20 border border-accent rounded-lg p-4 flex items-center gap-3 pointer-events-none">
            <Target className="w-5 h-5 text-accent-foreground animate-pulse" />
            <p className="text-sm text-accent-foreground">
              Click anywhere on the map to place an outpost marker
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3 h-[500px] lg:h-[600px]">
            <TrackingMap
              outposts={outposts}
              zones={zones}
              zonePoints={zonePoints}
              onMapClick={handleMapClick}
              isAddingOutpost={isAddingOutpost}
              isDrawingZone={isDrawingZone}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructions */}
            <div className="card-elevated p-4">
              <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Drawing Tools
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Click "Add Outpost" then click the map to place trackers</p>
                <p>• Click "Draw Zone" then click points to define boundaries</p>
                <p>• Click "Finish Zone" when done drawing (min 3 points)</p>
              </div>
              {isDrawingZone && zonePoints.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {zonePoints.length} point{zonePoints.length !== 1 ? 's' : ''} placed
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={finishZoneDrawing}
                    disabled={zonePoints.length < 3}
                  >
                    Finish Zone
                  </Button>
                </div>
              )}
            </div>

            {/* Outposts List */}
            <div className="card-elevated p-4">
              <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4" />
                Outposts ({outposts.length})
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {outposts.map((outpost) => {
                  const TypeIcon = outpostTypeIcons[outpost.type];
                  return (
                    <div 
                      key={outpost.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <TypeIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{outpost.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{outpost.type}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeOutpost(outpost.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
                {outposts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No outposts placed yet
                  </p>
                )}
              </div>
            </div>

            {/* Zones List */}
            <div className="card-elevated p-4">
              <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Tracking Zones ({zones.length})
              </h3>
              <div className="space-y-2">
                {zones.map((zone) => (
                  <div 
                    key={zone.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="text-sm font-medium text-foreground">{zone.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeZone(zone.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {zones.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No zones defined yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Outpost Dialog */}
        <Dialog open={!!pendingOutpost} onOpenChange={() => setPendingOutpost(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Add Outpost</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="outpost-name">Outpost Name</Label>
                <Input
                  id="outpost-name"
                  value={newOutpostName}
                  onChange={(e) => setNewOutpostName(e.target.value)}
                  placeholder="e.g., North Gate Tracker"
                />
              </div>
              <div>
                <Label htmlFor="outpost-type">Type</Label>
                <Select value={newOutpostType} onValueChange={(v) => setNewOutpostType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tracker">
                      <span className="flex items-center gap-2">
                        <Radio className="w-4 h-4" />
                        Tracker
                      </span>
                    </SelectItem>
                    <SelectItem value="camera">
                      <span className="flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Camera
                      </span>
                    </SelectItem>
                    <SelectItem value="sensor">
                      <span className="flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        Sensor
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {pendingOutpost && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-mono text-sm">
                    {pendingOutpost[0].toFixed(6)}, {pendingOutpost[1].toFixed(6)}
                  </p>
                </div>
              )}
            </div>
            <Button onClick={confirmAddOutpost} className="w-full bg-gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Outpost
            </Button>
          </DialogContent>
        </Dialog>

        {/* Add Zone Dialog */}
        <Dialog open={!!pendingZone} onOpenChange={() => { setPendingZone(null); setZonePoints([]); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Name Your Zone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="zone-name">Zone Name</Label>
                <Input
                  id="zone-name"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="e.g., Main Grazing Area"
                />
              </div>
              {pendingZone && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Boundary Points</p>
                  <p className="font-mono text-sm">{pendingZone.length} vertices</p>
                </div>
              )}
            </div>
            <Button onClick={confirmAddZone} className="w-full bg-gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Create Zone
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
