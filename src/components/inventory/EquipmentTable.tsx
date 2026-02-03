import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FarmEquipment } from "@/hooks/useFarmEquipment";
import { MoreHorizontal, Tractor, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

interface EquipmentTableProps {
  items: FarmEquipment[];
  onEdit?: (item: FarmEquipment) => void;
  onDelete: (id: string) => void;
}

export function EquipmentTable({ items, onEdit, onDelete }: EquipmentTableProps) {
  const getConditionVariant = (condition: string | null) => {
    switch (condition) {
      case "Excellent":
        return "default";
      case "Good":
        return "secondary";
      case "Fair":
        return "outline";
      case "Poor":
      case "Under Repair":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      "Tractor": "🚜",
      "Planter": "🌱",
      "Harvester": "🌾",
      "Trailer": "🚚",
      "Irrigation": "💧",
      "Sprayer": "💨",
      "Loader": "🏗️",
      "Baler": "📦",
      "Cultivator": "⚙️",
      "Other": "🔧",
    };
    return icons[type] || "🔧";
  };

  if (items.length === 0) {
    return (
      <div className="card-elevated p-12 text-center">
        <Tractor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No equipment registered yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add tractors, planters, and other farm machinery.
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Equipment</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Make / Model</TableHead>
            <TableHead className="font-semibold">Year</TableHead>
            <TableHead className="font-semibold text-right">Purchase Cost</TableHead>
            <TableHead className="font-semibold text-right">Current Value</TableHead>
            <TableHead className="font-semibold">Condition</TableHead>
            <TableHead className="font-semibold">Purchase Date</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
              <TableCell>
                <div className="font-medium">{item.name}</div>
                {item.serial_number && (
                  <div className="text-xs text-muted-foreground">S/N: {item.serial_number}</div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-normal">
                  {getTypeIcon(item.equipment_type)} {item.equipment_type}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.make || item.model 
                  ? `${item.make || ""} ${item.model || ""}`.trim() 
                  : "-"}
              </TableCell>
              <TableCell className="font-mono text-muted-foreground">
                {item.year || "-"}
              </TableCell>
              <TableCell className="text-right font-mono">
                R{(item.purchase_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right font-mono">
                {item.current_value 
                  ? `R${item.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={getConditionVariant(item.condition)}>
                  {item.condition || "Unknown"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {item.purchase_date 
                  ? format(new Date(item.purchase_date), "dd MMM yyyy")
                  : "-"}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(item.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
