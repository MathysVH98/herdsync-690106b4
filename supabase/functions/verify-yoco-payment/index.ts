import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const yocoSecretKey = Deno.env.get("YOCO_SECRET_KEY");
    if (!yocoSecretKey) {
      throw new Error("YOCO_SECRET_KEY not configured");
    }

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { checkoutId } = await req.json();
    if (!checkoutId) {
      throw new Error("Missing checkoutId");
    }

    console.log(`Verifying Yoco checkout ${checkoutId} for user ${userId}`);

    // Check the checkout status with Yoco API
    const yocoResponse = await fetch(
      `https://payments.yoco.com/api/checkouts/${checkoutId}`,
      {
        headers: {
          Authorization: `Bearer ${yocoSecretKey}`,
        },
      }
    );

    if (!yocoResponse.ok) {
      const errorText = await yocoResponse.text();
      console.error(`Yoco API error: ${errorText}`);
      throw new Error("Failed to verify payment with Yoco");
    }

    const checkout = await yocoResponse.json();
    console.log(`Yoco checkout status: ${checkout.status}`, JSON.stringify(checkout.metadata));

    if (checkout.status !== "completed") {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Payment not completed. Status: ${checkout.status}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract metadata
    const { farmId, tier, animalLimit } = checkout.metadata || {};
    if (!farmId || !tier) {
      throw new Error("Missing payment metadata");
    }

    // Verify the user owns this farm
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: farm } = await adminClient
      .from("farms")
      .select("id, owner_id")
      .eq("id", farmId)
      .single();

    if (!farm || farm.owner_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Farm ownership mismatch" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if subscription is already updated (idempotency)
    const { data: existingSub } = await adminClient
      .from("subscriptions")
      .select("*")
      .eq("farm_id", farmId)
      .maybeSingle();

    if (
      existingSub &&
      existingSub.status === "active" &&
      existingSub.tier === tier &&
      existingSub.payment_reference === checkoutId
    ) {
      console.log("Subscription already updated for this payment");
      return new Response(
        JSON.stringify({ success: true, alreadyUpdated: true, tier }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Define animal limits
    const animalLimits: Record<string, number> = {
      basic: 80,
      starter: 250,
      pro: 999999,
    };

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { error: updateError } = await adminClient
      .from("subscriptions")
      .upsert(
        {
          farm_id: farmId,
          user_id: userId,
          tier: tier,
          status: "active",
          payment_provider: "yoco",
          payment_reference: checkoutId,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          animal_limit: parseInt(animalLimit) || animalLimits[tier] || 80,
        },
        { onConflict: "farm_id" }
      );

    if (updateError) {
      console.error("Subscription update error:", updateError);
      throw new Error("Failed to update subscription");
    }

    console.log(`Subscription activated for farm ${farmId}: ${tier}`);

    return new Response(
      JSON.stringify({ success: true, tier }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Verify payment error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
