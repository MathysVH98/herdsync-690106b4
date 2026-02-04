import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";

export interface EmployeePermissions {
  can_view_livestock: boolean;
  can_view_feeding: boolean;
  can_add_feeding: boolean;
  can_view_health: boolean;
  can_add_health: boolean;
  can_view_inventory: boolean;
  can_add_inventory_usage: boolean;
  can_view_chemicals: boolean;
  can_add_chemical_usage: boolean;
  can_view_documents: boolean;
  can_upload_documents: boolean;
  can_view_tracking: boolean;
}

interface EmployeePermissionsContextType {
  permissions: EmployeePermissions | null;
  isEmployee: boolean;
  isFarmOwner: boolean;
  loading: boolean;
  canView: (page: string) => boolean;
  canAdd: (page: string) => boolean;
}

const defaultPermissions: EmployeePermissions = {
  can_view_livestock: false,
  can_view_feeding: false,
  can_add_feeding: false,
  can_view_health: false,
  can_add_health: false,
  can_view_inventory: false,
  can_add_inventory_usage: false,
  can_view_chemicals: false,
  can_add_chemical_usage: false,
  can_view_documents: false,
  can_upload_documents: false,
  can_view_tracking: false,
};

const EmployeePermissionsContext = createContext<EmployeePermissionsContextType>({
  permissions: null,
  isEmployee: false,
  isFarmOwner: true,
  loading: true,
  canView: () => true,
  canAdd: () => true,
});

export function EmployeePermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { farm } = useFarm();
  const [permissions, setPermissions] = useState<EmployeePermissions | null>(null);
  const [isEmployee, setIsEmployee] = useState(false);
  const [isFarmOwner, setIsFarmOwner] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user || !farm?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Check if user is farm owner
      if (farm.owner_id === user.id) {
        setIsFarmOwner(true);
        setIsEmployee(false);
        setPermissions(null);
        setLoading(false);
        return;
      }

      // Check if user is an employee
      const { data: employeeUser, error } = await supabase
        .from("employee_users")
        .select(`
          id,
          employee_permissions (*)
        `)
        .eq("user_id", user.id)
        .eq("farm_id", farm.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching employee permissions:", error);
        setLoading(false);
        return;
      }

      if (employeeUser) {
        setIsEmployee(true);
        setIsFarmOwner(false);
        const perms = employeeUser.employee_permissions?.[0] || defaultPermissions;
        setPermissions({
          can_view_livestock: perms.can_view_livestock,
          can_view_feeding: perms.can_view_feeding,
          can_add_feeding: perms.can_add_feeding,
          can_view_health: perms.can_view_health,
          can_add_health: perms.can_add_health,
          can_view_inventory: perms.can_view_inventory,
          can_add_inventory_usage: perms.can_add_inventory_usage,
          can_view_chemicals: perms.can_view_chemicals,
          can_add_chemical_usage: perms.can_add_chemical_usage,
          can_view_documents: perms.can_view_documents,
          can_upload_documents: perms.can_upload_documents,
          can_view_tracking: perms.can_view_tracking,
        });
      } else {
        // User is neither owner nor employee - might be a farm member
        setIsFarmOwner(false);
        setIsEmployee(false);
        setPermissions(null);
      }

      setLoading(false);
    };

    checkPermissions();
  }, [user, farm?.id, farm?.owner_id]);

  const canView = (page: string): boolean => {
    if (isFarmOwner) return true;
    if (!isEmployee || !permissions) return false;

    const pageMap: Record<string, keyof EmployeePermissions> = {
      livestock: "can_view_livestock",
      feeding: "can_view_feeding",
      health: "can_view_health",
      inventory: "can_view_inventory",
      chemicals: "can_view_chemicals",
      documents: "can_view_documents",
      tracking: "can_view_tracking",
    };

    const permKey = pageMap[page.toLowerCase()];
    return permKey ? permissions[permKey] : false;
  };

  const canAdd = (page: string): boolean => {
    if (isFarmOwner) return true;
    if (!isEmployee || !permissions) return false;

    const addMap: Record<string, keyof EmployeePermissions> = {
      feeding: "can_add_feeding",
      health: "can_add_health",
      inventory: "can_add_inventory_usage",
      chemicals: "can_add_chemical_usage",
      documents: "can_upload_documents",
    };

    const permKey = addMap[page.toLowerCase()];
    return permKey ? permissions[permKey] : false;
  };

  return (
    <EmployeePermissionsContext.Provider
      value={{ permissions, isEmployee, isFarmOwner, loading, canView, canAdd }}
    >
      {children}
    </EmployeePermissionsContext.Provider>
  );
}

export function useEmployeePermissions() {
  return useContext(EmployeePermissionsContext);
}
