import { BookOpen, Search } from "lucide-react";
import { useState } from "react";
import { searchWithinUrls, searchExa, ExaSearchResult } from "@/knowledge/searchClient";

interface KnowledgeSectionProps {
  knowledgeUrl: string;
  onKnowledgeUrlChange: (url: string) => void;
}

export function KnowledgeSection({
  knowledgeUrl,
  onKnowledgeUrlChange
}: KnowledgeSectionProps) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ExaSearchResult[]>([]);
  const [mode, setMode] = useState<"source" | "web">("source");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      runSearch();
    }
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const r = mode === "source"
        ? await searchWithinUrls(query.trim(), knowledgeUrl.trim() ? [knowledgeUrl.trim()] : [])
        : await searchExa(query.trim());
      setResults(r);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white/90">Knowledge Base</h3>
        </div>
        <p className="text-sm text-white/60">
          Add URL sources to train your agent with specific information from your website, documentation, or other online resources.
        </p>
      </div>

      {/* URL Input (Single source) */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-white/80">Source URL</h4>
        <input
          type="text"
          value={knowledgeUrl}
          onChange={(e) => onKnowledgeUrlChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com/your-content"
          className="w-full bg-transparent text-sm px-3 py-2 rounded-lg border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {/* Search */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-white/80">Search</h4>
          <div className="inline-flex items-center text-[11px] gap-1 bg-white/5 border border-white/10 rounded-full p-1">
            <button
              className={`px-2 py-1 rounded-full ${mode === 'source' ? 'bg-white/15 text-white/80' : 'text-white/60'}`}
              onClick={() => setMode('source')}
            >
              Source URL
            </button>
            <button
              className={`px-2 py-1 rounded-full ${mode === 'web' ? 'bg-white/15 text-white/80' : 'text-white/60'}`}
              onClick={() => setMode('web')}
            >
              Web
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' ? runSearch() : undefined}
              placeholder="Ask a question about your sources..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <button
            onClick={runSearch}
            disabled={searching || !query.trim() || (mode === 'source' && !knowledgeUrl.trim())}
            className="text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 border border-white/20 disabled:opacity-50"
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs text-white/60">Found {results.length} results</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((r, i) => (
                <div key={`${r.id}-${i}`} className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-all duration-200">
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm text-white/90 font-medium line-clamp-2 mb-1">{r.title}</h4>
                        <div className="text-[11px] text-white/50 truncate">{new URL(r.url).hostname}</div>
                      </div>
                      {r.image && (
                        <img 
                          src={r.image} 
                          alt="" 
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                    </div>
                    
                    {r.text && (
                      <div className="text-xs text-white/60 line-clamp-3 mb-2">
                        {r.text.substring(0, 200)}...
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-white/40">
                        Score: {(r.score * 100).toFixed(0)}%
                      </div>
                      <button
                        onClick={() => window.open(r.url, '_blank')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-white/70 border border-white/20"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
