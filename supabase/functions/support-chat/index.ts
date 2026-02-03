import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are HerdSync's friendly and knowledgeable support assistant. You help farmers and farm managers use the HerdSync farm management platform effectively.

HerdSync is a comprehensive farm management platform that includes:
- **Livestock Management**: Track animals, their health records, feeding schedules, and movements
- **Employees**: Manage farm workers, their details, and assignments
- **Feeding Schedule**: Set up and monitor feeding times for different animal types
- **Farm Inventory**: Track feed, supplies, and other consumables with reorder alerts
- **Health Records**: Log vaccinations, treatments, and veterinary visits
- **Farm Expenses**: Record and categorize all farm-related expenses
- **Market Area**: View commodity prices and market trends
- **Animal Sales**: Create and manage animal sale agreements with legal documentation
- **Audit & Compliance**: Stay compliant with South African regulations including:
  - Document Vault for storing compliance documents
  - Labour & OHS records
  - Chemicals & Remedies tracking
- **Reports**: Generate various farm reports
- **Tracking**: GPS tracking for animals and equipment

Key features to highlight:
- Multi-farm support (users can manage multiple farms)
- Subscription tiers: Basic, Starter, and Pro plans
- South African compliance focus (SARS, Department of Labour, OHS)

When helping users:
1. Be concise but thorough
2. Use simple language appropriate for farmers
3. Provide step-by-step instructions when explaining features
4. If you don't know something specific about the app, suggest they contact support at 91Stephan@gmail.com or call +27 78 318 6923
5. Always be encouraging and patient

Keep responses brief and focused on solving the user's problem.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
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
