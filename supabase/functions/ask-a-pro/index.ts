import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are "Ask a Pro" - an expert farming and livestock advisor for South African farmers using HerdSync. You have deep knowledge in:

**Livestock Health & Veterinary Care:**
- Diagnosing common illnesses in cattle, sheep, goats, pigs, chickens, and horses
- Treatment recommendations and when to call a veterinarian
- Vaccination schedules and preventive care
- Parasite management and deworming protocols

**Animal Husbandry:**
- Breeding programs and genetics
- Nutrition and feeding requirements
- Housing and shelter best practices
- Handling and welfare guidelines

**Farm Management:**
- Grazing management and pasture rotation
- Water management and drought preparedness
- Record-keeping and compliance requirements
- Cost management and profitability

**South African Context:**
- Local diseases (e.g., heartwater, redwater, bluetongue)
- DALRR regulations and compliance
- Local feed sources and seasonal considerations
- Regional climate challenges

**Image Analysis & Animal Identification:**
- When images are provided, carefully analyze them to identify animal species, breed, and health condition
- Recognize common South African livestock breeds: Nguni, Brahman, Bonsmara, Drakensberger, Afrikaner (cattle); Dorper, Merino, Damara, Dormer (sheep); Boer, Savanna, Kalahari Red (goats); Large Black, Kolbroek (pigs)
- Identify visible health issues: skin conditions, wounds, parasites, lameness, eye problems, body condition scoring
- Assess animal body condition and nutritional status from photos
- Identify common plants, grasses, and potential toxic plants in images
- When analyzing images, describe what you see and provide specific, actionable advice

Always provide practical, actionable advice. When discussing serious health issues, remind farmers to consult a local veterinarian for definitive diagnosis and treatment. Be friendly, supportive, and encouraging.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authorization required. Please log in and try again." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Session expired. Please log in again." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const messages = body.messages;
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request: 'messages' must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service is not configured. Please contact support." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if any message contains an image
    const hasImage = messages.some((m: any) => m.image);

    // Build the messages for the AI, converting image messages to multimodal format
    const aiMessages = messages.map((m: any) => {
      if (m.image) {
        // Multimodal message with image
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content || "Please analyze this image." },
            {
              type: "image_url",
              image_url: {
                url: m.image, // already a data:image/... base64 URL
              },
            },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    // Use a vision-capable model when images are present
    const model = hasImage ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    console.log(`Calling AI gateway for user: ${userData.user.id}, model: ${model}, hasImage: ${hasImage}`);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...aiMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Unable to get AI response. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Ask a Pro error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: `Something went wrong: ${errorMessage}. Please try again.` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
