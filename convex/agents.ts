import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const baseAgentArgs = {
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  company: v.optional(v.string()),
  startMessage: v.optional(v.string()),
  systemInstructions: v.optional(v.string()),
  model: v.optional(v.string()),
  temperature: v.optional(v.number()),
  voice: v.optional(v.string()),
  tools: v.optional(
    v.array(
      v.object({
        type: v.literal("mcp"),
        server_label: v.string(),
        server_url: v.string(),
        headers: v.optional(v.record(v.string(), v.string())),
        allowed_tools: v.optional(v.array(v.string())),
      })
    )
  ),
  metadata: v.optional(v.record(v.string(), v.any())),
  knowledgeUrl: v.optional(v.string()),
  isActive: v.boolean(),
};

export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return ctx.db.query("agents").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect();
    }
    return ctx.db.query("agents").collect();
  },
});

export const getById = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const [doc] = await ctx.db
      .query("agents")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .take(1);
    return doc ?? null;
  },
});

export const create = mutation({
  args: baseAgentArgs,
  handler: async (ctx, args) => {
    const normalizedSlug = args.slug.trim().toLowerCase();
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_slug", (q) => q.eq("slug", normalizedSlug))
      .first();
    if (existing) throw new Error("Agent slug must be unique");

    const now = Date.now();
    const id = await ctx.db.insert("agents", {
      ...args,
      slug: normalizedSlug,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("agents"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    company: v.optional(v.string()),
    startMessage: v.optional(v.string()),
    systemInstructions: v.optional(v.string()),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    voice: v.optional(v.string()),
    tools: v.optional(
      v.array(
        v.object({
          type: v.literal("mcp"),
          server_label: v.string(),
          server_url: v.string(),
          headers: v.optional(v.record(v.string(), v.string())),
          allowed_tools: v.optional(v.array(v.string())),
        })
      )
    ),
    metadata: v.optional(v.record(v.string(), v.any())),
    knowledgeUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Agent not found");

    let nextSlug: string | undefined = undefined;
    if (rest.slug !== undefined) {
      nextSlug = rest.slug.trim().toLowerCase();
      if (nextSlug !== existing.slug) {
        const conflict = await ctx.db
          .query("agents")
          .withIndex("by_slug", (q) => q.eq("slug", nextSlug!))
          .first();
        if (conflict) throw new Error("Agent slug must be unique");
      }
    }

    const updates: Record<string, unknown> = {
      ...rest,
      ...(nextSlug ? { slug: nextSlug } : {}),
      updatedAt: Date.now(),
    };

    await ctx.db.patch(id, updates);
    return ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});


