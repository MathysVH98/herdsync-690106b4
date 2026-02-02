import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFarm } from "@/hooks/useFarm";
import { CreateFarmDialog } from "./CreateFarmDialog";
import { useState } from "react";

export function FarmSwitcher() {
  const { farm, farms, setActiveFarm, loading } = useFarm();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-9 w-full bg-sidebar-accent/50 animate-pulse rounded-lg" />
    );
  }

  if (farms.length === 0) {
    return (
      <CreateFarmDialog
        trigger={
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
            <Plus className="w-4 h-4" />
            Create Your First Farm
          </Button>
        }
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-3 h-9 text-sm font-normal hover:bg-sidebar-accent"
        >
          <span className="truncate">{farm?.name || "Select farm"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search farms..." />
          <CommandList>
            <CommandEmpty>No farm found.</CommandEmpty>
            <CommandGroup>
              {farms.map((f) => (
                <CommandItem
                  key={f.id}
                  value={f.name}
                  onSelect={() => {
                    setActiveFarm(f.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      farm?.id === f.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {f.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CreateFarmDialog
                trigger={
                  <CommandItem
                    onSelect={() => setOpen(false)}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Farm
                  </CommandItem>
                }
              />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
