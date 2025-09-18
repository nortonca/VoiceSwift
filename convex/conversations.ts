import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const convs = await ctx.db.query("conversations").withIndex("by_createdAt").order("desc").collect();
    // Optionally enrich with last message preview
    const results = await Promise.all(
      convs.map(async (c) => {
        const last = await ctx.db
          .query("messages")
          .withIndex("by_conversation_ts", (q) => q.eq("conversationId", c._id))
          .order("desc")
          .take(1);
        const lastMsg = last[0] || null;
        return {
          _id: c._id,
          title: c.title,
          resolved: c.resolved,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          preview: lastMsg ? { from: lastMsg.from, text: lastMsg.text, ts: lastMsg.ts } : null,
        };
      })
    );
    return results;
  },
});

export const get = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("conversations", {
      title: args.title.trim() || "New conversation",
      resolved: false,
      createdAt: now,
      updatedAt: now,
    });
    return ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("conversations"),
    title: v.optional(v.string()),
    resolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Conversation not found");
    await ctx.db.patch(id, { ...rest, updatedAt: Date.now() });
    return ctx.db.get(id);
  },
});


