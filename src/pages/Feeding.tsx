import { Layout } from "@/components/Layout";
import { FeedingSchedule } from "@/components/FeedingSchedule";
import { mockFeedingSchedule } from "@/data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sun, Moon, Calendar } from "lucide-react";

export default function Feeding() {
  const morningFeedings = mockFeedingSchedule.filter(f => f.period === "morning");
  const eveningFeedings = mockFeedingSchedule.filter(f => f.period === "evening");

  // Group by animal type
  const byAnimalType = mockFeedingSchedule.reduce((acc, item) => {
    if (!acc[item.animalType]) {
      acc[item.animalType] = [];
    }
    acc[item.animalType].push(item);
    return acc;
  }, {} as Record<string, typeof mockFeedingSchedule>);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Feeding Schedule
          </h1>
          <p className="text-muted-foreground mt-1">
            Organized feeding times for all your livestock
          </p>
        </div>

        <Tabs defaultValue="time" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="time" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              By Time
            </TabsTrigger>
            <TabsTrigger value="animal" className="flex items-center gap-2">
              🐾 By Animal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="time" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Morning Schedule */}
              <div className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Sun className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-foreground">
                      Morning Schedule
                    </h3>
                    <p className="text-sm text-muted-foreground">05:30 - 08:00</p>
                  </div>
                </div>
                <div className="space-y-0">
                  {morningFeedings.map((item) => (
                    <div key={item.id} className="timeline-item">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="feed-time-badge feed-time-morning">
                              <Sun className="w-3.5 h-3.5" />
                              {item.time}
                            </span>
                          </div>
                          <h4 className="font-semibold text-foreground">{item.animalType}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{item.feedType}</p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evening Schedule */}
              <div className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-foreground">
                      Evening Schedule
                    </h3>
                    <p className="text-sm text-muted-foreground">16:30 - 18:30</p>
                  </div>
                </div>
                <div className="space-y-0">
                  {eveningFeedings.map((item) => (
                    <div key={item.id} className="timeline-item">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="feed-time-badge feed-time-evening">
                              <Moon className="w-3.5 h-3.5" />
                              {item.time}
                            </span>
                          </div>
                          <h4 className="font-semibold text-foreground">{item.animalType}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{item.feedType}</p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="animal" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(byAnimalType).map(([animalType, feedings]) => (
                <div key={animalType} className="card-elevated p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">
                      {animalType === "Cattle" ? "🐄" : 
                       animalType === "Chickens" ? "🐔" : 
                       animalType === "Pigs" ? "🐷" : 
                       animalType.includes("Sheep") ? "🐑" : 
                       animalType === "Horses" ? "🐴" : "🐾"}
                    </span>
                    <h3 className="font-display font-semibold text-lg text-foreground">
                      {animalType}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {feedings.map((item) => (
                      <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`feed-time-badge text-xs ${
                            item.period === "morning" ? "feed-time-morning" : "feed-time-evening"
                          }`}>
                            {item.period === "morning" ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                            {item.time}
                          </span>
                        </div>
                        <p className="text-sm text-foreground font-medium">{item.feedType}</p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
