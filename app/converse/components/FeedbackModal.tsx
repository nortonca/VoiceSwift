"use client";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/90 mb-2">Thanks! How was the voice session?</div>
        <div className="text-xs text-white/60 mb-4">Your feedback helps improve accuracy and UX.</div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 text-white/70 border border-white/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


