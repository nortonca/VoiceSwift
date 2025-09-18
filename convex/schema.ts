import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Convex database schema
// Add new tables and indexes here. Run `npx convex dev` to apply.
const agents = defineTable({
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
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_slug", ["slug"]) // used to ensure uniqueness and quick lookup
  .index("by_isActive", ["isActive"]);

export default defineSchema({
  agents,
  conversations: defineTable({
    title: v.string(),
    resolved: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"]),
  messages: defineTable({
    conversationId: v.id("conversations"),
    from: v.union(v.literal("user"), v.literal("agent"), v.literal("tool")),
    text: v.string(),
    ts: v.number(),
    metadata: v.optional(v.record(v.string(), v.any())),
  })
    .index("by_conversation_ts", ["conversationId", "ts"]),
});


