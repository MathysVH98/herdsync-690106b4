import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are HerdSync's support assistant. You ONLY answer questions about the HerdSync website and application.

**CRITICAL RULES:**
1. You MUST ONLY answer questions directly related to HerdSync and its features
2. If a user asks about ANYTHING unrelated to HerdSync (weather, general knowledge, jokes, coding help, personal advice, news, sports, recipes, math, history, science, etc.), politely decline and redirect them
3. For off-topic questions, respond with: "I'm sorry, but I can only help with questions about the HerdSync platform. Is there anything about HerdSync I can assist you with?"
4. Never provide information outside of HerdSync's scope, even if the user insists

**What you CAN help with (HerdSync topics only):**
- **Livestock Management**: Track animals, health records, feeding schedules, movements
- **Employees**: Manage farm workers and their details
- **Feeding Schedule**: Setting up and monitoring feeding times
- **Farm Inventory**: Tracking feed, supplies, and consumables with reorder alerts
- **Health Records**: Vaccinations, treatments, veterinary visits
- **Farm Expenses**: Recording and categorizing farm expenses
- **Market Area**: Commodity prices and market trends
- **Animal Sales**: Creating sale agreements and legal documentation
- **Audit & Compliance**: South African regulations (SARS, Labour, OHS)
  - Document Vault
  - Labour & OHS records
  - Chemicals & Remedies tracking
- **Reports**: Generating farm reports
- **Tracking**: GPS tracking for animals and equipment
- **Account & Subscription**: Basic, Starter, and Pro plans
- **Multi-farm management**
- **Navigation and using the website**

**When helping with HerdSync:**
1. Be concise but thorough
2. Use simple language appropriate for farmers
3. Provide step-by-step instructions when explaining features
4. If you don't know something specific, suggest contacting support at 91Stephan@gmail.com or call +27 78 318 6923
5. Be encouraging and patient

Remember: You are STRICTLY a HerdSync support bot. Decline ALL off-topic requests politely.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized - Please sign in to use support chat" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized - Please sign in to use support chat" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const messages = body.messages;
    
    // Validate messages is an array
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request: 'messages' must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Our support assistant is busy right now. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Support chat is temporarily unavailable. Please contact us directly at 91Stephan@gmail.com" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to connect to support assistant" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Support chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
