import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { FeedingSchedule } from "@/components/FeedingSchedule";
import { AlertList } from "@/components/AlertCard";
import { Badge } from "@/components/ui/badge";
import { 
  mockFeedingSchedule, 
  mockAlerts, 
  mockHealthRecords,
  getLivestockStats,
  getLowStockItems 
} from "@/data/mockData";
import { 
  PawPrint, 
  Heart, 
  AlertTriangle, 
  Package,
  Clock,
  Calendar
} from "lucide-react";

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const stats = getLivestockStats();
  const lowStockItems = getLowStockItems();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const morningFeedings = mockFeedingSchedule.filter(f => f.period === "morning").slice(0, 4);
  const recentHealth = mockHealthRecords.slice(0, 3);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening on your farm today.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-5 py-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">
                {currentTime.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentTime.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Livestock"
            value={stats.total}
            icon={PawPrint}
            variant="primary"
          />
          <StatsCard
            title="Healthy Animals"
            value={stats.healthy}
            icon={Heart}
            variant="success"
          />
          <StatsCard
            title="Needs Attention"
            value={stats.needsAttention}
            icon={AlertTriangle}
            variant="warning"
          />
          <StatsCard
            title="Low Stock Items"
            value={lowStockItems.length}
            icon={Package}
            variant={lowStockItems.length > 0 ? "danger" : "default"}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Livestock Breakdown & Feeding */}
          <div className="lg:col-span-2 space-y-6">
            {/* Livestock Breakdown */}
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                Livestock Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-3xl mb-2">
                      {type === "Cattle" ? "🐄" : 
                       type === "Sheep" ? "🐑" : 
                       type === "Goat" ? "🐐" : 
                       type === "Pig" ? "🐷" : 
                       type === "Chicken" ? "🐔" : 
                       type === "Horse" ? "🐴" : "🐾"}
                    </p>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-sm text-muted-foreground">{type}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Feeding Schedule */}
            <FeedingSchedule 
              items={morningFeedings} 
              title="Morning Feeding Schedule"
            />
          </div>

          {/* Right Column - Alerts */}
          <div className="space-y-6">
            {/* Alerts */}
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg text-foreground">
                  Alerts
                </h3>
                <Badge variant="destructive" className="animate-pulse-soft">
                  {mockAlerts.length} Active
                </Badge>
              </div>
              <AlertList alerts={mockAlerts.slice(0, 4)} />
            </div>

            {/* Recent Health Records */}
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                Recent Health Records
              </h3>
              <div className="space-y-3">
                {recentHealth.map((record) => (
                  <div key={record.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{record.animalName}</p>
                      <p className="text-xs text-muted-foreground">{record.type} - {record.date}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {record.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
