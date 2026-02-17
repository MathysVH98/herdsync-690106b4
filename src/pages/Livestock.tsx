import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { LivestockCard, Animal, AnimalStatus } from "@/components/LivestockCard";
import { AnimalDetailDialog, AnimalDetails } from "@/components/AnimalDetailDialog";
import { MarkForSaleDialog } from "@/components/MarkForSaleDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Search, Filter, Download, Upload, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { useToast } from "@/hooks/use-toast";
import { useFarm } from "@/hooks/useFarm";
import { useEmployeePermissions } from "@/hooks/useEmployeePermissions";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV } from "@/utils/exportCSV";
import { ImportCSVDialog } from "@/components/ImportCSVDialog";
import { domesticAnimalTypes, wildGameAnimalTypes, allAnimalTypes } from "@/utils/animalImages";
import { differenceInDays, format } from "date-fns";

const statusOptions: AnimalStatus[] = ["Healthy", "Under Observation", "Sick", "Pregnant"];

const normalizeAnimalType = (value: string) => {
  const v = (value || "").trim().toLowerCase();
  if (v === "cow" || v === "cattle") return "cattle";
  return v;
};

export default function Livestock() {
  const navigate = useNavigate();
  const { isEmployee } = useEmployeePermissions();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [rawAnimalsData, setRawAnimalsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [isMarkForSaleDialogOpen, setIsMarkForSaleDialogOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAnimalForDetail, setSelectedAnimalForDetail] = useState<AnimalDetails | null>(null);
  const { toast } = useToast();
  const { farm } = useFarm();

  const [newAnimal, setNewAnimal] = useState({
    name: "",
    type: "",
    breed: "",
    tag: "",
    dateOfBirth: undefined as Date | undefined,
    weight: "",
    status: "Healthy" as AnimalStatus,
    feedType: "",
    purchaseCost: "",
  });

  const [saleData, setSaleData] = useState({
    salePrice: "",
    soldTo: "",
  });

  const fetchLivestock = async () => {
    if (!farm?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from("livestock")
      .select("*")
      .eq("farm_id", farm.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching livestock:", error);
      toast({
        title: "Error",
        description: "Failed to load livestock data.",
        variant: "destructive",
      });
    } else {
      setRawAnimalsData(data || []);
      setAnimals(data.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        breed: a.breed || "",
        tag: a.tag,
        age: a.age || "",
        weight: a.weight || "",
        status: a.status as AnimalStatus,
        lastFed: a.last_fed ? new Date(a.last_fed).toLocaleString() : "Not yet fed",
        feedType: a.feed_type || "",
        purchaseCost: a.purchase_cost || 0,
        salePrice: a.sale_price,
        soldAt: a.sold_at,
        soldTo: a.sold_to,
        plannedSaleDate: a.planned_sale_date,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLivestock();
  }, [farm?.id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && farm?.id) {
        fetchLivestock();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [farm?.id]);

  const activeAnimals = animals.filter(a => !a.soldAt);
  const soldAnimals = animals.filter(a => a.soldAt);
  const markedForSaleAnimals = activeAnimals.filter(a => a.plannedSaleDate);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "sold" || value === "marked-for-sale") {
      setFilterStatus("all");
      setFilterType("all");
      setSearchTerm("");
    }
  };

  const getAnimalsForTab = () => {
    switch (activeTab) {
      case "marked-for-sale":
        return markedForSaleAnimals;
      case "sold":
        return soldAnimals;
      default:
        return activeAnimals;
    }
  };

  const filteredAnimals = getAnimalsForTab().filter((animal) => {
    const matchesSearch = 
      animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.breed.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      activeTab !== "active" ? true : filterStatus === "all" || animal.status === filterStatus;
    const matchesType =
      activeTab !== "active"
        ? true
        : filterType === "all" || normalizeAnimalType(animal.type) === normalizeAnimalType(filterType);

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAddAnimal = async () => {
    if (!farm?.id) {
      toast({ title: "No Farm Selected", description: "Please select a farm first.", variant: "destructive" });
      return;
    }

    if (!newAnimal.name || !newAnimal.type || !newAnimal.tag) {
      toast({ title: "Missing Information", description: "Please fill in at least name, type, and tag.", variant: "destructive" });
      return;
    }

    const { data, error } = await supabase
      .from("livestock")
      .insert({
        farm_id: farm.id,
        name: newAnimal.name,
        type: newAnimal.type,
        breed: newAnimal.breed || null,
        tag: newAnimal.tag,
        date_of_birth: newAnimal.dateOfBirth ? format(newAnimal.dateOfBirth, "yyyy-MM-dd") : null,
        weight: newAnimal.weight || null,
        status: newAnimal.status,
        feed_type: newAnimal.feedType || null,
        purchase_cost: parseFloat(newAnimal.purchaseCost) || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding animal:", error);
      toast({ title: "Error", description: "Failed to add animal.", variant: "destructive" });
      return;
    }

    const animal: Animal = {
      id: data.id,
      name: data.name,
      type: data.type,
      breed: data.breed || "",
      tag: data.tag,
      age: data.age || "",
      weight: data.weight || "",
      status: data.status as AnimalStatus,
      lastFed: "Not yet fed",
      feedType: data.feed_type || "",
      purchaseCost: data.purchase_cost || 0,
      salePrice: null,
      soldAt: null,
      soldTo: null,
    };

    setAnimals([animal, ...animals]);
    setNewAnimal({ name: "", type: "", breed: "", tag: "", dateOfBirth: undefined, weight: "", status: "Healthy", feedType: "", purchaseCost: "" });
    setIsAddDialogOpen(false);
    toast({ title: "Animal Added", description: `${animal.name} has been added to your livestock.` });
  };

  const handleFeed = async (id: string) => {
    const animal = animals.find((a) => a.id === id);
    await supabase.from("livestock").update({ last_fed: new Date().toISOString() }).eq("id", id);
    setAnimals(animals.map(a => a.id === id ? { ...a, lastFed: new Date().toLocaleString() } : a));
    toast({ title: "Feeding Recorded", description: `${animal?.name} has been fed.` });
  };

  const handleRemove = async (id: string) => {
    const animal = animals.find((a) => a.id === id);
    const { error } = await supabase.from("livestock").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to remove animal.", variant: "destructive" });
      return;
    }
    setAnimals(animals.filter((a) => a.id !== id));
    toast({ title: "Animal Removed", description: `${animal?.name} has been removed from your livestock.` });
  };

  const handleOpenSellDialog = (id: string) => {
    setSelectedAnimalId(id);
    setSaleData({ salePrice: "", soldTo: "" });
    setIsSellDialogOpen(true);
  };

  const handleOpenMarkForSaleDialog = (id: string) => {
    setSelectedAnimalId(id);
    setIsMarkForSaleDialogOpen(true);
  };

  const handleMarkForSale = async (plannedSaleDate: Date) => {
    if (!selectedAnimalId || !farm?.id) return;

    const { error } = await supabase
      .from("livestock")
      .update({ planned_sale_date: format(plannedSaleDate, "yyyy-MM-dd") })
      .eq("id", selectedAnimalId);

    if (error) {
      toast({ title: "Error", description: "Failed to mark animal for sale.", variant: "destructive" });
      return;
    }

    const animal = animals.find(a => a.id === selectedAnimalId);
    
    // Create an alert for the planned sale
    const daysUntilSale = differenceInDays(plannedSaleDate, new Date());
    if (daysUntilSale >= 30) {
      const alertDate = new Date(plannedSaleDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      await supabase.from("alerts").insert({
        farm_id: farm.id,
        type: "warning",
        title: `Start Feeding Program for ${animal?.name}`,
        message: `${animal?.name} (#${animal?.tag}) is scheduled for sale on ${format(plannedSaleDate, "PPP")}. Start the feeding program now.`,
      });
    }

    setAnimals(animals.map(a => 
      a.id === selectedAnimalId 
        ? { ...a, plannedSaleDate: format(plannedSaleDate, "yyyy-MM-dd") } 
        : a
    ));
    setIsMarkForSaleDialogOpen(false);
    setSelectedAnimalId(null);
    toast({ 
      title: "Marked for Sale", 
      description: `${animal?.name} is now scheduled for sale on ${format(plannedSaleDate, "PPP")}.` 
    });
  };

  const handleCancelPlannedSale = async (id: string) => {
    const animal = animals.find(a => a.id === id);
    
    const { error } = await supabase
      .from("livestock")
      .update({ planned_sale_date: null })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to cancel planned sale.", variant: "destructive" });
      return;
    }

    // Auto-dismiss any feeding program alerts related to this animal
    if (animal?.name && farm?.id) {
      await supabase
        .from("alerts")
        .update({ dismissed: true })
        .eq("farm_id", farm.id)
        .eq("dismissed", false)
        .ilike("title", `%${animal.name}%`);
    }

    setAnimals(animals.map(a => a.id === id ? { ...a, plannedSaleDate: null } : a));
    toast({ title: "Planned Sale Cancelled", description: `${animal?.name} is no longer marked for sale.` });
  };

  const handleHealthRecord = (id: string) => {
    navigate("/health", { state: { preselectedAnimalId: id } });
  };

  const handleAnimalClick = (id: string) => {
    const rawAnimal = rawAnimalsData.find(a => a.id === id);
    if (rawAnimal) {
      setSelectedAnimalForDetail({
        id: rawAnimal.id,
        name: rawAnimal.name,
        type: rawAnimal.type,
        breed: rawAnimal.breed || "",
        tag: rawAnimal.tag,
        age: rawAnimal.age || "",
        weight: rawAnimal.weight || "",
        status: rawAnimal.status as AnimalStatus,
        feedType: rawAnimal.feed_type || "",
        purchaseCost: rawAnimal.purchase_cost || 0,
        notes: rawAnimal.notes,
        sex: rawAnimal.sex,
        dateOfBirth: rawAnimal.date_of_birth,
        microchipNumber: rawAnimal.microchip_number,
        brandMark: rawAnimal.brand_mark,
        colorMarkings: rawAnimal.color_markings,
        sireId: rawAnimal.sire_id,
        damId: rawAnimal.dam_id,
        birthWeight: rawAnimal.birth_weight,
        weaningDate: rawAnimal.weaning_date,
        nursedBy: rawAnimal.nursed_by,
        birthHealthStatus: rawAnimal.birth_health_status,
        pregnancyCount: rawAnimal.pregnancy_count,
        previousOwnersCount: rawAnimal.previous_owners_count,
        previousOwnersNotes: rawAnimal.previous_owners_notes,
      });
      setDetailDialogOpen(true);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = activeTab === "active" ? activeAnimals : soldAnimals;
    const columns = [
      { key: "tag" as keyof Animal, header: "Tag Number" },
      { key: "name" as keyof Animal, header: "Name" },
      { key: "type" as keyof Animal, header: "Type" },
      { key: "breed" as keyof Animal, header: "Breed" },
      { key: "age" as keyof Animal, header: "Age" },
      { key: "weight" as keyof Animal, header: "Weight" },
      { key: "status" as keyof Animal, header: "Status" },
      { key: "feedType" as keyof Animal, header: "Feed Type" },
      { key: "purchaseCost" as keyof Animal, header: "Purchase Cost (R)" },
      ...(activeTab === "sold" ? [
        { key: "salePrice" as keyof Animal, header: "Sale Price (R)" },
        { key: "soldAt" as keyof Animal, header: "Sold Date" },
        { key: "soldTo" as keyof Animal, header: "Sold To" },
      ] : []),
    ];
    const filename = `livestock_${activeTab}_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(dataToExport, filename, columns);
    toast({ title: "Export Complete", description: `${dataToExport.length} animals exported to CSV.` });
  };

  const allAnimalsForLineage = rawAnimalsData.map(a => ({ id: a.id, name: a.name, tag: a.tag, sex: a.sex }));

  const handleSellAnimal = async () => {
    if (!selectedAnimalId) return;
    const salePrice = parseFloat(saleData.salePrice);
    if (isNaN(salePrice) || salePrice < 0) {
      toast({ title: "Invalid Price", description: "Please enter a valid sale price.", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("livestock")
      .update({ sale_price: salePrice, sold_at: new Date().toISOString(), sold_to: saleData.soldTo || null })
      .eq("id", selectedAnimalId);

    if (error) {
      toast({ title: "Error", description: "Failed to record sale.", variant: "destructive" });
      return;
    }

    const animal = animals.find(a => a.id === selectedAnimalId);
    setAnimals(animals.map(a => a.id === selectedAnimalId ? { ...a, salePrice, soldAt: new Date().toISOString(), soldTo: saleData.soldTo || null } : a));
    setIsSellDialogOpen(false);
    setSelectedAnimalId(null);
    toast({ title: "Sale Recorded", description: `${animal?.name} has been marked as sold for R${salePrice.toFixed(2)}.` });
  };

  const statusCounts = {
    all: activeAnimals.length,
    Healthy: activeAnimals.filter((a) => a.status === "Healthy").length,
    "Under Observation": activeAnimals.filter((a) => a.status === "Under Observation").length,
    Sick: activeAnimals.filter((a) => a.status === "Sick").length,
    Pregnant: activeAnimals.filter((a) => a.status === "Pregnant").length,
  };

  const totalPurchaseCost = soldAnimals.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const totalSaleRevenue = soldAnimals.reduce((sum, a) => sum + (a.salePrice || 0), 0);
  const totalProfit = totalSaleRevenue - totalPurchaseCost;

  if (!farm) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">No Farm Selected</h2>
            <p className="text-muted-foreground">Create or select a farm to manage livestock.</p>
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
            <h1 className="text-3xl font-bold font-display text-foreground">Livestock Management</h1>
            <p className="text-muted-foreground mt-1">Manage all your farm animals in one place</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={filteredAnimals.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground glow-accent">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Animal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="font-display">Add New Animal</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" value={newAnimal.name} onChange={(e) => setNewAnimal({ ...newAnimal, name: e.target.value })} placeholder="e.g., Bessie" />
                    </div>
                    <div>
                      <Label htmlFor="tag">Tag Number</Label>
                      <Input id="tag" value={newAnimal.tag} onChange={(e) => setNewAnimal({ ...newAnimal, tag: e.target.value })} placeholder="e.g., C001" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Animal Type</Label>
                      <Select value={newAnimal.type} onValueChange={(v) => setNewAnimal({ ...newAnimal, type: v })}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Domestic Livestock</SelectLabel>
                            {domesticAnimalTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel>Wild Game</SelectLabel>
                            {wildGameAnimalTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="breed">Breed</Label>
                      <Input id="breed" value={newAnimal.breed} onChange={(e) => setNewAnimal({ ...newAnimal, breed: e.target.value })} placeholder="e.g., Holstein" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label>Date of Birth</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newAnimal.dateOfBirth && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newAnimal.dateOfBirth ? format(newAnimal.dateOfBirth, "PPP") : <span>Select date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newAnimal.dateOfBirth}
                            onSelect={(date) => setNewAnimal({ ...newAnimal, dateOfBirth: date })}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight</Label>
                      <Input id="weight" value={newAnimal.weight} onChange={(e) => setNewAnimal({ ...newAnimal, weight: e.target.value })} placeholder="e.g., 500 kg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={newAnimal.status} onValueChange={(v) => setNewAnimal({ ...newAnimal, status: v as AnimalStatus })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="feedType">Feed Type</Label>
                      <Input id="feedType" value={newAnimal.feedType} onChange={(e) => setNewAnimal({ ...newAnimal, feedType: e.target.value })} placeholder="e.g., Dairy Mix" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="purchaseCost">Purchase Cost (R)</Label>
                    <Input id="purchaseCost" type="number" min="0" step="0.01" value={newAnimal.purchaseCost} onChange={(e) => setNewAnimal({ ...newAnimal, purchaseCost: e.target.value })} placeholder="e.g., 5000.00" />
                  </div>
                </div>
                <Button onClick={handleAddAnimal} className="w-full bg-gradient-primary text-primary-foreground">Add Animal</Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs for Active vs Marked for Sale vs Sold */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="active">Active ({activeAnimals.length})</TabsTrigger>
            <TabsTrigger value="marked-for-sale" className="relative">
              Marked for Sale
              {markedForSaleAnimals.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {markedForSaleAnimals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sold">Sold ({soldAnimals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-4">
            <div className="card-elevated p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by name, tag, or breed..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <div className="flex gap-3">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {statusOptions.map((status) => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectGroup>
                        <SelectLabel>Domestic</SelectLabel>
                        {domesticAnimalTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Wild Game</SelectLabel>
                        {wildGameAnimalTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant={filterStatus === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterStatus("all")}>All ({statusCounts.all})</Badge>
                <Badge variant={filterStatus === "Healthy" ? "default" : "outline"} className="cursor-pointer badge-healthy" onClick={() => setFilterStatus("Healthy")}>Healthy ({statusCounts.Healthy})</Badge>
                <Badge variant={filterStatus === "Under Observation" ? "default" : "outline"} className="cursor-pointer badge-observation" onClick={() => setFilterStatus("Under Observation")}>Under Observation ({statusCounts["Under Observation"]})</Badge>
                <Badge variant={filterStatus === "Sick" ? "default" : "outline"} className="cursor-pointer badge-sick" onClick={() => setFilterStatus("Sick")}>Sick ({statusCounts.Sick})</Badge>
                <Badge variant={filterStatus === "Pregnant" ? "default" : "outline"} className="cursor-pointer badge-pregnant" onClick={() => setFilterStatus("Pregnant")}>Pregnant ({statusCounts.Pregnant})</Badge>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (<div key={i} className="h-48 bg-muted/50 animate-pulse rounded-xl" />))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAnimals.map((animal) => (
                  <div key={animal.id} onClick={() => handleAnimalClick(animal.id)} className="cursor-pointer">
                    <LivestockCard 
                      animal={animal} 
                      onFeed={handleFeed} 
                      onHealthRecord={handleHealthRecord} 
                      onRemove={handleRemove} 
                      onSell={handleOpenSellDialog}
                      onMarkForSale={handleOpenMarkForSaleDialog}
                      onCancelPlannedSale={handleCancelPlannedSale}
                      hideFinancials={isEmployee}
                    />
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredAnimals.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{activeAnimals.length === 0 ? "No animals added yet. Click 'Add Animal' to get started." : "No animals found matching your criteria."}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="marked-for-sale" className="space-y-4 mt-4">
            <div className="card-elevated p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search animals marked for sale..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10" 
                />
              </div>
            </div>

            {markedForSaleAnimals.length > 0 && (
              <div className="card-elevated p-4 bg-info/5 border-info/20">
                <p className="text-sm text-info">
                  <span className="font-semibold">{markedForSaleAnimals.length}</span> animal{markedForSaleAnimals.length !== 1 ? 's' : ''} marked for upcoming sales. 
                  Alerts will trigger 1 month before each sale date to start feeding programs.
                </p>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (<div key={i} className="h-48 bg-muted/50 animate-pulse rounded-xl" />))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAnimals.map((animal) => (
                  <div key={animal.id} onClick={() => handleAnimalClick(animal.id)} className="cursor-pointer">
                    <LivestockCard 
                      animal={animal} 
                      onFeed={handleFeed} 
                      onHealthRecord={handleHealthRecord} 
                      onRemove={handleRemove} 
                      onSell={handleOpenSellDialog}
                      onMarkForSale={handleOpenMarkForSaleDialog}
                      onCancelPlannedSale={handleCancelPlannedSale}
                      hideFinancials={isEmployee}
                    />
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredAnimals.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {markedForSaleAnimals.length === 0 
                    ? "No animals marked for sale. Use the 'Mark for Sale' option on an animal to schedule it for an upcoming sale." 
                    : "No animals found matching your search."}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sold" className="space-y-4 mt-4">
            {soldAnimals.length > 0 && !isEmployee && (
              <div className="card-elevated p-4">
                <h3 className="font-semibold text-foreground mb-3">Sales Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Purchase Cost</p>
                    <p className="text-xl font-semibold text-foreground">R{totalPurchaseCost.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-semibold text-foreground">R{totalSaleRevenue.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Profit</p>
                    <p className={`text-xl font-semibold ${totalProfit >= 0 ? "text-primary" : "text-destructive"}`}>R{totalProfit.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="card-elevated p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search sold animals..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (<div key={i} className="h-48 bg-muted/50 animate-pulse rounded-xl" />))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAnimals.map((animal) => (
                  <div key={animal.id} onClick={() => handleAnimalClick(animal.id)} className="cursor-pointer">
                    <LivestockCard animal={animal} isSold hideFinancials={isEmployee} />
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredAnimals.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{soldAnimals.length === 0 ? "No sold animals yet. Mark animals as sold to see them here." : "No sold animals found matching your search."}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Sell Dialog */}
      <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display">Record Sale</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="salePrice">Sale Price (R)</Label>
              <Input id="salePrice" type="number" min="0" step="0.01" value={saleData.salePrice} onChange={(e) => setSaleData({ ...saleData, salePrice: e.target.value })} placeholder="e.g., 8000.00" />
            </div>
            <div>
              <Label htmlFor="soldTo">Sold To (Optional)</Label>
              <Input id="soldTo" value={saleData.soldTo} onChange={(e) => setSaleData({ ...saleData, soldTo: e.target.value })} placeholder="e.g., John Smith" />
            </div>
          </div>
          <Button onClick={handleSellAnimal} className="w-full bg-gradient-primary text-primary-foreground">Confirm Sale</Button>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <ImportCSVDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        farmId={farm.id}
        onImportComplete={fetchLivestock}
      />

      {/* Animal Detail Dialog */}
      <AnimalDetailDialog
        animal={selectedAnimalForDetail}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        allAnimals={allAnimalsForLineage}
        onUpdate={fetchLivestock}
      />

      {/* Mark for Sale Dialog */}
      <MarkForSaleDialog
        open={isMarkForSaleDialogOpen}
        onOpenChange={setIsMarkForSaleDialogOpen}
        animalName={animals.find(a => a.id === selectedAnimalId)?.name || ""}
        onConfirm={handleMarkForSale}
      />
    </Layout>
  );
}
