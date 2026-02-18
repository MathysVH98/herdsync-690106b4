import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const YOCO_API_URL = "https://payments.yoco.com/api";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const yocoSecretKey = Deno.env.get("YOCO_SECRET_KEY");
    if (!yocoSecretKey) {
      throw new Error("YOCO_SECRET_KEY not configured");
    }

    const { tier, farmId, userId, successUrl, cancelUrl } = await req.json();

    if (!tier || !farmId || !userId) {
      throw new Error("Missing required fields: tier, farmId, userId");
    }

    // Get origin from request or use provided URLs
    const origin = req.headers.get("origin") || "https://lovable.dev";
    const finalSuccessUrl = successUrl || `${origin}/pricing?payment=success&provider=yoco`;
    const finalCancelUrl = cancelUrl || `${origin}/pricing?payment=cancelled`;

    // Define pricing for each tier (in cents for Yoco)
    const pricing: Record<string, { amountInCents: number; description: string; animalLimit: number }> = {
      basic: { amountInCents: 9900, description: "FarmTrack Basic - Up to 80 animals", animalLimit: 80 },
      starter: { amountInCents: 24900, description: "FarmTrack Starter - Up to 250 animals", animalLimit: 250 },
      pro: { amountInCents: 59900, description: "FarmTrack Pro - Unlimited animals", animalLimit: 999999 },
    };

    const plan = pricing[tier];
    if (!plan) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    // Create Yoco checkout session
    const checkoutResponse = await fetch(`${YOCO_API_URL}/checkouts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${yocoSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: plan.amountInCents,
        currency: "ZAR",
        successUrl: finalSuccessUrl,
        cancelUrl: finalCancelUrl,
        failureUrl: finalCancelUrl,
        metadata: {
          farmId,
          userId,
          tier,
          animalLimit: plan.animalLimit.toString(),
        },
        lineItems: [
          {
            displayName: plan.description,
            quantity: 1,
            pricingDetails: {
              price: plan.amountInCents,
            },
          },
        ],
      }),
    });

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.text();
      throw new Error(`Yoco checkout creation failed [${checkoutResponse.status}]: ${error}`);
    }

    const checkout = await checkoutResponse.json();

    console.log(`Yoco checkout created: ${checkout.id} for farm ${farmId}, tier ${tier}`);

    return new Response(
      JSON.stringify({
        success: true,
        checkoutId: checkout.id,
        redirectUrl: checkout.redirectUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Yoco checkout error:", error);
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
