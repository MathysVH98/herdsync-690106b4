import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { CommodityWithPrices } from "@/hooks/useMarketPrices";
import { PriceHistoryChart } from "./PriceHistoryChart";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface CommodityDetailDialogProps {
  commodity: CommodityWithPrices | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommodityDetailDialog({
  commodity,
  open,
  onOpenChange,
}: CommodityDetailDialogProps) {
  if (!commodity) return null;

  const { name, unit, latestPrice, previousPrice, priceChange, priceHistory, category } =
    commodity;

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    if (unit.includes("ton")) {
      return `R${price.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `R${price.toFixed(2)}`;
  };

  const getTrendIcon = () => {
    if (priceChange === null) return <Minus className="w-5 h-5" />;
    if (priceChange > 0) return <TrendingUp className="w-5 h-5" />;
    if (priceChange < 0) return <TrendingDown className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };

  const getTrendColor = () => {
    if (priceChange === null) return "text-muted-foreground";
    if (priceChange > 0) return "text-success";
    if (priceChange < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  // Calculate weekly stats
  const weeklyPrices = priceHistory.map((p) => p.price);
  const weeklyHigh = weeklyPrices.length > 0 ? Math.max(...weeklyPrices) : null;
  const weeklyLow = weeklyPrices.length > 0 ? Math.min(...weeklyPrices) : null;
  const weeklyAvg =
    weeklyPrices.length > 0
      ? weeklyPrices.reduce((a, b) => a + b, 0) / weeklyPrices.length
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl">{name}</DialogTitle>
            <Badge variant="secondary">{category.name}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Price */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-3xl font-bold text-foreground">
                {formatPrice(latestPrice)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{unit}</p>
            </div>
            <div className={cn("flex items-center gap-2", getTrendColor())}>
              {getTrendIcon()}
              {priceChange !== null && (
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {priceChange > 0 ? "+" : ""}
                    {priceChange.toFixed(2)}%
                  </p>
                  <p className="text-xs opacity-80">vs yesterday</p>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-card border border-border rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Weekly High</p>
              <p className="text-lg font-semibold text-foreground">
                {formatPrice(weeklyHigh)}
              </p>
            </div>
            <div className="p-3 bg-card border border-border rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Weekly Low</p>
              <p className="text-lg font-semibold text-foreground">
                {formatPrice(weeklyLow)}
              </p>
            </div>
            <div className="p-3 bg-card border border-border rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Weekly Avg</p>
              <p className="text-lg font-semibold text-foreground">
                {formatPrice(weeklyAvg)}
              </p>
            </div>
          </div>

          {/* Price History Chart */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium text-foreground">7-Day Price History</h4>
            </div>
            <PriceHistoryChart commodity={commodity} />
          </div>

          {/* Price History Table */}
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">
                    Date
                  </th>
                  <th className="text-right py-2 text-muted-foreground font-medium">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...priceHistory].reverse().map((item, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-2 text-foreground">
                      {format(parseISO(item.date), "EEE, dd MMM yyyy")}
                    </td>
                    <td className="py-2 text-right font-medium text-foreground">
                      {formatPrice(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
