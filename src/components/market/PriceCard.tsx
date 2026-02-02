import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommodityWithPrices } from "@/hooks/useMarketPrices";

interface PriceCardProps {
  commodity: CommodityWithPrices;
  onClick?: () => void;
}

export function PriceCard({ commodity, onClick }: PriceCardProps) {
  const { name, unit, latestPrice, priceChange } = commodity;

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    if (unit.includes("ton")) {
      return `R${price.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `R${price.toFixed(2)}`;
  };

  const getTrendIcon = () => {
    if (priceChange === null) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (priceChange > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (priceChange < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (priceChange === null) return "text-muted-foreground";
    if (priceChange > 0) return "text-success";
    if (priceChange < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-foreground text-sm truncate">{name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{unit}</p>
        </div>
        {getTrendIcon()}
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-xl font-bold text-foreground">
          {formatPrice(latestPrice)}
        </p>
        {priceChange !== null && (
          <p className={cn("text-sm font-medium", getTrendColor())}>
            {priceChange > 0 ? "+" : ""}
            {priceChange.toFixed(1)}%
          </p>
        )}
      </div>
    </button>
  );
}
