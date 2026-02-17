import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CommodityPrice {
  commodity_name: string;
  price: number;
  unit: string;
}

interface PriceResponse {
  prices: CommodityPrice[];
  source: string;
  date: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get list of commodities from database
    const { data: commodities, error: comError } = await supabase
      .from("commodities")
      .select("id, name, unit");

    if (comError) {
      throw new Error(`Failed to fetch commodities: ${comError.message}`);
    }

    // Build a map of index to commodity for reliable matching
    const commodityMap = commodities.map((c, i) => ({ index: i, id: c.id, name: c.name, unit: c.unit }));
    const commodityList = commodityMap.map((c) => `[${c.index}] ${c.name} (${c.unit})`).join("\n");

    const today = new Date().toISOString().split("T")[0];

    // Use AI to get current SA market prices
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a South African agricultural market analyst. Provide realistic current market prices for commodities in South Africa. Use your knowledge of typical SA market prices and current trends. Prices should be in South African Rand (ZAR). Be realistic and consistent with known market ranges:

- Beef A2/A3 carcass: R60-75/kg
- Beef B2/B3 carcass: R55-65/kg
- Beef C2/C3 carcass: R50-62/kg
- Weaner Calf (Bulls): R35-50/kg
- Lamb/Mutton A2/A3 carcass: R95-115/kg
- Mutton B2/B3 carcass: R75-90/kg
- Mutton C2/C3 carcass: R70-90/kg
- Feeder Lamb: R45-60/kg
- Pork Porkers: R35-45/kg
- Pork Baconers: R35-45/kg
- Chicken frozen: R45-65/kg
- White/Yellow Maize: R3,500-5,500/ton
- Wheat: R5,000-8,000/ton
- Soybeans: R7,000-10,000/ton
- Sunflower seeds: R7,000-11,000/ton
- Sorghum: R3,500-5,500/ton
- Fresh milk: R14-20/litre
- Eggs (large): R40-60/dozen
- Butter: R120-180/kg
- Cheddar cheese: R100-160/kg
- Potatoes: R60-120/10kg
- Onions: R50-100/10kg
- Tomatoes: R15-40/kg
- Cabbage: R15-35/head
- Merino wool: R80-150/kg
- Cattle hides: R400-800/hide
- Sheep skins: R80-200/skin

Return prices that reflect current South African market conditions.`,
            },
            {
              role: "user",
              content: `Provide current South African market prices for ALL of these commodities as of ${today}:

${commodityList}

IMPORTANT: You MUST return a price for EVERY commodity listed above, using the index number [0], [1], etc. as the identifier.

Return ONLY a JSON object with this exact format, no other text:
{
  "prices": [
    {"index": 0, "commodity_name": "Beef (A2/A3 Carcass)", "price": 65.50},
    {"index": 1, "commodity_name": "...", "price": ...},
    ...one entry for EVERY commodity above...
  ],
  "source": "SA Agricultural Market Estimates",
  "date": "${today}"
}`,
            },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted, please add funds" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from AI response (handle markdown code blocks)
    let priceData: PriceResponse;
    try {
      // Remove markdown code blocks if present
      let jsonStr = content.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      priceData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse price data from AI");
    }

    // Match AI prices to commodity IDs using index
    const priceInserts = [];
    for (const price of priceData.prices) {
      // Primary: match by index
      const byIndex = commodityMap.find((c) => c.index === price.index);
      if (byIndex) {
        priceInserts.push({
          commodity_id: byIndex.id,
          price: price.price,
          price_date: today,
          source: priceData.source,
        });
        continue;
      }
      // Fallback: match by name
      const byName = commodities.find((c) => {
        const aiName = (price.commodity_name || "").toLowerCase().replace(/[^a-z0-9]/g, '');
        const dbName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return aiName === dbName || aiName.includes(dbName) || dbName.includes(aiName);
      });
      if (byName) {
        priceInserts.push({
          commodity_id: byName.id,
          price: price.price,
          price_date: today,
          source: priceData.source,
        });
      }
    }

    if (priceInserts.length === 0) {
      throw new Error("No valid prices matched to commodities");
    }

    // Upsert prices (update if exists for today, insert if not)
    const { error: insertError } = await supabase
      .from("commodity_prices")
      .upsert(priceInserts, { 
        onConflict: "commodity_id,price_date",
        ignoreDuplicates: false 
      });

    if (insertError) {
      // If upsert fails due to constraint, try individual inserts/updates
      console.log("Upsert failed, trying individual updates:", insertError.message);
      
      for (const priceInsert of priceInserts) {
        // Check if price exists for today
        const { data: existing } = await supabase
          .from("commodity_prices")
          .select("id")
          .eq("commodity_id", priceInsert.commodity_id)
          .eq("price_date", today)
          .maybeSingle();

        if (existing) {
          // Update existing
          await supabase
            .from("commodity_prices")
            .update({ price: priceInsert.price, source: priceInsert.source })
            .eq("id", existing.id);
        } else {
          // Insert new
          await supabase.from("commodity_prices").insert(priceInsert);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${priceInserts.length} commodity prices`,
        prices: priceInserts,
        source: priceData.source,
        date: today,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching market prices:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
