import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Syringe, 
  Stethoscope, 
  Pill, 
  Baby,
  Scissors,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

export type HealthRecordType = 
  | "Vaccination" 
  | "Checkup" 
  | "Treatment" 
  | "Pregnancy Check" 
  | "Farrier Visit";

export interface HealthRecord {
  id: string;
  animalId: string;
  animalName: string;
  type: HealthRecordType;
  date: string;
  provider: string;
  notes: string;
  nextDue?: string;
}

interface HealthRecordCardProps {
  record: HealthRecord;
  onEdit?: (record: HealthRecord) => void;
  onDelete?: (id: string) => void;
}

const healthTypeOptions: { type: HealthRecordType; label: string }[] = [
  { type: "Vaccination", label: "Vaccinations" },
  { type: "Checkup", label: "Checkups" },
  { type: "Treatment", label: "Treatments" },
  { type: "Pregnancy Check", label: "Pregnancy" },
  { type: "Farrier Visit", label: "Farrier" },
];

const typeConfig: Record<HealthRecordType, { icon: typeof Syringe; color: string }> = {
  "Vaccination": { icon: Syringe, color: "bg-info/10 text-info border-info/30" },
  "Checkup": { icon: Stethoscope, color: "bg-success/10 text-success border-success/30" },
  "Treatment": { icon: Pill, color: "bg-warning/10 text-warning border-warning/30" },
  "Pregnancy Check": { icon: Baby, color: "bg-accent/20 text-accent-foreground border-accent/30" },
  "Farrier Visit": { icon: Scissors, color: "bg-muted text-muted-foreground border-border" },
};

const defaultConfig = { icon: Stethoscope, color: "bg-muted text-muted-foreground border-border" };

export function HealthRecordCard({ record, onEdit, onDelete }: HealthRecordCardProps) {
  const config = typeConfig[record.type as HealthRecordType] || defaultConfig;
  const Icon = config.icon;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editData, setEditData] = useState(record);

  const handleSave = () => {
    onEdit?.(editData);
    setIsEditOpen(false);
  };

  return (
    <>
      <div className="card-elevated p-5 relative">
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditData(record); setIsEditOpen(true); }}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-start gap-4 pr-8">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", config.color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-semibold text-foreground">{record.animalName}</h4>
              <Badge variant="outline" className="text-xs">{record.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{record.notes}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {record.date}
              </span>
              <span>Provider: {record.provider}</span>
            </div>
            {record.nextDue && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs">
                  <span className="text-muted-foreground">Next due: </span>
                  <span className="font-medium text-primary">{record.nextDue}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Health Record</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Animal Name</Label>
                <Input value={editData.animalName} onChange={(e) => setEditData({ ...editData, animalName: e.target.value })} />
              </div>
              <div>
                <Label>Record Type</Label>
                <Select value={editData.type} onValueChange={(v) => setEditData({ ...editData, type: v as HealthRecordType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {healthTypeOptions.map(({ type, label }) => (
                      <SelectItem key={type} value={type}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} />
              </div>
              <div>
                <Label>Provider</Label>
                <Input value={editData.provider} onChange={(e) => setEditData({ ...editData, provider: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
            </div>
            <div>
              <Label>Next Due Date (optional)</Label>
              <Input type="date" value={editData.nextDue || ""} onChange={(e) => setEditData({ ...editData, nextDue: e.target.value })} />
            </div>
          </div>
          <Button onClick={handleSave} className="w-full bg-gradient-primary text-primary-foreground">Save Changes</Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Health Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the {record.type.toLowerCase()} record for {record.animalName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => onDelete?.(record.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
