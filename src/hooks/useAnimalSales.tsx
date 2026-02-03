import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { useToast } from "@/hooks/use-toast";

export interface AnimalSaleItem {
  id?: string;
  animal_sale_id?: string;
  animal_id: string;
  unit_price: number | null;
  notes: string | null;
}

export interface AnimalSale {
  id?: string;
  farm_id?: string;
  sale_number?: string;
  sale_date: string;
  sale_location: string;
  sale_status: "draft" | "finalized";
  
  seller_name: string;
  seller_id_or_reg: string;
  seller_address: string;
  seller_phone: string;
  seller_email: string;
  seller_vat_number: string;
  
  buyer_name: string;
  buyer_id_or_reg: string;
  buyer_address: string;
  buyer_phone: string;
  buyer_email: string;
  buyer_vat_number: string;
  
  price_type: "per_animal" | "per_lot";
  price_per_animal: number | null;
  lot_price_total: number | null;
  vat_applicable: boolean;
  vat_rate: number;
  vat_amount: number;
  subtotal: number;
  total_amount: number;
  
  payment_method: "eft" | "cash" | "other";
  payment_reference: string;
  deposit_amount: number | null;
  balance_due_date: string | null;
  ownership_passes: "on_full_payment" | "on_signature" | "custom";
  ownership_passes_custom: string;
  risk_passes: "on_loading" | "on_handover" | "on_delivery" | "custom";
  risk_passes_custom: string;
  transport_responsibility: "buyer" | "seller" | "split" | "custom";
  transport_responsibility_custom: string;
  delivery_details: string;
  
  health_declaration: string;
  warranty_clause: string;
  special_conditions: string;
  
  seller_signature_name: string;
  seller_signature_date: string | null;
  buyer_signature_name: string;
  buyer_signature_date: string | null;
  witness1_name: string;
  witness1_signature: string;
  witness2_name: string;
  witness2_signature: string;
  
  pdf_document_id: string | null;
  created_at?: string;
  updated_at?: string;
  
  items?: AnimalSaleItem[];
}

export const getDefaultSale = (): AnimalSale => ({
  sale_date: new Date().toISOString().split("T")[0],
  sale_location: "",
  sale_status: "draft",
  
  seller_name: "",
  seller_id_or_reg: "",
  seller_address: "",
  seller_phone: "",
  seller_email: "",
  seller_vat_number: "",
  
  buyer_name: "",
  buyer_id_or_reg: "",
  buyer_address: "",
  buyer_phone: "",
  buyer_email: "",
  buyer_vat_number: "",
  
  price_type: "per_animal",
  price_per_animal: null,
  lot_price_total: null,
  vat_applicable: false,
  vat_rate: 15,
  vat_amount: 0,
  subtotal: 0,
  total_amount: 0,
  
  payment_method: "eft",
  payment_reference: "",
  deposit_amount: null,
  balance_due_date: null,
  ownership_passes: "on_full_payment",
  ownership_passes_custom: "",
  risk_passes: "on_handover",
  risk_passes_custom: "",
  transport_responsibility: "buyer",
  transport_responsibility_custom: "",
  delivery_details: "",
  
  health_declaration: "",
  warranty_clause: "Sold as-is / voetstoots unless stated otherwise",
  special_conditions: "",
  
  seller_signature_name: "",
  seller_signature_date: null,
  buyer_signature_name: "",
  buyer_signature_date: null,
  witness1_name: "",
  witness1_signature: "",
  witness2_name: "",
  witness2_signature: "",
  
  pdf_document_id: null,
  items: [],
});

export function useAnimalSales() {
  const { farm } = useFarm();
  const { toast } = useToast();
  const [sales, setSales] = useState<AnimalSale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    if (!farm?.id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("animal_sales")
      .select("*")
      .eq("farm_id", farm.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales:", error);
      toast({ title: "Error", description: "Failed to load sales", variant: "destructive" });
    } else {
      setSales((data || []) as AnimalSale[]);
    }
    setLoading(false);
  };

  const saveSale = async (sale: AnimalSale, items: AnimalSaleItem[]): Promise<AnimalSale | null> => {
    if (!farm?.id) return null;

    try {
      // Prepare sale data for insert/update
      const saleData = {
        farm_id: farm.id,
        sale_date: sale.sale_date,
        sale_location: sale.sale_location || null,
        sale_status: sale.sale_status,
        seller_name: sale.seller_name,
        seller_id_or_reg: sale.seller_id_or_reg || null,
        seller_address: sale.seller_address || null,
        seller_phone: sale.seller_phone || null,
        seller_email: sale.seller_email || null,
        seller_vat_number: sale.seller_vat_number || null,
        buyer_name: sale.buyer_name,
        buyer_id_or_reg: sale.buyer_id_or_reg || null,
        buyer_address: sale.buyer_address || null,
        buyer_phone: sale.buyer_phone || null,
        buyer_email: sale.buyer_email || null,
        buyer_vat_number: sale.buyer_vat_number || null,
        price_type: sale.price_type,
        price_per_animal: sale.price_per_animal,
        lot_price_total: sale.lot_price_total,
        vat_applicable: sale.vat_applicable,
        vat_rate: sale.vat_rate,
        vat_amount: sale.vat_amount,
        subtotal: sale.subtotal,
        total_amount: sale.total_amount,
        payment_method: sale.payment_method,
        payment_reference: sale.payment_reference || null,
        deposit_amount: sale.deposit_amount,
        balance_due_date: sale.balance_due_date || null,
        ownership_passes: sale.ownership_passes,
        ownership_passes_custom: sale.ownership_passes_custom || null,
        risk_passes: sale.risk_passes,
        risk_passes_custom: sale.risk_passes_custom || null,
        transport_responsibility: sale.transport_responsibility,
        transport_responsibility_custom: sale.transport_responsibility_custom || null,
        delivery_details: sale.delivery_details || null,
        health_declaration: sale.health_declaration || null,
        warranty_clause: sale.warranty_clause || null,
        special_conditions: sale.special_conditions || null,
        seller_signature_name: sale.seller_signature_name || null,
        seller_signature_date: sale.seller_signature_date || null,
        buyer_signature_name: sale.buyer_signature_name || null,
        buyer_signature_date: sale.buyer_signature_date || null,
        witness1_name: sale.witness1_name || null,
        witness1_signature: sale.witness1_signature || null,
        witness2_name: sale.witness2_name || null,
        witness2_signature: sale.witness2_signature || null,
        pdf_document_id: sale.pdf_document_id,
      };

      let savedSale: AnimalSale;

      if (sale.id) {
        // Update existing sale
        const { data, error } = await supabase
          .from("animal_sales")
          .update(saleData)
          .eq("id", sale.id)
          .select()
          .single();

        if (error) throw error;
        savedSale = data as AnimalSale;

        // Delete existing items and re-insert
        await supabase
          .from("animal_sale_items")
          .delete()
          .eq("animal_sale_id", sale.id);
      } else {
        // Insert new sale
        // Type assertion needed while Supabase types regenerate
        const { data, error } = await supabase
          .from("animal_sales")
          .insert(saleData as any)
          .select()
          .single();

        if (error) throw error;
        savedSale = data as AnimalSale;
      }

      // Insert sale items
      if (items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          animal_sale_id: savedSale.id,
          animal_id: item.animal_id,
          unit_price: item.unit_price,
          notes: item.notes || null,
        }));

        const { error: itemsError } = await supabase
          .from("animal_sale_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast({ title: "Sale Saved", description: `Sale ${savedSale.sale_number} has been saved.` });
      await fetchSales();
      return savedSale;
    } catch (error: any) {
      console.error("Error saving sale:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const finalizeSale = async (
    sale: AnimalSale,
    items: AnimalSaleItem[],
    markAnimalsSold: (ids: string[]) => Promise<boolean>
  ): Promise<AnimalSale | null> => {
    // Validate required fields
    if (!sale.buyer_name || !sale.seller_name || items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in buyer name, seller name, and select at least one animal.",
        variant: "destructive",
      });
      return null;
    }

    // Update sale status to finalized
    const finalizedSale: AnimalSale = { ...sale, sale_status: "finalized" };
    const savedSale = await saveSale(finalizedSale, items);

    if (savedSale) {
      // Mark animals as sold
      const animalIds = items.map((item) => item.animal_id);
      await markAnimalsSold(animalIds);
      toast({ title: "Sale Finalized", description: "Animals have been marked as sold." });
    }

    return savedSale;
  };

  useEffect(() => {
    if (farm?.id) {
      fetchSales();
    }
  }, [farm?.id]);

  return {
    sales,
    loading,
    fetchSales,
    saveSale,
    finalizeSale,
  };
}
