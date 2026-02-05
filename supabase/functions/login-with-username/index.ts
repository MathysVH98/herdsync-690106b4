import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginRequest {
  username: string;
  password: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { username, password }: LoginRequest = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limiting
    const { data: canProceed } = await supabaseAdmin.rpc("check_login_rate_limit", {
      username_to_check: username
    });

    if (!canProceed) {
      return new Response(
        JSON.stringify({ error: "Too many login attempts. Please try again in 15 minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash username for logging (don't store plaintext)
    const encoder = new TextEncoder();
    const usernameData = encoder.encode(username.toLowerCase());
    const hashBuffer = await crypto.subtle.digest("SHA-256", usernameData);
    const usernameHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // Look up the employee user by username
    const { data: employeeUser, error: lookupError } = await supabaseAdmin
      .from("employee_users")
      .select("user_id, username")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    if (lookupError) {
      console.error("Lookup error:", lookupError);
      // Log failed attempt
      await supabaseAdmin.rpc("log_login_attempt", {
        p_username_hash: usernameHash,
        p_ip_hash: null,
        p_success: false
      });
      return new Response(
        JSON.stringify({ error: "Login failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!employeeUser) {
      // Log failed attempt
      await supabaseAdmin.rpc("log_login_attempt", {
        p_username_hash: usernameHash,
        p_ip_hash: null,
        p_success: false
      });
      return new Response(
        JSON.stringify({ error: "Invalid username or password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The auth email is formatted as username@employee.herdsync.local
    const authEmail = `${employeeUser.username}@employee.herdsync.local`;

    // Now sign in with the auth email and password
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: authEmail,
      password: password,
    });

    if (authError) {
      // Log failed attempt
      await supabaseAdmin.rpc("log_login_attempt", {
        p_username_hash: usernameHash,
        p_ip_hash: null,
        p_success: false
      });
      return new Response(
        JSON.stringify({ error: "Invalid username or password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful login
    await supabaseAdmin.rpc("log_login_attempt", {
      p_username_hash: usernameHash,
      p_ip_hash: null,
      p_success: true
    });

    return new Response(
      JSON.stringify({
        session: authData.session,
        user: authData.user,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in login-with-username:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
