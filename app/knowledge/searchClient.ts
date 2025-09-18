export interface ExaSearchResult {
  id: string;
  title: string;
  url: string;
  publishedDate?: string | null;
  author?: string | null;
  score: number;
  text?: string;
  highlights?: string[];
  summary?: string;
  image?: string;
}

export async function searchWithinUrls(query: string, urls: string[]): Promise<ExaSearchResult[]> {
  const includeDomains = Array.from(
    new Set(
      urls
        .map((u) => {
          try {
            return new URL(u).hostname;
          } catch {
            return u.split("/")[0] || "";
          }
        })
        .filter(Boolean)
    )
  );

  console.log("🔍 searchWithinUrls:", { query, urls, includeDomains });

  const resp = await fetch("/api/exa-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      includeDomains,
      numResults: 5,
      type: "neural", // Use neural for better semantic search
      livecrawl: "never",
    }),
  });
  
  if (!resp.ok) {
    console.error("❌ Search API error:", resp.status, resp.statusText);
    const errorData = await resp.json().catch(() => ({ error: "Unknown error" }));
    console.error("❌ Error details:", errorData);
    return [];
  }
  
  const data = await resp.json();
  console.log("✅ Search response:", { resultsCount: data?.results?.length || 0 });
  // Exa returns results in data.results array
  return Array.isArray(data?.results) ? data.results : [];
}

export async function searchExa(query: string, includeDomains?: string[]): Promise<ExaSearchResult[]> {
  const body: any = { query, numResults: 5, type: "neural", livecrawl: "never" }; // Use neural search
  if (includeDomains && includeDomains.length) body.includeDomains = includeDomains;
  
  console.log("🔍 searchExa:", { query, includeDomains });
  
  const resp = await fetch("/api/exa-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  if (!resp.ok) {
    console.error("❌ searchExa API error:", resp.status, resp.statusText);
    const errorData = await resp.json().catch(() => ({ error: "Unknown error" }));
    console.error("❌ Error details:", errorData);
    return [];
  }
  
  const data = await resp.json();
  console.log("✅ searchExa response:", { resultsCount: data?.results?.length || 0 });
  return Array.isArray(data?.results) ? data.results : [];
}


