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
     const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
     
     // Get the authorization header to verify the caller
     const authHeader = req.headers.get("Authorization");
     if (!authHeader) {
       return new Response(
         JSON.stringify({ error: "No authorization header" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Create client with user's token to verify they're an admin
     const userClient = createClient(supabaseUrl, anonKey, {
       global: { headers: { Authorization: authHeader } },
       auth: { autoRefreshToken: false, persistSession: false },
     });
 
     const { data: { user }, error: userError } = await userClient.auth.getUser();
     if (userError || !user) {
       return new Response(
         JSON.stringify({ error: "Unauthorized" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Check if user is admin
     const { data: isAdmin } = await userClient.rpc("has_role", {
       _user_id: user.id,
       _role: "admin",
     });
 
     if (!isAdmin) {
       return new Response(
         JSON.stringify({ error: "Admin access required" }),
         { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Use service role to fetch all users
     const adminClient = createClient(supabaseUrl, serviceRoleKey, {
       auth: { autoRefreshToken: false, persistSession: false },
     });
 
     // Get all users from auth
     const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
     if (authError) throw authError;
 
     // Get all subscriptions with farm info
     const { data: subscriptions, error: subError } = await adminClient
       .from("subscriptions")
       .select(`
         *,
         farms!inner(name, owner_id)
       `)
       .order("created_at", { ascending: false });
 
     if (subError) throw subError;
 
     // Get all farms
     const { data: farms, error: farmError } = await adminClient
       .from("farms")
       .select("*")
       .order("created_at", { ascending: false });
 
     if (farmError) throw farmError;
 
     // Build user map with their farms and subscriptions
     const usersWithDetails = authUsers.users.map(authUser => {
       const userFarms = farms?.filter(f => f.owner_id === authUser.id) || [];
       const userSubscriptions = subscriptions?.filter(s => s.user_id === authUser.id) || [];
       
       return {
         id: authUser.id,
         email: authUser.email,
         created_at: authUser.created_at,
         last_sign_in_at: authUser.last_sign_in_at,
         email_confirmed_at: authUser.email_confirmed_at,
         farms: userFarms.map(f => ({
           id: f.id,
           name: f.name,
           province: f.province,
           created_at: f.created_at,
         })),
         subscriptions: userSubscriptions.map(s => ({
           id: s.id,
           farm_id: s.farm_id,
           farm_name: (s.farms as { name: string })?.name || "Unknown",
           tier: s.tier,
           status: s.status,
           trial_ends_at: s.trial_ends_at,
           current_period_end: s.current_period_end,
           animal_limit: s.animal_limit,
         })),
       };
     });
 
     return new Response(
       JSON.stringify({ users: usersWithDetails, total: usersWithDetails.length }),
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