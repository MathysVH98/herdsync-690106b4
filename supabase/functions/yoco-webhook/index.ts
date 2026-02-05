import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-yoco-signature",
};

// Constant-time comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Verify Yoco webhook signature
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const computedSignature = new TextDecoder().decode(hexEncode(new Uint8Array(signatureBuffer)));
    return secureCompare(computedSignature, signature.toLowerCase());
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const yocoSecretKey = Deno.env.get("YOCO_SECRET_KEY");
    if (!yocoSecretKey) {
      throw new Error("YOCO_SECRET_KEY not configured");
    }

    // Get webhook signature for verification
    const signature = req.headers.get("x-yoco-signature");
    if (!signature) {
      console.error("Missing webhook signature");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // Verify the signature
    const isValid = await verifySignature(rawBody, signature, yocoSecretKey);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    console.log("Yoco webhook received:", JSON.stringify(payload));

    // Handle different webhook event types
    const { type, payload: eventPayload } = payload;

    if (type === "payment.succeeded") {
      const { metadata, id: paymentId } = eventPayload;
      
      if (!metadata || !metadata.farmId || !metadata.userId || !metadata.tier) {
        console.error("Missing metadata in webhook payload");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { farmId, userId, tier, animalLimit } = metadata;

      // Update subscription in database
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error: updateError } = await supabase
        .from("subscriptions")
        .upsert({
          farm_id: farmId,
          user_id: userId,
          tier: tier,
          status: "active",
          payment_provider: "yoco",
          payment_reference: paymentId,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          animal_limit: parseInt(animalLimit) || 80,
        }, { onConflict: "farm_id" });

      if (updateError) {
        console.error("Subscription update error:", updateError);
        throw new Error("Failed to update subscription");
      }

      console.log(`Subscription activated for farm ${farmId}: ${tier}`);
    }

    // Acknowledge receipt of webhook
    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Yoco webhook error:", error);
    // Still return 200 to acknowledge receipt (prevent retries for processing errors)
    return new Response(
      JSON.stringify({
        received: true,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
