import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InventoryItem } from "@/hooks/useInventory";
import { Package } from "lucide-react";

interface RestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSubmit: (id: string, quantity: number, costPerUnit: number, supplier?: string) => Promise<boolean>;
}

export function RestockDialog({ open, onOpenChange, item, onSubmit }: RestockDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [supplier, setSupplier] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !quantity) return;

    setSubmitting(true);
    const success = await onSubmit(
      item.id,
      Number(quantity),
      Number(costPerUnit) || item.cost_per_unit,
      supplier || undefined
    );
    
    if (success) {
      setQuantity("");
      setCostPerUnit("");
      setSupplier("");
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  const totalCost = Number(quantity) * (Number(costPerUnit) || item?.cost_per_unit || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Package className="h-5 w-5" />
            Restock Item
          </DialogTitle>
          <DialogDescription>
            {item?.name} - Current stock: {item?.quantity} {item?.unit}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="quantity">Quantity to Add *</Label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`0 ${item?.unit || ''}`}
              required
            />
          </div>

          <div>
            <Label htmlFor="costPerUnit">Cost per Unit (R)</Label>
            <Input
              id="costPerUnit"
              type="number"
              min="0"
              step="0.01"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
              placeholder={item?.cost_per_unit?.toFixed(2) || "0.00"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to use existing: R{item?.cost_per_unit?.toFixed(2)}
            </p>
          </div>

          <div>
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder={item?.supplier || "Supplier name"}
            />
          </div>

          {quantity && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium">
                Total Cost: <span className="text-primary">R{totalCost.toFixed(2)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This will be automatically added as an expense.
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary text-primary-foreground"
            disabled={submitting || !quantity}
          >
            {submitting ? "Processing..." : "Restock & Record Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
