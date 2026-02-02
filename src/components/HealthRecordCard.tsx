import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Syringe, 
  Stethoscope, 
  Pill, 
  Baby,
  Scissors,
  Calendar
} from "lucide-react";

export type HealthRecordType = 
  | "Vaccination" 
  | "Checkup" 
  | "Treatment" 
  | "Pregnancy Check" 
  | "Farrier Visit";

export interface HealthRecord {
  id: string;
  animalId: string;
  animalName: string;
  type: HealthRecordType;
  date: string;
  provider: string;
  notes: string;
  nextDue?: string;
}

interface HealthRecordCardProps {
  record: HealthRecord;
}

const typeConfig: Record<HealthRecordType, { icon: typeof Syringe; color: string }> = {
  "Vaccination": { icon: Syringe, color: "bg-info/10 text-info border-info/30" },
  "Checkup": { icon: Stethoscope, color: "bg-success/10 text-success border-success/30" },
  "Treatment": { icon: Pill, color: "bg-warning/10 text-warning border-warning/30" },
  "Pregnancy Check": { icon: Baby, color: "bg-accent/20 text-accent-foreground border-accent/30" },
  "Farrier Visit": { icon: Scissors, color: "bg-muted text-muted-foreground border-border" },
};

export function HealthRecordCard({ record }: HealthRecordCardProps) {
  const config = typeConfig[record.type];
  const Icon = config.icon;

  return (
    <div className="card-elevated p-5">
      <div className="flex items-start gap-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", config.color)}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-foreground">{record.animalName}</h4>
            <Badge variant="outline" className="text-xs">
              {record.type}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-2">{record.notes}</p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {record.date}
            </span>
            <span>Provider: {record.provider}</span>
          </div>

          {record.nextDue && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs">
                <span className="text-muted-foreground">Next due: </span>
                <span className="font-medium text-primary">{record.nextDue}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
