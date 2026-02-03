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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryItem } from "@/hooks/useInventory";
import { MinusCircle } from "lucide-react";

interface UsageLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSubmit: (
    inventoryId: string,
    quantity: number,
    reason: string,
    usedBy?: string,
    notes?: string
  ) => Promise<boolean>;
}

const USAGE_REASONS = [
  "Daily feeding",
  "Animal treatment",
  "Equipment maintenance",
  "Vehicle use",
  "Field application",
  "Emergency use",
  "Wastage/Spoilage",
  "Other",
];

export function UsageLogDialog({ open, onOpenChange, item, onSubmit }: UsageLogDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [usedBy, setUsedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !quantity || (!reason && !customReason)) return;

    setSubmitting(true);
    const finalReason = reason === "Other" ? customReason : reason;
    const success = await onSubmit(
      item.id,
      Number(quantity),
      finalReason,
      usedBy || undefined,
      notes || undefined
    );
    
    if (success) {
      setQuantity("");
      setReason("");
      setCustomReason("");
      setUsedBy("");
      setNotes("");
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <MinusCircle className="h-5 w-5" />
            Log Usage
          </DialogTitle>
          <DialogDescription>
            {item?.name} - Available: {item?.quantity} {item?.unit}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="quantity">Quantity Used *</Label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              max={item?.quantity}
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`0 ${item?.unit || ''}`}
              required
            />
            {Number(quantity) > (item?.quantity || 0) && (
              <p className="text-xs text-destructive mt-1">
                Cannot exceed available stock
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reason">Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {USAGE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === "Other" && (
            <div>
              <Label htmlFor="customReason">Specify Reason *</Label>
              <Input
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter reason"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="usedBy">Used By</Label>
            <Input
              id="usedBy"
              value={usedBy}
              onChange={(e) => setUsedBy(e.target.value)}
              placeholder="Employee name"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={2}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={
              submitting || 
              !quantity || 
              Number(quantity) > (item?.quantity || 0) ||
              (!reason || (reason === "Other" && !customReason))
            }
          >
            {submitting ? "Logging..." : "Log Usage"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
