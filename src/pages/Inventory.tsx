import { Layout } from "@/components/Layout";
import { InventoryTable } from "@/components/InventoryTable";
import { StatsCard } from "@/components/StatsCard";
import { mockInventory, mockAnimals } from "@/data/mockData";
import { Package, AlertTriangle, TrendingDown, Calculator } from "lucide-react";

export default function Inventory() {
  const totalItems = mockInventory.length;
  const lowStockItems = mockInventory.filter(item => item.quantity <= item.reorderLevel).length;
  const criticalItems = mockInventory.filter(item => item.quantity < item.reorderLevel * 0.5).length;
  const totalValue = mockInventory.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

  // Calculate daily requirements
  const dailyRequirements = [
    { feedType: "Dairy Cattle Mix", dailyKg: 15, animals: 2 },
    { feedType: "Beef Cattle Feed", dailyKg: 12, animals: 1 },
    { feedType: "Layer Mash", dailyKg: 0.12, animals: 1 },
    { feedType: "Sheep Pellets", dailyKg: 1.5, animals: 1 },
    { feedType: "Goat Mix", dailyKg: 1.2, animals: 1 },
    { feedType: "Pig Grower", dailyKg: 3, animals: 1 },
    { feedType: "Horse Cubes", dailyKg: 5, animals: 1 },
  ].map(req => {
    const inventory = mockInventory.find(i => i.name === req.feedType);
    const dailyTotal = req.dailyKg * req.animals;
    const daysRemaining = inventory ? Math.floor(inventory.quantity / dailyTotal) : 0;
    return { ...req, dailyTotal, daysRemaining, inventory };
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Feed Inventory
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your feed stock levels and reorder requirements
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Feed Types"
            value={totalItems}
            icon={Package}
            variant="primary"
          />
          <StatsCard
            title="Running Low"
            value={lowStockItems}
            icon={TrendingDown}
            variant="warning"
          />
          <StatsCard
            title="Critical Stock"
            value={criticalItems}
            icon={AlertTriangle}
            variant={criticalItems > 0 ? "danger" : "default"}
          />
          <StatsCard
            title="Inventory Value"
            value={`R${totalValue.toLocaleString()}`}
            icon={Calculator}
          />
        </div>

        {/* Inventory Table */}
        <div>
          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Current Stock Levels
          </h2>
          <InventoryTable items={mockInventory} />
        </div>

        {/* Daily Requirements Calculator */}
        <div className="card-elevated p-6">
          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Daily Feed Requirements
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Estimated days remaining based on current stock and daily consumption
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dailyRequirements.map((req, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">{req.feedType}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily usage:</span>
                    <span className="font-mono">{req.dailyTotal.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">In stock:</span>
                    <span className="font-mono">{req.inventory?.quantity || 0} kg</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Days remaining:</span>
                    <span className={`font-bold font-mono ${
                      req.daysRemaining <= 7 ? "text-destructive" :
                      req.daysRemaining <= 14 ? "text-warning" :
                      "text-success"
                    }`}>
                      {req.daysRemaining} days
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
