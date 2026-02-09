import { useState, useEffect } from "react";
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
import { Database } from "@/integrations/supabase/types";
import { EmployeeTask } from "@/hooks/useEmployeeTasks";

type TaskPriority = Database["public"]["Enums"]["task_priority"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: EmployeeTask | null;
  employees: Employee[];
  onSubmit: (data: {
    id: string;
    title?: string;
    description?: string;
    assigned_to?: string;
    due_date?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    completed_by?: string | null;
  }) => void;
  isSubmitting?: boolean;
}

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
  employees,
  onSubmit,
  isSubmitting,
}: EditTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
    priority: "medium" as TaskPriority,
    status: "pending" as TaskStatus,
    completed_by: "" as string,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        assigned_to: task.assigned_to,
        due_date: task.due_date,
        priority: task.priority,
        status: task.status,
        completed_by: task.completed_by || "",
      });
    }
  }, [task]);

  const handleSubmit = () => {
    if (!task) return;
    
    onSubmit({
      id: task.id,
      title: formData.title,
      description: formData.description || undefined,
      assigned_to: formData.assigned_to,
      due_date: formData.due_date,
      priority: formData.priority,
      status: formData.status,
      completed_by: formData.status === "completed" ? (formData.completed_by || null) : null,
    });
  };

  const isValid = formData.title.trim() && formData.assigned_to && formData.due_date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the task details below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Task Title *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-assigned_to">Assign To *</Label>
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
              <Label htmlFor="edit-due_date">Due Date *</Label>
              <Input
                id="edit-due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
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

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v as TaskStatus }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.status === "completed" && (
            <div className="space-y-2">
              <Label htmlFor="edit-completed_by">Completed By</Label>
              <Select
                value={formData.completed_by}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, completed_by: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select who completed the task" />
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
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
