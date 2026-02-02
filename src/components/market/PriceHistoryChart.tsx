import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CommodityWithPrices } from "@/hooks/useMarketPrices";
import { format, parseISO } from "date-fns";

interface PriceHistoryChartProps {
  commodity: CommodityWithPrices;
}

export function PriceHistoryChart({ commodity }: PriceHistoryChartProps) {
  const { priceHistory, unit, name } = commodity;

  if (priceHistory.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No price history available
      </div>
    );
  }

  const formatPrice = (value: number) => {
    if (unit.includes("ton")) {
      return `R${value.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
    }
    return `R${value.toFixed(2)}`;
  };

  const data = priceHistory.map((item) => ({
    ...item,
    formattedDate: format(parseISO(item.date), "EEE dd"),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatPrice}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(data.date), "EEEE, dd MMM yyyy")}
                  </p>
                  <p className="text-lg font-bold text-primary mt-1">
                    {formatPrice(data.price)}
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
