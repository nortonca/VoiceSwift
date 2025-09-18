import { X } from "lucide-react";

interface NewConversationModalProps {
  isOpen: boolean;
  title: string;
  onTitleChange: (title: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

export function NewConversationModal({ isOpen, title, onTitleChange, onClose, onCreate }: NewConversationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur grid place-items-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#121212] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-white/80">New conversation</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full bg-transparent text-sm placeholder:text-white/40 focus:outline-none px-3 py-2 rounded-lg border border-white/10"
          placeholder="Subject or customer"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10">Cancel</button>
          <button onClick={onCreate} className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15">Create</button>
        </div>
      </div>
    </div>
  );
}
