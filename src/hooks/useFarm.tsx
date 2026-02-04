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
  const { user } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmployee, setIsEmployee] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);

  const fetchFarms = async () => {
    if (!user) {
      setFarms([]);
      setFarm(null);
      setIsEmployee(false);
      setEmployeeInfo(null);
      setLoading(false);
      return;
    }

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
        .single();

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
