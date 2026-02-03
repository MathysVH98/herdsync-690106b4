import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import { useAnimals, Animal } from "@/hooks/useAnimals";
import { useAnimalSales, AnimalSale as AnimalSaleType, AnimalSaleItem, getDefaultSale } from "@/hooks/useAnimalSales";
import { AnimalMultiSelect } from "@/components/animal-sale/AnimalMultiSelect";
import { SelectedAnimalsTable } from "@/components/animal-sale/SelectedAnimalsTable";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import {
  FileText,
  Save,
  CheckCircle,
  Download,
  FolderOpen,
  Plus,
  Users,
  DollarSign,
  Truck,
  HeartPulse,
  PenTool,
  ClipboardList,
} from "lucide-react";

export default function AnimalSale() {
  const { user } = useAuth();
  const { farm } = useFarm();
  const { toast } = useToast();
  const { animals, getAvailableAnimals, markAnimalsSold, fetchAnimals } = useAnimals();
  const { sales, saveSale, finalizeSale } = useAnimalSales();

  const [sale, setSale] = useState<AnimalSaleType>(getDefaultSale());
  const [items, setItems] = useState<AnimalSaleItem[]>([]);
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const availableAnimals = getAvailableAnimals();
  const selectedAnimals = animals.filter((a) => selectedAnimalIds.includes(a.id));

  // Sync items when selection changes
  useEffect(() => {
    setItems((prev) => {
      const newItems: AnimalSaleItem[] = selectedAnimalIds.map((animalId) => {
        const existing = prev.find((item) => item.animal_id === animalId);
        return existing || { animal_id: animalId, unit_price: null, notes: null };
      });
      return newItems;
    });
  }, [selectedAnimalIds]);

  // Calculate totals
  const calculations = useMemo(() => {
    let subtotal = 0;
    if (sale.price_type === "per_animal") {
      subtotal = items.reduce((sum, item) => sum + (item.unit_price || 0), 0);
    } else {
      subtotal = sale.lot_price_total || 0;
    }

    const vatAmount = sale.vat_applicable ? subtotal * (sale.vat_rate / 100) : 0;
    const total = subtotal + vatAmount;

    return { subtotal, vatAmount, total };
  }, [sale.price_type, sale.lot_price_total, sale.vat_applicable, sale.vat_rate, items]);

  // Update sale with calculations
  useEffect(() => {
    setSale((prev) => ({
      ...prev,
      subtotal: calculations.subtotal,
      vat_amount: calculations.vatAmount,
      total_amount: calculations.total,
    }));
  }, [calculations]);

  const updateSale = (updates: Partial<AnimalSaleType>) => {
    setSale((prev) => ({ ...prev, ...updates }));
  };

  const handleItemChange = (animalId: string, field: "unit_price" | "notes", value: string | number | null) => {
    setItems((prev) =>
      prev.map((item) =>
        item.animal_id === animalId
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleRemoveAnimal = (animalId: string) => {
    setSelectedAnimalIds((prev) => prev.filter((id) => id !== animalId));
  };

  const handleSaveDraft = async () => {
    if (!sale.buyer_name || !sale.seller_name) {
      toast({
        title: "Required Fields",
        description: "Please enter buyer and seller names.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const savedSale = await saveSale(sale, items);
    if (savedSale) {
      setSale((prev) => ({ ...prev, id: savedSale.id, sale_number: savedSale.sale_number }));
    }
    setSaving(false);
  };

  const handleFinalize = async () => {
    setSaving(true);
    const savedSale = await finalizeSale(sale, items, markAnimalsSold);
    if (savedSale) {
      setSale((prev) => ({ ...prev, id: savedSale.id, sale_number: savedSale.sale_number, sale_status: "finalized" }));
    }
    setSaving(false);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ANIMAL BILL OF SALE", pageWidth / 2, 20, { align: "center" });

    // Sale Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let y = 35;
    doc.text(`Sale Number: ${sale.sale_number || "Draft"}`, 14, y);
    doc.text(`Date: ${format(new Date(sale.sale_date), "dd MMMM yyyy")}`, pageWidth - 14, y, { align: "right" });
    y += 6;
    doc.text(`Location: ${sale.sale_location || "-"}`, 14, y);

    // Seller Section
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("SELLER DETAILS", 14, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(`Name: ${sale.seller_name}`, 14, y);
    y += 5;
    doc.text(`ID/Reg: ${sale.seller_id_or_reg || "-"}`, 14, y);
    doc.text(`Phone: ${sale.seller_phone || "-"}`, 105, y);
    y += 5;
    doc.text(`Address: ${sale.seller_address || "-"}`, 14, y);
    y += 5;
    doc.text(`Email: ${sale.seller_email || "-"}`, 14, y);
    if (sale.seller_vat_number) {
      y += 5;
      doc.text(`VAT Number: ${sale.seller_vat_number}`, 14, y);
    }

    // Buyer Section
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("BUYER DETAILS", 14, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(`Name: ${sale.buyer_name}`, 14, y);
    y += 5;
    doc.text(`ID/Reg: ${sale.buyer_id_or_reg || "-"}`, 14, y);
    doc.text(`Phone: ${sale.buyer_phone || "-"}`, 105, y);
    y += 5;
    doc.text(`Address: ${sale.buyer_address || "-"}`, 14, y);
    y += 5;
    doc.text(`Email: ${sale.buyer_email || "-"}`, 14, y);
    if (sale.buyer_vat_number) {
      y += 5;
      doc.text(`VAT Number: ${sale.buyer_vat_number}`, 14, y);
    }

    // Animals Table
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("ANIMALS INCLUDED IN SALE", 14, y);
    y += 4;

    const tableData = selectedAnimals.map((animal) => {
      const item = items.find((i) => i.animal_id === animal.id);
      return [
        animal.animal_tag_id,
        animal.species,
        animal.breed || "-",
        animal.sex || "-",
        animal.dob_or_age || "-",
        animal.brand_mark || "-",
        animal.microchip_number || "-",
        sale.price_type === "per_animal" ? `R ${(item?.unit_price || 0).toFixed(2)}` : "-",
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["Tag/ID", "Species", "Breed", "Sex", "Age/DOB", "Brand", "Microchip", "Price"]],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Pricing Summary
    y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text("PRICING SUMMARY", 14, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(`Subtotal: R ${calculations.subtotal.toFixed(2)}`, pageWidth - 14, y, { align: "right" });
    if (sale.vat_applicable) {
      y += 5;
      doc.text(`VAT (${sale.vat_rate}%): R ${calculations.vatAmount.toFixed(2)}`, pageWidth - 14, y, { align: "right" });
    }
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: R ${calculations.total.toFixed(2)}`, pageWidth - 14, y, { align: "right" });

    // Payment & Delivery Terms
    y += 12;
    doc.text("PAYMENT & DELIVERY TERMS", 14, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(`Payment Method: ${sale.payment_method.toUpperCase()}`, 14, y);
    if (sale.payment_reference) {
      y += 5;
      doc.text(`Reference: ${sale.payment_reference}`, 14, y);
    }
    if (sale.deposit_amount) {
      y += 5;
      doc.text(`Deposit: R ${sale.deposit_amount.toFixed(2)}`, 14, y);
    }
    y += 5;
    const ownershipLabel = sale.ownership_passes === "custom" ? sale.ownership_passes_custom : sale.ownership_passes.replace(/_/g, " ");
    doc.text(`Ownership passes: ${ownershipLabel}`, 14, y);
    y += 5;
    const riskLabel = sale.risk_passes === "custom" ? sale.risk_passes_custom : sale.risk_passes.replace(/_/g, " ");
    doc.text(`Risk passes: ${riskLabel}`, 14, y);
    y += 5;
    const transportLabel = sale.transport_responsibility === "custom" ? sale.transport_responsibility_custom : sale.transport_responsibility;
    doc.text(`Transport: ${transportLabel}`, 14, y);

    // Health & Conditions
    if (sale.health_declaration || sale.warranty_clause || sale.special_conditions) {
      y += 12;
      doc.setFont("helvetica", "bold");
      doc.text("HEALTH & CONDITIONS", 14, y);
      doc.setFont("helvetica", "normal");
      if (sale.health_declaration) {
        y += 6;
        doc.text(`Health Declaration: ${sale.health_declaration}`, 14, y, { maxWidth: 180 });
        y += Math.ceil(sale.health_declaration.length / 80) * 5;
      }
      if (sale.warranty_clause) {
        y += 6;
        doc.text(`Warranty: ${sale.warranty_clause}`, 14, y, { maxWidth: 180 });
        y += Math.ceil(sale.warranty_clause.length / 80) * 5;
      }
      if (sale.special_conditions) {
        y += 6;
        doc.text(`Special Conditions: ${sale.special_conditions}`, 14, y, { maxWidth: 180 });
      }
    }

    // Check for new page
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    // Signatures
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.text("SIGNATURES", 14, y);
    y += 10;

    // Seller signature
    doc.setFont("helvetica", "normal");
    doc.text("Seller:", 14, y);
    doc.line(35, y, 95, y);
    doc.text("Date:", 100, y);
    doc.line(115, y, 145, y);
    if (sale.seller_signature_name) {
      doc.text(sale.seller_signature_name, 40, y - 2);
    }

    // Buyer signature
    y += 12;
    doc.text("Buyer:", 14, y);
    doc.line(35, y, 95, y);
    doc.text("Date:", 100, y);
    doc.line(115, y, 145, y);
    if (sale.buyer_signature_name) {
      doc.text(sale.buyer_signature_name, 40, y - 2);
    }

    // Witnesses
    y += 12;
    doc.text("Witness 1:", 14, y);
    doc.line(40, y, 95, y);
    if (sale.witness1_name) {
      doc.text(sale.witness1_name, 45, y - 2);
    }

    y += 12;
    doc.text("Witness 2:", 14, y);
    doc.line(40, y, 95, y);
    if (sale.witness2_name) {
      doc.text(sale.witness2_name, 45, y - 2);
    }

    return doc;
  };

  const handleExportPDF = () => {
    const doc = generatePDF();
    const fileName = `AnimalSale_${sale.sale_number || "Draft"}_${sale.buyer_name.replace(/\s+/g, "_")}_${sale.sale_date}.pdf`;
    doc.save(fileName);
    toast({ title: "PDF Exported", description: `${fileName} has been downloaded.` });
  };

  const handleSaveToVault = async () => {
    if (!farm?.id || !user?.id) {
      toast({ title: "Error", description: "Please log in first.", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const doc = generatePDF();
      const pdfBlob = doc.output("blob");
      const fileName = `AnimalSale_${sale.sale_number || "Draft"}_${sale.buyer_name.replace(/\s+/g, "_")}_${sale.sale_date}.pdf`;

      // Upload to storage
      const storagePath = `${farm.id}/sales/${Date.now()}_${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("compliance-documents")
        .upload(storagePath, pdfBlob, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("compliance-documents")
        .getPublicUrl(storagePath);

      // Create document record
      const { data: docData, error: insertError } = await supabase
        .from("compliance_documents")
        .insert({
          farm_id: farm.id,
          title: `Animal Sale - ${sale.sale_number || "Draft"} - ${sale.buyer_name}`,
          category: "sales",
          file_url: urlData.publicUrl,
          file_name: fileName,
          uploaded_by: user.id,
          date_of_document: sale.sale_date,
          notes: `Sale Number: ${sale.sale_number || "Draft"}\nBuyer: ${sale.buyer_name}\nSeller: ${sale.seller_name}\nAnimals: ${selectedAnimals.length}\nTotal: R ${calculations.total.toFixed(2)}`,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Saved to Document Vault",
        description: "The Bill of Sale has been saved under Sales documents.",
      });
    } catch (error: any) {
      console.error("Error saving to vault:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };


  const resetForm = () => {
    setSale(getDefaultSale());
    setItems([]);
    setSelectedAnimalIds([]);
  };

  if (!user || !farm) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <FileText className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in Required</h2>
          <p className="text-muted-foreground">Please sign in to create animal sales.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-display text-foreground">Animal Sale</h1>
              {sale.sale_number && (
                <Badge variant="outline">{sale.sale_number}</Badge>
              )}
              {sale.sale_status === "finalized" && (
                <Badge className="bg-primary text-primary-foreground">Finalized</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">Create a Bill of Sale for farm animals</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </div>
        </div>

        {/* Main Form */}
        <Tabs defaultValue="sale-info" className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-1">
            <TabsTrigger value="sale-info" className="gap-1">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Sale Info</span>
            </TabsTrigger>
            <TabsTrigger value="parties" className="gap-1">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Parties</span>
            </TabsTrigger>
            <TabsTrigger value="animals" className="gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Animals</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-1">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-1">
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">Delivery</span>
            </TabsTrigger>
            <TabsTrigger value="signatures" className="gap-1">
              <PenTool className="w-4 h-4" />
              <span className="hidden sm:inline">Signatures</span>
            </TabsTrigger>
          </TabsList>

          {/* Sale Info Tab */}
          <TabsContent value="sale-info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Sale Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Sale Date *</Label>
                  <Input
                    type="date"
                    value={sale.sale_date}
                    onChange={(e) => updateSale({ sale_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Sale Location</Label>
                  <Input
                    value={sale.sale_location}
                    onChange={(e) => updateSale({ sale_location: e.target.value })}
                    placeholder="e.g., Farm Name, Town"
                  />
                </div>
                <div>
                  <Label>Sale Number</Label>
                  <Input
                    value={sale.sale_number || "(Auto-generated on save)"}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parties Tab */}
          <TabsContent value="parties" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Seller */}
              <Card>
                <CardHeader>
                  <CardTitle>Seller Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Full Name / Farm / Company *</Label>
                    <Input
                      value={sale.seller_name}
                      onChange={(e) => updateSale({ seller_name: e.target.value })}
                      placeholder="Seller name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ID / Reg Number</Label>
                      <Input
                        value={sale.seller_id_or_reg}
                        onChange={(e) => updateSale({ seller_id_or_reg: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={sale.seller_phone}
                        onChange={(e) => updateSale({ seller_phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea
                      value={sale.seller_address}
                      onChange={(e) => updateSale({ seller_address: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={sale.seller_email}
                        onChange={(e) => updateSale({ seller_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>VAT Number</Label>
                      <Input
                        value={sale.seller_vat_number}
                        onChange={(e) => updateSale({ seller_vat_number: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Buyer */}
              <Card>
                <CardHeader>
                  <CardTitle>Buyer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Full Name / Farm / Company *</Label>
                    <Input
                      value={sale.buyer_name}
                      onChange={(e) => updateSale({ buyer_name: e.target.value })}
                      placeholder="Buyer name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ID / Reg Number</Label>
                      <Input
                        value={sale.buyer_id_or_reg}
                        onChange={(e) => updateSale({ buyer_id_or_reg: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={sale.buyer_phone}
                        onChange={(e) => updateSale({ buyer_phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea
                      value={sale.buyer_address}
                      onChange={(e) => updateSale({ buyer_address: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={sale.buyer_email}
                        onChange={(e) => updateSale({ buyer_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>VAT Number</Label>
                      <Input
                        value={sale.buyer_vat_number}
                        onChange={(e) => updateSale({ buyer_vat_number: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Animals Tab */}
          <TabsContent value="animals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Select Animals for Sale</span>
                  <Badge variant="secondary">{selectedAnimalIds.length} selected</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Search & Select Animals (Available only)</Label>
                  <AnimalMultiSelect
                    animals={availableAnimals}
                    selectedIds={selectedAnimalIds}
                    onSelectionChange={setSelectedAnimalIds}
                    disabled={sale.sale_status === "finalized"}
                  />
                </div>

                <Separator />

                <SelectedAnimalsTable
                  animals={selectedAnimals}
                  items={items}
                  onItemChange={handleItemChange}
                  onRemove={handleRemoveAnimal}
                  priceType={sale.price_type}
                  disabled={sale.sale_status === "finalized"}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Price Type</Label>
                    <Select
                      value={sale.price_type}
                      onValueChange={(v) => updateSale({ price_type: v as "per_animal" | "per_lot" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_animal">Per Animal</SelectItem>
                        <SelectItem value="per_lot">Per Lot (Total)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {sale.price_type === "per_lot" && (
                    <div>
                      <Label>Lot Total (R)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={sale.lot_price_total ?? ""}
                        onChange={(e) =>
                          updateSale({ lot_price_total: e.target.value ? parseFloat(e.target.value) : null })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sale.vat_applicable}
                      onCheckedChange={(v) => updateSale({ vat_applicable: v })}
                    />
                    <Label>VAT Applicable</Label>
                  </div>
                  {sale.vat_applicable && (
                    <div className="flex items-center gap-2">
                      <Label>Rate (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={sale.vat_rate}
                        onChange={(e) => updateSale({ vat_rate: parseFloat(e.target.value) || 15 })}
                        className="w-20"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">R {calculations.subtotal.toFixed(2)}</span>
                  </div>
                  {sale.vat_applicable && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VAT ({sale.vat_rate}%):</span>
                      <span className="font-medium">R {calculations.vatAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-primary">R {calculations.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Tab */}
          <TabsContent value="delivery" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Payment Method</Label>
                      <Select
                        value={sale.payment_method}
                        onValueChange={(v) => updateSale({ payment_method: v as "eft" | "cash" | "other" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eft">EFT</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Payment Reference</Label>
                      <Input
                        value={sale.payment_reference}
                        onChange={(e) => updateSale({ payment_reference: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Deposit Amount (R)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={sale.deposit_amount ?? ""}
                        onChange={(e) =>
                          updateSale({ deposit_amount: e.target.value ? parseFloat(e.target.value) : null })
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Balance Due Date</Label>
                      <Input
                        type="date"
                        value={sale.balance_due_date || ""}
                        onChange={(e) => updateSale({ balance_due_date: e.target.value || null })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ownership & Risk</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Ownership Passes</Label>
                    <Select
                      value={sale.ownership_passes}
                      onValueChange={(v) => updateSale({ ownership_passes: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_full_payment">On Full Payment</SelectItem>
                        <SelectItem value="on_signature">On Signature</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {sale.ownership_passes === "custom" && (
                      <Input
                        className="mt-2"
                        value={sale.ownership_passes_custom}
                        onChange={(e) => updateSale({ ownership_passes_custom: e.target.value })}
                        placeholder="Specify custom terms..."
                      />
                    )}
                  </div>
                  <div>
                    <Label>Risk Passes</Label>
                    <Select
                      value={sale.risk_passes}
                      onValueChange={(v) => updateSale({ risk_passes: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_loading">On Loading</SelectItem>
                        <SelectItem value="on_handover">On Handover</SelectItem>
                        <SelectItem value="on_delivery">On Delivery</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {sale.risk_passes === "custom" && (
                      <Input
                        className="mt-2"
                        value={sale.risk_passes_custom}
                        onChange={(e) => updateSale({ risk_passes_custom: e.target.value })}
                        placeholder="Specify custom terms..."
                      />
                    )}
                  </div>
                  <div>
                    <Label>Transport Responsibility</Label>
                    <Select
                      value={sale.transport_responsibility}
                      onValueChange={(v) => updateSale({ transport_responsibility: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="seller">Seller</SelectItem>
                        <SelectItem value="split">Split</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {sale.transport_responsibility === "custom" && (
                      <Input
                        className="mt-2"
                        value={sale.transport_responsibility_custom}
                        onChange={(e) => updateSale({ transport_responsibility_custom: e.target.value })}
                        placeholder="Specify custom terms..."
                      />
                    )}
                  </div>
                  <div>
                    <Label>Delivery Details</Label>
                    <Textarea
                      value={sale.delivery_details}
                      onChange={(e) => updateSale({ delivery_details: e.target.value })}
                      placeholder="Collection point, delivery address, etc."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5" />
                  Health & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Health Declaration</Label>
                  <Textarea
                    value={sale.health_declaration}
                    onChange={(e) => updateSale({ health_declaration: e.target.value })}
                    placeholder="State any health certifications, vaccinations, or known conditions..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Warranty Clause</Label>
                  <Textarea
                    value={sale.warranty_clause}
                    onChange={(e) => updateSale({ warranty_clause: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Special Conditions</Label>
                  <Textarea
                    value={sale.special_conditions}
                    onChange={(e) => updateSale({ special_conditions: e.target.value })}
                    placeholder="Any additional terms or conditions..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signatures Tab */}
          <TabsContent value="signatures" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Seller Signature</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Typed Name</Label>
                    <Input
                      value={sale.seller_signature_name}
                      onChange={(e) => updateSale({ seller_signature_name: e.target.value })}
                      placeholder="Full name of signatory"
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={sale.seller_signature_date || ""}
                      onChange={(e) => updateSale({ seller_signature_date: e.target.value || null })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Buyer Signature</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Typed Name</Label>
                    <Input
                      value={sale.buyer_signature_name}
                      onChange={(e) => updateSale({ buyer_signature_name: e.target.value })}
                      placeholder="Full name of signatory"
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={sale.buyer_signature_date || ""}
                      onChange={(e) => updateSale({ buyer_signature_date: e.target.value || null })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Witness 1</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={sale.witness1_name}
                      onChange={(e) => updateSale({ witness1_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Signature (typed)</Label>
                    <Input
                      value={sale.witness1_signature}
                      onChange={(e) => updateSale({ witness1_signature: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Witness 2</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={sale.witness2_name}
                      onChange={(e) => updateSale({ witness2_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Signature (typed)</Label>
                    <Input
                      value={sale.witness2_signature}
                      onChange={(e) => updateSale({ witness2_signature: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving || sale.sale_status === "finalized"}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                variant="outline"
                onClick={handleFinalize}
                disabled={saving || sale.sale_status === "finalized" || selectedAnimalIds.length === 0}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Finalize Sale
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={!sale.buyer_name || !sale.seller_name}
              >
                <Download className="w-4 h-4 mr-2" />
                Export to PDF
              </Button>
              <Button
                onClick={handleSaveToVault}
                disabled={saving || !sale.buyer_name || !sale.seller_name}
                className="bg-gradient-primary"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Save to Document Vault
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </Layout>
  );
}
