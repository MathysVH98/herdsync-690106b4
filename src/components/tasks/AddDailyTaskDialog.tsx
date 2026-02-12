import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface AddDailyTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSubmit: (data: { title: string; description?: string; assigned_to: string }) => void;
  isSubmitting?: boolean;
}

export function AddDailyTaskDialog({
  open,
  onOpenChange,
  employees,
  onSubmit,
  isSubmitting,
}: AddDailyTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
  });

  const handleSubmit = () => {
    onSubmit({
      title: formData.title,
      description: formData.description || undefined,
      assigned_to: formData.assigned_to,
    });
    setFormData({ title: "", description: "", assigned_to: "" });
  };

  const isValid = formData.title.trim() && formData.assigned_to;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Daily Task</DialogTitle>
          <DialogDescription>
            Create a recurring daily task. Employees check it off each day.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="daily-title">Task Title *</Label>
            <Input
              id="daily-title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Check water troughs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily-description">Description</Label>
            <Textarea
              id="daily-description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily-assigned">Assign To *</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, assigned_to: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Daily Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
