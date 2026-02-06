import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { useToast } from "@/hooks/use-toast";

// Re-export Animal type that maps to livestock table
export interface Animal {
  id: string;
  farm_id: string;
  animal_tag_id: string; // maps to livestock.tag
  species: string; // maps to livestock.type
  breed: string | null;
  sex: string | null; // maps from livestock.status or null
  dob_or_age: string | null; // maps to livestock.age
  color_markings: string | null;
  brand_mark: string | null;
  microchip_number: string | null;
  health_notes: string | null; // maps to livestock.notes
  status: "available" | "sold" | "deceased" | "transferred";
  name: string; // livestock name
  weight: string | null;
  plannedSaleDate: string | null; // maps to livestock.planned_sale_date
  created_at: string;
  updated_at: string;
}

export function useAnimals() {
  const { farm } = useFarm();
  const { toast } = useToast();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnimals = async () => {
    if (!farm?.id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("livestock")
      .select("*")
      .eq("farm_id", farm.id)
      .order("tag", { ascending: true });

    if (error) {
      console.error("Error fetching animals:", error);
      toast({ title: "Error", description: "Failed to load animals", variant: "destructive" });
    } else {
      // Map livestock data to Animal interface
      const mappedAnimals: Animal[] = (data || []).map((livestock) => ({
        id: livestock.id,
        farm_id: livestock.farm_id,
        animal_tag_id: livestock.tag,
        species: livestock.type,
        breed: livestock.breed,
        sex: null, // livestock doesn't have sex field
        dob_or_age: livestock.age,
        color_markings: null,
        brand_mark: null,
        microchip_number: null,
        health_notes: livestock.notes,
        status: livestock.sold_at ? "sold" : "available",
        name: livestock.name,
        weight: livestock.weight,
        plannedSaleDate: livestock.planned_sale_date,
        created_at: livestock.created_at,
        updated_at: livestock.updated_at,
      }));
      setAnimals(mappedAnimals);
    }
    setLoading(false);
  };

  const getAvailableAnimals = () => {
    return animals.filter((a) => a.status === "available");
  };

  // Mark animals as sold with individual prices from sale items
  const markAnimalsSoldWithPrices = async (
    items: { animal_id: string; unit_price: number | null }[],
    soldTo?: string
  ) => {
    const now = new Date().toISOString();
    
    // Update each animal with its individual sale price
    const updatePromises = items.map((item) =>
      supabase
        .from("livestock")
        .update({
          sold_at: now,
          sale_price: item.unit_price || null,
          sold_to: soldTo || null,
        })
        .eq("id", item.animal_id)
    );

    const results = await Promise.all(updatePromises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      console.error("Error marking animals as sold:", errors);
      toast({ title: "Error", description: "Failed to update some animals", variant: "destructive" });
      return false;
    }

    await fetchAnimals();
    return true;
  };

  // Legacy function for backward compatibility (single price for all)
  const markAnimalsSold = async (animalIds: string[], salePrice?: number, soldTo?: string) => {
    const { error } = await supabase
      .from("livestock")
      .update({ 
        sold_at: new Date().toISOString(),
        sale_price: salePrice || null,
        sold_to: soldTo || null,
      })
      .in("id", animalIds);

    if (error) {
      console.error("Error marking animals as sold:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    await fetchAnimals();
    return true;
  };

  useEffect(() => {
    if (farm?.id) {
      fetchAnimals();
    }
  }, [farm?.id]);

  return {
    animals,
    loading,
    fetchAnimals,
    getAvailableAnimals,
    markAnimalsSold,
    markAnimalsSoldWithPrices,
  };
}
