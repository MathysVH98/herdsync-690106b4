import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_ADMINS = [
  { email: "admin-basic@herdsync.test", password: "TestAdmin123!", tier: "basic" },
  { email: "admin-starter@herdsync.test", password: "TestAdmin123!", tier: "starter" },
  { email: "admin-pro@herdsync.test", password: "TestAdmin123!", tier: "pro" },
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
        results.push({ email: admin.email, status: "already exists", tier: admin.tier });
      } else {
        // Create the user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true, // Auto-confirm for testing
        });

        if (createError) {
          results.push({ email: admin.email, status: "error", error: createError.message });
          continue;
        }

        userId = newUser.user.id;
        results.push({ email: admin.email, status: "created", tier: admin.tier });
      }

      // Check if role already assigned
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();

      if (!existingRole) {
        // Assign admin role with tier
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "admin",
            assigned_tier: admin.tier,
          });

        if (roleError) {
          console.error(`Error assigning role for ${admin.email}:`, roleError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test admin accounts processed",
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
