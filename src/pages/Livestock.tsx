import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { LivestockCard, Animal, AnimalStatus } from "@/components/LivestockCard";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Plus, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFarm } from "@/hooks/useFarm";
import { supabase } from "@/integrations/supabase/client";

const statusOptions: AnimalStatus[] = ["Healthy", "Under Observation", "Sick", "Pregnant"];
const typeOptions = ["Cattle", "Sheep", "Goat", "Pig", "Chicken", "Duck", "Horse"];

export default function Livestock() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const { toast } = useToast();
  const { farm } = useFarm();

  const [newAnimal, setNewAnimal] = useState({
    name: "",
    type: "",
    breed: "",
    tag: "",
    age: "",
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
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLivestock();
  }, [farm?.id]);

  // Refetch when page becomes visible (e.g., after navigating back from Animal Sale)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && farm?.id) {
        fetchLivestock();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [farm?.id]);

  // Separate active and sold animals
  const activeAnimals = animals.filter(a => !a.soldAt);
  const soldAnimals = animals.filter(a => a.soldAt);

  const filteredAnimals = (activeTab === "active" ? activeAnimals : soldAnimals).filter((animal) => {
    const matchesSearch = 
      animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || animal.status === filterStatus;
    const matchesType = filterType === "all" || animal.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAddAnimal = async () => {
    if (!farm?.id) {
      toast({
        title: "No Farm Selected",
        description: "Please select a farm first.",
        variant: "destructive",
      });
      return;
    }

    if (!newAnimal.name || !newAnimal.type || !newAnimal.tag) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least name, type, and tag.",
        variant: "destructive",
      });
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
        age: newAnimal.age || null,
        weight: newAnimal.weight || null,
        status: newAnimal.status,
        feed_type: newAnimal.feedType || null,
        purchase_cost: parseFloat(newAnimal.purchaseCost) || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding animal:", error);
      toast({
        title: "Error",
        description: "Failed to add animal.",
        variant: "destructive",
      });
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
    setNewAnimal({
      name: "",
      type: "",
      breed: "",
      tag: "",
      age: "",
      weight: "",
      status: "Healthy",
      feedType: "",
      purchaseCost: "",
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Animal Added",
      description: `${animal.name} has been added to your livestock.`,
    });
  };

  const handleFeed = async (id: string) => {
    const animal = animals.find((a) => a.id === id);
    
    await supabase
      .from("livestock")
      .update({ last_fed: new Date().toISOString() })
      .eq("id", id);

    setAnimals(animals.map(a => 
      a.id === id ? { ...a, lastFed: new Date().toLocaleString() } : a
    ));

    toast({
      title: "Feeding Recorded",
      description: `${animal?.name} has been fed.`,
    });
  };

  const handleRemove = async (id: string) => {
    const animal = animals.find((a) => a.id === id);
    
    const { error } = await supabase
      .from("livestock")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove animal.",
        variant: "destructive",
      });
      return;
    }

    setAnimals(animals.filter((a) => a.id !== id));
    toast({
      title: "Animal Removed",
      description: `${animal?.name} has been removed from your livestock.`,
    });
  };

  const handleOpenSellDialog = (id: string) => {
    setSelectedAnimalId(id);
    setSaleData({ salePrice: "", soldTo: "" });
    setIsSellDialogOpen(true);
  };

  const handleSellAnimal = async () => {
    if (!selectedAnimalId) return;

    const salePrice = parseFloat(saleData.salePrice);
    if (isNaN(salePrice) || salePrice < 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid sale price.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("livestock")
      .update({
        sale_price: salePrice,
        sold_at: new Date().toISOString(),
        sold_to: saleData.soldTo || null,
      })
      .eq("id", selectedAnimalId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to record sale.",
        variant: "destructive",
      });
      return;
    }

    const animal = animals.find(a => a.id === selectedAnimalId);
    setAnimals(animals.map(a => 
      a.id === selectedAnimalId 
        ? { ...a, salePrice, soldAt: new Date().toISOString(), soldTo: saleData.soldTo || null }
        : a
    ));

    setIsSellDialogOpen(false);
    setSelectedAnimalId(null);

    toast({
      title: "Sale Recorded",
      description: `${animal?.name} has been marked as sold for R${salePrice.toFixed(2)}.`,
    });
  };

  const statusCounts = {
    all: activeAnimals.length,
    Healthy: activeAnimals.filter((a) => a.status === "Healthy").length,
    "Under Observation": activeAnimals.filter((a) => a.status === "Under Observation").length,
    Sick: activeAnimals.filter((a) => a.status === "Sick").length,
    Pregnant: activeAnimals.filter((a) => a.status === "Pregnant").length,
  };

  // Calculate financial summary for sold animals
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
            <h1 className="text-3xl font-bold font-display text-foreground">
              Livestock Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all your farm animals in one place
            </p>
          </div>

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
                    <Input
                      id="name"
                      value={newAnimal.name}
                      onChange={(e) => setNewAnimal({ ...newAnimal, name: e.target.value })}
                      placeholder="e.g., Bessie"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tag">Tag Number</Label>
                    <Input
                      id="tag"
                      value={newAnimal.tag}
                      onChange={(e) => setNewAnimal({ ...newAnimal, tag: e.target.value })}
                      placeholder="e.g., C001"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Animal Type</Label>
                    <Select value={newAnimal.type} onValueChange={(v) => setNewAnimal({ ...newAnimal, type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="breed">Breed</Label>
                    <Input
                      id="breed"
                      value={newAnimal.breed}
                      onChange={(e) => setNewAnimal({ ...newAnimal, breed: e.target.value })}
                      placeholder="e.g., Holstein"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      value={newAnimal.age}
                      onChange={(e) => setNewAnimal({ ...newAnimal, age: e.target.value })}
                      placeholder="e.g., 2 years"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      value={newAnimal.weight}
                      onChange={(e) => setNewAnimal({ ...newAnimal, weight: e.target.value })}
                      placeholder="e.g., 500 kg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={newAnimal.status} onValueChange={(v) => setNewAnimal({ ...newAnimal, status: v as AnimalStatus })}>
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
                    <Label htmlFor="feedType">Feed Type</Label>
                    <Input
                      id="feedType"
                      value={newAnimal.feedType}
                      onChange={(e) => setNewAnimal({ ...newAnimal, feedType: e.target.value })}
                      placeholder="e.g., Dairy Mix"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="purchaseCost">Purchase Cost (R)</Label>
                  <Input
                    id="purchaseCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newAnimal.purchaseCost}
                    onChange={(e) => setNewAnimal({ ...newAnimal, purchaseCost: e.target.value })}
                    placeholder="e.g., 5000.00"
                  />
                </div>
              </div>
              <Button onClick={handleAddAnimal} className="w-full bg-gradient-primary text-primary-foreground">
                Add Animal
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs for Active vs Sold */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">
              Active ({activeAnimals.length})
            </TabsTrigger>
            <TabsTrigger value="sold">
              Sold History ({soldAnimals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="card-elevated p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, tag, or breed..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-3">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {typeOptions.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge 
                  variant={filterStatus === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilterStatus("all")}
                >
                  All ({statusCounts.all})
                </Badge>
                <Badge 
                  variant={filterStatus === "Healthy" ? "default" : "outline"}
                  className="cursor-pointer badge-healthy"
                  onClick={() => setFilterStatus("Healthy")}
                >
                  Healthy ({statusCounts.Healthy})
                </Badge>
                <Badge 
                  variant={filterStatus === "Under Observation" ? "default" : "outline"}
                  className="cursor-pointer badge-observation"
                  onClick={() => setFilterStatus("Under Observation")}
                >
                  Under Observation ({statusCounts["Under Observation"]})
                </Badge>
                <Badge 
                  variant={filterStatus === "Sick" ? "default" : "outline"}
                  className="cursor-pointer badge-sick"
                  onClick={() => setFilterStatus("Sick")}
                >
                  Sick ({statusCounts.Sick})
                </Badge>
                <Badge 
                  variant={filterStatus === "Pregnant" ? "default" : "outline"}
                  className="cursor-pointer badge-pregnant"
                  onClick={() => setFilterStatus("Pregnant")}
                >
                  Pregnant ({statusCounts.Pregnant})
                </Badge>
              </div>
            </div>

            {/* Animal Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-muted/50 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAnimals.map((animal) => (
                  <LivestockCard
                    key={animal.id}
                    animal={animal}
                    onFeed={handleFeed}
                    onRemove={handleRemove}
                    onSell={handleOpenSellDialog}
                  />
                ))}
              </div>
            )}

            {!loading && filteredAnimals.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {activeAnimals.length === 0 
                    ? "No animals added yet. Click 'Add Animal' to get started."
                    : "No animals found matching your criteria."}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sold" className="space-y-4 mt-4">
            {/* Financial Summary */}
            {soldAnimals.length > 0 && (
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
                    <p className={`text-xl font-semibold ${totalProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                      R{totalProfit.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="card-elevated p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search sold animals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sold Animals Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-muted/50 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAnimals.map((animal) => (
                  <LivestockCard
                    key={animal.id}
                    animal={animal}
                    isSold
                  />
                ))}
              </div>
            )}

            {!loading && filteredAnimals.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {soldAnimals.length === 0 
                    ? "No sold animals yet. Mark animals as sold to see them here."
                    : "No sold animals found matching your search."}
                </p>
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
              <Input
                id="salePrice"
                type="number"
                min="0"
                step="0.01"
                value={saleData.salePrice}
                onChange={(e) => setSaleData({ ...saleData, salePrice: e.target.value })}
                placeholder="e.g., 8000.00"
              />
            </div>
            <div>
              <Label htmlFor="soldTo">Sold To (Optional)</Label>
              <Input
                id="soldTo"
                value={saleData.soldTo}
                onChange={(e) => setSaleData({ ...saleData, soldTo: e.target.value })}
                placeholder="e.g., John Smith"
              />
            </div>
          </div>
          <Button onClick={handleSellAnimal} className="w-full bg-gradient-primary text-primary-foreground">
            Confirm Sale
          </Button>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
