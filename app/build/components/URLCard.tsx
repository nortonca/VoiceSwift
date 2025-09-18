import { X, ExternalLink, Globe } from "lucide-react";
import { useState } from "react";

interface URLCardProps {
  url: string;
  onUpdate: (oldUrl: string, newUrl: string) => void;
  onRemove: (url: string) => void;
}

export function URLCard({ url, onUpdate, onRemove }: URLCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(url);

  const handleSave = () => {
    if (editValue.trim() && editValue !== url) {
      onUpdate(url, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(url);
      setIsEditing(false);
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url.split('/')[0] || url;
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="group relative rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-all duration-200">
      <div className="p-3">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm px-0 py-1 border-none outline-none text-white/90 placeholder:text-white/40"
            placeholder="Enter URL..."
            autoFocus
          />
        ) : (
          <div 
            className="cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-3 w-3 text-white/40 flex-shrink-0" />
              <span className="text-xs text-white/60 truncate">
                {getDomain(url)}
              </span>
              {isValidUrl(url) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(url, '_blank');
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="h-3 w-3 text-white/40 hover:text-white/60" />
                </button>
              )}
            </div>
            <div className="text-sm text-white/80 truncate pr-6">
              {url}
            </div>
          </div>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(url)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
