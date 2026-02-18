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
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFarm } from "@/hooks/useFarm";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Building, MapPin } from "lucide-react";

const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

export function FarmSwitcher() {
  const { farm, farms, setActiveFarm, loading, refetchFarms, isEmployee } = useFarm();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [farmName, setFarmName] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Employees cannot create farms
    if (isEmployee) {
      toast({
        title: "Not Allowed",
        description: "Employees cannot create farms.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "Please sign in to create a farm.",
        variant: "destructive",
      });
      return;
    }

    if (!farmName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a farm name.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // First, verify we have a valid session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      // Create the farm using secure RPC function
      const { data: farmId, error: farmError } = await supabase
        .rpc("create_farm_for_user", {
          _name: farmName.trim(),
          _address: address.trim() || null,
          _province: province || null,
        });

      if (farmError) {
        console.error("Farm creation error:", farmError);
        throw farmError;
      }

      toast({
        title: "Farm Created!",
        description: `${farmName} has been successfully created.`,
      });

      // Refresh farms and set the new one as active
      await refetchFarms();
      if (farmId) setActiveFarm(farmId);

      // Reset form and close dialog
      setFarmName("");
      setAddress("");
      setProvince("");
      setDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating farm:", error);
      toast({
        title: "Failed to Create Farm",
        description: error.message || error.details || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateDialog = () => {
    setPopoverOpen(false);
    // Small delay to let popover close before dialog opens
    setTimeout(() => setDialogOpen(true), 100);
  };

  if (loading) {
    return (
      <div className="h-9 w-full bg-sidebar-accent/50 animate-pulse rounded-lg" />
    );
  }

  // Employees see their farm name without ability to switch or create
  if (isEmployee) {
    return (
      <div className="flex items-center gap-2 px-3 h-9 text-sm bg-sidebar-accent/30 rounded-lg">
        <Building className="w-4 h-4 text-muted-foreground" />
        <span className="truncate font-medium">{farm?.name || "Your Farm"}</span>
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 justify-start"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Create Your First Farm
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <Building className="w-5 h-5" />
                Create New Farm
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateFarm} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="farm-name">Farm Name *</Label>
                <Input
                  id="farm-name"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g., Sunrise Farm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farm-address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="farm-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Farm physical address"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farm-province">Province</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {SA_PROVINCES.map((prov) => (
                      <SelectItem key={prov} value={prov}>
                        {prov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-primary text-primary-foreground"
                  onClick={(e) => {
                    if (!submitting) {
                      handleCreateFarm(e as any);
                    }
                  }}
                >
                  {submitting ? "Creating..." : "Create Farm"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={popoverOpen}
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
                      setPopoverOpen(false);
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
                <CommandItem
                  onSelect={openCreateDialog}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Farm
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Building className="w-5 h-5" />
              Create New Farm
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFarm} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="farm-name-main">Farm Name *</Label>
              <Input
                id="farm-name-main"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="e.g., Sunrise Farm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="farm-address-main">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="farm-address-main"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Farm physical address"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="farm-province-main">Province</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {SA_PROVINCES.map((prov) => (
                    <SelectItem key={prov} value={prov}>
                      {prov}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-primary text-primary-foreground"
                onClick={(e) => {
                  // Backup click handler in case form submit doesn't work
                  if (!submitting) {
                    handleCreateFarm(e as any);
                  }
                }}
              >
                {submitting ? "Creating..." : "Create Farm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
