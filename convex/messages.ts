import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByConversation = query({
  args: {
    conversationId: v.id("conversations"),
    cursor: v.optional(v.any()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const { page, isDone, continueCursor } = await ctx.db
      .query("messages")
      .withIndex("by_conversation_ts", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .paginate({ cursor: args.cursor, numItems: limit });
    return { page, isDone, continueCursor };
  },
});

export const add = mutation({
  args: {
    conversationId: v.id("conversations"),
    from: v.union(v.literal("user"), v.literal("agent")),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      from: args.from,
      text: args.text,
      ts: now,
    });
    // touch conversation updatedAt
    await ctx.db.patch(args.conversationId, { updatedAt: now });
    return ctx.db.get(id);
  },
});


