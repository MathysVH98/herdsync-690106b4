import { Layout } from "@/components/Layout";
import { mockAnimals, mockInventory, mockHealthRecords } from "@/data/mockData";
import { StatsCard } from "@/components/StatsCard";
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
import { TrendingUp, DollarSign, Scale, Calendar } from "lucide-react";

const COLORS = ['hsl(142, 45%, 35%)', 'hsl(38, 85%, 55%)', 'hsl(200, 80%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(280, 60%, 50%)'];

export default function Reports() {
  // Feed cost analysis
  const dailyCosts = mockInventory.map(item => ({
    name: item.name.replace(' Mix', '').replace(' Feed', '').replace(' Pellets', ''),
    daily: Math.round(item.costPerUnit * 2), // Simplified daily consumption
    weekly: Math.round(item.costPerUnit * 14),
    monthly: Math.round(item.costPerUnit * 60),
  }));

  const totalDailyCost = dailyCosts.reduce((sum, item) => sum + item.daily, 0);
  const totalWeeklyCost = dailyCosts.reduce((sum, item) => sum + item.weekly, 0);
  const totalMonthlyCost = dailyCosts.reduce((sum, item) => sum + item.monthly, 0);

  // Livestock by type
  const livestockByType = mockAnimals.reduce((acc, animal) => {
    if (!acc[animal.type]) {
      acc[animal.type] = { count: 0, totalWeight: 0, totalAge: 0 };
    }
    acc[animal.type].count++;
    acc[animal.type].totalWeight += parseFloat(animal.weight) || 0;
    acc[animal.type].totalAge += parseFloat(animal.age) || 0;
    return acc;
  }, {} as Record<string, { count: number; totalWeight: number; totalAge: number }>);

  const livestockStats = Object.entries(livestockByType).map(([type, data]) => ({
    name: type,
    count: data.count,
    avgWeight: Math.round(data.totalWeight / data.count),
    avgAge: (data.totalAge / data.count).toFixed(1),
  }));

  // Health status breakdown
  const healthStatus = mockAnimals.reduce((acc, animal) => {
    acc[animal.status] = (acc[animal.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const healthData = Object.entries(healthStatus).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  // Feed consumption by animal type (mock data)
  const feedConsumption = [
    { name: 'Cattle', consumption: 45 },
    { name: 'Sheep', consumption: 8 },
    { name: 'Goats', consumption: 6 },
    { name: 'Pigs', consumption: 15 },
    { name: 'Chickens', consumption: 3 },
    { name: 'Horses', consumption: 12 },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your farm operations
          </p>
        </div>

        {/* Cost Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Daily Feed Cost"
            value={`R${totalDailyCost}`}
            icon={DollarSign}
            variant="primary"
          />
          <StatsCard
            title="Weekly Feed Cost"
            value={`R${totalWeeklyCost}`}
            icon={TrendingUp}
          />
          <StatsCard
            title="Monthly Feed Cost"
            value={`R${totalMonthlyCost}`}
            icon={Calendar}
            variant="warning"
          />
          <StatsCard
            title="Total Animals"
            value={mockAnimals.length}
            icon={Scale}
            variant="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feed Cost Chart */}
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

          {/* Health Status Pie Chart */}
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

          {/* Livestock Statistics */}
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

          {/* Feed Consumption Chart */}
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
        </div>
      </div>
    </Layout>
  );
}
