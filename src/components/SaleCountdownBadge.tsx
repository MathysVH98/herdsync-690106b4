import { differenceInDays, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SaleCountdownBadgeProps {
  plannedSaleDate: string;
  className?: string;
}

export function SaleCountdownBadge({ plannedSaleDate, className }: SaleCountdownBadgeProps) {
  const saleDate = new Date(plannedSaleDate);
  const today = new Date();
  const daysUntilSale = differenceInDays(saleDate, today);

  // Determine badge variant and styling based on days remaining
  const getBadgeConfig = () => {
    if (daysUntilSale <= 0) {
      return {
        variant: "destructive" as const,
        icon: AlertTriangle,
        text: "Sale Day!",
        bgClass: "bg-destructive/10 text-destructive border-destructive/30",
      };
    }
    if (daysUntilSale <= 7) {
      return {
        variant: "default" as const,
        icon: Clock,
        text: `${daysUntilSale}d left`,
        bgClass: "bg-warning/10 text-warning border-warning/30 animate-pulse",
      };
    }
    if (daysUntilSale <= 30) {
      return {
        variant: "secondary" as const,
        icon: Calendar,
        text: `${daysUntilSale}d to sale`,
        bgClass: "bg-info/10 text-info border-info/30",
      };
    }
    return {
      variant: "outline" as const,
      icon: Calendar,
      text: `Sale: ${format(saleDate, "MMM d")}`,
      bgClass: "bg-muted/50 text-muted-foreground border-border",
    };
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs font-medium gap-1 cursor-default",
              config.bgClass,
              className
            )}
          >
            <Icon className="w-3 h-3" />
            {config.text}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Planned sale: {format(saleDate, "PPP")}</p>
          {daysUntilSale <= 30 && daysUntilSale > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {daysUntilSale <= 7 ? "⏰ Final countdown!" : "📋 Feeding program active"}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
