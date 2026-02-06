import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { FeedingSchedule, FeedingItem } from "@/components/FeedingSchedule";
import { AlertList } from "@/components/AlertCard";
import { WeatherWidget } from "@/components/WeatherWidget";
import { Badge } from "@/components/ui/badge";
import { getAnimalImage } from "@/utils/animalImages";
import { SaleCountdownBadge } from "@/components/SaleCountdownBadge";
import { useFarm } from "@/hooks/useFarm";
 import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  PawPrint, 
  Heart, 
  AlertTriangle, 
  Package,
  Clock,
  Calendar
} from "lucide-react";

interface LivestockItem {
  id: string;
  name: string;
  type: string;
  status: string;
  tag: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
  planned_sale_date: string | null;
}

interface HealthRecord {
  id: string;
  animal_name: string;
  type: string;
  date: string;
}

interface AlertItem {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
}

interface FeedInventoryItem {
  id: string;
  quantity: number;
  reorder_level: number;
}

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
   const { user, loading: authLoading } = useAuth();
   const { farm, loading: farmLoading } = useFarm();
  const [livestock, setLivestock] = useState<LivestockItem[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [feedingSchedule, setFeedingSchedule] = useState<FeedingItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [feedInventory, setFeedInventory] = useState<FeedInventoryItem[]>([]);
   const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!farm?.id) {
       setDataLoading(false);
      return;
    }

    const fetchData = async () => {
       setDataLoading(true);
      
      const [livestockRes, healthRes, feedingRes, alertsRes, inventoryRes] = await Promise.all([
        supabase.from("livestock").select("id, name, type, status, tag, breed, age, weight, planned_sale_date").eq("farm_id", farm.id),
        supabase.from("health_records").select("id, animal_name, type, date").eq("farm_id", farm.id).order("date", { ascending: false }).limit(5),
        supabase.from("feeding_schedule").select("*").eq("farm_id", farm.id).order("time"),
        supabase.from("alerts").select("*").eq("farm_id", farm.id).eq("dismissed", false).order("created_at", { ascending: false }).limit(6),
        supabase.from("feed_inventory").select("id, quantity, reorder_level").eq("farm_id", farm.id),
      ]);

      if (livestockRes.data) setLivestock(livestockRes.data);
      if (healthRes.data) setHealthRecords(healthRes.data);
      if (feedingRes.data) setFeedingSchedule(feedingRes.data.map(f => ({
        id: f.id,
        animalType: f.animal_type,
        feedType: f.feed_type,
        time: f.time,
        period: f.period as "morning" | "evening",
        notes: f.notes || undefined,
      })));
      if (alertsRes.data) setAlerts(alertsRes.data);
      if (inventoryRes.data) setFeedInventory(inventoryRes.data);

       setDataLoading(false);
    };

    fetchData();
  }, [farm?.id]);

   const loading = dataLoading;
 
  // Calculate stats from real data
  const stats = {
    total: livestock.length,
    healthy: livestock.filter(a => a.status === "Healthy").length,
    needsAttention: livestock.filter(a => a.status === "Under Observation" || a.status === "Sick").length,
    byType: livestock.reduce((acc, animal) => {
      acc[animal.type] = (acc[animal.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // Get animals with upcoming planned sales (within 30 days)
  const upcomingSales = livestock
    .filter(animal => {
      if (!animal.planned_sale_date) return false;
      const saleDate = new Date(animal.planned_sale_date);
      const today = new Date();
      const daysUntilSale = Math.floor((saleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilSale <= 30 && daysUntilSale >= 0;
    })
    .sort((a, b) => {
      const dateA = new Date(a.planned_sale_date!);
      const dateB = new Date(b.planned_sale_date!);
      return dateA.getTime() - dateB.getTime();
    });

  const lowStockItems = feedInventory.filter(item => item.quantity <= item.reorder_level);
  const morningFeedings = feedingSchedule.filter(f => f.period === "morning").slice(0, 4);

  // Format alerts for AlertList component
  const formattedAlerts = alerts.map(a => ({
    id: a.id,
    type: a.type as "danger" | "warning" | "info",
    title: a.title,
    message: a.message,
    time: formatRelativeTime(a.created_at),
  }));

  function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

   // Show loading state while auth or farm is loading
   if (authLoading || farmLoading) {
     return (
       <Layout>
         <div className="flex items-center justify-center h-96">
           <div className="text-center space-y-4">
             <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
             <div>
               <h2 className="text-xl font-semibold text-foreground mb-2">Loading your farm...</h2>
               <p className="text-muted-foreground">Please wait while we fetch your data.</p>
             </div>
           </div>
         </div>
       </Layout>
     );
   }
 
  if (!farm) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">No Farm Selected</h2>
            <p className="text-muted-foreground">Create or select a farm to view your dashboard.</p>
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
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening on {farm.name} today.
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
            value={loading ? "-" : stats.total}
            icon={PawPrint}
            variant="primary"
          />
          <StatsCard
            title="Healthy Animals"
            value={loading ? "-" : stats.healthy}
            icon={Heart}
            variant="success"
          />
          <StatsCard
            title="Needs Attention"
            value={loading ? "-" : stats.needsAttention}
            icon={AlertTriangle}
            variant="warning"
          />
          <StatsCard
            title="Low Stock Items"
            value={loading ? "-" : lowStockItems.length}
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
              {Object.keys(stats.byType).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No livestock added yet. Go to the Livestock page to add your animals.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="bg-muted/50 rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:shadow-md">
                      <div className="aspect-square relative">
                        <img 
                          src={getAnimalImage(type)} 
                          alt={type}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-2xl font-bold text-white">{count}</p>
                          <p className="text-xs text-white/90">{type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feeding Schedule */}
            {morningFeedings.length > 0 ? (
              <FeedingSchedule 
                items={morningFeedings} 
                title="Morning Feeding Schedule"
              />
            ) : (
              <div className="card-elevated p-6">
                <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                  Morning Feeding Schedule
                </h3>
                <p className="text-muted-foreground text-center py-8">
                  No feeding schedule set up yet. Go to the Feeding page to create one.
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Weather & Alerts */}
          <div className="space-y-6">
            {/* Weather Widget */}
            <WeatherWidget />
            
            {/* Alerts */}
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg text-foreground">
                  Alerts
                </h3>
                {formattedAlerts.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse-soft">
                    {formattedAlerts.length} Active
                  </Badge>
                )}
              </div>
              {formattedAlerts.length > 0 ? (
                <AlertList alerts={formattedAlerts.slice(0, 4)} />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No active alerts
                </p>
              )}
            </div>

            {/* Recent Health Records */}
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                Recent Health Records
              </h3>
              {healthRecords.length > 0 ? (
                <div className="space-y-3">
                  {healthRecords.slice(0, 3).map((record) => (
                    <div key={record.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{record.animal_name}</p>
                        <p className="text-xs text-muted-foreground">{record.type} - {record.date}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {record.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No health records yet
                </p>
              )}
            </div>

            {/* Upcoming Sales */}
            {upcomingSales.length > 0 && (
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-lg text-foreground">
                    Upcoming Sales
                  </h3>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                    {upcomingSales.length} Pending
                  </Badge>
                </div>
                <div className="space-y-3">
                  {upcomingSales.slice(0, 4).map((animal) => (
                    <div key={animal.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <img 
                        src={getAnimalImage(animal.type)} 
                        alt={animal.type}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{animal.name}</p>
                          <Badge variant="outline" className="text-xs shrink-0">
                            #{animal.tag}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {animal.breed || animal.type} • {animal.age || 'Unknown age'} • {animal.weight || 'Unknown weight'}
                        </p>
                      </div>
                      <SaleCountdownBadge plannedSaleDate={animal.planned_sale_date!} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
