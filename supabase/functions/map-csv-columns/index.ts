import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CSVMappingRequest {
  headers: string[];
  sampleRows: string[][];
}

interface ColumnMapping {
  csvColumn: string;
  livestockField: string | null;
  confidence: number;
}

const LIVESTOCK_FIELDS = [
  { field: "name", description: "Animal name or identifier name" },
  { field: "tag", description: "Tag number, ear tag, ID number, animal ID" },
  { field: "type", description: "Animal type/species: Cattle, Sheep, Goat, Pig, Chicken, Duck, Horse, Cow" },
  { field: "breed", description: "Breed of the animal" },
  { field: "age", description: "Age of the animal (e.g., 2 years, 18 months)" },
  { field: "weight", description: "Weight of the animal (e.g., 500 kg, 1200 lbs)" },
  { field: "status", description: "Health status: Healthy, Under Observation, Sick, Pregnant" },
  { field: "sex", description: "Sex/gender: male, female, bull, cow, heifer, steer, ram, ewe" },
  { field: "date_of_birth", description: "Date of birth, DOB, birth date" },
  { field: "purchase_cost", description: "Purchase cost, price paid, acquisition cost" },
  { field: "feed_type", description: "Feed type, diet, food type" },
  { field: "notes", description: "Notes, comments, remarks, description" },
  { field: "microchip_number", description: "Microchip number, chip ID, RFID" },
  { field: "brand_mark", description: "Brand mark, branding, brand" },
  { field: "color_markings", description: "Color, markings, appearance, coat color" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { headers, sampleRows } = await req.json() as CSVMappingRequest;

    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      return new Response(
        JSON.stringify({ error: "No headers provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the prompt for the AI
    const fieldsDescription = LIVESTOCK_FIELDS.map(f => `- ${f.field}: ${f.description}`).join("\n");
    
    const sampleDataDescription = sampleRows.length > 0
      ? `\n\nSample data from the CSV:\n${headers.join(" | ")}\n${sampleRows.slice(0, 3).map(row => row.join(" | ")).join("\n")}`
      : "";

    const prompt = `You are a data mapping expert. Given the following CSV column headers from a livestock/animal data file, map each column to the most appropriate livestock database field.

Available database fields:
${fieldsDescription}

CSV headers to map: ${headers.join(", ")}
${sampleDataDescription}

For each CSV header, determine:
1. The best matching livestock field (or null if no good match)
2. A confidence score from 0 to 1

Respond ONLY with a valid JSON array in this exact format, no other text:
[{"csvColumn": "header1", "livestockField": "field_name_or_null", "confidence": 0.95}, ...]

Important rules:
- "tag" field should match columns like: tag, id, animal_id, ear_tag, tag_number, identification
- "type" field should match: type, species, animal_type, kind, category
- "name" field should match: name, animal_name, nickname
- If a column clearly doesn't match any field, set livestockField to null
- Be generous with matching - prefer a reasonable match over null`;

    // Call Lovable AI
    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      
      // Fallback to heuristic mapping if AI fails
      const mappings = heuristicMapping(headers);
      return new Response(
        JSON.stringify({ mappings, method: "heuristic" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from the response
    let mappings: ColumnMapping[];
    try {
      // Try to parse the content directly
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        mappings = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback to heuristic
      mappings = heuristicMapping(headers);
      return new Response(
        JSON.stringify({ mappings, method: "heuristic" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ mappings, method: "ai" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in map-csv-columns:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function heuristicMapping(headers: string[]): ColumnMapping[] {
  const fieldPatterns: Record<string, RegExp[]> = {
    name: [/^name$/i, /animal.?name/i, /^nickname$/i],
    tag: [/^tag$/i, /tag.?num/i, /ear.?tag/i, /^id$/i, /animal.?id/i, /identification/i],
    type: [/^type$/i, /species/i, /animal.?type/i, /^kind$/i, /category/i],
    breed: [/^breed$/i, /^variety$/i],
    age: [/^age$/i, /^years?$/i, /^months?$/i],
    weight: [/^weight$/i, /^mass$/i, /^kg$/i, /^lbs?$/i],
    status: [/^status$/i, /health.?status/i, /condition/i],
    sex: [/^sex$/i, /^gender$/i, /^male|female$/i],
    date_of_birth: [/dob/i, /birth.?date/i, /date.?of.?birth/i, /born/i],
    purchase_cost: [/cost/i, /price/i, /purchase/i, /paid/i, /value/i],
    feed_type: [/feed/i, /diet/i, /food/i],
    notes: [/notes?/i, /comment/i, /remark/i, /description/i],
    microchip_number: [/microchip/i, /chip/i, /rfid/i],
    brand_mark: [/brand/i, /mark/i],
    color_markings: [/color/i, /colour/i, /marking/i, /coat/i, /appearance/i],
  };

  return headers.map(header => {
    const normalized = header.toLowerCase().trim();
    
    for (const [field, patterns] of Object.entries(fieldPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(normalized)) {
          return { csvColumn: header, livestockField: field, confidence: 0.8 };
        }
      }
    }
    
    // Fuzzy match - check if the header contains any field name
    for (const field of Object.keys(fieldPatterns)) {
      if (normalized.includes(field) || field.includes(normalized)) {
        return { csvColumn: header, livestockField: field, confidence: 0.6 };
      }
    }
    
    return { csvColumn: header, livestockField: null, confidence: 0 };
  });
}
