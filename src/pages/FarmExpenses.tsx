import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFarmExpenses, EXPENSE_CATEGORIES, FarmExpense } from "@/hooks/useFarmExpenses";
import { useFarm } from "@/hooks/useFarm";
import { useEmployeePermissions } from "@/hooks/useEmployeePermissions";
import { useInventory, INVENTORY_CATEGORIES, InventoryCategory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Receipt,
  Fuel,
  Pill,
  Wrench,
  Truck,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
   Camera,
   Image,
   X,
   ExternalLink,
   FileDown,
} from "lucide-react";
import { useExpensesPdf } from "@/hooks/useExpensesPdf";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

const categoryIcons: Record<string, React.ReactNode> = {
  "Medicine & Veterinary": <Pill className="w-4 h-4" />,
  "Petrol": <Fuel className="w-4 h-4" />,
  "Diesel": <Fuel className="w-4 h-4" />,
  "Feed & Supplements": <Receipt className="w-4 h-4" />,
  "Equipment & Repairs": <Wrench className="w-4 h-4" />,
  "Transport": <Truck className="w-4 h-4" />,
  "Labour (Casual)": <Users className="w-4 h-4" />,
};

export default function FarmExpenses() {
  const { expenses, loading, addExpense, deleteExpense, getTotalByMonth, getTotalByCategory } = useFarmExpenses();
  const { farm } = useFarm();
  const { isEmployee, isFarmOwner } = useEmployeePermissions();
  const { addItem: addInventoryItem } = useInventory();
  const { generateExpensesPdf } = useExpensesPdf();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [linkToInventory, setLinkToInventory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  // Fetch employees for salary data
  const { data: employees = [] } = useQuery({
    queryKey: ["employees", farm?.id],
    queryFn: async () => {
      if (!farm?.id) return [];
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("farm_id", farm.id)
        .eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!farm?.id,
  });

  const [formData, setFormData] = useState({
    expense_date: format(new Date(), "yyyy-MM-dd"),
    category: "",
    description: "",
    amount: "",
    supplier_vendor: "",
    receipt_reference: "",
    notes: "",
  });
  const [inventoryData, setInventoryData] = useState({
    name: "",
    category: "" as InventoryCategory | "",
    quantity: "",
    unit: "units",
    reorder_level: "",
    cost_per_unit: "",
    storage_location: "",
  });
  const UNITS = ["kg", "L", "units", "bags", "boxes", "rolls", "m", "pairs"];

  // Map expense categories to inventory categories
  const expenseToInventoryCategory: Record<string, InventoryCategory> = {
    "Medicine & Veterinary": "Medicine",
    "Petrol": "Fuel",
    "Diesel": "Fuel",
    "Feed & Supplements": "Feed",
    "Equipment & Repairs": "Spare Parts",
    "Chemicals & Pesticides": "Chemicals",
    "Seeds & Fertilizer": "Chemicals",
  };

  const handleExpenseCategoryChange = (value: string) => {
    setFormData({ ...formData, category: value });
    if (linkToInventory) {
      const mappedCategory = expenseToInventoryCategory[value] || "";
      setInventoryData((prev) => ({ ...prev, category: mappedCategory }));
    }
  };
   const [receiptFile, setReceiptFile] = useState<File | null>(null);
   const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
   const [uploading, setUploading] = useState(false);
 
   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       if (file.size > 5 * 1024 * 1024) {
         alert("File size must be less than 5MB");
         return;
       }
       setReceiptFile(file);
       const reader = new FileReader();
       reader.onloadend = () => {
         setReceiptPreview(reader.result as string);
       };
       reader.readAsDataURL(file);
     }
   };
 
   const clearReceiptFile = () => {
     setReceiptFile(null);
     setReceiptPreview(null);
   };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.description || !formData.amount) return;

     setUploading(true);
     let receiptImageUrl: string | null = null;
 
     // Upload receipt image if provided
     if (receiptFile && farm?.id) {
       const fileExt = receiptFile.name.split('.').pop();
       const fileName = `${farm.id}/${Date.now()}.${fileExt}`;
       
       const { data: uploadData, error: uploadError } = await supabase.storage
         .from('expense-receipts')
         .upload(fileName, receiptFile);
 
       if (uploadError) {
         console.error('Upload error:', uploadError);
         setUploading(false);
         return;
       }
 
       const { data: { publicUrl } } = supabase.storage
         .from('expense-receipts')
         .getPublicUrl(fileName);
       
       receiptImageUrl = publicUrl;
     }
 
     await addExpense({
       expense_date: formData.expense_date,
       category: formData.category,
       description: formData.description,
       amount: parseFloat(formData.amount),
       supplier_vendor: formData.supplier_vendor || null,
       receipt_reference: formData.receipt_reference || null,
       notes: formData.notes || null,
        receipt_image_url: receiptImageUrl,
     });

     // Create linked inventory item if checkbox is checked
     if (linkToInventory && inventoryData.name && inventoryData.category) {
       await addInventoryItem({
         name: inventoryData.name,
         category: inventoryData.category as InventoryCategory,
         quantity: Number(inventoryData.quantity) || 0,
         unit: inventoryData.unit,
         reorder_level: Number(inventoryData.reorder_level) || 0,
         cost_per_unit: Number(inventoryData.cost_per_unit) || 0,
         supplier: formData.supplier_vendor || null,
         storage_location: inventoryData.storage_location || null,
         notes: formData.notes || null,
         last_restocked: formData.expense_date,
       });
     }

    setFormData({
      expense_date: format(new Date(), "yyyy-MM-dd"),
      category: "",
      description: "",
      amount: "",
      supplier_vendor: "",
      receipt_reference: "",
      notes: "",
    });
    setInventoryData({
      name: "",
      category: "",
      quantity: "",
      unit: "units",
      reorder_level: "",
      cost_per_unit: "",
      storage_location: "",
    });
    setLinkToInventory(false);
     setReceiptFile(null);
     setReceiptPreview(null);
     setUploading(false);
    setDialogOpen(false);
  };

  // Calculate monthly totals
  const monthlyExpenses = expenses.filter((e) => e.expense_date.startsWith(selectedMonth));
  const monthlyExpenseTotal = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalSalaries = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const grandTotal = monthlyExpenseTotal + totalSalaries;

  // Generate last 6 months for selection
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    };
  });

  // Group expenses by category for summary
  const expensesByCategory = EXPENSE_CATEGORIES.map((cat) => ({
    category: cat,
    total: getTotalByCategory(cat, selectedMonth),
  })).filter((c) => c.total > 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Farm Expenses</h1>
            <p className="text-muted-foreground">
              Track medicine, fuel, and all farm operating costs
            </p>
          </div>
          <div className="flex gap-2">
            {isFarmOwner && (
              <Button
                variant="outline"
                onClick={() =>
                  generateExpensesPdf({
                    farmName: farm?.name || "My Farm",
                    selectedMonth,
                    expenses: monthlyExpenses,
                    employees,
                    expensesByCategory,
                    monthlyExpenseTotal,
                    totalSalaries,
                    grandTotal,
                  })
                }
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense_date">Date</Label>
                    <Input
                      id="expense_date"
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (R)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={handleExpenseCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Diesel for tractor"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier_vendor">Supplier/Vendor (optional)</Label>
                  <Input
                    id="supplier_vendor"
                    placeholder="e.g., Agri Supplies"
                    value={formData.supplier_vendor}
                    onChange={(e) => setFormData({ ...formData, supplier_vendor: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt_reference">Receipt/Invoice # (optional)</Label>
                  <Input
                    id="receipt_reference"
                    placeholder="e.g., INV-2026-001"
                    value={formData.receipt_reference}
                    onChange={(e) => setFormData({ ...formData, receipt_reference: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                {/* Link to Inventory Checkbox */}
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Checkbox
                    id="link-inventory"
                    checked={linkToInventory}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      setLinkToInventory(isChecked);
                      if (isChecked && formData.category) {
                        const mappedCategory = expenseToInventoryCategory[formData.category] || "";
                        setInventoryData((prev) => ({ ...prev, category: mappedCategory }));
                      }
                    }}
                  />
                  <Label htmlFor="link-inventory" className="text-sm font-medium cursor-pointer">
                    Link this expense to Farm Inventory
                  </Label>
                </div>

                {linkToInventory && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm font-medium text-muted-foreground">Inventory Item Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inv_name">Item Name *</Label>
                        <Input
                          id="inv_name"
                          placeholder="e.g., Diesel Fuel"
                          value={inventoryData.name}
                          onChange={(e) => setInventoryData({ ...inventoryData, name: e.target.value })}
                          required={linkToInventory}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inv_category">Category</Label>
                        <Input
                          id="inv_category"
                          value={inventoryData.category || (formData.category ? "No matching category" : "Select expense category first")}
                          readOnly
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inv_quantity">Quantity *</Label>
                        <Input
                          id="inv_quantity"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={inventoryData.quantity}
                          onChange={(e) => setInventoryData({ ...inventoryData, quantity: e.target.value })}
                          required={linkToInventory}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inv_unit">Unit</Label>
                        <Select
                          value={inventoryData.unit}
                          onValueChange={(v) => setInventoryData({ ...inventoryData, unit: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inv_reorder">Reorder Level</Label>
                        <Input
                          id="inv_reorder"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={inventoryData.reorder_level}
                          onChange={(e) => setInventoryData({ ...inventoryData, reorder_level: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inv_cost">Cost per Unit (R)</Label>
                        <Input
                          id="inv_cost"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={inventoryData.cost_per_unit}
                          onChange={(e) => setInventoryData({ ...inventoryData, cost_per_unit: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inv_storage">Storage Location</Label>
                        <Input
                          id="inv_storage"
                          placeholder="e.g., Shed A, Fuel Tank 1"
                          value={inventoryData.storage_location}
                          onChange={(e) => setInventoryData({ ...inventoryData, storage_location: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                 {/* Receipt Photo Upload */}
                 <div className="space-y-2">
                   <Label>Receipt Photo (optional)</Label>
                   {receiptPreview ? (
                     <div className="relative">
                       <img 
                         src={receiptPreview} 
                         alt="Receipt preview" 
                         className="w-full h-32 object-cover rounded-lg border"
                       />
                       <Button
                         type="button"
                         variant="destructive"
                         size="icon"
                         className="absolute top-2 right-2 h-6 w-6"
                         onClick={clearReceiptFile}
                       >
                         <X className="w-3 h-3" />
                       </Button>
                     </div>
                   ) : (
                     <div className="border-2 border-dashed rounded-lg p-4 text-center">
                       <input
                         type="file"
                         accept="image/*"
                         onChange={handleFileChange}
                         className="hidden"
                         id="receipt-upload"
                       />
                       <label
                         htmlFor="receipt-upload"
                         className="cursor-pointer flex flex-col items-center gap-2"
                       >
                         <Camera className="w-8 h-8 text-muted-foreground" />
                         <span className="text-sm text-muted-foreground">
                           Click to upload receipt photo
                         </span>
                         <span className="text-xs text-muted-foreground">
                           Max 5MB • JPG, PNG
                         </span>
                       </label>
                     </div>
                   )}
                 </div>
 
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                   <Button type="submit" disabled={uploading}>
                     {uploading ? "Uploading..." : "Add Expense"}
                   </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards - hidden from employees */}
        {!isEmployee && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Operating Expenses
                </CardTitle>
                <Receipt className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R{monthlyExpenseTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">{monthlyExpenses.length} transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Employee Salaries
                </CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R{totalSalaries.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">{employees.length} active employees</p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-primary">
                  Total Monthly Cost
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">R{grandTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">Expenses + Salaries</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="expenses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            {!isEmployee && <TabsTrigger value="summary">Monthly Summary</TabsTrigger>}
          </TabsList>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Expense Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : monthlyExpenses.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No expenses recorded for this month</p>
                    <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                      Add First Expense
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Supplier</TableHead>
                         <TableHead>Receipt</TableHead>
                        {!isEmployee && <TableHead className="text-right">Amount</TableHead>}
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{format(new Date(expense.expense_date), "dd MMM yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              {categoryIcons[expense.category] || <DollarSign className="w-3 h-3" />}
                              {expense.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {expense.supplier_vendor || "-"}
                          </TableCell>
                           <TableCell>
                             {expense.receipt_image_url ? (
                               <a
                                 href={expense.receipt_image_url}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-1 text-primary hover:underline"
                               >
                                 <Image className="w-4 h-4" />
                                 <span className="text-xs">View</span>
                               </a>
                             ) : (
                               <span className="text-muted-foreground text-xs">-</span>
                             )}
                           </TableCell>
                          {!isEmployee && (
                            <TableCell className="text-right font-medium">
                              R{Number(expense.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                            </TableCell>
                          )}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteExpense(expense.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {!isEmployee && (
            <TabsContent value="summary">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expenses by Category */}
                <Card>
                  <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expensesByCategory.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No expenses this month</p>
                    ) : (
                      <div className="space-y-3">
                        {expensesByCategory.map((item) => (
                          <div key={item.category} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {categoryIcons[item.category] || <DollarSign className="w-4 h-4" />}
                              <span className="text-sm">{item.category}</span>
                            </div>
                            <span className="font-medium">
                              R{item.total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                        <div className="border-t pt-3 flex items-center justify-between font-semibold">
                          <span>Total Expenses</span>
                          <span>R{monthlyExpenseTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Employee Salaries */}
                <Card>
                  <CardHeader>
                    <CardTitle>Employee Salaries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employees.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No active employees</p>
                    ) : (
                      <div className="space-y-3">
                        {employees.map((emp: any) => (
                          <div key={emp.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{emp.first_name} {emp.last_name}</span>
                              <Badge variant="secondary" className="text-xs">{emp.role}</Badge>
                            </div>
                            <span className="font-medium">
                              R{(emp.salary || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                        <div className="border-t pt-3 flex items-center justify-between font-semibold">
                          <span>Total Salaries</span>
                          <span>R{totalSalaries.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Grand Total */}
                <Card className="lg:col-span-2 bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Monthly Grand Total</h3>
                        <p className="text-sm text-muted-foreground">
                          All operating costs including salaries for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
                        </p>
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        R{grandTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
