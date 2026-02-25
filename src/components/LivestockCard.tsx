import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Utensils, Stethoscope, Trash2, DollarSign, CalendarCheck, X } from "lucide-react";
import { getAnimalImage } from "@/utils/animalImages";
import { SaleCountdownBadge } from "@/components/SaleCountdownBadge";

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
  purchaseCost?: number;
  salePrice?: number | null;
  soldAt?: string | null;
  soldTo?: string | null;
  plannedSaleDate?: string | null;
  removedAt?: string | null;
  removalReason?: string | null;
}

interface LivestockCardProps {
  animal: Animal;
  onFeed?: (id: string) => void;
  onHealthRecord?: (id: string) => void;
  onRemove?: (id: string) => void;
  onSell?: (id: string) => void;
  onMarkForSale?: (id: string) => void;
  onCancelPlannedSale?: (id: string) => void;
  isSold?: boolean;
  hideFinancials?: boolean;
}

const statusStyles: Record<AnimalStatus, string> = {
  "Healthy": "badge-healthy",
  "Under Observation": "badge-observation",
  "Sick": "badge-sick",
  "Pregnant": "badge-pregnant",
};


export function LivestockCard({ animal, onFeed, onHealthRecord, onRemove, onSell, onMarkForSale, onCancelPlannedSale, isSold = false, hideFinancials = false }: LivestockCardProps) {
  return (
    <div className={cn("card-elevated p-5 group", isSold && "opacity-80")}>
      <div className="flex items-start gap-4">
        {/* Animal Avatar */}
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border">
          <img 
            src={getAnimalImage(animal.type)} 
            alt={animal.type}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{animal.name}</h3>
            <Badge variant="outline" className="text-xs font-mono">
              #{animal.tag}
            </Badge>
            {isSold && animal.soldAt && (
              <Badge variant="secondary" className="text-xs">
                Sold
              </Badge>
            )}
            {isSold && animal.removedAt && !animal.soldAt && (
              <Badge variant="destructive" className="text-xs">
                {animal.removalReason?.split(":")[0] || "Removed"}
              </Badge>
            )}
            {!isSold && animal.plannedSaleDate && (
              <SaleCountdownBadge plannedSaleDate={animal.plannedSaleDate} />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {animal.breed} • {animal.age} • {animal.weight}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("text-xs font-medium", statusStyles[animal.status])}>
              {animal.status}
            </Badge>
            {!isSold && (
              <span className="text-xs text-muted-foreground">
                Fed: {animal.lastFed}
              </span>
            )}
            {isSold && animal.soldAt && (
              <span className="text-xs text-muted-foreground">
                Sold: {new Date(animal.soldAt).toLocaleDateString("en-ZA")}
              </span>
            )}
            {isSold && animal.removedAt && !animal.soldAt && (
              <span className="text-xs text-muted-foreground">
                Removed: {new Date(animal.removedAt).toLocaleDateString("en-ZA")}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isSold && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onFeed?.(animal.id)}>
                <Utensils className="w-4 h-4 mr-2" />
                Record Feeding
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onHealthRecord?.(animal.id)}>
                <Stethoscope className="w-4 h-4 mr-2" />
                Add Health Record
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {animal.plannedSaleDate ? (
                <>
                  <DropdownMenuItem onClick={() => onSell?.(animal.id)}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Complete Sale Now
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCancelPlannedSale?.(animal.id)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel Planned Sale
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onMarkForSale?.(animal.id)}>
                    <CalendarCheck className="w-4 h-4 mr-2" />
                    Mark for Sale
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSell?.(animal.id)}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Sell Now
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onRemove?.(animal.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Animal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Financial Info */}
      <div className="mt-4 pt-4 border-t border-border space-y-2">
        {!isSold && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Feed Type:</span>
            <span className="font-medium text-foreground">{animal.feedType || "-"}</span>
          </div>
        )}
        {!hideFinancials && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Purchase Cost:</span>
            <span className="font-medium text-foreground">R{animal.purchaseCost?.toFixed(2) || "0.00"}</span>
          </div>
        )}
        {isSold && animal.salePrice != null && !hideFinancials && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sale Price:</span>
              <span className="font-medium text-foreground">R{animal.salePrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profit:</span>
              <span className={cn(
                "font-semibold",
                (animal.salePrice - (animal.purchaseCost || 0)) >= 0 
                  ? "text-green-600" 
                  : "text-red-600"
              )}>
                R{(animal.salePrice - (animal.purchaseCost || 0)).toFixed(2)}
              </span>
            </div>
          </>
        )}
        {isSold && animal.soldTo && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sold To:</span>
            <span className="font-medium text-foreground">{animal.soldTo}</span>
          </div>
        )}
        {isSold && animal.removedAt && animal.removalReason && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Reason:</span>
            <span className="font-medium text-foreground">{animal.removalReason}</span>
          </div>
        )}
      </div>
    </div>
  );
}
