import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { useToast } from "@/hooks/use-toast";

export const EQUIPMENT_TYPES = [
  "Tractor",
  "Planter",
  "Harvester",
  "Trailer",
  "Irrigation",
  "Sprayer",
  "Loader",
  "Baler",
  "Cultivator",
  "Other",
] as const;

export type EquipmentType = typeof EQUIPMENT_TYPES[number];

export const EQUIPMENT_CONDITIONS = ["Excellent", "Good", "Fair", "Poor", "Under Repair"] as const;
export type EquipmentCondition = typeof EQUIPMENT_CONDITIONS[number];

export interface FarmEquipment {
  id: string;
  farm_id: string;
  name: string;
  equipment_type: string;
  make: string | null;
  model: string | null;
  year: number | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_cost: number;
  current_value: number | null;
  condition: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useFarmEquipment() {
  const { farm } = useFarm();
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<FarmEquipment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEquipment = async () => {
    if (!farm?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("farm_equipment")
      .select("*")
      .eq("farm_id", farm.id)
      .order("equipment_type", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching equipment:", error);
      toast({ title: "Error", description: "Failed to load equipment", variant: "destructive" });
    } else {
      setEquipment((data || []) as FarmEquipment[]);
    }
    setLoading(false);
  };

  const addEquipment = async (item: Omit<FarmEquipment, "id" | "farm_id" | "created_at" | "updated_at">) => {
    if (!farm?.id) return null;

    const { data, error } = await supabase
      .from("farm_equipment")
      .insert({
        farm_id: farm.id,
        ...item,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding equipment:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    toast({ title: "Equipment Added", description: `${item.name} has been added to your equipment.` });
    await fetchEquipment();
    return data;
  };

  const updateEquipment = async (id: string, updates: Partial<FarmEquipment>) => {
    const { error } = await supabase
      .from("farm_equipment")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating equipment:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Equipment Updated", description: "Equipment has been updated." });
    await fetchEquipment();
    return true;
  };

  const deleteEquipment = async (id: string) => {
    const { error } = await supabase
      .from("farm_equipment")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting equipment:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Equipment Deleted", description: "Equipment has been removed." });
    await fetchEquipment();
    return true;
  };

  const getTotalValue = () => {
    return equipment.reduce((sum, item) => sum + (item.current_value || item.purchase_cost || 0), 0);
  };

  const getEquipmentByType = (type: string) => {
    return equipment.filter((item) => item.equipment_type === type);
  };

  // Get equipment purchased in a specific month (for monthly reports)
  const getEquipmentPurchasedInMonth = (year: number, month: number) => {
    return equipment.filter((item) => {
      if (!item.purchase_date) return false;
      const purchaseDate = new Date(item.purchase_date);
      return purchaseDate.getFullYear() === year && purchaseDate.getMonth() === month;
    });
  };

  useEffect(() => {
    if (farm?.id) {
      fetchEquipment();
    }
  }, [farm?.id]);

  return {
    equipment,
    loading,
    fetchEquipment,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    getTotalValue,
    getEquipmentByType,
    getEquipmentPurchasedInMonth,
  };
}
