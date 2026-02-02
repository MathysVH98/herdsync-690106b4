import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Farm {
  id: string;
  name: string;
  owner_id: string;
  address: string | null;
  province: string | null;
}

interface FarmContextType {
  farm: Farm | null;
  farms: Farm[];
  loading: boolean;
  setActiveFarm: (farmId: string) => void;
  refetchFarms: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType>({
  farm: null,
  farms: [],
  loading: true,
  setActiveFarm: () => {},
  refetchFarms: async () => {},
});

export function FarmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFarms = async () => {
    if (!user) {
      setFarms([]);
      setFarm(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("farms")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching farms:", error);
      setLoading(false);
      return;
    }

    setFarms(data || []);
    
    // Set first farm as active if none selected
    if (data && data.length > 0 && !farm) {
      setFarm(data[0]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchFarms();
  }, [user]);

  const setActiveFarm = (farmId: string) => {
    const selectedFarm = farms.find((f) => f.id === farmId);
    if (selectedFarm) {
      setFarm(selectedFarm);
    }
  };

  return (
    <FarmContext.Provider
      value={{
        farm,
        farms,
        loading,
        setActiveFarm,
        refetchFarms: fetchFarms,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  return useContext(FarmContext);
}
