import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ChecklistItem {
  id: string;
  category_id: string;
  item_id: string;
  item_text: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
}

export interface ChecklistCategory {
  id: string;
  name: string;
  items: ChecklistItem[];
}

// Define the default checklist structure
const defaultChecklistItems = [
  {
    category_id: "animal-welfare",
    category_name: "Animal Welfare",
    items: [
      { item_id: "aw1", item_text: "Adequate food and water available" },
      { item_id: "aw2", item_text: "Appropriate shelter and living conditions" },
      { item_id: "aw3", item_text: "Regular health monitoring documented" },
      { item_id: "aw4", item_text: "Humane handling procedures in place" },
      { item_id: "aw5", item_text: "Pain management protocols documented" },
    ],
  },
  {
    category_id: "biosecurity",
    category_name: "Biosecurity",
    items: [
      { item_id: "bs1", item_text: "Biosecurity plan documented and current" },
      { item_id: "bs2", item_text: "Visitor log maintained" },
      { item_id: "bs3", item_text: "Quarantine procedures documented" },
      { item_id: "bs4", item_text: "Vehicle and equipment cleaning protocols" },
      { item_id: "bs5", item_text: "Disease outbreak response plan" },
    ],
  },
  {
    category_id: "chemical-use",
    category_name: "Chemical Use",
    items: [
      { item_id: "ch1", item_text: "Chemical storage meets regulations" },
      { item_id: "ch2", item_text: "All treatments recorded with WHP/ESI" },
      { item_id: "ch3", item_text: "Chemical inventory current" },
      { item_id: "ch4", item_text: "Staff trained in chemical handling" },
      { item_id: "ch5", item_text: "Disposal procedures documented" },
    ],
  },
  {
    category_id: "traceability",
    category_name: "Traceability",
    items: [
      { item_id: "tr1", item_text: "All animals identified with NLIS tags" },
      { item_id: "tr2", item_text: "Movement records up to date" },
      { item_id: "tr3", item_text: "NVDs/eNVDs properly completed" },
      { item_id: "tr4", item_text: "Deceased animal records maintained" },
      { item_id: "tr5", item_text: "Birth and purchase records complete" },
    ],
  },
  {
    category_id: "staff-safety",
    category_name: "Staff Safety",
    items: [
      { item_id: "ss1", item_text: "Safety induction completed for all staff" },
      { item_id: "ss2", item_text: "PPE available and properly maintained" },
      { item_id: "ss3", item_text: "First aid kits stocked and accessible" },
      { item_id: "ss4", item_text: "Emergency procedures documented" },
      { item_id: "ss5", item_text: "Incident reporting system in place" },
    ],
  },
  {
    category_id: "sustainability",
    category_name: "Sustainability",
    items: [
      { item_id: "su1", item_text: "Grazing rotation plan documented" },
      { item_id: "su2", item_text: "Water usage monitoring in place" },
      { item_id: "su3", item_text: "Pasture condition assessments recorded" },
      { item_id: "su4", item_text: "Environmental impact measures documented" },
      { item_id: "su5", item_text: "Carbon footprint tracking initiated" },
    ],
  },
];

export const getCurrentMonthYear = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const getMonthYearLabel = (monthYear: string) => {
  const [year, month] = monthYear.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
};

export function useMonthlyCompliance() {
  const { farm } = useFarm();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [currentMonthYear] = useState(getCurrentMonthYear());

  const initializeMonth = useCallback(async () => {
    if (!farm?.id || !user?.id) return;

    const monthYear = getCurrentMonthYear();
    
    // Check if current month already has entries
    const { data: existingItems } = await supabase
      .from("monthly_compliance_checklists")
      .select("id")
      .eq("farm_id", farm.id)
      .eq("month_year", monthYear)
      .limit(1);

    if (!existingItems || existingItems.length === 0) {
      // Initialize new month with all checklist items (all unchecked)
      const newItems = defaultChecklistItems.flatMap((cat) =>
        cat.items.map((item) => ({
          farm_id: farm.id,
          category_id: cat.category_id,
          item_id: item.item_id,
          item_text: item.item_text,
          completed: false,
          month_year: monthYear,
        }))
      );

      const { error } = await supabase
        .from("monthly_compliance_checklists")
        .insert(newItems);

      if (error) {
        console.error("Error initializing monthly checklists:", error);
      }
    }
  }, [farm?.id, user?.id]);

  const fetchChecklists = useCallback(async () => {
    if (!farm?.id) return;

    setLoading(true);
    try {
      const monthYear = getCurrentMonthYear();
      
      const { data, error } = await supabase
        .from("monthly_compliance_checklists")
        .select("*")
        .eq("farm_id", farm.id)
        .eq("month_year", monthYear);

      if (error) throw error;

      // Group by category
      const grouped: Record<string, ChecklistItem[]> = {};
      data?.forEach((item) => {
        if (!grouped[item.category_id]) {
          grouped[item.category_id] = [];
        }
        grouped[item.category_id].push({
          id: item.id,
          category_id: item.category_id,
          item_id: item.item_id,
          item_text: item.item_text,
          completed: item.completed,
          completed_at: item.completed_at,
          notes: item.notes,
        });
      });

      setChecklists(grouped);
    } catch (error) {
      console.error("Error fetching monthly checklists:", error);
    } finally {
      setLoading(false);
    }
  }, [farm?.id]);

  useEffect(() => {
    const init = async () => {
      await initializeMonth();
      await fetchChecklists();
    };
    if (farm?.id && user?.id) {
      init();
    }
  }, [farm?.id, user?.id, initializeMonth, fetchChecklists]);

  const toggleItem = async (itemId: string, currentState: boolean) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from("monthly_compliance_checklists")
      .update({
        completed: !currentState,
        completed_at: !currentState ? new Date().toISOString() : null,
        completed_by: !currentState ? user.id : null,
      })
      .eq("id", itemId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update checklist item",
        variant: "destructive",
      });
      return;
    }

    // Update local state
    setChecklists((prev) => {
      const updated = { ...prev };
      for (const categoryId in updated) {
        updated[categoryId] = updated[categoryId].map((item) =>
          item.id === itemId
            ? {
                ...item,
                completed: !currentState,
                completed_at: !currentState ? new Date().toISOString() : null,
              }
            : item
        );
      }
      return updated;
    });
  };

  const getOverallProgress = useCallback(() => {
    const allItems = Object.values(checklists).flat();
    if (allItems.length === 0) return 0;
    const completed = allItems.filter((i) => i.completed).length;
    return Math.round((completed / allItems.length) * 100);
  }, [checklists]);

  const getCategoryProgress = useCallback(
    (categoryId: string) => {
      const items = checklists[categoryId] || [];
      if (items.length === 0) return 0;
      const completed = items.filter((i) => i.completed).length;
      return Math.round((completed / items.length) * 100);
    },
    [checklists]
  );

  const getComplianceStatus = useCallback(() => {
    const progress = getOverallProgress();
    if (progress >= 80) return { status: "compliant", label: "Compliant", color: "green" };
    if (progress >= 50) return { status: "partial", label: "Partially Compliant", color: "yellow" };
    return { status: "non-compliant", label: "Non-Compliant", color: "red" };
  }, [getOverallProgress]);

  const categories = defaultChecklistItems.map((cat) => ({
    id: cat.category_id,
    name: cat.category_name,
    items: checklists[cat.category_id] || [],
  }));

  return {
    loading,
    checklists,
    categories,
    currentMonthYear,
    toggleItem,
    getOverallProgress,
    getCategoryProgress,
    getComplianceStatus,
    refetch: fetchChecklists,
  };
}
