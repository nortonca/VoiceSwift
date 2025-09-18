# Agent Integration Implementation

## Overview

This document describes the complete agent integration system implemented for VoiceSwift, enabling dynamic agent configurations with custom system prompts, voice settings, and seamless workflow between the Build and Live pages.

## Architecture

### Core Components

1. **Convex Database Schema** (`convex/schema.ts`)
2. **Agent CRUD Operations** (`convex/agents.ts`)
3. **Build Page Agent Management** (`app/build/page.tsx`)
4. **Live Page Agent Usage** (`app/page.tsx`)
5. **Voice API Integration** (`app/api/route.ts`)

## Database Schema

### Agents Table

```typescript
agents: defineTable({
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  company: v.optional(v.string()),
  startMessage: v.optional(v.string()),
  systemInstructions: v.optional(v.string()), // Core agent personality
  model: v.optional(v.string()),
  temperature: v.optional(v.number()),
  voice: v.optional(v.string()),
  knowledgeUrl: v.optional(v.string()),
  tools: v.optional(v.array(v.object({...}))),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

**Key Fields:**
- `systemInstructions`: Primary system prompt for the agent
- `voice`: Voice preference (alloy, echo, fable)
- `model`: AI model preference
- `temperature`: Response creativity setting

## Agent Workflow

### 1. Build Page (Agent Creation/Editing)

```typescript
// Auto-loads first available agent
useEffect(() => {
  if (listAgents && Array.isArray(listAgents) && listAgents.length > 0) {
    const agent = listAgents[0];
    // Hydrate form with agent data
    setSystemInstructions(agent.systemInstructions ?? "");
    setSelectedVoice(agent.voice ?? "alloy");
    // ... other fields
  }
}, [listAgents]);
```

**Features:**
- Form-based agent configuration
- Real-time state management
- Validation and error handling
- Save/update functionality

### 2. Live Page (Agent Usage)

```typescript
// Uses same agent loading pattern as Build page
const agents = useQuery(api.agents.list, {});
const [currentAgent, setCurrentAgent] = useState(null);

useEffect(() => {
  if (agents && Array.isArray(agents) && agents.length > 0) {
    setCurrentAgent(agents[0]); // Same agent as Build page
  }
}, [agents]);
```

**Features:**
- Automatic agent detection
- No manual selection required
- Real-time agent display
- Seamless Build ↔ Live workflow

### 3. API Route (Agent Processing)

```typescript
// Receives full agent object from client
const { data } = schema.safeParse(await request.formData());
const agent = data.agent;

// Strict agent validation
if (!agent) {
  throw new Error("Agent is required");
}

if (!agent.systemInstructions?.trim()) {
  throw new Error("Agent must have systemInstructions configured");
}

// Use agent's system instructions as primary prompt
let systemPrompt = agent.systemInstructions.trim();
```

**Features:**
- No default fallback prompts
- Strict agent requirements
- Full agent configuration usage
- Dynamic voice and model settings

## Data Flow

```
Build Page (Edit Agent)
       ↓
   Convex Database
       ↓
Live Page (Auto-load Same Agent)
       ↓
Voice/Text Input
       ↓
API Route (Use Agent Config)
       ↓
AI Processing (Custom Instructions)
       ↓
Voice Synthesis (Agent Voice)
```

## Key Features

### 1. Unified Agent System
- Both Build and Live pages work with the same agent
- No agent selection UI needed
- Consistent experience across pages

### 2. Custom System Instructions
- Each agent has unique personality via `systemInstructions`
- No default VoiceSwift prompts
- Pure agent-driven responses

### 3. Voice Configuration
- Agent-specific voice preferences
- Voice mapping: `alloy` → Cartesia voice IDs
- Custom temperature settings

### 4. Context Enhancement
- Location and time injection
- Technical specifications for voice optimization
- Agent profile information

## Implementation Details

### Agent Auto-Selection Logic

Both Build and Live pages use identical logic:

```typescript
// Query all agents
const agents = useQuery(api.agents.list, {});

// Auto-select first agent
useEffect(() => {
  if (agents?.length > 0) {
    setCurrentAgent(agents[0]);
  }
}, [agents]);
```

### System Prompt Construction

```typescript
// Start with agent's custom instructions
let systemPrompt = agent.systemInstructions.trim();

// Add contextual information
systemPrompt += `

CONTEXT INFORMATION:
- User's current location: ${await location()}
- Current time: ${await time()}

TECHNICAL SPECIFICATIONS:
- Keep responses to 1-3 sentences for voice optimization
- No markdown, emojis, or fancy formatting
- Optimized for text-to-speech compatibility

AGENT PROFILE:
- Agent Name: ${agent.name}
- Voice Model: ${agent.voice || "sonic-turbo"}
- Temperature: ${agent.temperature || 0.7}`;
```

### Voice Mapping

```typescript
const voiceMapping = {
  "alloy": "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
  "echo": "820a3788-2b37-4d21-847a-b65d8a68c99a", 
  "fable": "fb26447f-308b-471e-8b00-8e9f04284eb5",
};

const voiceId = voiceMapping[agent.voice || "alloy"];
```

## Error Handling

### Client-Side
- Loading states for agent fetching
- Disabled inputs when no agent available
- Clear user guidance for empty states

### API-Side
- Strict validation with Zod schemas
- Required agent and systemInstructions
- Detailed error logging

## UI/UX Improvements

### Build Page
- Form validation and error display
- Real-time agent configuration
- Status indicators (Draft/Published)

### Live Page
- Agent display with configuration indicators
- "✓ Custom Instructions" badges
- "Using agent from Build page" context

### Voice Controls
- Conditional rendering based on agent availability
- Proper state management
- Error feedback modals

## Benefits

1. **Simplified Workflow**: Edit in Build → Test in Live seamlessly
2. **No Duplication**: Single source of truth for agent configuration
3. **Real-time Updates**: Changes immediately available across pages
4. **Type Safety**: Full TypeScript integration with Zod validation
5. **Performance**: Client-side queries with Convex reactivity
6. **Scalability**: Easy to add new agent features and configurations

## Future Enhancements

1. **Multi-Agent Support**: Support for switching between multiple agents
2. **Agent Templates**: Pre-built agent configurations for common use cases
3. **Advanced Voice Settings**: More granular voice customization options
4. **Agent Analytics**: Usage tracking and performance metrics
5. **Agent Sharing**: Export/import agent configurations

## Conclusion

The agent integration system provides a robust, type-safe, and user-friendly way to create, configure, and use AI agents in VoiceSwift. The unified approach between Build and Live pages creates a seamless development experience while maintaining flexibility and scalability.