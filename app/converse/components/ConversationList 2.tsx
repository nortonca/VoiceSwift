import { CheckCircle, Clock, Plus, User, Bot } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  resolved: boolean;
  messages: Array<{
    id: string;
    from: "user" | "agent";
    text: string;
    ts: number;
  }>;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ConversationList({ conversations, selectedId, onSelect, onNew }: ConversationListProps) {
  return (
    <aside className="col-span-12 md:col-span-4 lg:col-span-3 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="p-3 flex items-center justify-between border-b border-white/10">
        <span className="text-xs text-white/60">Conversations</span>
        <button onClick={onNew} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/10 hover:bg-white/15">
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>
      <div className="max-h-[60vh] overflow-auto divide-y divide-white/5">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left px-3 py-2 hover:bg-white/5 ${selectedId === c.id ? "bg-white/5" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/90 line-clamp-1">{c.title}</span>
              {c.resolved ? (
                <CheckCircle className="ml-2 h-4 w-4 text-emerald-400" />
              ) : (
                <Clock className="ml-2 h-4 w-4 text-amber-400" />
              )}
            </div>
            <div className="text-[11px] text-white/40 mt-1 line-clamp-2 flex items-start gap-1">
              {c.messages.length > 0 ? (
                <>
                  {c.messages[c.messages.length - 1].from === "user" ? (
                    <User className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Bot className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="line-clamp-2">{c.messages[c.messages.length - 1].text}</span>
                </>
              ) : (
                "No messages yet"
              )}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
