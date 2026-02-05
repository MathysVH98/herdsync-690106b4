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

interface EmployeeInfo {
  farmId: string;
  employeeUserId: string;
}

interface FarmContextType {
  farm: Farm | null;
  farms: Farm[];
  loading: boolean;
  isEmployee: boolean;
  employeeInfo: EmployeeInfo | null;
  setActiveFarm: (farmId: string) => void;
  refetchFarms: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType>({
  farm: null,
  farms: [],
  loading: true,
  isEmployee: false,
  employeeInfo: null,
  setActiveFarm: () => {},
  refetchFarms: async () => {},
});

export function FarmProvider({ children }: { children: ReactNode }) {
   const { user, loading: authLoading } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmployee, setIsEmployee] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);

  const fetchFarms = async () => {
     // Wait for auth to complete first
     if (authLoading) {
       return;
     }
 
    if (!user) {
      setFarms([]);
      setFarm(null);
      setIsEmployee(false);
      setEmployeeInfo(null);
      setLoading(false);
      return;
    }

     setLoading(true);
 
    // First, check if the user is an employee (logged in via username/password)
    const { data: employeeData, error: employeeError } = await supabase
      .from("employee_users")
      .select("id, farm_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (employeeData && !employeeError) {
      // User is an employee - fetch only their assigned farm
      setIsEmployee(true);
      setEmployeeInfo({
        farmId: employeeData.farm_id,
        employeeUserId: employeeData.id,
      });

      const { data: farmData, error: farmError } = await supabase
        .from("farms")
        .select("*")
        .eq("id", employeeData.farm_id)
         .maybeSingle();

      if (farmData && !farmError) {
        setFarms([farmData]);
        setFarm(farmData);
      }

      setLoading(false);
      return;
    }

    // Not an employee - fetch farms normally (owner/member)
    setIsEmployee(false);
    setEmployeeInfo(null);

     // Fetch owned farms and invited farm IDs in parallel
     const [ownedFarmsRes, invitedFarmIdsRes] = await Promise.all([
       supabase
         .from("farms")
         .select("*")
         .eq("owner_id", user.id)
         .order("created_at", { ascending: true }),
       supabase
         .from("farm_invited_users")
         .select("farm_id")
         .eq("user_id", user.id),
     ]);
 
     const ownedFarms = ownedFarmsRes.data || [];
     const invitedFarmIds = invitedFarmIdsRes.data;
 
     // Fetch invited farms if any exist
     let invitedFarms: Farm[] = [];
     if (invitedFarmIds && invitedFarmIds.length > 0) {
       const farmIds = invitedFarmIds.map(f => f.farm_id);
       const { data: farms } = await supabase
         .from("farms")
         .select("*")
         .in("id", farmIds);
       invitedFarms = farms || [];
     }

    // Combine and deduplicate farms
     const allFarms = [...ownedFarms, ...invitedFarms];
    const uniqueFarms = allFarms.filter((farm, index, self) => 
      index === self.findIndex(f => f.id === farm.id)
    );

    setFarms(uniqueFarms);
    
    // Set first farm as active if none selected
    if (uniqueFarms.length > 0 && !farm) {
      setFarm(uniqueFarms[0]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
     if (!authLoading) {
       fetchFarms();
     }
   }, [user, authLoading]);

  const setActiveFarm = (farmId: string) => {
    // Employees can only access their assigned farm
    if (isEmployee && employeeInfo && farmId !== employeeInfo.farmId) {
      return;
    }

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
        isEmployee,
        employeeInfo,
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
