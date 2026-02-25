import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

const REMOVAL_REASONS = [
  "Dead",
  "Stolen",
  "Lost",
  "Donated",
  "Culled",
  "Other",
] as const;

export type RemovalReason = (typeof REMOVAL_REASONS)[number];

interface RemoveAnimalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalName: string;
  onConfirm: (reason: RemovalReason, notes: string) => void;
}

export function RemoveAnimalDialog({
  open,
  onOpenChange,
  animalName,
  onConfirm,
}: RemoveAnimalDialogProps) {
  const [reason, setReason] = useState<RemovalReason | "">("");
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(reason, notes);
    setReason("");
    setNotes("");
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setReason("");
      setNotes("");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Remove Animal
          </DialogTitle>
          <DialogDescription>
            <strong>{animalName}</strong> will be removed from your active herd
            but kept in your records for year-end reporting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="removal-reason">
              Reason for Removal <span className="text-destructive">*</span>
            </Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as RemovalReason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REMOVAL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="removal-notes">Notes (optional)</Label>
            <Textarea
              id="removal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason}
          >
            Confirm Removal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
