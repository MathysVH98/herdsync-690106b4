import { useState } from "react";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  AlertTriangle, 
  Calculator, 
  Plus,
  Fuel,
  Pill,
  Wrench,
  FlaskConical,
  Cog,
  Wheat,
  History,
  Tractor
} from "lucide-react";
import { useFarm } from "@/hooks/useFarm";
import { useInventory, InventoryItem, INVENTORY_CATEGORIES } from "@/hooks/useInventory";
import { useFarmEquipment } from "@/hooks/useFarmEquipment";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AddInventoryDialog } from "@/components/inventory/AddInventoryDialog";
import { AddEquipmentDialog } from "@/components/inventory/AddEquipmentDialog";
import { EquipmentTable } from "@/components/inventory/EquipmentTable";
import { RestockDialog } from "@/components/inventory/RestockDialog";
import { UsageLogDialog } from "@/components/inventory/UsageLogDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const categoryIcons: Record<string, React.ReactNode> = {
  "Feed": <Wheat className="h-4 w-4" />,
  "Fuel": <Fuel className="h-4 w-4" />,
  "Medicine": <Pill className="h-4 w-4" />,
  "Tools": <Wrench className="h-4 w-4" />,
  "Chemicals": <FlaskConical className="h-4 w-4" />,
  "Spare Parts": <Cog className="h-4 w-4" />,
};

export default function Inventory() {
  const { farm } = useFarm();
  const { 
    inventory, 
    usageLog,
    loading, 
    addItem, 
    deleteItem,
    restockItem,
    logUsage,
    getLowStockItems,
    getTotalValue,
  } = useInventory();
  
  const {
    equipment,
    loading: equipmentLoading,
    addEquipment,
    deleteEquipment,
    getTotalValue: getEquipmentTotalValue,
  } = useFarmEquipment();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddEquipmentDialogOpen, setIsAddEquipmentDialogOpen] = useState(false);
  const [restockItem_, setRestockItem] = useState<InventoryItem | null>(null);
  const [usageItem, setUsageItem] = useState<InventoryItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const lowStockItems = getLowStockItems();
  const totalValue = getTotalValue();
  const equipmentValue = getEquipmentTotalValue();
  const totalItems = inventory.length;

  const filteredItems = activeCategory === "all" 
    ? inventory 
    : inventory.filter(item => item.category === activeCategory);

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
              Farm Inventory
            </h1>
            <p className="text-muted-foreground mt-1">
              Track all farm stock, supplies, and equipment
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-gradient-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
            <Button 
              onClick={() => setIsAddEquipmentDialogOpen(true)}
              variant="outline"
            >
              <Tractor className="w-4 h-4 mr-2" />
              Add Equipment
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          <StatsCard
            title="Total Items"
            value={loading ? "-" : totalItems}
            icon={Package}
            variant="primary"
          />
          <StatsCard
            title="Low Stock Items"
            value={loading ? "-" : lowStockItems.length}
            icon={AlertTriangle}
            variant={lowStockItems.length > 0 ? "warning" : "default"}
          />
          <StatsCard
            title="Equipment"
            value={equipmentLoading ? "-" : equipment.length}
            icon={Tractor}
          />
          <StatsCard
            title="Inventory Value"
            value={loading ? "-" : `R${totalValue.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`}
            icon={Calculator}
          />
          <StatsCard
            title="Equipment Value"
            value={equipmentLoading ? "-" : `R${equipmentValue.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`}
            icon={Calculator}
          />
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-accent/50 border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-foreground">
                Low Stock Alert
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setRestockItem(item)}
                >
                  {item.name} ({item.quantity} {item.unit})
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Category Tabs and Inventory Table */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              All
            </TabsTrigger>
            {INVENTORY_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="flex items-center gap-1">
                {categoryIcons[cat]}
                {cat}
              </TabsTrigger>
            ))}
            <TabsTrigger value="equipment" className="flex items-center gap-1">
              <Tractor className="h-4 w-4" />
              Equipment
            </TabsTrigger>
            <TabsTrigger value="usage-log" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              Usage Log
            </TabsTrigger>
          </TabsList>

          {/* All and Category Views */}
          {["all", ...INVENTORY_CATEGORIES].map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-4">
              {loading ? (
                <div className="h-48 bg-muted/50 animate-pulse rounded-xl" />
              ) : (
                <InventoryTable
                  items={filteredItems}
                  onRestock={setRestockItem}
                  onLogUsage={setUsageItem}
                  onDelete={deleteItem}
                />
              )}
            </TabsContent>
          ))}

          {/* Equipment View */}
          <TabsContent value="equipment" className="mt-4">
            {equipmentLoading ? (
              <div className="h-48 bg-muted/50 animate-pulse rounded-xl" />
            ) : (
              <EquipmentTable
                items={equipment}
                onDelete={deleteEquipment}
              />
            )}
          </TabsContent>

          {/* Usage Log View */}
          <TabsContent value="usage-log" className="mt-4">
            <div className="card-elevated overflow-hidden">
              {usageLog.length === 0 ? (
                <div className="p-12 text-center">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No usage records yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Quantity Used</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Used By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageLog.map((log) => {
                      const item = inventory.find(i => i.id === log.inventory_id);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(log.usage_date), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item?.name || "Unknown Item"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {log.quantity_used} {item?.unit || ""}
                          </TableCell>
                          <TableCell>{log.reason}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.used_by || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {log.notes || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AddInventoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={addItem}
      />

      <RestockDialog
        open={!!restockItem_}
        onOpenChange={(open) => !open && setRestockItem(null)}
        item={restockItem_}
        onSubmit={restockItem}
      />

      <UsageLogDialog
        open={!!usageItem}
        onOpenChange={(open) => !open && setUsageItem(null)}
        item={usageItem}
        onSubmit={logUsage}
      />

      <AddEquipmentDialog
        open={isAddEquipmentDialogOpen}
        onOpenChange={setIsAddEquipmentDialogOpen}
        onSubmit={addEquipment}
      />
    </Layout>
  );
}
