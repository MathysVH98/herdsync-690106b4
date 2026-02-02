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
import { Sun, Moon, Calendar, Plus } from "lucide-react";
import { useFarm } from "@/hooks/useFarm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const animalTypes = ["Cattle", "Chickens", "Pigs", "Sheep & Goats", "Horses", "Ducks", "Other"];

export default function Feeding() {
  const [feedingSchedule, setFeedingSchedule] = useState<FeedingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { farm } = useFarm();
  const { toast } = useToast();

  const [newItem, setNewItem] = useState({
    animalType: "",
    feedType: "",
    time: "",
    period: "morning",
    notes: "",
  });

  useEffect(() => {
    if (!farm?.id) {
      setLoading(false);
      return;
    }

    const fetchFeedingSchedule = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("feeding_schedule")
        .select("*")
        .eq("farm_id", farm.id)
        .order("time");

      if (error) {
        console.error("Error fetching feeding schedule:", error);
      } else {
        setFeedingSchedule(data.map(item => ({
          id: item.id,
          animalType: item.animal_type,
          feedType: item.feed_type,
          time: item.time,
          period: item.period as "morning" | "evening",
          notes: item.notes || undefined,
        })));
      }
      setLoading(false);
    };

    fetchFeedingSchedule();
  }, [farm?.id]);

  const handleAddItem = async () => {
    if (!farm?.id) {
      toast({
        title: "No Farm Selected",
        description: "Please select a farm first.",
        variant: "destructive",
      });
      return;
    }

    if (!newItem.animalType || !newItem.feedType || !newItem.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in animal type, feed type, and time.",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("feeding_schedule")
      .insert({
        farm_id: farm.id,
        animal_type: newItem.animalType,
        feed_type: newItem.feedType,
        time: newItem.time,
        period: newItem.period,
        notes: newItem.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding feeding schedule:", error);
      toast({
        title: "Error",
        description: "Failed to add feeding schedule.",
        variant: "destructive",
      });
      return;
    }

    const item: FeedingItem = {
      id: data.id,
      animalType: data.animal_type,
      feedType: data.feed_type,
      time: data.time,
      period: data.period as "morning" | "evening",
      notes: data.notes || undefined,
    };

    setFeedingSchedule([...feedingSchedule, item].sort((a, b) => a.time.localeCompare(b.time)));
    setNewItem({
      animalType: "",
      feedType: "",
      time: "",
      period: "morning",
      notes: "",
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Schedule Added",
      description: `Feeding schedule for ${item.animalType} has been added.`,
    });
  };

  const morningFeedings = feedingSchedule.filter(f => f.period === "morning");
  const eveningFeedings = feedingSchedule.filter(f => f.period === "evening");

  // Group by animal type
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
            <h1 className="text-3xl font-bold font-display text-foreground">
              Feeding Schedule
            </h1>
            <p className="text-muted-foreground mt-1">
              Organized feeding times for all your livestock
            </p>
          </div>

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
                    <Label htmlFor="animalType">Animal Type</Label>
                    <Select value={newItem.animalType} onValueChange={(v) => setNewItem({ ...newItem, animalType: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {animalTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="period">Period</Label>
                    <Select value={newItem.period} onValueChange={(v) => setNewItem({ ...newItem, period: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                    <Input
                      id="time"
                      type="time"
                      value={newItem.time}
                      onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="feedType">Feed Type</Label>
                    <Input
                      id="feedType"
                      value={newItem.feedType}
                      onChange={(e) => setNewItem({ ...newItem, feedType: e.target.value })}
                      placeholder="e.g., Dairy Mix + Hay"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={newItem.notes}
                    onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                    placeholder="Any special instructions..."
                  />
                </div>
              </div>
              <Button onClick={handleAddItem} className="w-full bg-gradient-primary text-primary-foreground">
                Add Schedule
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 bg-muted/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : feedingSchedule.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No feeding schedule set up yet. Click 'Add Schedule' to get started.</p>
          </div>
        ) : (
          <Tabs defaultValue="time" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="time" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                By Time
              </TabsTrigger>
              <TabsTrigger value="animal" className="flex items-center gap-2">
                🐾 By Animal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="time" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Morning Schedule */}
                <div className="card-elevated p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                      <Sun className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg text-foreground">
                        Morning Schedule
                      </h3>
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
                                <span className="feed-time-badge feed-time-morning">
                                  <Sun className="w-3.5 h-3.5" />
                                  {item.time}
                                </span>
                              </div>
                              <h4 className="font-semibold text-foreground">{item.animalType}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{item.feedType}</p>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                  Note: {item.notes}
                                </p>
                              )}
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
                      <h3 className="font-display font-semibold text-lg text-foreground">
                        Evening Schedule
                      </h3>
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
                                <span className="feed-time-badge feed-time-evening">
                                  <Moon className="w-3.5 h-3.5" />
                                  {item.time}
                                </span>
                              </div>
                              <h4 className="font-semibold text-foreground">{item.animalType}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{item.feedType}</p>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                  Note: {item.notes}
                                </p>
                              )}
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
                      <h3 className="font-display font-semibold text-lg text-foreground">
                        {animalType}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {feedings.map((item) => (
                        <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`feed-time-badge text-xs ${
                              item.period === "morning" ? "feed-time-morning" : "feed-time-evening"
                            }`}>
                              {item.period === "morning" ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                              {item.time}
                            </span>
                          </div>
                          <p className="text-sm text-foreground font-medium">{item.feedType}</p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>
                          )}
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
