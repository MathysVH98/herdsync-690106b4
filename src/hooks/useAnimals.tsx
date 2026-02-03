import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { useToast } from "@/hooks/use-toast";

export interface Animal {
  id: string;
  farm_id: string;
  animal_tag_id: string;
  species: string;
  breed: string | null;
  sex: string | null;
  dob_or_age: string | null;
  color_markings: string | null;
  brand_mark: string | null;
  microchip_number: string | null;
  health_notes: string | null;
  status: "available" | "sold" | "deceased" | "transferred";
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
      .from("animals")
      .select("*")
      .eq("farm_id", farm.id)
      .order("animal_tag_id", { ascending: true });

    if (error) {
      console.error("Error fetching animals:", error);
      toast({ title: "Error", description: "Failed to load animals", variant: "destructive" });
    } else {
      setAnimals((data || []) as Animal[]);
    }
    setLoading(false);
  };

  const getAvailableAnimals = () => {
    return animals.filter((a) => a.status === "available");
  };

  const addAnimal = async (animal: Omit<Animal, "id" | "farm_id" | "created_at" | "updated_at">) => {
    if (!farm?.id) return null;

    const { data, error } = await supabase
      .from("animals")
      .insert({ ...animal, farm_id: farm.id })
      .select()
      .single();

    if (error) {
      console.error("Error adding animal:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    await fetchAnimals();
    return data as Animal;
  };

  const updateAnimalStatus = async (animalId: string, status: Animal["status"]) => {
    const { error } = await supabase
      .from("animals")
      .update({ status })
      .eq("id", animalId);

    if (error) {
      console.error("Error updating animal:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    await fetchAnimals();
    return true;
  };

  const markAnimalsSold = async (animalIds: string[]) => {
    const { error } = await supabase
      .from("animals")
      .update({ status: "sold" as const })
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
    addAnimal,
    updateAnimalStatus,
    markAnimalsSold,
  };
}
