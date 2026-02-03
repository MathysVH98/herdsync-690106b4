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
import { InventoryItem, useInventory } from "@/hooks/useInventory";
import { MoreHorizontal, Package, MinusCircle, Trash2 } from "lucide-react";

interface InventoryTableProps {
  items: InventoryItem[];
  onRestock: (item: InventoryItem) => void;
  onLogUsage: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export function InventoryTable({ items, onRestock, onLogUsage, onDelete }: InventoryTableProps) {
  const { getStockStatus } = useInventory();

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      "Feed": "🌾",
      "Fuel": "⛽",
      "Medicine": "💊",
      "Tools": "🔧",
      "Chemicals": "🧪",
      "Spare Parts": "⚙️",
    };
    return icons[category] || "📦";
  };

  if (items.length === 0) {
    return (
      <div className="card-elevated p-12 text-center">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No inventory items in this category.</p>
      </div>
    );
  }

  return (
    <div className="card-elevated overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Item</TableHead>
            <TableHead className="font-semibold">Category</TableHead>
            <TableHead className="font-semibold text-right">Quantity</TableHead>
            <TableHead className="font-semibold text-right">Reorder At</TableHead>
            <TableHead className="font-semibold text-right">Value</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Location</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const status = getStockStatus(item);
            const value = item.quantity * item.cost_per_unit;
            
            return (
              <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="font-medium">{item.name}</div>
                  {item.supplier && (
                    <div className="text-xs text-muted-foreground">{item.supplier}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {getCategoryIcon(item.category)} {item.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {item.quantity} {item.unit}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {item.reorder_level > 0 ? `${item.reorder_level} ${item.unit}` : "-"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  R{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={status.variant === "warning" ? "outline" : status.variant}
                    className={status.variant === "warning" ? "border-yellow-500 text-yellow-600 bg-yellow-50" : ""}
                  >
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {item.storage_location || "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onRestock(item)}>
                        <Package className="h-4 w-4 mr-2" />
                        Restock
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onLogUsage(item)}>
                        <MinusCircle className="h-4 w-4 mr-2" />
                        Log Usage
                      </DropdownMenuItem>
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
