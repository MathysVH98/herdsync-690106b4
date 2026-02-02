import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useMarketPrices, CommodityWithPrices } from "@/hooks/useMarketPrices";
import { CategorySection } from "@/components/market/CategorySection";
import { CommodityDetailDialog } from "@/components/market/CommodityDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Search, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function MarketArea() {
  const { data, isLoading, error, refetch, isFetching } = useMarketPrices();
  const [selectedCommodity, setSelectedCommodity] =
    useState<CommodityWithPrices | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const { toast } = useToast();

  const filteredData = data?.groupedByCategory.map((group) => ({
    ...group,
    commodities: group.commodities.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((group) => group.commodities.length > 0);

  const today = format(new Date(), "EEEE, dd MMMM yyyy");

  const handleFetchLatestPrices = async () => {
    setIsFetchingPrices(true);
    try {
      const { data: result, error: fetchError } = await supabase.functions.invoke(
        "fetch-market-prices"
      );

      if (fetchError) {
        throw fetchError;
      }

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Prices Updated",
        description: `Successfully updated ${result.prices?.length || 0} commodity prices from ${result.source}`,
      });

      // Refetch to show new prices
      refetch();
    } catch (err) {
      console.error("Error fetching prices:", err);
      toast({
        title: "Failed to Update Prices",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsFetchingPrices(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-display text-foreground">
                Market Prices
              </h1>
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                ZAR
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{today}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleFetchLatestPrices}
              disabled={isFetchingPrices}
              className="bg-gradient-primary"
            >
              <Sparkles className={`w-4 h-4 mr-2 ${isFetchingPrices ? "animate-pulse" : ""}`} />
              {isFetchingPrices ? "Fetching..." : "Get Latest Prices"}
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search commodities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh from database"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="h-24 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Failed to load market prices
            </h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        )}

        {/* Price Categories */}
        {!isLoading && !error && filteredData && (
          <div className="space-y-8">
            {filteredData.map(({ category, commodities }) => (
              <CategorySection
                key={category.id}
                category={category}
                commodities={commodities}
                onCommodityClick={setSelectedCommodity}
              />
            ))}

            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No commodities found matching "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">💡 AI-Powered Prices:</strong> Click "Get Latest Prices" 
            to fetch current South African agricultural commodity prices using AI. 
            Prices are estimates based on market knowledge and trends.
          </p>
        </div>
      </div>

      {/* Detail Dialog */}
      <CommodityDetailDialog
        commodity={selectedCommodity}
        open={!!selectedCommodity}
        onOpenChange={(open) => !open && setSelectedCommodity(null)}
      />
    </Layout>
  );
}
