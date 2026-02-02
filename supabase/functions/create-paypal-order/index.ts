import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PAYPAL_API_URL = Deno.env.get("PAYPAL_MODE") === "live" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tier, farmId, userId, returnUrl, cancelUrl } = await req.json();

    if (!tier || !farmId || !userId) {
      throw new Error("Missing required fields: tier, farmId, userId");
    }

    // Get origin from request or use provided URLs
    const origin = req.headers.get("origin") || "https://lovable.dev";
    const finalReturnUrl = returnUrl || `${origin}/pricing?payment=success&provider=paypal`;
    const finalCancelUrl = cancelUrl || `${origin}/pricing?payment=cancelled`;

    // Define pricing for each tier
    // Note: PayPal doesn't support ZAR directly, so we use USD equivalent
    // Approximate exchange rate: 1 USD = 18 ZAR (prices shown in USD)
    const pricing: Record<string, { amountUSD: string; amountZAR: string; description: string; animalLimit: number }> = {
      basic: { amountUSD: "5.50", amountZAR: "99.00", description: "FarmTrack Basic - Up to 80 animals (R99/mo)", animalLimit: 80 },
      starter: { amountUSD: "13.85", amountZAR: "249.00", description: "FarmTrack Starter - Up to 250 animals (R249/mo)", animalLimit: 250 },
      pro: { amountUSD: "33.30", amountZAR: "599.00", description: "FarmTrack Pro - Unlimited animals (R599/mo)", animalLimit: -1 },
    };

    const plan = pricing[tier];
    if (!plan) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `${farmId}_${tier}`,
            description: plan.description,
            custom_id: JSON.stringify({ farmId, userId, tier }),
            amount: {
              currency_code: "USD",
              value: plan.amountUSD,
            },
          },
        ],
        application_context: {
          brand_name: "FarmTrack",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: finalReturnUrl,
          cancel_url: finalCancelUrl,
        },
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.text();
      throw new Error(`PayPal order creation failed: ${error}`);
    }

    const order = await orderResponse.json();
    
    // Find the approval URL
    const approvalUrl = order.links.find((link: { rel: string }) => link.rel === "approve")?.href;

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        approvalUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("PayPal order error:", error);
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
