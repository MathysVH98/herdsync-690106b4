import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { HealthRecordCard, HealthRecord, HealthRecordType } from "@/components/HealthRecordCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { Syringe, Stethoscope, Pill, Baby, Scissors, Plus } from "lucide-react";
import { useFarm } from "@/hooks/useFarm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const healthTypes: { type: HealthRecordType; icon: typeof Syringe; label: string }[] = [
  { type: "Vaccination", icon: Syringe, label: "Vaccinations" },
  { type: "Checkup", icon: Stethoscope, label: "Checkups" },
  { type: "Treatment", icon: Pill, label: "Treatments" },
  { type: "Pregnancy Check", icon: Baby, label: "Pregnancy" },
  { type: "Farrier Visit", icon: Scissors, label: "Farrier" },
];

export default function Health() {
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { farm } = useFarm();
  const { toast } = useToast();

  const [newRecord, setNewRecord] = useState({
    animalName: "",
    type: "" as HealthRecordType,
    date: new Date().toISOString().split('T')[0],
    provider: "",
    notes: "",
    nextDue: "",
  });

  useEffect(() => {
    if (!farm?.id) {
      setLoading(false);
      return;
    }

    const fetchHealthRecords = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("health_records")
        .select("*")
        .eq("farm_id", farm.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching health records:", error);
      } else {
        setHealthRecords(data.map(r => ({
          id: r.id,
          animalId: r.animal_id || "",
          animalName: r.animal_name,
          type: r.type as HealthRecordType,
          date: r.date,
          provider: r.provider || "",
          notes: r.notes || "",
          nextDue: r.next_due || undefined,
        })));
      }
      setLoading(false);
    };

    fetchHealthRecords();
  }, [farm?.id]);

  const handleAddRecord = async () => {
    if (!farm?.id) {
      toast({
        title: "No Farm Selected",
        description: "Please select a farm first.",
        variant: "destructive",
      });
      return;
    }

    if (!newRecord.animalName || !newRecord.type || !newRecord.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in animal name, type, and date.",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("health_records")
      .insert({
        farm_id: farm.id,
        animal_name: newRecord.animalName,
        type: newRecord.type,
        date: newRecord.date,
        provider: newRecord.provider || null,
        notes: newRecord.notes || null,
        next_due: newRecord.nextDue || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding health record:", error);
      toast({
        title: "Error",
        description: "Failed to add health record.",
        variant: "destructive",
      });
      return;
    }

    const record: HealthRecord = {
      id: data.id,
      animalId: data.animal_id || "",
      animalName: data.animal_name,
      type: data.type as HealthRecordType,
      date: data.date,
      provider: data.provider || "",
      notes: data.notes || "",
      nextDue: data.next_due || undefined,
    };

    setHealthRecords([record, ...healthRecords]);
    setNewRecord({
      animalName: "",
      type: "" as HealthRecordType,
      date: new Date().toISOString().split('T')[0],
      provider: "",
      notes: "",
      nextDue: "",
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Record Added",
      description: `Health record for ${record.animalName} has been added.`,
    });
  };

  const typeCounts = healthTypes.reduce((acc, { type }) => {
    acc[type] = healthRecords.filter(r => r.type === type).length;
    return acc;
  }, {} as Record<HealthRecordType, number>);

  if (!farm) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">No Farm Selected</h2>
            <p className="text-muted-foreground">Create or select a farm to view health records.</p>
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
              Health Records
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive health tracking for all your livestock
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-display">Add Health Record</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="animalName">Animal Name</Label>
                    <Input
                      id="animalName"
                      value={newRecord.animalName}
                      onChange={(e) => setNewRecord({ ...newRecord, animalName: e.target.value })}
                      placeholder="e.g., Bessie"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Record Type</Label>
                    <Select value={newRecord.type} onValueChange={(v) => setNewRecord({ ...newRecord, type: v as HealthRecordType })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {healthTypes.map(({ type, label }) => (
                          <SelectItem key={type} value={type}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newRecord.date}
                      onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="provider">Provider</Label>
                    <Input
                      id="provider"
                      value={newRecord.provider}
                      onChange={(e) => setNewRecord({ ...newRecord, provider: e.target.value })}
                      placeholder="e.g., Dr. Smith"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newRecord.notes}
                    onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
                <div>
                  <Label htmlFor="nextDue">Next Due Date (optional)</Label>
                  <Input
                    id="nextDue"
                    type="date"
                    value={newRecord.nextDue}
                    onChange={(e) => setNewRecord({ ...newRecord, nextDue: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddRecord} className="w-full bg-gradient-primary text-primary-foreground">
                Add Record
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {healthTypes.map(({ type, icon: Icon, label }) => (
            <div key={type} className="card-elevated p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{typeCounts[type] || 0}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Records Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All Records
              <Badge variant="secondary" className="ml-2">{healthRecords.length}</Badge>
            </TabsTrigger>
            {healthTypes.map(({ type, label }) => (
              <TabsTrigger 
                key={type} 
                value={type}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {label}
                <Badge variant="secondary" className="ml-2">{typeCounts[type] || 0}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : healthRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthRecords.map((record) => (
                  <HealthRecordCard key={record.id} record={record} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No health records yet. Click 'Add Record' to get started.</p>
              </div>
            )}
          </TabsContent>

          {healthTypes.map(({ type }) => (
            <TabsContent key={type} value={type} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthRecords
                  .filter(r => r.type === type)
                  .map((record) => (
                    <HealthRecordCard key={record.id} record={record} />
                  ))}
              </div>
              {healthRecords.filter(r => r.type === type).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No {type.toLowerCase()} records found.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}
