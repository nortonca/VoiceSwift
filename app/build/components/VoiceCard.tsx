import { Check, Play } from "lucide-react";

interface VoiceCardProps {
  id: string;
  name: string;
  description: string;
  isSelected: boolean;
  isPremium?: boolean;
  onSelect: (id: string) => void;
  onPreview?: (id: string) => void;
}

export function VoiceCard({ 
  id, 
  name, 
  description, 
  isSelected, 
  isPremium = false, 
  onSelect,
  onPreview 
}: VoiceCardProps) {
  return (
    <div
      onClick={() => onSelect(id)}
      className={`group relative cursor-pointer rounded-xl border transition-all duration-200 ${
        isSelected
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-white/10 bg-white/5 hover:bg-white/8"
      }`}
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className={`truncate text-sm font-medium ${
              isSelected ? "text-emerald-300" : "text-white/90"
            }`}>
              {name}
            </h3>
            {isPremium && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">
                Premium
              </span>
            )}
            {isSelected && <Check className="w-3 h-3 text-emerald-300" />}
          </div>

          {/* Preview button (hover only) */}
          {onPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview(id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white/70"
              aria-label="Preview voice"
            >
              <Play className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Description */}
        <p className={`text-xs leading-relaxed text-white/60 ${isSelected ? "text-white/70" : ""}`}>
          {description}
        </p>
      </div>
    </div>
  );
}
