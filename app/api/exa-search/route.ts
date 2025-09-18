import { NextRequest } from "next/server";
import Exa from "exa-js";

export async function POST(req: NextRequest) {
  try {
    const { query, includeDomains, numResults, type, livecrawl } = await req.json();
    if (typeof query !== "string" || !query.trim()) {
      return new Response(JSON.stringify({ error: "Missing query" }), { status: 400 });
    }

    const exaKey = process.env.EXA_API_KEY;
    if (!exaKey) {
      return new Response(JSON.stringify({ error: "Missing EXA_API_KEY" }), { status: 500 });
    }

    // Only allow includeDomains provided by client; if empty, return early.
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

    const exa = new Exa(exaKey);
    
    const opts: any = {
      type: type || "fast",
      livecrawl: livecrawl || "never",
      numResults: typeof numResults === "number" ? numResults : 5,
      text: true,
    };
    if (domains.length > 0) opts.includeDomains = domains;

    const result = await exa.searchAndContents(query, opts);

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), { status: 500 });
  }
}


