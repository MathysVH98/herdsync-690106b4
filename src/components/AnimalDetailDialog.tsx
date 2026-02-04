import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFarm } from "@/hooks/useFarm";
import { Save, Baby, Heart, Users, Calendar } from "lucide-react";

export type AnimalStatus = "Healthy" | "Under Observation" | "Sick" | "Pregnant";

export interface AnimalDetails {
  id: string;
  name: string;
  type: string;
  breed: string;
  tag: string;
  age: string;
  weight: string;
  status: AnimalStatus;
  feedType: string;
  purchaseCost: number;
  notes?: string;
  // New detailed fields
  sex?: string;
  dateOfBirth?: string;
  microchipNumber?: string;
  brandMark?: string;
  colorMarkings?: string;
  sireId?: string;
  damId?: string;
  birthWeight?: string;
  weaningDate?: string;
  nursedBy?: string;
  birthHealthStatus?: string;
  pregnancyCount?: number;
  previousOwnersCount?: number;
  previousOwnersNotes?: string;
}

interface BirthingRecord {
  id: string;
  birthDate: string;
  birthWeight?: string;
  healthStatusAtBirth?: string;
  nursedBy?: string;
  weaningDate?: string;
  notes?: string;
  offspringId?: string;
  offspringName?: string;
}

interface AnimalDetailDialogProps {
  animal: AnimalDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allAnimals: { id: string; name: string; tag: string; sex?: string }[];
  onUpdate: () => void;
}

const statusOptions: AnimalStatus[] = ["Healthy", "Under Observation", "Sick", "Pregnant"];
const typeOptions = ["Cattle", "Sheep", "Goat", "Pig", "Chicken", "Duck", "Horse"];

export function AnimalDetailDialog({
  animal,
  open,
  onOpenChange,
  allAnimals,
  onUpdate,
}: AnimalDetailDialogProps) {
  const { toast } = useToast();
  const { farm } = useFarm();
  const [saving, setSaving] = useState(false);
  const [birthing, setBirthing] = useState<BirthingRecord[]>([]);
  const [loadingBirthing, setLoadingBirthing] = useState(false);
  
  const [formData, setFormData] = useState<Partial<AnimalDetails>>({});

  useEffect(() => {
    if (animal) {
      setFormData({
        name: animal.name,
        type: animal.type,
        breed: animal.breed,
        tag: animal.tag,
        age: animal.age,
        weight: animal.weight,
        status: animal.status,
        feedType: animal.feedType,
        purchaseCost: animal.purchaseCost,
        notes: animal.notes,
        sex: animal.sex,
        dateOfBirth: animal.dateOfBirth,
        microchipNumber: animal.microchipNumber,
        brandMark: animal.brandMark,
        colorMarkings: animal.colorMarkings,
        sireId: animal.sireId,
        damId: animal.damId,
        birthWeight: animal.birthWeight,
        weaningDate: animal.weaningDate,
        nursedBy: animal.nursedBy,
        birthHealthStatus: animal.birthHealthStatus,
        pregnancyCount: animal.pregnancyCount || 0,
        previousOwnersCount: animal.previousOwnersCount || 0,
        previousOwnersNotes: animal.previousOwnersNotes,
      });
      fetchBirthingRecords();
    }
  }, [animal]);

  const fetchBirthingRecords = async () => {
    if (!animal?.id || !farm?.id) return;
    
    setLoadingBirthing(true);
    const { data, error } = await supabase
      .from("birthing_records")
      .select("*")
      .eq("farm_id", farm.id)
      .eq("mother_id", animal.id)
      .order("birth_date", { ascending: false });

    if (!error && data) {
      setBirthing(data.map((r: any) => ({
        id: r.id,
        birthDate: r.birth_date,
        birthWeight: r.birth_weight,
        healthStatusAtBirth: r.health_status_at_birth,
        nursedBy: r.nursed_by,
        weaningDate: r.weaning_date,
        notes: r.notes,
        offspringId: r.offspring_id,
      })));
    }
    setLoadingBirthing(false);
  };

  const handleSave = async () => {
    if (!animal?.id) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("livestock")
      .update({
        name: formData.name,
        type: formData.type,
        breed: formData.breed || null,
        tag: formData.tag,
        age: formData.age || null,
        weight: formData.weight || null,
        status: formData.status,
        feed_type: formData.feedType || null,
        purchase_cost: formData.purchaseCost || 0,
        notes: formData.notes || null,
        sex: formData.sex || null,
        date_of_birth: formData.dateOfBirth || null,
        microchip_number: formData.microchipNumber || null,
        brand_mark: formData.brandMark || null,
        color_markings: formData.colorMarkings || null,
        sire_id: formData.sireId || null,
        dam_id: formData.damId || null,
        birth_weight: formData.birthWeight || null,
        weaning_date: formData.weaningDate || null,
        nursed_by: formData.nursedBy || null,
        birth_health_status: formData.birthHealthStatus || null,
        pregnancy_count: formData.pregnancyCount || 0,
        previous_owners_count: formData.previousOwnersCount || 0,
        previous_owners_notes: formData.previousOwnersNotes || null,
      })
      .eq("id", animal.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update animal details.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: "Animal details have been saved.",
      });
      onUpdate();
      onOpenChange(false);
    }
  };

  const maleAnimals = allAnimals.filter(a => a.sex === "male" && a.id !== animal?.id);
  const femaleAnimals = allAnimals.filter(a => a.sex === "female" && a.id !== animal?.id);

  if (!animal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <span className="text-2xl">
              {animal.type === "Cattle" ? "🐄" : 
               animal.type === "Sheep" ? "🐑" : 
               animal.type === "Goat" ? "🐐" : 
               animal.type === "Pig" ? "🐷" : 
               animal.type === "Chicken" ? "🐔" : 
               animal.type === "Duck" ? "🦆" : 
               animal.type === "Horse" ? "🐴" : "🐾"}
            </span>
            {animal.name || animal.tag}
            <Badge variant="outline" className="font-mono">#{animal.tag}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="lineage">Lineage</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Tag Number</Label>
                <Input
                  value={formData.tag || ""}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Breed</Label>
                <Input
                  value={formData.breed || ""}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Sex</Label>
                <Select value={formData.sex || ""} onValueChange={(v) => setFormData({ ...formData, sex: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Age</Label>
                <Input
                  value={formData.age || ""}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="e.g., 2 years"
                />
              </div>
              <div>
                <Label>Weight</Label>
                <Input
                  value={formData.weight || ""}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="e.g., 500 kg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({ ...formData, status: v as AnimalStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Feed Type</Label>
                <Input
                  value={formData.feedType || ""}
                  onChange={(e) => setFormData({ ...formData, feedType: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Purchase Cost (R)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.purchaseCost || ""}
                onChange={(e) => setFormData({ ...formData, purchaseCost: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <Label>Birth Weight</Label>
                <Input
                  value={formData.birthWeight || ""}
                  onChange={(e) => setFormData({ ...formData, birthWeight: e.target.value })}
                  placeholder="e.g., 35 kg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Microchip Number</Label>
                <Input
                  value={formData.microchipNumber || ""}
                  onChange={(e) => setFormData({ ...formData, microchipNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Brand/Mark</Label>
                <Input
                  value={formData.brandMark || ""}
                  onChange={(e) => setFormData({ ...formData, brandMark: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Color/Markings</Label>
              <Input
                value={formData.colorMarkings || ""}
                onChange={(e) => setFormData({ ...formData, colorMarkings: e.target.value })}
                placeholder="e.g., Black with white spots"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nursed By</Label>
                <Select 
                  value={formData.nursedBy || ""} 
                  onValueChange={(v) => setFormData({ ...formData, nursedBy: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="bottle">Bottle Fed</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Weaning Date</Label>
                <Input
                  type="date"
                  value={formData.weaningDate || ""}
                  onChange={(e) => setFormData({ ...formData, weaningDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Birth Health Status</Label>
              <Input
                value={formData.birthHealthStatus || ""}
                onChange={(e) => setFormData({ ...formData, birthHealthStatus: e.target.value })}
                placeholder="Health condition at birth"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="lineage" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sire (Father)</Label>
                <Select 
                  value={formData.sireId || "none"} 
                  onValueChange={(v) => setFormData({ ...formData, sireId: v === "none" ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {maleAnimals.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.tag} - {a.name || "Unnamed"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dam (Mother)</Label>
                <Select 
                  value={formData.damId || "none"} 
                  onValueChange={(v) => setFormData({ ...formData, damId: v === "none" ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {femaleAnimals.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.tag} - {a.name || "Unnamed"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.sex === "female" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Baby className="w-4 h-4" />
                    Pregnancy & Birthing History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Number of Pregnancies</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.pregnancyCount || 0}
                      onChange={(e) => setFormData({ ...formData, pregnancyCount: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  {loadingBirthing ? (
                    <p className="text-sm text-muted-foreground">Loading birthing records...</p>
                  ) : birthing.length > 0 ? (
                    <div className="space-y-2">
                      <Label>Birthing Records</Label>
                      {birthing.map((record) => (
                        <div key={record.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-3 h-3" />
                            <span className="font-medium">
                              {new Date(record.birthDate).toLocaleDateString("en-ZA")}
                            </span>
                            {record.birthWeight && (
                              <Badge variant="outline" className="text-xs">
                                {record.birthWeight}
                              </Badge>
                            )}
                          </div>
                          {record.healthStatusAtBirth && (
                            <p className="text-muted-foreground">Health: {record.healthStatusAtBirth}</p>
                          )}
                          {record.nursedBy && (
                            <p className="text-muted-foreground">Nursed by: {record.nursedBy}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No birthing records found.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Ownership History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Number of Previous Owners</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.previousOwnersCount || 0}
                    onChange={(e) => setFormData({ ...formData, previousOwnersCount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Previous Owners Notes</Label>
                  <Textarea
                    value={formData.previousOwnersNotes || ""}
                    onChange={(e) => setFormData({ ...formData, previousOwnersNotes: e.target.value })}
                    placeholder="Details about previous owners, dates of ownership changes, etc."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Health Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge className={
                    formData.status === "Healthy" ? "badge-healthy" :
                    formData.status === "Sick" ? "badge-sick" :
                    formData.status === "Pregnant" ? "badge-pregnant" :
                    "badge-observation"
                  }>
                    {formData.status}
                  </Badge>
                  {formData.sex && (
                    <span className="text-sm text-muted-foreground">
                      {formData.sex === "male" ? "♂ Male" : formData.sex === "female" ? "♀ Female" : "Unknown"}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-gradient-primary text-primary-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
