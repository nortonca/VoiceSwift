import { Save, Upload, Download } from "lucide-react";

interface ActionButtonsProps {
  status: "draft" | "published";
  dirty: boolean;
  saving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}

export function ActionButtons({ status, dirty, saving, lastSaved, onSave, onPublish, onUnpublish }: ActionButtonsProps) {
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="flex items-center gap-2">
      {status === "published" ? (
        <button onClick={onUnpublish} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15">
          <Download className="h-3 w-3" />
          Unpublish
        </button>
      ) : (
        <button onClick={onPublish} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-emerald-600/70 hover:bg-emerald-600/80">
          <Upload className="h-3 w-3" />
          Publish
        </button>
      )}
      <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-60">
        <Save className="h-3 w-3" />
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
