import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Animal } from "@/hooks/useAnimals";
import { AnimalSaleItem } from "@/hooks/useAnimalSales";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectedAnimalsTableProps {
  animals: Animal[];
  items: AnimalSaleItem[];
  onItemChange: (animalId: string, field: "unit_price" | "notes", value: string | number | null) => void;
  onRemove: (animalId: string) => void;
  priceType: "per_animal" | "per_lot";
  disabled?: boolean;
}

export function SelectedAnimalsTable({
  animals,
  items,
  onItemChange,
  onRemove,
  priceType,
  disabled = false,
}: SelectedAnimalsTableProps) {
  const getItemForAnimal = (animalId: string) => {
    return items.find((item) => item.animal_id === animalId);
  };

  if (animals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        No animals selected. Use the dropdown above to add animals to this sale.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tag/ID</TableHead>
            <TableHead>Species</TableHead>
            <TableHead>Breed</TableHead>
            <TableHead>Sex</TableHead>
            <TableHead>Age/DOB</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Microchip</TableHead>
            {priceType === "per_animal" && (
              <TableHead className="w-[120px]">Unit Price (R)</TableHead>
            )}
            <TableHead className="w-[150px]">Notes</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {animals.map((animal) => {
            const item = getItemForAnimal(animal.id);
            return (
              <TableRow key={animal.id}>
                <TableCell className="font-medium">{animal.animal_tag_id}</TableCell>
                <TableCell>{animal.species}</TableCell>
                <TableCell>{animal.breed || "-"}</TableCell>
                <TableCell>{animal.sex || "-"}</TableCell>
                <TableCell>{animal.dob_or_age || "-"}</TableCell>
                <TableCell>{animal.brand_mark || "-"}</TableCell>
                <TableCell>{animal.microchip_number || "-"}</TableCell>
                {priceType === "per_animal" && (
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item?.unit_price ?? ""}
                      onChange={(e) =>
                        onItemChange(
                          animal.id,
                          "unit_price",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      disabled={disabled}
                      className="h-8"
                      placeholder="0.00"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Input
                    value={item?.notes ?? ""}
                    onChange={(e) => onItemChange(animal.id, "notes", e.target.value)}
                    disabled={disabled}
                    className="h-8"
                    placeholder="Notes..."
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(animal.id)}
                    disabled={disabled}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
