 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     
     const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
       auth: { autoRefreshToken: false, persistSession: false }
     });
 
     const authHeader = req.headers.get("Authorization");
     if (!authHeader) {
       return new Response(
         JSON.stringify({ error: "No authorization header" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Get the current user
     const { data: { user } } = await supabaseAdmin.auth.getUser(
       authHeader.replace("Bearer ", "")
     );
 
     if (!user || !user.email) {
       return new Response(
         JSON.stringify({ error: "Invalid token or no email" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Find pending invitations for this user's email
     const { data: invitations, error: invError } = await supabaseAdmin
       .from("farm_invitations")
       .select("*")
       .eq("email", user.email.toLowerCase())
       .eq("status", "pending")
       .gt("expires_at", new Date().toISOString());
 
     if (invError) {
       console.error("Error fetching invitations:", invError);
       return new Response(
         JSON.stringify({ error: "Failed to fetch invitations" }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     if (!invitations || invitations.length === 0) {
       return new Response(
         JSON.stringify({ message: "No pending invitations found", accepted: 0 }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     let acceptedCount = 0;
     const acceptedFarms: string[] = [];
 
     for (const invitation of invitations) {
       // Check if user is already a member of this farm
       const { data: existingMember } = await supabaseAdmin
         .from("farm_invited_users")
         .select("id")
         .eq("farm_id", invitation.farm_id)
         .eq("user_id", user.id)
         .maybeSingle();
 
       if (existingMember) {
         // Already a member, just update invitation status
         await supabaseAdmin
           .from("farm_invitations")
           .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_by: user.id })
           .eq("id", invitation.id);
         continue;
       }
 
       // Check user limits for the farm
       const { data: subscription } = await supabaseAdmin
         .from("subscriptions")
         .select("tier")
         .eq("farm_id", invitation.farm_id)
         .maybeSingle();
 
        const tier = subscription?.tier || "basic";
        const limit = tier === "basic" ? 5 : tier === "starter" ? 20 : 999999;
 
       const { count: currentCount } = await supabaseAdmin
         .from("farm_invited_users")
         .select("*", { count: "exact", head: true })
         .eq("farm_id", invitation.farm_id);
 
       if ((currentCount || 0) >= limit) {
         console.log(`Farm ${invitation.farm_id} has reached user limit`);
         continue;
       }
 
        // If role is 'manager', add to farm_members instead of farm_invited_users
        if (invitation.role === "manager") {
          // Check if already a farm member
          const { data: existingFarmMember } = await supabaseAdmin
            .from("farm_members")
            .select("id")
            .eq("farm_id", invitation.farm_id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (!existingFarmMember) {
            const { error: memberError } = await supabaseAdmin
              .from("farm_members")
              .insert({
                farm_id: invitation.farm_id,
                user_id: user.id,
                role: "manager",
              });

            if (memberError) {
              console.error("Error adding manager to farm:", memberError);
              continue;
            }
          }
        }

        // Add user to farm_invited_users (for farm access tracking)
        const { error: insertError } = await supabaseAdmin
          .from("farm_invited_users")
          .insert({
            farm_id: invitation.farm_id,
            user_id: user.id,
            invited_by: invitation.invited_by,
            invitation_id: invitation.id,
          });
 
       if (insertError) {
         console.error("Error adding user to farm:", insertError);
         continue;
       }
 
       // Update invitation status
       await supabaseAdmin
         .from("farm_invitations")
         .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_by: user.id })
         .eq("id", invitation.id);
 
       acceptedCount++;
       acceptedFarms.push(invitation.farm_id);
     }
 
     return new Response(
       JSON.stringify({
         message: `Accepted ${acceptedCount} invitation(s)`,
         accepted: acceptedCount,
         farms: acceptedFarms,
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
 
   } catch (error) {
     console.error("Error in accept-farm-invitation:", error);
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     return new Response(
       JSON.stringify({ error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });