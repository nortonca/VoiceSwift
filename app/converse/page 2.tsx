"use client";

import { useEffect, useState } from "react";
import { ConversationList } from "./components/ConversationList";
import { ChatArea } from "./components/ChatArea";
import { MessageInput } from "./components/MessageInput";
import { NewConversationModal } from "./components/NewConversationModal";
import { FeedbackModal } from "./components/FeedbackModal";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type Msg = { id: string; from: "user" | "agent"; text: string; ts: number };
type Conv = { id: string; title: string; resolved: boolean; messages: Msg[] };

export default function ConversePage() {
  const apiAny = api as any;
  const convs = useQuery(apiAny.conversations?.list, {});
  const createConvMutation = useMutation(apiAny.conversations?.create);
  const updateConvMutation = useMutation(apiAny.conversations?.update);
  const [convos, setConvos] = useState<Conv[]>([
    {
      id: "1",
      title: "Order #1045 – Pickup time?",
      resolved: false,
      messages: [
        { id: "m1", from: "agent", text: "Hi! How can I help with your order today?", ts: Date.now() - 1200000 },
        { id: "m2", from: "user", text: "I placed order #1045 for pickup but haven't received a time confirmation yet", ts: Date.now() - 1100000 },
        { id: "m3", from: "agent", text: "Let me check that for you right away. Order #1045 is for 2 lattes and a croissant, correct?", ts: Date.now() - 1000000 },
        { id: "m4", from: "user", text: "Yes, that's right!", ts: Date.now() - 950000 },
        { id: "m5", from: "agent", text: "Perfect! Your order will be ready for pickup at 2:30 PM today. We'll send you a notification when it's ready.", ts: Date.now() - 900000 },
        { id: "m6", from: "user", text: "Great, thank you so much!", ts: Date.now() - 850000 },
      ],
    },
    {
      id: "2", 
      title: "Menu question – Vegan options",
      resolved: true,
      messages: [
        { id: "m7", from: "user", text: "Do you have any vegan pastry options?", ts: Date.now() - 2400000 },
        { id: "m8", from: "agent", text: "Yes! We have several vegan options including our almond croissant, blueberry muffin, and chocolate chip cookies.", ts: Date.now() - 2300000 },
        { id: "m9", from: "user", text: "Are they made in a separate area to avoid cross-contamination?", ts: Date.now() - 2200000 },
        { id: "m10", from: "agent", text: "Our vegan items are prepared in a dedicated vegan prep area to minimize cross-contamination. However, our kitchen does handle dairy and eggs, so we can't guarantee 100% separation.", ts: Date.now() - 2100000 },
        { id: "m11", from: "user", text: "That sounds good enough for me. I'll try the almond croissant!", ts: Date.now() - 2000000 },
        { id: "m12", from: "agent", text: "Excellent choice! Would you like me to place that order for you now?", ts: Date.now() - 1900000 },
        { id: "m13", from: "user", text: "Yes please, for pickup in about 20 minutes", ts: Date.now() - 1800000 },
        { id: "m14", from: "agent", text: "Order placed! Your vegan almond croissant will be ready for pickup at 1:45 PM. Total is $4.50.", ts: Date.now() - 1700000 },
      ],
    },
    {
      id: "3",
      title: "Catering for office meeting",
      resolved: false,
      messages: [
        { id: "m15", from: "user", text: "Hi, I need catering for a business meeting next Tuesday. About 15 people.", ts: Date.now() - 3600000 },
        { id: "m16", from: "agent", text: "I'd be happy to help with your catering needs! What time is your meeting, and do you have any preferences for food and drinks?", ts: Date.now() - 3500000 },
        { id: "m17", from: "user", text: "Meeting is 10 AM to 12 PM. We'd like a mix of coffee, some pastries, and maybe some light lunch options", ts: Date.now() - 3400000 },
        { id: "m18", from: "agent", text: "Perfect! For 15 people, I'd recommend our Business Breakfast package which includes assorted pastries, fresh fruit, and a coffee service setup. We also have sandwich platters for lunch. Would you like me to send you our full catering menu?", ts: Date.now() - 3300000 },
        { id: "m19", from: "user", text: "Yes, please email it to me. Also, do you deliver to downtown offices?", ts: Date.now() - 3200000 },
      ],
    },
    {
      id: "4", 
      title: "Loyalty program questions",
      resolved: true,
      messages: [
        { id: "m20", from: "agent", text: "Welcome to our cafe! I see this is your first visit. Would you like to hear about our loyalty program?", ts: Date.now() - 7200000 },
        { id: "m21", from: "user", text: "Sure, how does it work?", ts: Date.now() - 7100000 },
        { id: "m22", from: "agent", text: "For every $10 you spend, you earn 1 point. Collect 10 points and get a free drink of your choice! Plus you get a free birthday treat and early access to seasonal specials.", ts: Date.now() - 7000000 },
        { id: "m23", from: "user", text: "That sounds great! How do I sign up?", ts: Date.now() - 6900000 },
        { id: "m24", from: "agent", text: "I can set you up right now! I just need your name, email, and phone number. You'll also get 2 bonus points just for signing up today.", ts: Date.now() - 6800000 },
        { id: "m25", from: "user", text: "Perfect! My email is sarah.johnson@email.com and phone is 555-0123", ts: Date.now() - 6700000 },
        { id: "m26", from: "agent", text: "All set! You're now part of our loyalty program. I've sent a confirmation to your email with your account details. Your first purchase today will earn you points!", ts: Date.now() - 6600000 },
      ],
    },
    {
      id: "5",
      title: "WiFi password and seating",
      resolved: true,
      messages: [
        { id: "m27", from: "user", text: "Hi, what's the WiFi password? And are there any quiet areas good for working?", ts: Date.now() - 5400000 },
        { id: "m28", from: "agent", text: "The WiFi network is 'CafeConnect' and the password is 'coffee2024'. For quiet work areas, I'd recommend the back corner by the window or our upstairs loft area.", ts: Date.now() - 5300000 },
        { id: "m29", from: "user", text: "Great! Are there power outlets in those areas?", ts: Date.now() - 5200000 },
        { id: "m30", from: "agent", text: "Yes, both areas have plenty of outlets. The window corner has table-level outlets, and the loft has outlets along the wall. Both areas tend to be quieter, especially in the afternoons.", ts: Date.now() - 5100000 },
        { id: "m31", from: "user", text: "Perfect, thank you!", ts: Date.now() - 5000000 },
      ],
    },
  ]);
  const [selected, setSelected] = useState<string>("");
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [draft, setDraft] = useState("");

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
  const [showFeedback, setShowFeedback] = useState(false);

  const createConv = async () => {
    const title = newTitle.trim() || "New conversation";
    const created = await createConvMutation({ title });
    if ((created as any)?._id) setSelected((created as any)._id);
    setNewTitle("");
    setNewOpen(false);
  };

  const send = () => {
    if (!draft.trim() || !active) return;
    const msg: Msg = { id: `${Date.now()}`, from: "user", text: draft.trim(), ts: Date.now() };
    setConvos((cs) => cs.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, msg] } : c)));
    setDraft("");
  };

  const resolve = async () => {
    if (!active) return;
    await updateConvMutation({ id: active.id as any, resolved: !active.resolved });
  };

  const clearConversation = () => {
    if (!active) return;
    setConvos((cs) => cs.map((c) => (c.id === active.id ? { ...c, messages: [] } : c)));
  };

  return (
    <div className="flex-1 grid grid-cols-12 gap-4 px-4 py-6">
      <ConversationList
        conversations={convos}
        selectedId={selected}
        onSelect={setSelected}
        onNew={() => setNewOpen(true)}
      />

      {selected ? (
      <ChatArea
        activeConversation={active}
        onResolve={resolve}
        draft={draft}
        onDraftChange={setDraft}
        onSend={send}
        onStopVoice={() => {
          setShowFeedback(true);
          clearConversation();
        }}
      />) : (
        <section className="col-span-12 md:col-span-8 lg:col-span-9 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
          <div className="text-center space-y-2 p-6">
            <div className="text-white/60 text-sm">No conversation selected</div>
            <div className="text-white/40 text-xs">Create a new conversation to get started</div>
          </div>
        </section>
      )}

      <NewConversationModal
        isOpen={newOpen}
        title={newTitle}
        onTitleChange={setNewTitle}
        onClose={() => setNewOpen(false)}
        onCreate={createConv}
      />

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
}


