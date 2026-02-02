import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import {
  Beaker,
  FlaskConical,
  Plus,
  Trash2,
  Edit,
  Calendar,
  MapPin,
  User,
  Package,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChemicalInventory {
  id: string;
  farm_id: string;
  product_name: string;
  active_ingredient: string | null;
  batch_no: string | null;
  expiry_date: string | null;
  quantity: number;
  unit: string;
  storage_location: string | null;
  notes: string | null;
}

type ChemicalTarget = "animal" | "land" | "other";

interface ChemicalApplication {
  id: string;
  farm_id: string;
  application_date: string;
  product_name: string;
  batch_no: string | null;
  dosage: number;
  unit: string;
  target: ChemicalTarget;
  animal_id: string | null;
  location_or_paddock: string | null;
  operator_name: string;
  notes: string | null;
  attachment_url: string | null;
}

export default function ChemicalsRemedies() {
  const { user } = useAuth();
  const { farm } = useFarm();
  const { toast } = useToast();

  const [inventory, setInventory] = useState<ChemicalInventory[]>([]);
  const [applications, setApplications] = useState<ChemicalApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<ChemicalInventory | null>(null);
  const [editingApplication, setEditingApplication] = useState<ChemicalApplication | null>(null);

  useEffect(() => {
    if (farm?.id) {
      fetchData();
    }
  }, [farm?.id]);

  const fetchData = async () => {
    if (!farm?.id) return;

    const [invRes, appRes] = await Promise.all([
      supabase.from("chemicals_inventory").select("*").eq("farm_id", farm.id).order("product_name"),
      supabase.from("chemical_applications").select("*").eq("farm_id", farm.id).order("application_date", { ascending: false }),
    ]);

    setInventory(invRes.data || []);
    setApplications(appRes.data || []);
    setLoading(false);
  };

  const saveInventory = async (data: Partial<ChemicalInventory>) => {
    if (!farm?.id) return;

    if (editingInventory?.id) {
      await supabase.from("chemicals_inventory").update(data).eq("id", editingInventory.id);
    } else {
      const insertData = {
        farm_id: farm.id,
        product_name: data.product_name!,
        active_ingredient: data.active_ingredient,
        batch_no: data.batch_no,
        expiry_date: data.expiry_date,
        quantity: data.quantity ?? 0,
        unit: data.unit ?? "L",
        storage_location: data.storage_location,
        notes: data.notes,
      };
      await supabase.from("chemicals_inventory").insert(insertData);
    }
    toast({ title: "Saved", description: "Chemical inventory updated" });
    setIsInventoryOpen(false);
    setEditingInventory(null);
    fetchData();
  };

  const deleteInventory = async (id: string) => {
    await supabase.from("chemicals_inventory").delete().eq("id", id);
    toast({ title: "Deleted", description: "Chemical removed from inventory" });
    fetchData();
  };

  const saveApplication = async (data: Partial<ChemicalApplication>) => {
    if (!farm?.id) return;

    if (editingApplication?.id) {
      await supabase.from("chemical_applications").update(data).eq("id", editingApplication.id);
    } else {
      const insertData = {
        farm_id: farm.id,
        product_name: data.product_name!,
        application_date: data.application_date,
        batch_no: data.batch_no,
        dosage: data.dosage!,
        unit: data.unit ?? "mL",
        target: data.target ?? "animal",
        animal_id: data.animal_id,
        location_or_paddock: data.location_or_paddock,
        operator_name: data.operator_name!,
        notes: data.notes,
      };
      await supabase.from("chemical_applications").insert(insertData);
    }
    toast({ title: "Saved", description: "Application record saved" });
    setIsApplicationOpen(false);
    setEditingApplication(null);
    fetchData();
  };

  const deleteApplication = async (id: string) => {
    await supabase.from("chemical_applications").delete().eq("id", id);
    toast({ title: "Deleted", description: "Application record removed" });
    fetchData();
  };

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const expiry = new Date(date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (!user || !farm) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Beaker className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in Required</h2>
          <p className="text-muted-foreground">Please sign in to access Chemicals & Remedies.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Chemicals & Remedies</h1>
          <p className="text-muted-foreground mt-1">Manage inventory and track applications</p>
        </div>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <FlaskConical className="w-4 h-4" />
              <span className="hidden sm:inline">Applications</span>
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingInventory(null); setIsInventoryOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Chemical
              </Button>
            </div>
            {inventory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No chemicals in inventory</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((item) => (
                  <div key={item.id} className="card-elevated p-4 group">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isExpired(item.expiry_date) ? "bg-destructive/10" : isExpiringSoon(item.expiry_date) ? "bg-yellow-500/10" : "bg-primary/10"}`}>
                        <Beaker className={`w-5 h-5 ${isExpired(item.expiry_date) ? "text-destructive" : isExpiringSoon(item.expiry_date) ? "text-yellow-600" : "text-primary"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground">{item.product_name}</h4>
                        {item.active_ingredient && (
                          <p className="text-xs text-muted-foreground">{item.active_ingredient}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{item.quantity} {item.unit}</Badge>
                          {item.batch_no && <Badge variant="outline">#{item.batch_no}</Badge>}
                        </div>
                        {item.expiry_date && (
                          <p className={`text-xs mt-1 ${isExpired(item.expiry_date) ? "text-destructive" : isExpiringSoon(item.expiry_date) ? "text-yellow-600" : "text-muted-foreground"}`}>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Expires: {new Date(item.expiry_date).toLocaleDateString()}
                            {isExpired(item.expiry_date) && " (EXPIRED)"}
                            {isExpiringSoon(item.expiry_date) && " (Soon)"}
                          </p>
                        )}
                        {item.storage_location && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3 inline mr-1" />{item.storage_location}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingInventory(item); setIsInventoryOpen(true); }}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteInventory(item.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingApplication(null); setIsApplicationOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Record Application
              </Button>
            </div>
            {applications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No application records</div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="card-elevated p-4 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FlaskConical className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{app.product_name}</h4>
                          <Badge variant="outline">{app.dosage} {app.unit}</Badge>
                          <Badge variant="outline" className="capitalize">{app.target}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <User className="w-3 h-3 inline mr-1" />{app.operator_name}
                          {app.location_or_paddock && <> • <MapPin className="w-3 h-3 inline mr-1" />{app.location_or_paddock}</>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(app.application_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingApplication(app); setIsApplicationOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteApplication(app.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Inventory Dialog */}
        <InventoryDialog
          open={isInventoryOpen}
          onOpenChange={setIsInventoryOpen}
          editing={editingInventory}
          onSave={saveInventory}
        />

        {/* Application Dialog */}
        <ApplicationDialog
          open={isApplicationOpen}
          onOpenChange={setIsApplicationOpen}
          editing={editingApplication}
          onSave={saveApplication}
          inventory={inventory}
        />
      </div>
    </Layout>
  );
}

function InventoryDialog({ open, onOpenChange, editing, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ChemicalInventory | null;
  onSave: (data: Partial<ChemicalInventory>) => void;
}) {
  const [productName, setProductName] = useState("");
  const [activeIngredient, setActiveIngredient] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("L");
  const [storageLocation, setStorageLocation] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editing) {
      setProductName(editing.product_name);
      setActiveIngredient(editing.active_ingredient || "");
      setBatchNo(editing.batch_no || "");
      setExpiryDate(editing.expiry_date || "");
      setQuantity(String(editing.quantity));
      setUnit(editing.unit);
      setStorageLocation(editing.storage_location || "");
      setNotes(editing.notes || "");
    } else {
      setProductName("");
      setActiveIngredient("");
      setBatchNo("");
      setExpiryDate("");
      setQuantity("");
      setUnit("L");
      setStorageLocation("");
      setNotes("");
    }
  }, [editing, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "Add"} Chemical</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label>Product Name</Label>
            <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., Ivermectin 1%" />
          </div>
          <div>
            <Label>Active Ingredient</Label>
            <Input value={activeIngredient} onChange={(e) => setActiveIngredient(e.target.value)} placeholder="e.g., Ivermectin" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Batch No</Label>
              <Input value={batchNo} onChange={(e) => setBatchNo(e.target.value)} />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Litres (L)</SelectItem>
                  <SelectItem value="mL">Millilitres (mL)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="g">Grams (g)</SelectItem>
                  <SelectItem value="units">Units</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Storage Location</Label>
            <Input value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} placeholder="e.g., Chemical Store Room A" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <Button onClick={() => onSave({ product_name: productName, active_ingredient: activeIngredient || null, batch_no: batchNo || null, expiry_date: expiryDate || null, quantity: parseFloat(quantity) || 0, unit, storage_location: storageLocation || null, notes: notes || null })} className="w-full">
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ApplicationDialog({ open, onOpenChange, editing, onSave, inventory }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ChemicalApplication | null;
  onSave: (data: Partial<ChemicalApplication>) => void;
  inventory: ChemicalInventory[];
}) {
  const [applicationDate, setApplicationDate] = useState("");
  const [productName, setProductName] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [dosage, setDosage] = useState("");
  const [unit, setUnit] = useState("mL");
  const [target, setTarget] = useState<ChemicalTarget>("animal");
  const [animalId, setAnimalId] = useState("");
  const [location, setLocation] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editing) {
      setApplicationDate(editing.application_date);
      setProductName(editing.product_name);
      setBatchNo(editing.batch_no || "");
      setDosage(String(editing.dosage));
      setUnit(editing.unit);
      setTarget(editing.target);
      setAnimalId(editing.animal_id || "");
      setLocation(editing.location_or_paddock || "");
      setOperatorName(editing.operator_name);
      setNotes(editing.notes || "");
    } else {
      setApplicationDate(new Date().toISOString().split("T")[0]);
      setProductName("");
      setBatchNo("");
      setDosage("");
      setUnit("mL");
      setTarget("animal");
      setAnimalId("");
      setLocation("");
      setOperatorName("");
      setNotes("");
    }
  }, [editing, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "Record"} Application</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label>Application Date</Label>
            <Input type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} />
          </div>
          <div>
            <Label>Product</Label>
            <Select value={productName} onValueChange={setProductName}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {inventory.map((item) => (
                  <SelectItem key={item.id} value={item.product_name}>{item.product_name}</SelectItem>
                ))}
                <SelectItem value="other">Other (type below)</SelectItem>
              </SelectContent>
            </Select>
            {productName === "other" && (
              <Input className="mt-2" placeholder="Enter product name" onChange={(e) => setProductName(e.target.value)} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Dosage</Label>
              <Input type="number" value={dosage} onChange={(e) => setDosage(e.target.value)} />
            </div>
            <div>
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mL">mL</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Target</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as ChemicalTarget)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="animal">Animal</SelectItem>
                <SelectItem value="land">Land/Paddock</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {target === "animal" && (
            <div>
              <Label>Animal ID (optional)</Label>
              <Input value={animalId} onChange={(e) => setAnimalId(e.target.value)} placeholder="e.g., Tag #A001" />
            </div>
          )}
          <div>
            <Label>Location/Paddock</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., North Paddock" />
          </div>
          <div>
            <Label>Operator Name</Label>
            <Input value={operatorName} onChange={(e) => setOperatorName(e.target.value)} placeholder="Who applied it?" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <Button onClick={() => onSave({ application_date: applicationDate, product_name: productName, batch_no: batchNo || null, dosage: parseFloat(dosage) || 0, unit, target, animal_id: animalId || null, location_or_paddock: location || null, operator_name: operatorName, notes: notes || null })} className="w-full">
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
