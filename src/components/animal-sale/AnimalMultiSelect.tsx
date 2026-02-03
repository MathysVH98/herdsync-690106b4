import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Animal } from "@/hooks/useAnimals";

interface AnimalMultiSelectProps {
  animals: Animal[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function AnimalMultiSelect({
  animals,
  selectedIds,
  onSelectionChange,
  disabled = false,
}: AnimalMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredAnimals = animals.filter((animal) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      animal.animal_tag_id.toLowerCase().includes(searchLower) ||
      animal.species.toLowerCase().includes(searchLower) ||
      (animal.breed?.toLowerCase() || "").includes(searchLower)
    );
  });

  const getAnimalLabel = (animal: Animal) => {
    const parts = [animal.animal_tag_id, animal.species];
    if (animal.breed) parts.push(animal.breed);
    if (animal.sex) parts.push(animal.sex);
    if (animal.dob_or_age) parts.push(animal.dob_or_age);
    return parts.join(" – ");
  };

  const toggleAnimal = (animalId: string) => {
    if (selectedIds.includes(animalId)) {
      onSelectionChange(selectedIds.filter((id) => id !== animalId));
    } else {
      onSelectionChange([...selectedIds, animalId]);
    }
  };

  const removeAnimal = (animalId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== animalId));
  };

  const selectedAnimals = animals.filter((a) => selectedIds.includes(a.id));

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between min-h-[40px] h-auto"
          >
            <span className="truncate">
              {selectedIds.length === 0
                ? "Select animals..."
                : `${selectedIds.length} animal${selectedIds.length === 1 ? "" : "s"} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search by tag, species, breed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            {filteredAnimals.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No animals found.
              </div>
            ) : (
              <div className="p-1">
                {filteredAnimals.map((animal) => {
                  const isSelected = selectedIds.includes(animal.id);
                  return (
                    <button
                      key={animal.id}
                      onClick={() => toggleAnimal(animal.id)}
                      className={cn(
                        "flex items-center gap-2 w-full px-2 py-2 text-left text-sm rounded-md hover:bg-accent transition-colors",
                        isSelected && "bg-accent"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{animal.animal_tag_id}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {animal.species}
                          {animal.breed && ` • ${animal.breed}`}
                          {animal.sex && ` • ${animal.sex}`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Selected animals badges */}
      {selectedAnimals.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedAnimals.map((animal) => (
            <Badge
              key={animal.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span className="truncate max-w-[150px]">{animal.animal_tag_id}</span>
              <button
                onClick={() => removeAnimal(animal.id)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
