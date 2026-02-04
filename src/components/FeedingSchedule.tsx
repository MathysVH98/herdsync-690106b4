import { cn } from "@/lib/utils";
import { Clock, Sun, Moon } from "lucide-react";

export interface FeedingItem {
  id: string;
  animalId?: string;
  animalType: string;
  feedType: string;
  time: string;
  period: "morning" | "evening";
  notes?: string;
}

interface FeedingScheduleItemProps {
  item: FeedingItem;
}

const periodIcons = {
  morning: Sun,
  evening: Moon,
};

export function FeedingScheduleItem({ item }: FeedingScheduleItemProps) {
  const PeriodIcon = periodIcons[item.period];
  
  return (
    <div className="timeline-item">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "feed-time-badge",
              item.period === "morning" ? "feed-time-morning" : "feed-time-evening"
            )}>
              <PeriodIcon className="w-3.5 h-3.5" />
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
        
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

interface FeedingScheduleProps {
  items: FeedingItem[];
  title?: string;
}

export function FeedingSchedule({ items, title = "Today's Schedule" }: FeedingScheduleProps) {
  return (
    <div className="card-elevated p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-4">{title}</h3>
      <div className="space-y-0">
        {items.map((item) => (
          <FeedingScheduleItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
