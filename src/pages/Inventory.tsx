import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { InventoryTable, InventoryItem } from "@/components/InventoryTable";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Package, AlertTriangle, TrendingDown, Calculator, Plus } from "lucide-react";
import { useFarm } from "@/hooks/useFarm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const feedTypes = [
  "Cattle Feed",
  "Poultry Feed",
  "Sheep Feed",
  "Goat Feed",
  "Pig Feed",
  "Horse Feed",
  "Roughage",
  "Supplements",
  "Other",
];

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { farm } = useFarm();
  const { toast } = useToast();

  const [newItem, setNewItem] = useState({
    name: "",
    type: "",
    quantity: "",
    unit: "kg",
    reorderLevel: "",
    costPerUnit: "",
  });

  useEffect(() => {
    if (!farm?.id) {
      setLoading(false);
      return;
    }

    const fetchInventory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("feed_inventory")
        .select("*")
        .eq("farm_id", farm.id)
        .order("name");

      if (error) {
        console.error("Error fetching inventory:", error);
      } else {
        setInventory(data.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          quantity: Number(item.quantity),
          unit: item.unit,
          reorderLevel: Number(item.reorder_level),
          costPerUnit: Number(item.cost_per_unit),
          lastRestocked: item.last_restocked || undefined,
        })));
      }
      setLoading(false);
    };

    fetchInventory();
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

    if (!newItem.name || !newItem.type || !newItem.quantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in name, type, and quantity.",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("feed_inventory")
      .insert({
        farm_id: farm.id,
        name: newItem.name,
        type: newItem.type,
        quantity: Number(newItem.quantity),
        unit: newItem.unit,
        reorder_level: Number(newItem.reorderLevel) || 0,
        cost_per_unit: Number(newItem.costPerUnit) || 0,
        last_restocked: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to add inventory item.",
        variant: "destructive",
      });
      return;
    }

    const item: InventoryItem = {
      id: data.id,
      name: data.name,
      type: data.type,
      quantity: Number(data.quantity),
      unit: data.unit,
      reorderLevel: Number(data.reorder_level),
      costPerUnit: Number(data.cost_per_unit),
      lastRestocked: data.last_restocked || undefined,
    };

    setInventory([...inventory, item]);
    setNewItem({
      name: "",
      type: "",
      quantity: "",
      unit: "kg",
      reorderLevel: "",
      costPerUnit: "",
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Item Added",
      description: `${item.name} has been added to your inventory.`,
    });
  };

  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(item => item.quantity <= item.reorderLevel).length;
  const criticalItems = inventory.filter(item => item.quantity < item.reorderLevel * 0.5).length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

  if (!farm) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">No Farm Selected</h2>
            <p className="text-muted-foreground">Create or select a farm to manage inventory.</p>
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
              Feed Inventory
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your feed stock levels and reorder requirements
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-display">Add Inventory Item</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="e.g., Dairy Cattle Mix"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Feed Type</Label>
                    <Select value={newItem.type} onValueChange={(v) => setNewItem({ ...newItem, type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {feedTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={newItem.unit} onValueChange={(v) => setNewItem({ ...newItem, unit: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="bales">bales</SelectItem>
                        <SelectItem value="blocks">blocks</SelectItem>
                        <SelectItem value="bags">bags</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input
                      id="reorderLevel"
                      type="number"
                      value={newItem.reorderLevel}
                      onChange={(e) => setNewItem({ ...newItem, reorderLevel: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="costPerUnit">Cost per Unit (R)</Label>
                  <Input
                    id="costPerUnit"
                    type="number"
                    step="0.01"
                    value={newItem.costPerUnit}
                    onChange={(e) => setNewItem({ ...newItem, costPerUnit: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <Button onClick={handleAddItem} className="w-full bg-gradient-primary text-primary-foreground">
                Add Item
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Feed Types"
            value={loading ? "-" : totalItems}
            icon={Package}
            variant="primary"
          />
          <StatsCard
            title="Running Low"
            value={loading ? "-" : lowStockItems}
            icon={TrendingDown}
            variant="warning"
          />
          <StatsCard
            title="Critical Stock"
            value={loading ? "-" : criticalItems}
            icon={AlertTriangle}
            variant={criticalItems > 0 ? "danger" : "default"}
          />
          <StatsCard
            title="Inventory Value"
            value={loading ? "-" : `R${totalValue.toLocaleString()}`}
            icon={Calculator}
          />
        </div>

        {/* Inventory Table */}
        <div>
          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Current Stock Levels
          </h2>
          {loading ? (
            <div className="h-48 bg-muted/50 animate-pulse rounded-xl" />
          ) : inventory.length > 0 ? (
            <InventoryTable items={inventory} />
          ) : (
            <div className="card-elevated p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No inventory items yet. Click 'Add Item' to get started.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
