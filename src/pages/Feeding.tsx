import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { FeedingSchedule } from "@/components/FeedingSchedule";
import { FeedingItem } from "@/components/FeedingSchedule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Moon, Calendar, Plus, Clock, Utensils } from "lucide-react";
import { useFarm } from "@/hooks/useFarm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Kept for backward compatibility with existing schedules
const animalTypes = ["Cattle", "Chickens", "Pigs", "Sheep & Goats", "Horses", "Ducks", "Other"];

interface FeedingLogEntry {
  id: string;
  animalId: string;
  animalName: string;
  animalTag: string;
  feedType: string;
  quantity?: string;
  fedAt: string;
  fedBy?: string;
  notes?: string;
}

interface LivestockAnimal {
  id: string;
  name: string;
  tag: string;
  type: string;
}

export default function Feeding() {
  const [feedingSchedule, setFeedingSchedule] = useState<FeedingItem[]>([]);
  const [feedingLog, setFeedingLog] = useState<FeedingLogEntry[]>([]);
  const [animals, setAnimals] = useState<LivestockAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedAnimalFilter, setSelectedAnimalFilter] = useState<string>("all");
  const { farm } = useFarm();
  const { toast } = useToast();

  const [newItem, setNewItem] = useState({
    animalId: "",
    feedType: "",
    time: "",
    period: "morning",
    notes: "",
  });

  const [newLogEntry, setNewLogEntry] = useState({
    animalId: "",
    feedType: "",
    quantity: "",
    fedBy: "",
    notes: "",
  });

  useEffect(() => {
    if (!farm?.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch feeding schedule with animal details
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("feeding_schedule")
        .select("*, livestock(id, name, tag, type)")
        .eq("farm_id", farm.id)
        .order("time");

      if (!scheduleError && scheduleData) {
        setFeedingSchedule(scheduleData.map((item: any) => ({
          id: item.id,
          animalId: item.animal_id,
          animalType: item.livestock ? `${item.livestock.tag} - ${item.livestock.name}` : item.animal_type || "Unknown",
          feedType: item.feed_type,
          time: item.time,
          period: item.period as "morning" | "evening",
          notes: item.notes || undefined,
        })));
      }

      // Fetch livestock for dropdown
      const { data: livestockData, error: livestockError } = await supabase
        .from("livestock")
        .select("id, name, tag, type")
        .eq("farm_id", farm.id)
        .is("sold_at", null)
        .order("tag");

      if (!livestockError && livestockData) {
        setAnimals(livestockData);
      }

      // Fetch feeding log
      const { data: logData, error: logError } = await supabase
        .from("feeding_log")
        .select("*, livestock(name, tag)")
        .eq("farm_id", farm.id)
        .order("fed_at", { ascending: false })
        .limit(100);

      if (!logError && logData) {
        setFeedingLog(logData.map((entry: any) => ({
          id: entry.id,
          animalId: entry.animal_id,
          animalName: entry.livestock?.name || "Unknown",
          animalTag: entry.livestock?.tag || "",
          feedType: entry.feed_type,
          quantity: entry.quantity,
          fedAt: entry.fed_at,
          fedBy: entry.fed_by,
          notes: entry.notes,
        })));
      }

      setLoading(false);
    };

    fetchData();
  }, [farm?.id]);

  const handleAddItem = async () => {
    if (!farm?.id) {
      toast({ title: "No Farm Selected", description: "Please select a farm first.", variant: "destructive" });
      return;
    }

    if (!newItem.animalId || !newItem.feedType || !newItem.time) {
      toast({ title: "Missing Information", description: "Please select an animal, feed type, and time.", variant: "destructive" });
      return;
    }

    const selectedAnimal = animals.find(a => a.id === newItem.animalId);

    const { data, error } = await supabase
      .from("feeding_schedule")
      .insert({
        farm_id: farm.id,
        animal_id: newItem.animalId,
        animal_type: selectedAnimal ? `${selectedAnimal.tag} - ${selectedAnimal.name}` : null,
        feed_type: newItem.feedType,
        time: newItem.time,
        period: newItem.period,
        notes: newItem.notes || null,
      })
      .select("*, livestock(id, name, tag, type)")
      .single();

    if (error) {
      console.error("Error adding feeding schedule:", error);
      toast({ title: "Error", description: "Failed to add feeding schedule.", variant: "destructive" });
      return;
    }

    const item: FeedingItem = {
      id: data.id,
      animalId: data.animal_id,
      animalType: data.livestock ? `${data.livestock.tag} - ${data.livestock.name}` : data.animal_type || "Unknown",
      feedType: data.feed_type,
      time: data.time,
      period: data.period as "morning" | "evening",
      notes: data.notes || undefined,
    };

    setFeedingSchedule([...feedingSchedule, item].sort((a, b) => a.time.localeCompare(b.time)));
    setNewItem({ animalId: "", feedType: "", time: "", period: "morning", notes: "" });
    setIsAddDialogOpen(false);
    toast({ title: "Schedule Added", description: `Feeding schedule for ${item.animalType} has been added.` });
  };

  const handleLogFeeding = async () => {
    if (!farm?.id) {
      toast({ title: "No Farm Selected", description: "Please select a farm first.", variant: "destructive" });
      return;
    }

    if (!newLogEntry.animalId || !newLogEntry.feedType) {
      toast({ title: "Missing Information", description: "Please select an animal and enter feed type.", variant: "destructive" });
      return;
    }

    const { data, error } = await supabase
      .from("feeding_log")
      .insert({
        farm_id: farm.id,
        animal_id: newLogEntry.animalId,
        feed_type: newLogEntry.feedType,
        quantity: newLogEntry.quantity || null,
        fed_by: newLogEntry.fedBy || null,
        notes: newLogEntry.notes || null,
      })
      .select("*, livestock(name, tag)")
      .single();

    if (error) {
      console.error("Error logging feeding:", error);
      toast({ title: "Error", description: "Failed to log feeding.", variant: "destructive" });
      return;
    }

    const entry: FeedingLogEntry = {
      id: data.id,
      animalId: data.animal_id,
      animalName: data.livestock?.name || "Unknown",
      animalTag: data.livestock?.tag || "",
      feedType: data.feed_type,
      quantity: data.quantity,
      fedAt: data.fed_at,
      fedBy: data.fed_by,
      notes: data.notes,
    };

    // Also update the livestock last_fed field
    await supabase
      .from("livestock")
      .update({ last_fed: new Date().toISOString() })
      .eq("id", newLogEntry.animalId);

    setFeedingLog([entry, ...feedingLog]);
    setNewLogEntry({ animalId: "", feedType: "", quantity: "", fedBy: "", notes: "" });
    setIsLogDialogOpen(false);
    toast({ title: "Feeding Logged", description: `Feeding for ${entry.animalName} has been recorded.` });
  };

  const filteredLog = selectedAnimalFilter === "all" 
    ? feedingLog 
    : feedingLog.filter(entry => entry.animalId === selectedAnimalFilter);

  const morningFeedings = feedingSchedule.filter(f => f.period === "morning");
  const eveningFeedings = feedingSchedule.filter(f => f.period === "evening");

  const byAnimalType = feedingSchedule.reduce((acc, item) => {
    if (!acc[item.animalType]) {
      acc[item.animalType] = [];
    }
    acc[item.animalType].push(item);
    return acc;
  }, {} as Record<string, FeedingItem[]>);

  if (!farm) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">No Farm Selected</h2>
            <p className="text-muted-foreground">Create or select a farm to manage feeding schedules.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">Feeding Management</h1>
            <p className="text-muted-foreground mt-1">Organized feeding times and logs for all your livestock</p>
          </div>

          <div className="flex gap-3">
            <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Utensils className="w-4 h-4 mr-2" />
                  Log Feeding
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="font-display">Log Individual Feeding</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label>Select Animal</Label>
                    <Select value={newLogEntry.animalId} onValueChange={(v) => setNewLogEntry({ ...newLogEntry, animalId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select animal" /></SelectTrigger>
                      <SelectContent>
                        {animals.map((animal) => (
                          <SelectItem key={animal.id} value={animal.id}>
                            {animal.tag} - {animal.name} ({animal.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Feed Type</Label>
                      <Input value={newLogEntry.feedType} onChange={(e) => setNewLogEntry({ ...newLogEntry, feedType: e.target.value })} placeholder="e.g., Hay, Grain Mix" />
                    </div>
                    <div>
                      <Label>Quantity (optional)</Label>
                      <Input value={newLogEntry.quantity} onChange={(e) => setNewLogEntry({ ...newLogEntry, quantity: e.target.value })} placeholder="e.g., 5 kg" />
                    </div>
                  </div>
                  <div>
                    <Label>Fed By (optional)</Label>
                    <Input value={newLogEntry.fedBy} onChange={(e) => setNewLogEntry({ ...newLogEntry, fedBy: e.target.value })} placeholder="Person name" />
                  </div>
                  <div>
                    <Label>Notes (optional)</Label>
                    <Textarea value={newLogEntry.notes} onChange={(e) => setNewLogEntry({ ...newLogEntry, notes: e.target.value })} placeholder="Any special notes..." />
                  </div>
                </div>
                <Button onClick={handleLogFeeding} className="w-full bg-gradient-primary text-primary-foreground">Log Feeding</Button>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="font-display">Add Feeding Schedule</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="animalId">Select Animal</Label>
                      <Select value={newItem.animalId} onValueChange={(v) => setNewItem({ ...newItem, animalId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select animal" /></SelectTrigger>
                        <SelectContent>
                          {animals.map((animal) => (
                            <SelectItem key={animal.id} value={animal.id}>
                              {animal.tag} - {animal.name} ({animal.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="period">Period</Label>
                      <Select value={newItem.period} onValueChange={(v) => setNewItem({ ...newItem, period: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input id="time" type="time" value={newItem.time} onChange={(e) => setNewItem({ ...newItem, time: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="feedType">Feed Type</Label>
                      <Input id="feedType" value={newItem.feedType} onChange={(e) => setNewItem({ ...newItem, feedType: e.target.value })} placeholder="e.g., Dairy Mix + Hay" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea id="notes" value={newItem.notes} onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })} placeholder="Any special instructions..." />
                  </div>
                </div>
                <Button onClick={handleAddItem} className="w-full bg-gradient-primary text-primary-foreground">Add Schedule</Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (<div key={i} className="h-64 bg-muted/50 animate-pulse rounded-xl" />))}
          </div>
        ) : (
          <Tabs defaultValue="schedule" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="log" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Feeding Log
              </TabsTrigger>
              <TabsTrigger value="animal" className="flex items-center gap-2">
                🐾 By Animal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="mt-6">
              {feedingSchedule.length === 0 ? (
                <div className="card-elevated p-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No feeding schedule set up yet. Click 'Add Schedule' to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Morning Schedule */}
                  <div className="card-elevated p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                        <Sun className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-lg text-foreground">Morning Schedule</h3>
                        <p className="text-sm text-muted-foreground">05:30 - 08:00</p>
                      </div>
                    </div>
                    {morningFeedings.length > 0 ? (
                      <div className="space-y-0">
                        {morningFeedings.map((item) => (
                          <div key={item.id} className="timeline-item">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="feed-time-badge feed-time-morning"><Sun className="w-3.5 h-3.5" />{item.time}</span>
                                </div>
                                <h4 className="font-semibold text-foreground">{item.animalType}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{item.feedType}</p>
                                {item.notes && (<p className="text-xs text-muted-foreground mt-2 italic">Note: {item.notes}</p>)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No morning feedings scheduled.</p>
                    )}
                  </div>

                  {/* Evening Schedule */}
                  <div className="card-elevated p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Moon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-lg text-foreground">Evening Schedule</h3>
                        <p className="text-sm text-muted-foreground">16:30 - 18:30</p>
                      </div>
                    </div>
                    {eveningFeedings.length > 0 ? (
                      <div className="space-y-0">
                        {eveningFeedings.map((item) => (
                          <div key={item.id} className="timeline-item">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="feed-time-badge feed-time-evening"><Moon className="w-3.5 h-3.5" />{item.time}</span>
                                </div>
                                <h4 className="font-semibold text-foreground">{item.animalType}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{item.feedType}</p>
                                {item.notes && (<p className="text-xs text-muted-foreground mt-2 italic">Note: {item.notes}</p>)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No evening feedings scheduled.</p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="log" className="mt-6 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Recent Feeding Log</span>
                    <Select value={selectedAnimalFilter} onValueChange={setSelectedAnimalFilter}>
                      <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by animal" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Animals</SelectItem>
                        {animals.map((animal) => (
                          <SelectItem key={animal.id} value={animal.id}>{animal.tag} - {animal.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredLog.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No feeding logs yet. Click 'Log Feeding' to record an individual feeding.</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredLog.map((entry) => (
                        <div key={entry.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground">{entry.animalTag} - {entry.animalName}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(entry.fedAt), "MMM d, yyyy h:mm a")}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{entry.feedType}{entry.quantity && ` • ${entry.quantity}`}</p>
                          {entry.fedBy && (<p className="text-xs text-muted-foreground mt-1">Fed by: {entry.fedBy}</p>)}
                          {entry.notes && (<p className="text-xs text-muted-foreground italic mt-1">{entry.notes}</p>)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="animal" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(byAnimalType).map(([animalType, feedings]) => (
                  <div key={animalType} className="card-elevated p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">
                        {animalType === "Cattle" ? "🐄" : 
                         animalType === "Chickens" ? "🐔" : 
                         animalType === "Pigs" ? "🐷" : 
                         animalType.includes("Sheep") ? "🐑" : 
                         animalType === "Horses" ? "🐴" : 
                         animalType === "Ducks" ? "🦆" : "🐾"}
                      </span>
                      <h3 className="font-display font-semibold text-lg text-foreground">{animalType}</h3>
                    </div>
                    <div className="space-y-3">
                      {feedings.map((item) => (
                        <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`feed-time-badge text-xs ${item.period === "morning" ? "feed-time-morning" : "feed-time-evening"}`}>
                              {item.period === "morning" ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                              {item.time}
                            </span>
                          </div>
                          <p className="text-sm text-foreground font-medium">{item.feedType}</p>
                          {item.notes && (<p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
