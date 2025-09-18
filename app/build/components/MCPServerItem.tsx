import { X, ExternalLink } from "lucide-react";

interface MCPServerItemProps {
  id: string;
  name: string;
  category: string;
  url?: string;
  isEnabled: boolean;
  onToggle: (id: string) => void;
  onRemove?: (id: string) => void;
}

export function MCPServerItem({ 
  id, 
  name, 
  category, 
  url, 
  isEnabled, 
  onToggle, 
  onRemove 
}: MCPServerItemProps) {
  return (
    <div className="group relative rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-all duration-200">
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <div className={`mt-1 w-2 h-2 rounded-full ${isEnabled ? "bg-emerald-400" : "bg-white/20"}`} />
            <div className="min-w-0">
              <div className="text-sm text-white/90 truncate">{name}</div>
              <div className="text-[11px] text-white/50">{category}</div>
              {url && (
                <button
                  onClick={() => window.open(url, '_blank')}
                  className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white/70 border border-white/20"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle(id)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isEnabled ? "bg-emerald-500" : "bg-white/10"
              }`}
              aria-label={isEnabled ? "Disable" : "Enable"}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                isEnabled ? "translate-x-4" : "translate-x-0.5"
              }`} />
            </button>
            {onRemove && (
              <button
                onClick={() => onRemove(id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-colors"
                aria-label="Remove"
              >
                <X className="h-3 w-3 text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
