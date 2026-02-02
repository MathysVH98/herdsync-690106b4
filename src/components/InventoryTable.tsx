import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  costPerUnit: number;
  lastRestocked: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
}

function getStockStatus(quantity: number, reorderLevel: number) {
  const ratio = quantity / reorderLevel;
  if (ratio > 2) return { label: "In Stock", class: "stock-good", emoji: "🟢" };
  if (ratio > 1) return { label: "Running Low", class: "stock-low", emoji: "🟡" };
  return { label: "Reorder Now", class: "stock-critical", emoji: "🔴" };
}

export function InventoryTable({ items }: InventoryTableProps) {
  return (
    <div className="card-elevated overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Feed Name</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold text-right">Quantity</TableHead>
            <TableHead className="font-semibold text-right">Reorder Level</TableHead>
            <TableHead className="font-semibold text-right">Cost/Unit (R)</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Last Restocked</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const status = getStockStatus(item.quantity, item.reorderLevel);
            return (
              <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {item.quantity} {item.unit}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {item.reorderLevel} {item.unit}
                </TableCell>
                <TableCell className="text-right font-mono">
                  R{item.costPerUnit.toFixed(2)}
                </TableCell>
                <TableCell>
                  <span className={cn("flex items-center gap-2", status.class)}>
                    <span>{status.emoji}</span>
                    <span className="font-medium">{status.label}</span>
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.lastRestocked}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
