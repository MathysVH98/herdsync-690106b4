 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 Deno.serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     
     const supabase = createClient(supabaseUrl, serviceRoleKey, {
       auth: { autoRefreshToken: false, persistSession: false },
     });
 
     // Get admin email from request or use default
     const { email } = await req.json().catch(() => ({ email: "syncherd@gmail.com" }));
 
     // Find user by email
     const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
     
     if (userError) {
       throw userError;
     }
 
     const adminUser = userData.users.find(u => u.email === email);
     
     if (!adminUser) {
       return new Response(
         JSON.stringify({ error: `User with email ${email} not found. They need to sign up first.` }),
         { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Check if already admin
     const { data: existingRole } = await supabase
       .from("user_roles")
       .select("*")
       .eq("user_id", adminUser.id)
       .eq("role", "admin")
       .maybeSingle();
 
     if (existingRole) {
       return new Response(
         JSON.stringify({ message: "User is already an admin", user_id: adminUser.id }),
         { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Add admin role with pro tier
     const { error: roleError } = await supabase
       .from("user_roles")
       .insert({
         user_id: adminUser.id,
         role: "admin",
         assigned_tier: "pro",
       });
 
     if (roleError) {
       throw roleError;
     }
 
     return new Response(
       JSON.stringify({ message: "Admin role assigned successfully", user_id: adminUser.id }),
       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     console.error("Error:", errorMessage);
     return new Response(
       JSON.stringify({ error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });