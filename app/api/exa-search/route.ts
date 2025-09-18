import { NextRequest } from "next/server";
import Exa from "exa-js";

export async function POST(req: NextRequest) {
  try {
    const { query, includeDomains, numResults, type, livecrawl } = await req.json();
    
    console.log("🔍 Exa Search Request:", { query, includeDomains, numResults, type, livecrawl });
    
    if (typeof query !== "string" || !query.trim()) {
      console.error("❌ Missing or invalid query");
      return new Response(JSON.stringify({ error: "Missing query" }), { status: 400 });
    }

    const exaKey = process.env.EXA_API_KEY;
    if (!exaKey) {
      console.error("❌ Missing EXA_API_KEY");
      return new Response(JSON.stringify({ error: "Missing EXA_API_KEY" }), { status: 500 });
    }

    // Process domains if provided
    const rawDomains: string[] = Array.isArray(includeDomains)
      ? includeDomains.filter((d) => typeof d === "string" && d.trim().length > 0)
      : [];
    const domains = Array.from(
      new Set(
        rawDomains.map((d) => {
          try {
            const u = new URL(d);
            return u.hostname;
          } catch {
            return d.replace(/^https?:\/\//, "");
          }
        })
      )
    );

    console.log("🌐 Processed domains:", domains);

    const exa = new Exa(exaKey);
    
    // Fix: Use correct text option format
    const opts: any = {
      type: type || "neural", // Use 'neural' as default (better for semantic search)
      livecrawl: livecrawl || "never",
      numResults: typeof numResults === "number" ? Math.min(numResults, 10) : 5,
      text: { maxCharacters: 3000 }, // ✅ CORRECT FORMAT
    };
    
    // Only add includeDomains if we have valid domains
    if (domains.length > 0) {
      opts.includeDomains = domains;
    }

    console.log("⚙️ Search options:", opts);

    const result = await exa.searchAndContents(query, opts);
    
    console.log("✅ Exa API Response:", {
      resultsCount: result?.results?.length || 0,
      hasResults: Boolean(result?.results?.length),
    });

    return new Response(JSON.stringify(result), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error("❌ Exa Search Error:", e);
    return new Response(
      JSON.stringify({ 
        error: e?.message || "Unexpected error",
        details: e?.stack || "No stack trace available"
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


