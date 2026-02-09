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
import { format } from "date-fns";
import { Database } from "@/integrations/supabase/types";

type TaskPriority = Database["public"]["Enums"]["task_priority"];

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSubmit: (data: {
    title: string;
    description?: string;
    assigned_to: string;
    due_date: string;
    priority: TaskPriority;
  }) => void;
  isSubmitting?: boolean;
}

export function AddTaskDialog({
  open,
  onOpenChange,
  employees,
  onSubmit,
  isSubmitting,
}: AddTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    due_date: format(new Date(), "yyyy-MM-dd"),
    priority: "medium" as TaskPriority,
  });

  const handleSubmit = () => {
    onSubmit({
      title: formData.title,
      description: formData.description || undefined,
      assigned_to: formData.assigned_to,
      due_date: formData.due_date,
      priority: formData.priority,
    });
    // Reset form after submit
    setFormData({
      title: "",
      description: "",
      assigned_to: "",
      due_date: format(new Date(), "yyyy-MM-dd"),
      priority: "medium",
    });
  };

  const isValid = formData.title.trim() && formData.assigned_to && formData.due_date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a task and assign it to an employee.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Check cattle water troughs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about the task..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To *</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, priority: v as TaskPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
