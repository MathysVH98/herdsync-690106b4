import { Layout } from "@/components/Layout";
import { HealthRecordCard, HealthRecordType } from "@/components/HealthRecordCard";
import { mockHealthRecords } from "@/data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Syringe, Stethoscope, Pill, Baby, Scissors } from "lucide-react";

const healthTypes: { type: HealthRecordType; icon: typeof Syringe; label: string }[] = [
  { type: "Vaccination", icon: Syringe, label: "Vaccinations" },
  { type: "Checkup", icon: Stethoscope, label: "Checkups" },
  { type: "Treatment", icon: Pill, label: "Treatments" },
  { type: "Pregnancy Check", icon: Baby, label: "Pregnancy" },
  { type: "Farrier Visit", icon: Scissors, label: "Farrier" },
];

export default function Health() {
  const typeCounts = healthTypes.reduce((acc, { type }) => {
    acc[type] = mockHealthRecords.filter(r => r.type === type).length;
    return acc;
  }, {} as Record<HealthRecordType, number>);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Health Records
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive health tracking for all your livestock
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {healthTypes.map(({ type, icon: Icon, label }) => (
            <div key={type} className="card-elevated p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{typeCounts[type]}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Records Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All Records
              <Badge variant="secondary" className="ml-2">{mockHealthRecords.length}</Badge>
            </TabsTrigger>
            {healthTypes.map(({ type, label }) => (
              <TabsTrigger 
                key={type} 
                value={type}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {label}
                <Badge variant="secondary" className="ml-2">{typeCounts[type]}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockHealthRecords.map((record) => (
                <HealthRecordCard key={record.id} record={record} />
              ))}
            </div>
          </TabsContent>

          {healthTypes.map(({ type }) => (
            <TabsContent key={type} value={type} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockHealthRecords
                  .filter(r => r.type === type)
                  .map((record) => (
                    <HealthRecordCard key={record.id} record={record} />
                  ))}
              </div>
              {mockHealthRecords.filter(r => r.type === type).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No {type.toLowerCase()} records found.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}
