import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Utensils, Stethoscope, Trash2 } from "lucide-react";

export type AnimalStatus = "Healthy" | "Under Observation" | "Sick" | "Pregnant";

export interface Animal {
  id: string;
  name: string;
  type: string;
  breed: string;
  tag: string;
  age: string;
  weight: string;
  status: AnimalStatus;
  lastFed: string;
  feedType: string;
  imageUrl?: string;
}

interface LivestockCardProps {
  animal: Animal;
  onFeed?: (id: string) => void;
  onHealthRecord?: (id: string) => void;
  onRemove?: (id: string) => void;
}

const statusStyles: Record<AnimalStatus, string> = {
  "Healthy": "badge-healthy",
  "Under Observation": "badge-observation",
  "Sick": "badge-sick",
  "Pregnant": "badge-pregnant",
};

const animalEmojis: Record<string, string> = {
  "Cattle": "🐄",
  "Sheep": "🐑",
  "Goat": "🐐",
  "Pig": "🐷",
  "Chicken": "🐔",
  "Duck": "🦆",
  "Horse": "🐴",
};

export function LivestockCard({ animal, onFeed, onHealthRecord, onRemove }: LivestockCardProps) {
  return (
    <div className="card-elevated p-5 group">
      <div className="flex items-start gap-4">
        {/* Animal Avatar */}
        <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-3xl shrink-0">
          {animalEmojis[animal.type] || "🐾"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{animal.name}</h3>
            <Badge variant="outline" className="text-xs font-mono">
              #{animal.tag}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {animal.breed} • {animal.age} • {animal.weight}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("text-xs font-medium", statusStyles[animal.status])}>
              {animal.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Fed: {animal.lastFed}
            </span>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onFeed?.(animal.id)}>
              <Utensils className="w-4 h-4 mr-2" />
              Record Feeding
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHealthRecord?.(animal.id)}>
              <Stethoscope className="w-4 h-4 mr-2" />
              Add Health Record
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onRemove?.(animal.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Animal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Feed Info */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Feed Type:</span>
          <span className="font-medium text-foreground">{animal.feedType}</span>
        </div>
      </div>
    </div>
  );
}
