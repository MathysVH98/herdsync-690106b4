import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_ADMINS = [
  { email: "admin-basic@herdsync.test", password: "TestAdmin123!", tier: "basic", animalLimit: 80 },
  { email: "admin-starter@herdsync.test", password: "TestAdmin123!", tier: "starter", animalLimit: 250 },
  { email: "admin-pro@herdsync.test", password: "TestAdmin123!", tier: "pro", animalLimit: 999999 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results = [];

    for (const admin of TEST_ADMINS) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === admin.email);
      
      let userId: string;
      
      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create the user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true,
        });

        if (createError) {
          results.push({ email: admin.email, status: "error", error: createError.message });
          continue;
        }

        userId = newUser.user.id;
      }

      // Check if role already assigned
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();

      if (!existingRole) {
        await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "admin",
            assigned_tier: admin.tier,
          });
      }

      // Check if farm exists for this user
      const { data: existingFarm } = await supabaseAdmin
        .from("farms")
        .select("*")
        .eq("owner_id", userId)
        .single();

      let farmId: string;

      if (!existingFarm) {
        // Create a test farm for the admin
        const { data: newFarm, error: farmError } = await supabaseAdmin
          .from("farms")
          .insert({
            name: `Test Farm (${admin.tier.charAt(0).toUpperCase() + admin.tier.slice(1)})`,
            owner_id: userId,
            province: "Test Province",
            address: "Test Address",
          })
          .select()
          .single();

        if (farmError) {
          results.push({ email: admin.email, status: "farm error", error: farmError.message });
          continue;
        }
        farmId = newFarm.id;
      } else {
        farmId = existingFarm.id;
      }

      // Check if subscription exists
      const { data: existingSub } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("farm_id", farmId)
        .single();

      // Set subscription period: 1 year from now
      const periodStart = new Date();
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);

      if (!existingSub) {
        // Create active subscription
        const { error: subError } = await supabaseAdmin
          .from("subscriptions")
          .insert({
            user_id: userId,
            farm_id: farmId,
            tier: admin.tier,
            status: "active",
            animal_limit: admin.animalLimit,
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
            trial_ends_at: new Date().toISOString(), // Trial already ended
          });

        if (subError) {
          results.push({ email: admin.email, status: "subscription error", error: subError.message });
          continue;
        }
      } else {
        // Update existing subscription to active with correct tier
        await supabaseAdmin
          .from("subscriptions")
          .update({
            tier: admin.tier,
            status: "active",
            animal_limit: admin.animalLimit,
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq("id", existingSub.id);
      }

      results.push({ email: admin.email, status: "ready", tier: admin.tier, farmId });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test admin accounts with active subscriptions ready",
        results,
        credentials: TEST_ADMINS.map(a => ({ email: a.email, password: a.password, tier: a.tier })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating test admins:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
