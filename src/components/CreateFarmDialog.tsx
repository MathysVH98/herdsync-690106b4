import { useState, useCallback, useRef, useEffect } from "react";
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
import { Plus, Building, MapPin, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import { useSubscription } from "@/hooks/useSubscription";

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

// Farm limits per tier (basic: 10, starter: 3, pro: unlimited as requested)
const FARM_LIMITS: Record<string, number> = {
  basic: 10,
  starter: 3,
  pro: Infinity,
};

interface CreateFarmDialogProps {
  trigger?: React.ReactNode;
}

interface LocationSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export function CreateFarmDialog({ trigger }: CreateFarmDialogProps) {
  const [open, setOpen] = useState(false);
  const [farmName, setFarmName] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMapSearch, setShowMapSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { farms, refetchFarms, setActiveFarm, loading: farmsLoading } = useFarm();
  const { subscription, isActive, loading: subscriptionLoading } = useSubscription();

  const tier = subscription?.tier || "basic";
  const farmLimit = FARM_LIMITS[tier] ?? FARM_LIMITS.basic;
  const currentFarmCount = farms.length;
  // Allow creating farms if within limit, or if still loading (don't show error prematurely)
  const canCreateFarm = farmsLoading || subscriptionLoading || currentFarmCount < farmLimit;

  const searchLocation = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=za&limit=5`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Location search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const selectLocation = (result: LocationSearchResult) => {
    // Extract a shorter address (first few parts)
    const addressParts = result.display_name.split(",").slice(0, 3).join(",").trim();
    setAddress(addressParts);
    
    // Try to detect province from the full address
    const fullAddress = result.display_name.toLowerCase();
    for (const prov of SA_PROVINCES) {
      if (fullAddress.includes(prov.toLowerCase())) {
        setProvince(prov);
        break;
      }
    }
    
    setShowMapSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    
    toast({
      title: "Location Selected",
      description: addressParts,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "Please sign in to create a farm.",
        variant: "destructive",
      });
      return;
    }

    if (!canCreateFarm) {
      toast({
        title: "Farm Limit Reached",
        description: `Your ${tier} plan allows up to ${farmLimit} farms. Please upgrade to add more.`,
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
      // Verify we have a valid session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      // Create the farm using secure RPC function
      const { data: farmId, error } = await supabase
        .rpc("create_farm_for_user", {
          _name: farmName.trim(),
          _address: address.trim() || null,
          _province: province || null,
        });

      if (error) {
        console.error("Farm creation error:", error);
        throw error;
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
      setOpen(false);
    } catch (error: any) {
      console.error("Error creating farm:", error);
      toast({
        title: "Failed to Create Farm",
        description: error.message || error.details || "An error occurred. Please try again.",
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

        {/* Loading state */}
        {(farmsLoading || subscriptionLoading) ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : /* Farm limit info */
        currentFarmCount >= farmLimit ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <p className="font-medium text-destructive">Farm Limit Reached</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your {tier} plan allows {farmLimit} farm{farmLimit !== 1 ? "s" : ""}. 
              You currently have {currentFarmCount}.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => {
                setOpen(false);
                window.location.href = "/pricing";
              }}
            >
              Upgrade Plan
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {currentFarmCount} of {farmLimit === Infinity ? "unlimited" : farmLimit} farms used
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapSearch(!showMapSearch)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
                    title="Search location on map"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>

                {/* Map Search Panel */}
                {showMapSearch && (
                  <div className="bg-muted/50 border rounded-lg p-3 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a location in South Africa..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            searchLocation();
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={searchLocation}
                        disabled={isSearching || !searchQuery.trim()}
                      >
                        {isSearching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Search"
                        )}
                      </Button>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {searchResults.map((result) => (
                          <button
                            key={result.place_id}
                            type="button"
                            onClick={() => selectLocation(result)}
                            className="w-full text-left px-3 py-2 text-sm bg-background hover:bg-muted rounded-md flex items-start gap-2"
                          >
                            <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{result.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.length === 0 && searchQuery && !isSearching && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No locations found. Try a different search.
                      </p>
                    )}
                  </div>
                )}
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
                  onClick={(e) => {
                    if (!loading) {
                      handleSubmit(e as any);
                    }
                  }}
                >
                  {loading ? "Creating..." : "Create Farm"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
