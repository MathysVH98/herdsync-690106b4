import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "syncherd@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event, userEmail, farmName, tier, paymentProvider, amount } = await req.json();

    console.log(`Admin notification: ${event} from ${userEmail} (${farmName})`);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured - skipping email notification");
      return new Response(
        JSON.stringify({ success: false, reason: "RESEND_API_KEY not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subject = "";
    let htmlBody = "";

    if (event === "payment_received") {
      subject = `💰 Payment Received - ${userEmail}`;
      htmlBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #16a34a;">Payment Received!</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; font-weight: bold;">User:</td><td style="padding: 8px;">${userEmail}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Farm:</td><td style="padding: 8px;">${farmName || "Unknown"}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Plan:</td><td style="padding: 8px;">${tier?.toUpperCase()}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Provider:</td><td style="padding: 8px;">${paymentProvider || "Unknown"}</td></tr>
            ${amount ? `<tr><td style="padding: 8px; font-weight: bold;">Amount:</td><td style="padding: 8px;">R${amount}</td></tr>` : ""}
          </table>
          <p style="color: #666;">This user has upgraded from trial to a paid subscription.</p>
        </div>
      `;
    } else if (event === "subscription_activated") {
      subject = `🎉 New Subscription - ${userEmail}`;
      htmlBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #2563eb;">Subscription Activated!</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; font-weight: bold;">User:</td><td style="padding: 8px;">${userEmail}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Farm:</td><td style="padding: 8px;">${farmName || "Unknown"}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Plan:</td><td style="padding: 8px;">${tier?.toUpperCase()}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Provider:</td><td style="padding: 8px;">${paymentProvider || "Unknown"}</td></tr>
          </table>
          <p style="color: #666;">This user is no longer on trial - they are now a paying customer!</p>
        </div>
      `;
    } else {
      subject = `HerdSync Admin Alert: ${event}`;
      htmlBody = `<p>Event: ${event}<br/>User: ${userEmail}<br/>Farm: ${farmName}<br/>Tier: ${tier}</p>`;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "HerdSync <notifications@herdsync.co.za>",
        to: [ADMIN_EMAIL],
        subject,
        html: htmlBody,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Failed to send email:", emailResult);
      return new Response(
        JSON.stringify({ success: false, error: emailResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin notification email sent:", emailResult.id);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Notify admin error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
