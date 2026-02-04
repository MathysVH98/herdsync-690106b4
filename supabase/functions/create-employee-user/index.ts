import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateEmployeeUserRequest {
  employee_id: string;
  username: string;
  password: string;
  farm_id: string;
  permissions: {
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
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Admin client for user creation
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get the requesting user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller is the farm owner
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (!caller) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CreateEmployeeUserRequest = await req.json();
    const { employee_id, username, password, farm_id, permissions } = body;

    // Validate input
    if (!employee_id || !username || !password || !farm_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
      return new Response(
        JSON.stringify({ error: "Username must be 3-30 characters, alphanumeric with dots, underscores or hyphens" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller owns the farm
    const { data: farm } = await supabaseAdmin
      .from("farms")
      .select("id, owner_id")
      .eq("id", farm_id)
      .single();

    if (!farm || farm.owner_id !== caller.id) {
      return new Response(
        JSON.stringify({ error: "You don't have permission to create users for this farm" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if username is already taken
    const { data: existingUser } = await supabaseAdmin
      .from("employee_users")
      .select("id")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Username is already taken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if employee already has a user account
    const { data: existingEmployeeUser } = await supabaseAdmin
      .from("employee_users")
      .select("id")
      .eq("employee_id", employee_id)
      .maybeSingle();

    if (existingEmployeeUser) {
      return new Response(
        JSON.stringify({ error: "This employee already has a user account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get employee details
    const { data: employee } = await supabaseAdmin
      .from("employees")
      .select("first_name, last_name, email")
      .eq("id", employee_id)
      .single();

    if (!employee) {
      return new Response(
        JSON.stringify({ error: "Employee not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a fake email for auth (using username@farm.herdsync.local)
    const authEmail = `${username.toLowerCase()}@employee.herdsync.local`;

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password: password,
      email_confirm: true, // Auto-confirm since it's not a real email
      user_metadata: {
        username: username.toLowerCase(),
        is_employee: true,
        employee_id: employee_id,
        farm_id: farm_id,
        full_name: `${employee.first_name} ${employee.last_name}`,
      },
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      return new Response(
        JSON.stringify({ error: "Failed to create user account: " + authError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create employee_users record
    const { data: employeeUser, error: euError } = await supabaseAdmin
      .from("employee_users")
      .insert({
        employee_id: employee_id,
        user_id: authData.user.id,
        username: username.toLowerCase(),
        farm_id: farm_id,
      })
      .select()
      .single();

    if (euError) {
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error("Employee user creation error:", euError);
      return new Response(
        JSON.stringify({ error: "Failed to link employee account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create permissions record
    const { error: permError } = await supabaseAdmin
      .from("employee_permissions")
      .insert({
        employee_user_id: employeeUser.id,
        farm_id: farm_id,
        ...permissions,
      });

    if (permError) {
      // Rollback
      await supabaseAdmin.from("employee_users").delete().eq("id", employeeUser.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error("Permissions creation error:", permError);
      return new Response(
        JSON.stringify({ error: "Failed to set permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        username: username.toLowerCase(),
        message: `User account created. Username: ${username.toLowerCase()}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in create-employee-user:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
