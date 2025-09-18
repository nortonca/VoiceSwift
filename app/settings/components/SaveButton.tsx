import { Save, Check } from "lucide-react";

interface SaveButtonProps {
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}

export function SaveButton({ saving, saved, onSave }: SaveButtonProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="space-y-1">
        <div className="text-sm font-medium text-white/80">Save Changes</div>
        <div className="text-xs text-white/60">Apply all your setting updates</div>
      </div>
      
      <div className="flex items-center gap-3">
        {saved && (
          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Check className="h-3 w-3" />
            Saved
          </div>
        )}
        <button 
          onClick={onSave} 
          disabled={saving}
          className="inline-flex items-center gap-1 text-sm px-4 py-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
