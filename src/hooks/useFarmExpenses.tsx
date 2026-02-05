import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { useToast } from "@/hooks/use-toast";

export interface FarmExpense {
  id: string;
  farm_id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  supplier_vendor: string | null;
  receipt_reference: string | null;
  notes: string | null;
   receipt_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const EXPENSE_CATEGORIES = [
  "Medicine & Veterinary",
  "Petrol",
  "Diesel",
  "Feed & Supplements",
  "Equipment & Repairs",
  "Utilities",
  "Labour (Casual)",
  "Transport",
  "Seeds & Fertilizer",
  "Chemicals & Pesticides",
  "Insurance",
  "Licenses & Permits",
  "Professional Services",
  "Other",
] as const;

export function useFarmExpenses() {
  const { farm } = useFarm();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<FarmExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    if (!farm?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("farm_expenses")
      .select("*")
      .eq("farm_id", farm.id)
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
      toast({ title: "Error", description: "Failed to load expenses", variant: "destructive" });
    } else {
      setExpenses((data || []) as FarmExpense[]);
    }
    setLoading(false);
  };

  const addExpense = async (expense: Omit<FarmExpense, "id" | "farm_id" | "created_at" | "updated_at">) => {
    if (!farm?.id) return null;

    const { data, error } = await supabase
      .from("farm_expenses")
      .insert({
        farm_id: farm.id,
        expense_date: expense.expense_date,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        supplier_vendor: expense.supplier_vendor || null,
        receipt_reference: expense.receipt_reference || null,
        notes: expense.notes || null,
         receipt_image_url: expense.receipt_image_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding expense:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    toast({ title: "Expense Added", description: "Expense has been recorded successfully." });
    await fetchExpenses();
    return data;
  };

  const updateExpense = async (id: string, updates: Partial<FarmExpense>) => {
    const { error } = await supabase
      .from("farm_expenses")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating expense:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Expense Updated", description: "Expense has been updated successfully." });
    await fetchExpenses();
    return true;
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase
      .from("farm_expenses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting expense:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Expense Deleted", description: "Expense has been removed." });
    await fetchExpenses();
    return true;
  };

  const getExpensesByMonth = (monthYear: string) => {
    return expenses.filter((e) => e.expense_date.startsWith(monthYear));
  };

  const getExpensesByCategory = (category: string) => {
    return expenses.filter((e) => e.category === category);
  };

  const getTotalByMonth = (monthYear: string) => {
    return getExpensesByMonth(monthYear).reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const getTotalByCategory = (category: string, monthYear?: string) => {
    let filtered = expenses.filter((e) => e.category === category);
    if (monthYear) {
      filtered = filtered.filter((e) => e.expense_date.startsWith(monthYear));
    }
    return filtered.reduce((sum, e) => sum + Number(e.amount), 0);
  };

  useEffect(() => {
    if (farm?.id) {
      fetchExpenses();
    }
  }, [farm?.id]);

  return {
    expenses,
    loading,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByMonth,
    getExpensesByCategory,
    getTotalByMonth,
    getTotalByCategory,
  };
}
