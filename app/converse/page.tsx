"use client";

import { useEffect, useState } from "react";
import { ConversationList } from "./components/ConversationList";
import { ChatArea } from "./components/ChatArea";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type Msg = { id: string; from: "user" | "agent"; text: string; ts: number };
type Conv = { id: string; title: string; resolved: boolean; messages: Msg[] };

export default function ConversePage() {
  const apiAny = api as any;
  const convs = useQuery(apiAny.conversations?.list, {});
  const updateConvMutation = useMutation(apiAny.conversations?.update);
  const [convos, setConvos] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<string>("");

  // hydrate from Convex list when available
  useEffect(() => {
    if (!convs) return;
    const mapped: Conv[] = (convs as any[]).map((c) => ({
      id: c._id,
      title: c.title,
      resolved: c.resolved,
      messages: c.preview ? [{ id: "prev", from: c.preview.from, text: c.preview.text, ts: c.preview.ts }] : [],
    }));
    setConvos(mapped);
    if (!selected && mapped.length > 0) setSelected(mapped[0].id);
  }, [convs]);
  const active = convos.find((c) => c.id === selected);


  const resolve = async () => {
    if (!active) return;
    await updateConvMutation({ id: active.id as any, resolved: !active.resolved });
  };

  return (
    <div className="flex-1 grid grid-cols-12 gap-4 px-4 py-6">
      <ConversationList
        conversations={convos}
        selectedId={selected}
        onSelect={setSelected}
      />

      {selected ? (
      <ChatArea
        activeConversation={active}
        onResolve={resolve}
      />) : (
        <section className="col-span-12 md:col-span-8 lg:col-span-9 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
          <div className="text-center space-y-2 p-6">
            <div className="text-white/60 text-sm">No conversation selected</div>
            <div className="text-white/40 text-xs">Select a conversation from the list to view its history</div>
          </div>
        </section>
      )}
    </div>
  );
}


