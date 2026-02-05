 import { createContext, useContext, useEffect, useState, ReactNode } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "./useAuth";
 
 interface AdminContextType {
   isAdmin: boolean;
   loading: boolean;
 }
 
 const AdminContext = createContext<AdminContextType>({
   isAdmin: false,
   loading: true,
 });
 
 export function AdminProvider({ children }: { children: ReactNode }) {
   const { user } = useAuth();
   const [isAdmin, setIsAdmin] = useState(false);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const checkAdminStatus = async () => {
       if (!user) {
         setIsAdmin(false);
         setLoading(false);
         return;
       }
 
       try {
         const { data } = await supabase.rpc("has_role", {
           _user_id: user.id,
           _role: "admin",
         });
         setIsAdmin(!!data);
       } catch (error) {
         console.error("Error checking admin status:", error);
         setIsAdmin(false);
       }
       setLoading(false);
     };
 
     checkAdminStatus();
   }, [user]);
 
   return (
     <AdminContext.Provider value={{ isAdmin, loading }}>
       {children}
     </AdminContext.Provider>
   );
 }
 
 export function useAdmin() {
   return useContext(AdminContext);
 }