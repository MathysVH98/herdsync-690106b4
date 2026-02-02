import { PriceCard } from "./PriceCard";
import { CommodityCategory, CommodityWithPrices } from "@/hooks/useMarketPrices";
import { Beef, Wheat, Milk, Scissors, Carrot } from "lucide-react";

interface CategorySectionProps {
  category: CommodityCategory;
  commodities: CommodityWithPrices[];
  onCommodityClick: (commodity: CommodityWithPrices) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  Meat: <Beef className="w-5 h-5" />,
  "Grains & Oilseeds": <Wheat className="w-5 h-5" />,
  "Dairy & Eggs": <Milk className="w-5 h-5" />,
  "Wool & Hides": <Scissors className="w-5 h-5" />,
  Vegetables: <Carrot className="w-5 h-5" />,
};

export function CategorySection({
  category,
  commodities,
  onCommodityClick,
}: CategorySectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {categoryIcons[category.name] || <Wheat className="w-5 h-5" />}
        </div>
        <h3 className="font-display font-semibold text-lg text-foreground">
          {category.name}
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {commodities.map((commodity) => (
          <PriceCard
            key={commodity.id}
            commodity={commodity}
            onClick={() => onCommodityClick(commodity)}
          />
        ))}
      </div>
    </div>
  );
}
