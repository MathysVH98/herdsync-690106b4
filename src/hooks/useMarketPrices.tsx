import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommodityPrice {
  id: string;
  commodity_id: string;
  price: number;
  price_date: string;
  source: string | null;
}

export interface Commodity {
  id: string;
  name: string;
  unit: string;
  category_id: string;
}

export interface CommodityCategory {
  id: string;
  name: string;
  display_order: number;
}

export interface CommodityWithPrices extends Commodity {
  category: CommodityCategory;
  latestPrice: number | null;
  previousPrice: number | null;
  priceChange: number | null;
  priceHistory: { date: string; price: number }[];
}

export function useMarketPrices() {
  return useQuery({
    queryKey: ["market-prices"],
    queryFn: async () => {
      // Fetch categories
      const { data: categories, error: catError } = await supabase
        .from("commodity_categories")
        .select("*")
        .order("display_order");

      if (catError) throw catError;

      // Fetch commodities
      const { data: commodities, error: comError } = await supabase
        .from("commodities")
        .select("*");

      if (comError) throw comError;

      // Fetch prices for last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: prices, error: priceError } = await supabase
        .from("commodity_prices")
        .select("*")
        .gte("price_date", sevenDaysAgo.toISOString().split("T")[0])
        .order("price_date", { ascending: false });

      if (priceError) throw priceError;

      // Build commodity data with prices
      const commoditiesWithPrices: CommodityWithPrices[] = commodities.map(
        (commodity) => {
          const category = categories.find(
            (c) => c.id === commodity.category_id
          )!;
          const commodityPrices = prices
            .filter((p) => p.commodity_id === commodity.id)
            .sort(
              (a, b) =>
                new Date(b.price_date).getTime() -
                new Date(a.price_date).getTime()
            );

          const latestPrice = commodityPrices[0]?.price
            ? Number(commodityPrices[0].price)
            : null;
          const previousPrice = commodityPrices[1]?.price
            ? Number(commodityPrices[1].price)
            : null;
          const priceChange =
            latestPrice !== null && previousPrice !== null
              ? ((latestPrice - previousPrice) / previousPrice) * 100
              : null;

          const priceHistory = commodityPrices
            .slice(0, 7)
            .reverse()
            .map((p) => ({
              date: p.price_date,
              price: Number(p.price),
            }));

          return {
            ...commodity,
            category,
            latestPrice,
            previousPrice,
            priceChange,
            priceHistory,
          };
        }
      );

      // Sort commodities within each category to group similar items
      const getSortKey = (name: string): string => {
        const lower = name.toLowerCase();
        if (lower.startsWith("beef")) return "01_beef_" + name;
        if (lower.includes("weaner calf")) return "01_beef_z_" + name;
        if (lower.startsWith("lamb") || lower.startsWith("mutton")) return "02_mutton_" + name;
        if (lower.includes("feeder lamb")) return "02_mutton_z_" + name;
        if (lower.startsWith("pork")) return "03_pork_" + name;
        if (lower.startsWith("chicken")) return "04_chicken_" + name;
        return "99_" + name;
      };

      commoditiesWithPrices.sort((a, b) => getSortKey(a.name).localeCompare(getSortKey(b.name)));

      // Group by category
      const groupedByCategory = categories.map((category) => ({
        category,
        commodities: commoditiesWithPrices.filter(
          (c) => c.category_id === category.id
        ),
      }));

      return {
        categories,
        commodities: commoditiesWithPrices,
        groupedByCategory,
      };
    },
  });
}
