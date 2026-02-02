import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { useFarm } from "@/hooks/useFarm";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { TrendingUp, DollarSign, Scale, Calendar, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReportPdf } from "@/hooks/useReportPdf";

const COLORS = ['hsl(142, 45%, 35%)', 'hsl(38, 85%, 55%)', 'hsl(200, 80%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(280, 60%, 50%)'];

interface LivestockItem {
  id: string;
  type: string;
  status: string;
  weight: string | null;
  age: string | null;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  cost_per_unit: number;
}

export default function Reports() {
  const { farm } = useFarm();
  const [livestock, setLivestock] = useState<LivestockItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { generatePdf } = useReportPdf();

  useEffect(() => {
    if (!farm?.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      const [livestockRes, inventoryRes] = await Promise.all([
        supabase.from("livestock").select("id, type, status, weight, age").eq("farm_id", farm.id),
        supabase.from("feed_inventory").select("id, name, quantity, cost_per_unit").eq("farm_id", farm.id),
      ]);

      if (livestockRes.data) setLivestock(livestockRes.data);
      if (inventoryRes.data) setInventory(inventoryRes.data);
      setLoading(false);
    };

    fetchData();
  }, [farm?.id]);

  // Feed cost analysis
  const dailyCosts = inventory.map(item => ({
    name: item.name.replace(' Mix', '').replace(' Feed', '').replace(' Pellets', ''),
    daily: Math.round(Number(item.cost_per_unit) * 2), // Simplified daily consumption
    weekly: Math.round(Number(item.cost_per_unit) * 14),
    monthly: Math.round(Number(item.cost_per_unit) * 60),
  }));

  const totalDailyCost = dailyCosts.reduce((sum, item) => sum + item.daily, 0);
  const totalWeeklyCost = dailyCosts.reduce((sum, item) => sum + item.weekly, 0);
  const totalMonthlyCost = dailyCosts.reduce((sum, item) => sum + item.monthly, 0);

  // Livestock by type
  const livestockByType = livestock.reduce((acc, animal) => {
    if (!acc[animal.type]) {
      acc[animal.type] = { count: 0, totalWeight: 0, totalAge: 0 };
    }
    acc[animal.type].count++;
    acc[animal.type].totalWeight += parseFloat(animal.weight || "0") || 0;
    acc[animal.type].totalAge += parseFloat(animal.age || "0") || 0;
    return acc;
  }, {} as Record<string, { count: number; totalWeight: number; totalAge: number }>);

  const livestockStats = Object.entries(livestockByType).map(([type, data]) => ({
    name: type,
    count: data.count,
    avgWeight: data.count > 0 ? Math.round(data.totalWeight / data.count) : 0,
    avgAge: data.count > 0 ? (data.totalAge / data.count).toFixed(1) : "0",
  }));

  // Health status breakdown
  const healthStatus = livestock.reduce((acc, animal) => {
    acc[animal.status] = (acc[animal.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const healthData = Object.entries(healthStatus).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  // Feed consumption by animal type (calculated from livestock counts)
  const feedConsumption = Object.entries(livestockByType).map(([type, data]) => ({
    name: type,
    consumption: Math.round(data.count * (type === "Cattle" ? 15 : type === "Horse" ? 12 : type === "Pig" ? 5 : 2)),
  })).filter(item => item.consumption > 0);

  if (!farm) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">No Farm Selected</h2>
            <p className="text-muted-foreground">Create or select a farm to view reports.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const handleExportPdf = () => {
    if (!farm) return;
    
    generatePdf({
      farmName: farm.name,
      totalDailyCost,
      totalWeeklyCost,
      totalMonthlyCost,
      totalAnimals: livestock.length,
      livestockStats,
      dailyCosts,
      healthData,
      feedConsumption,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into your farm operations
            </p>
          </div>
          <Button 
            onClick={handleExportPdf} 
            disabled={loading || (livestock.length === 0 && inventory.length === 0)}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>

        {/* Cost Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Daily Feed Cost"
            value={loading ? "-" : `R${totalDailyCost}`}
            icon={DollarSign}
            variant="primary"
          />
          <StatsCard
            title="Weekly Feed Cost"
            value={loading ? "-" : `R${totalWeeklyCost}`}
            icon={TrendingUp}
          />
          <StatsCard
            title="Monthly Feed Cost"
            value={loading ? "-" : `R${totalMonthlyCost}`}
            icon={Calendar}
            variant="warning"
          />
          <StatsCard
            title="Total Animals"
            value={loading ? "-" : livestock.length}
            icon={Scale}
            variant="success"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[350px] bg-muted/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : livestock.length === 0 && inventory.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Scale className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Add livestock and inventory items to see reports and analytics.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feed Cost Chart */}
            {dailyCosts.length > 0 && (
              <div className="card-elevated p-6">
                <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                  Daily Feed Costs (Rands)
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyCosts} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [`R${value}`, 'Cost']}
                      />
                      <Bar dataKey="daily" fill="hsl(142, 45%, 35%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Health Status Pie Chart */}
            {healthData.length > 0 && (
              <div className="card-elevated p-6">
                <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                  Health Status Breakdown
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={healthData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {healthData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Livestock Statistics */}
            {livestockStats.length > 0 && (
              <div className="card-elevated p-6">
                <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                  Livestock Statistics by Type
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">Count</th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">Avg Weight</th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">Avg Age</th>
                      </tr>
                    </thead>
                    <tbody>
                      {livestockStats.map((stat) => (
                        <tr key={stat.name} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-4">
                            <span className="flex items-center gap-2">
                              <span className="text-xl">
                                {stat.name === "Cattle" ? "🐄" : 
                                 stat.name === "Sheep" ? "🐑" : 
                                 stat.name === "Goat" ? "🐐" : 
                                 stat.name === "Pig" ? "🐷" : 
                                 stat.name === "Chicken" ? "🐔" : 
                                 stat.name === "Horse" ? "🐴" : "🐾"}
                              </span>
                              {stat.name}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 font-mono">{stat.count}</td>
                          <td className="text-right py-3 px-4 font-mono">{stat.avgWeight} kg</td>
                          <td className="text-right py-3 px-4 font-mono">{stat.avgAge} yrs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Feed Consumption Chart */}
            {feedConsumption.length > 0 && (
              <div className="card-elevated p-6">
                <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                  Daily Feed Consumption by Animal Type (kg)
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feedConsumption} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [`${value} kg`, 'Consumption']}
                      />
                      <Bar dataKey="consumption" fill="hsl(38, 85%, 55%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
