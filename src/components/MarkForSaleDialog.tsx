import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface MarkForSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalName: string;
  onConfirm: (plannedSaleDate: Date) => void;
}

export function MarkForSaleDialog({
  open,
  onOpenChange,
  animalName,
  onConfirm,
}: MarkForSaleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate);
      setSelectedDate(undefined);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedDate(undefined);
    }
    onOpenChange(newOpen);
  };

  // Calculate days until sale for preview
  const daysUntilSale = selectedDate ? differenceInDays(selectedDate, new Date()) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display">Mark for Sale</DialogTitle>
          <DialogDescription>
            Set a planned sale date for <span className="font-semibold">{animalName}</span>. 
            An alert will be created 1 month before the sale to start a feeding program.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Planned Sale Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {selectedDate && daysUntilSale !== null && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{daysUntilSale}</span> days until planned sale
              </p>
              {daysUntilSale >= 30 && (
                <p className="text-sm text-muted-foreground">
                  📋 Feeding program alert will trigger on{" "}
                  <span className="font-medium">
                    {format(new Date(selectedDate.getTime() - 30 * 24 * 60 * 60 * 1000), "PPP")}
                  </span>
                </p>
              )}
              {daysUntilSale <= 7 && daysUntilSale > 0 && (
                <p className="text-sm text-warning font-medium">
                  ⏰ Countdown active! Only {daysUntilSale} day{daysUntilSale !== 1 ? "s" : ""} left
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedDate}
            className="bg-gradient-primary"
          >
            Mark for Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
