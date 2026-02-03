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
import { EQUIPMENT_TYPES, EQUIPMENT_CONDITIONS, FarmEquipment } from "@/hooks/useFarmEquipment";

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: Omit<FarmEquipment, "id" | "farm_id" | "created_at" | "updated_at">) => Promise<any>;
}

export function AddEquipmentDialog({ open, onOpenChange, onSubmit }: AddEquipmentDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    equipment_type: "",
    make: "",
    model: "",
    year: "",
    serial_number: "",
    purchase_date: "",
    purchase_cost: "",
    current_value: "",
    condition: "Good",
    location: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.equipment_type) return;

    setSubmitting(true);
    await onSubmit({
      name: formData.name,
      equipment_type: formData.equipment_type,
      make: formData.make || null,
      model: formData.model || null,
      year: formData.year ? Number(formData.year) : null,
      serial_number: formData.serial_number || null,
      purchase_date: formData.purchase_date || null,
      purchase_cost: Number(formData.purchase_cost) || 0,
      current_value: formData.current_value ? Number(formData.current_value) : null,
      condition: formData.condition || null,
      location: formData.location || null,
      notes: formData.notes || null,
    });

    setFormData({
      name: "",
      equipment_type: "",
      make: "",
      model: "",
      year: "",
      serial_number: "",
      purchase_date: "",
      purchase_cost: "",
      current_value: "",
      condition: "Good",
      location: "",
      notes: "",
    });
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Add Farm Equipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Equipment Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John Deere 5075E"
                required
              />
            </div>
            <div>
              <Label htmlFor="equipment_type">Type *</Label>
              <Select
                value={formData.equipment_type}
                onValueChange={(v) => setFormData({ ...formData, equipment_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                placeholder="e.g., John Deere"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g., 5075E"
              />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder={new Date().getFullYear().toString()}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="Serial/VIN"
              />
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(v) => setFormData({ ...formData, condition: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_CONDITIONS.map((cond) => (
                    <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="purchase_cost">Purchase Cost (R)</Label>
              <Input
                id="purchase_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchase_cost}
                onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="current_value">Current Value (R)</Label>
              <Input
                id="current_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Storage Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Main Barn, Equipment Shed"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Service history, maintenance notes, etc."
              rows={2}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary text-primary-foreground"
            disabled={submitting || !formData.name || !formData.equipment_type}
          >
            {submitting ? "Adding..." : "Add Equipment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
