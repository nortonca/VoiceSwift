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

  const resp = await fetch("/api/exa-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      includeDomains,
      numResults: 5,
      type: "fast",
      livecrawl: "never",
    }),
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  // Exa returns results in data.results array
  return Array.isArray(data?.results) ? data.results : [];
}

export async function searchExa(query: string, includeDomains?: string[]): Promise<ExaSearchResult[]> {
  const body: any = { query, numResults: 5, type: "fast", livecrawl: "never" };
  if (includeDomains && includeDomains.length) body.includeDomains = includeDomains;
  const resp = await fetch("/api/exa-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return Array.isArray(data?.results) ? data.results : [];
}


