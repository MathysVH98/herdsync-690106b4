import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Building, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";

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

interface CreateFarmDialogProps {
  trigger?: React.ReactNode;
}

export function CreateFarmDialog({ trigger }: CreateFarmDialogProps) {
  const [open, setOpen] = useState(false);
  const [farmName, setFarmName] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { refetchFarms, setActiveFarm } = useFarm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("farms")
        .insert({
          name: farmName.trim(),
          owner_id: user.id,
          address: address.trim() || null,
          province: province || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Also add the user as a farm member with 'owner' role
      await supabase.from("farm_members").insert({
        farm_id: data.id,
        user_id: user.id,
        role: "owner",
      });

      // Create a subscription for the new farm (14-day trial)
      await supabase.from("subscriptions").insert({
        farm_id: data.id,
        user_id: user.id,
        tier: "basic",
        status: "trialing",
      });

      toast({
        title: "Farm Created!",
        description: `${farmName} has been successfully created.`,
      });

      // Refresh farms and set the new one as active
      await refetchFarms();
      setActiveFarm(data.id);

      // Reset form and close dialog
      setFarmName("");
      setAddress("");
      setProvince("");
      setOpen(false);
    } catch (error: any) {
      console.error("Error creating farm:", error);
      toast({
        title: "Failed to Create Farm",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            New Farm
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Building className="w-5 h-5" />
            Create New Farm
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-primary text-primary-foreground"
            >
              {loading ? "Creating..." : "Create Farm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
