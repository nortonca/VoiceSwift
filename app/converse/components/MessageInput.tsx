import { Send, Paperclip } from "lucide-react";
import { useRef, useEffect } from "react";

interface MessageInputProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
}

export function MessageInput({ draft, onDraftChange, onSend }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [draft]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (draft.trim()) {
        onSend();
      }
    }
  };

  const canSend = draft.trim().length > 0;

  return (
    <div className="p-4 border-t border-white/10 bg-white/2">
      <div className="flex items-end gap-3">
        {/* Attachment button */}
        <button className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 transition-colors group">
          <Paperclip className="h-4 w-4 text-white/40 group-hover:text-white/60" />
        </button>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            className="w-full resize-none rounded-2xl px-4 py-3 pr-12 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/20 transition-all max-h-32 overflow-y-auto"
            rows={1}
            style={{ minHeight: '44px' }}
          />
          
          {/* Character count (optional) */}
          {draft.length > 0 && (
            <div className="absolute bottom-1 right-12 text-xs text-white/30">
              {draft.length}
            </div>
          )}
        </div>

        {/* Send button */}
        <button 
          onClick={onSend} 
          disabled={!canSend}
          className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${
            canSend 
              ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30" 
              : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
          }`}
        >
          <Send className={`h-4 w-4 transition-transform ${canSend ? 'scale-100' : 'scale-90'}`} />
        </button>
      </div>
      
      {/* Helper text */}
      <div className="mt-2 flex justify-between items-center text-xs text-white/30">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <div className="flex items-center gap-4">
          <span>Powered by VoiceSwift AI</span>
        </div>
      </div>
    </div>
  );
}
