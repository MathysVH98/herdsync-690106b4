import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INVENTORY_CATEGORIES, InventoryCategory } from "@/hooks/useInventory";

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: {
    name: string;
    category: InventoryCategory;
    quantity: number;
    unit: string;
    reorder_level: number;
    cost_per_unit: number;
    supplier: string | null;
    storage_location: string | null;
    notes: string | null;
    last_restocked: string | null;
  }) => Promise<any>;
}

const UNITS = ["kg", "L", "units", "bags", "boxes", "rolls", "m", "pairs"];

export function AddInventoryDialog({ open, onOpenChange, onSubmit }: AddInventoryDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "" as InventoryCategory | "",
    quantity: "",
    unit: "units",
    reorder_level: "",
    cost_per_unit: "",
    supplier: "",
    storage_location: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.quantity) return;

    setSubmitting(true);
    await onSubmit({
      name: formData.name,
      category: formData.category as InventoryCategory,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      reorder_level: Number(formData.reorder_level) || 0,
      cost_per_unit: Number(formData.cost_per_unit) || 0,
      supplier: formData.supplier || null,
      storage_location: formData.storage_location || null,
      notes: formData.notes || null,
      last_restocked: new Date().toISOString().split('T')[0],
    });
    
    setFormData({
      name: "",
      category: "",
      quantity: "",
      unit: "units",
      reorder_level: "",
      cost_per_unit: "",
      supplier: "",
      storage_location: "",
      notes: "",
    });
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display">Add Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Diesel Fuel"
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({ ...formData, category: v as InventoryCategory })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                type="number"
                min="0"
                step="0.01"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost_per_unit">Cost per Unit (R)</Label>
              <Input
                id="cost_per_unit"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Supplier name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="storage_location">Storage Location</Label>
            <Input
              id="storage_location"
              value={formData.storage_location}
              onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
              placeholder="e.g., Shed A, Fuel Tank 1"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary text-primary-foreground"
            disabled={submitting || !formData.name || !formData.category || !formData.quantity}
          >
            {submitting ? "Adding..." : "Add Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
