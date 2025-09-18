import { Message } from "./Message";
import { useEffect, useRef, useState } from "react";
import { CheckCircle, RotateCcw } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface ChatAreaProps {
  activeConversation: {
    id: string;
    title: string;
    resolved: boolean;
    messages: Array<{
      id: string;
      from: "user" | "agent";
      text: string;
      ts: number;
    }>;
  } | undefined;
  onResolve: () => void;
}

export function ChatArea({ activeConversation, onResolve }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const convoId = activeConversation?.id as any | undefined;
  const [cursor, setCursor] = useState<any | undefined>(undefined);
  const [accMessages, setAccMessages] = useState<Array<{ id: string; from: "user"|"agent"; text: string; ts: number }>>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const page = useQuery(
    api.messages.listByConversation,
    convoId ? { conversationId: convoId, limit: 30, cursor } : "skip"
  );
  // Reset when conversation changes
  useEffect(() => {
    setCursor(undefined);
    setAccMessages([]);
    setHasMore(false);
  }, [convoId]);
  // Accumulate pages (prepend older batches)
  useEffect(() => {
    if (!page || !("page" in page)) return;
    const list = (page as any).page || [];
    const batch = [...list].reverse().map((m: any) => ({ id: String(m._id), from: m.from, text: m.text, ts: m.ts }));
    if (cursor === undefined) {
      setAccMessages(batch);
    } else {
      setAccMessages((prev) => [...batch, ...prev]);
    }
    setHasMore(!(page as any).isDone);
  }, [page]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [accMessages.length, activeConversation?.id]);

  if (!activeConversation) {
    return (
      <section className="col-span-12 md:col-span-8 lg:col-span-9 rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-white/60 text-sm">Select a conversation to start chatting</div>
          <div className="text-white/40 text-xs">Choose from the conversations on the left or create a new one</div>
        </div>
      </section>
    );
  }

  return (
    <section className="col-span-12 md:col-span-8 lg:col-span-9 rounded-2xl border border-white/10 bg-white/5 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white/90">{activeConversation.title}</span>
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            activeConversation.resolved 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          }`}>
            {activeConversation.resolved ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Resolved
              </>
            ) : (
              <>
                <RotateCcw className="h-3 w-3" />
                Active
              </>
            )}
          </span>
        </div>
        <button 
          onClick={onResolve} 
          className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-colors ${
            activeConversation.resolved 
              ? "bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/30" 
              : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/30"
          }`}
        >
          {activeConversation.resolved ? (
            <>
              <RotateCcw className="h-3 w-3" />
              Reopen
            </>
          ) : (
            <>
              <CheckCircle className="h-3 w-3" />
              Resolve
            </>
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={() => setCursor((page as any)?.continueCursor)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/70 border border-white/20"
            >
              Load older messages
            </button>
          </div>
        )}
        {accMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="text-white/60 text-sm">No messages yet</div>
              <div className="text-white/40 text-xs">This conversation has no message history</div>
            </div>
          </div>
        ) : (
          accMessages.map((message) => (
            <Message key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </section>
  );
}
