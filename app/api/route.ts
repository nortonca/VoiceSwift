export const runtime = "nodejs";

import { randomUUID } from "crypto";
import Groq from "groq-sdk";
import Exa from "exa-js";
import { headers } from "next/headers";
import { after } from "next/server";
import { performance } from "perf_hooks";
import { z } from "zod";
import { zfd } from "zod-form-data";

const groq = new Groq();

const agentSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    company: z.string().optional(),
    startMessage: z.string().optional(),
    systemInstructions: z.string().optional(),
    model: z.string().optional(),
    temperature: z.number().optional(),
    voice: z.string().optional(),
    knowledgeUrl: z.string().optional(),
    tools: z
      .array(
        z.object({
          type: z.literal("mcp"),
          server_label: z.string(),
          server_url: z.string().url(),
          headers: z.record(z.string()).optional(),
          allowed_tools: z.array(z.string()).optional(),
        })
      )
      .optional(),
    isActive: z.boolean(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough();

const schema = zfd.formData({
  input: z.union([zfd.text(), zfd.file()]),
  agent: zfd.json(agentSchema).optional(),
  message: zfd.repeatableOfType(
    zfd.json(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
  ),
});

type Agent = z.infer<typeof agentSchema>;
type StageName = "transcription" | "tools" | "generation" | "tts";
type StageStatus = "pending" | "running" | "success" | "error";

type StreamEvent =
  | { type: "transcript"; text: string }
  | { type: "stage"; stage: StageName; status: StageStatus }
  | { type: "metrics"; stage: StageName; duration: number }
  | { type: "text-delta"; delta: string }
  | { type: "text-final"; text: string }
  | {
      type: "tool";
      callId: string;
      name: string;
      input: unknown;
      output: unknown;
      source?: string;
    }
  | { type: "audio"; chunk: string }
  | { type: "done" }
  | { type: "error"; message: string };

type GroqMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Groq.Chat.Completions.ChatCompletionMessageToolCall[];
};

type ToolDefinition = Groq.Chat.Completions.ChatCompletionTool;

type CartesiaStream = {
  sendSegment: (segment: string, options: { continueStream: boolean }) => Promise<void>;
  onChunk: (handler: (chunk: string) => void) => void;
  waitForCompletion: () => Promise<void>;
  close: () => void;
};

export async function POST(request: Request) {
  const requestId = request.headers.get("x-vercel-id") || "local";
  const startAt = performance.now();

  const { data, success, error } = schema.safeParse(await request.formData());
  if (!success) {
    console.error("Schema validation failed:", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!data.agent) {
    return new Response(JSON.stringify({ error: "Agent is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array>();
  const writer = writable.getWriter();

  const sendEvent = async (event: StreamEvent) => {
    await writer.write(encoder.encode(JSON.stringify(event) + "\n"));
  };

  const stageTimers = new Map<StageName, number>();
  const startStage = async (stage: StageName) => {
    stageTimers.set(stage, performance.now());
    await sendEvent({ type: "stage", stage, status: "running" });
  };
  const completeStage = async (stage: StageName, status: StageStatus = "success") => {
    const began = stageTimers.get(stage) ?? performance.now();
    const duration = performance.now() - began;
    await sendEvent({ type: "stage", stage, status });
    await sendEvent({ type: "metrics", stage, duration });
  };

  const headersOut = new Headers();
  headersOut.set("Content-Type", "application/x-ndjson");

  let cartesia: CartesiaStream | null = null;

  (async () => {
    try {
      const { systemPrompt, agentConfig } = await getAgentConfig(data.agent!);

      const baseMessages: GroqMessage[] = [
        { role: "system", content: systemPrompt },
        ...data.message,
      ];

      await startStage("transcription");
      const transcript = await getTranscript(data.input);
      await completeStage("transcription");
      if (!transcript) {
        throw new Error("Unable to transcribe input");
      }
      await sendEvent({ type: "transcript", text: transcript });

      const messagesWithUser: GroqMessage[] = [
        ...baseMessages,
        { role: "user", content: transcript },
      ];

      await startStage("tools");
      const toolContext = await buildTooling({ agent: data.agent! });
      const { hydratedMessages } = await resolveTools({
        agentConfig,
        messages: messagesWithUser,
        tools: toolContext.tools,
        executors: toolContext.executors,
        sendEvent,
      });
      await completeStage("tools");

      await startStage("generation");
      cartesia = await createCartesiaStream({ voiceId: agentConfig.voiceId });
      cartesia.onChunk(async (chunk) => {
        try {
          await sendEvent({ type: "audio", chunk });
        } catch (error) {
          console.warn("Failed to forward audio chunk", error);
        }
      });

      const stream = await groq.chat.completions.create({
        model: agentConfig.model,
        temperature: agentConfig.temperature,
        messages: hydratedMessages as Groq.Chat.Completions.ChatCompletionMessageParam[],
        stream: true,
        tools: [],
        tool_choice: "none",
        parallel_tool_calls: false,
      });

      let pendingText = "";
      let cartesiaBuffer = "";

      const flushCartesia = async ({ force = false } = {}) => {
        if (!cartesia || !cartesiaBuffer) return;
        let cut = -1;
        for (let i = cartesiaBuffer.length - 1; i >= 0; i--) {
          const char = cartesiaBuffer[i];
          if (/[\.?!]/.test(char)) {
            cut = i + 1;
            break;
          }
          if (force && /[\s,;]/.test(char)) {
            cut = i + 1;
            break;
          }
        }
        if (cut === -1 && (force || cartesiaBuffer.length > 120)) {
          cut = cartesiaBuffer.length;
        }
        if (cut === -1) return;
        const segment = cartesiaBuffer.slice(0, cut);
        cartesiaBuffer = cartesiaBuffer.slice(cut);
        if (!segment.trim()) return;
        await cartesia.sendSegment(segment, { continueStream: true });
      };

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;
        const content = delta.content ?? "";
        if (content) {
          pendingText += content;
          cartesiaBuffer += content;
          await sendEvent({ type: "text-delta", delta: content });
          await flushCartesia();
        }
        const finish = chunk.choices?.[0]?.finish_reason;
        if (finish && finish !== "length") {
          break;
        }
      }

      await flushCartesia({ force: true });
      if (cartesia) {
        await cartesia.sendSegment(cartesiaBuffer, { continueStream: false });
      }

      await completeStage("generation");
      await startStage("tts");
      await cartesia?.waitForCompletion();
      await completeStage("tts");

      if (pendingText) {
        await sendEvent({ type: "text-final", text: pendingText });
      }

      await sendEvent({ type: "done" });
    } catch (err) {
      console.error("Streaming pipeline failed", err);
      const message = err instanceof Error ? err.message : "Unexpected error";
      try {
        await sendEvent({ type: "error", message });
      } catch {}
      try {
        if (cartesia) cartesia.close();
      } catch {}
    } finally {
      try {
        await writer.close();
      } catch {}
      const streamEnd = performance.now();
      after(() => {
        console.log("Total latency", Math.round(streamEnd - startAt), "ms");
      });
    }
  })();

  return new Response(readable, { headers: headersOut });
}

async function resolveTools({
  agentConfig,
  messages,
  tools,
  executors,
  sendEvent,
}: {
  agentConfig: { model: string; temperature: number };
  messages: GroqMessage[];
  tools: ToolDefinition[];
  executors: Map<string, ToolExecutor>;
  sendEvent: (event: StreamEvent) => Promise<void>;
}): Promise<{ hydratedMessages: GroqMessage[] }> {
  if (!tools.length) {
    return { hydratedMessages: messages };
  }

  let workingMessages = [...messages];

  while (true) {
    const response = await groq.chat.completions.create({
      model: agentConfig.model,
      temperature: agentConfig.temperature,
      messages: workingMessages as Groq.Chat.Completions.ChatCompletionMessageParam[],
      stream: false,
      tools,
      tool_choice: "auto",
      parallel_tool_calls: true,
    });

    const choice = response.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;
    if (choice?.finish_reason === "tool_calls" && toolCalls?.length) {
      workingMessages.push({
        role: "assistant",
        content: choice.message?.content ?? "",
        tool_calls: toolCalls,
      });

      for (const call of toolCalls) {
        const executor = executors.get(call.function.name);
        if (!executor) {
          await sendEvent({
            type: "tool",
            callId: call.id,
            name: call.function.name,
            input: call.function.arguments,
            output: { error: "Unknown tool" },
          });
          workingMessages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({ error: "Unknown tool" }),
          });
          continue;
        }

        let parsedArgs: unknown;
        try {
          parsedArgs = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        } catch {
          parsedArgs = {};
        }

        const output = await executor(parsedArgs);
        await sendEvent({
          type: "tool",
          callId: call.id,
          name: call.function.name,
          input: parsedArgs,
          output,
          source: output && typeof output === "object" && "source" in output ? (output as any).source : undefined,
        });

        workingMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(output ?? {}),
        });
      }

      continue;
    }

    return { hydratedMessages: workingMessages };
  }
}

type ToolExecutor = (args: unknown) => Promise<unknown>;

async function buildTooling({
  agent,
}: {
  agent: Agent;
}): Promise<{ tools: ToolDefinition[]; executors: Map<string, ToolExecutor> }> {
  const tools: ToolDefinition[] = [];
  const executors = new Map<string, ToolExecutor>();

  if (agent.knowledgeUrl) {
    tools.push({
      type: "function",
      function: {
        name: "knowledge_search",
        description: "Search the agent's curated knowledge base",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query targeting the curated knowledge base",
            },
          },
          required: ["query"],
        },
      },
    });

    executors.set("knowledge_search", async (args) => {
      const exaKey = process.env.EXA_API_KEY;
      if (!exaKey) {
        return { error: "Missing EXA_API_KEY" };
      }
      let query = "";
      if (typeof args === "object" && args && "query" in args) {
        query = String((args as any).query ?? "");
      }
      query = query.trim();
      if (!query) {
        return { error: "Query is required" };
      }

      const url = new URL(agent.knowledgeUrl!);
      const exa = new Exa(exaKey);
      const results = await exa.searchAndContents(query, {
        numResults: 5,
        text: true,
        includeDomains: [url.hostname],
      } as any);

      return {
        query,
        source: agent.knowledgeUrl,
        results: Array.isArray((results as any)?.results)
          ? (results as any).results.map((item: any) => ({
              id: item.id,
              title: item.title,
              url: item.url,
              snippet: item.snippet,
            }))
          : [],
      };
    });
  }

  if (Array.isArray(agent.tools)) {
    for (const tool of agent.tools) {
      if (tool.type !== "mcp") continue;
      const label = tool.server_label || tool.server_url;
      const namePrefix = sanitizeToolName(label);

      try {
        const discovery = await fetch(`${tool.server_url}/.well-known/mcp/tool`, {
          headers: {
            "Content-Type": "application/json",
            ...(tool.headers ?? {}),
          },
          cache: "no-store",
        });
        if (!discovery.ok) {
          console.warn("Failed to discover MCP tools", tool.server_url, discovery.status);
          continue;
        }
        const payload = (await discovery.json()) as MCPDiscoveryResponse;
        const allowed = tool.allowed_tools?.length
          ? new Set(tool.allowed_tools)
          : null;

        for (const remote of payload.tools ?? []) {
          if (allowed && !allowed.has(remote.name)) continue;
          const fullName = `${namePrefix}_${remote.name}`;
          tools.push({
            type: "function",
            function: {
              name: fullName,
              description: remote.description || `Invoke ${remote.name} from ${label}`,
              parameters: remote.input_schema ?? { type: "object" },
            },
          });

          executors.set(fullName, async (args) => {
            const response = await fetch(`${tool.server_url}/tool/${remote.name}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(tool.headers ?? {}),
              },
              body: JSON.stringify({ arguments: args ?? {} }),
            });
            if (!response.ok) {
              return { error: `MCP tool ${remote.name} failed`, status: response.status };
            }
            return response.json();
          });
        }
      } catch (error) {
        console.warn("Failed to hydrate MCP server", tool.server_url, error);
      }
    }
  }

  return { tools, executors };
}

type MCPDiscoveryResponse = {
  tools?: Array<{
    name: string;
    description?: string;
    input_schema?: Record<string, unknown>;
  }>;
};

function sanitizeToolName(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

async function createCartesiaStream({ voiceId }: { voiceId: string }): Promise<CartesiaStream> {
  const { WebSocket } = await import("ws");
  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    throw new Error("Missing CARTESIA_API_KEY");
  }
  const url = new URL("wss://api.cartesia.ai/tts/websocket");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("cartesia_version", "2025-04-16");

  const contextId = randomUUID();
  const ws = new WebSocket(url.toString(), {
    // Add WebSocket options for better stability
    perMessageDeflate: false,
    skipUTF8Validation: false,
  });

  await new Promise<void>((resolve, reject) => {
    ws.once("open", () => resolve());
    ws.once("error", (err) => reject(err));
  });

  let chunkHandler: ((chunk: string) => void) | null = null;
  let completionResolver: (() => void) | null = null;
  const completion = new Promise<void>((resolve) => {
    completionResolver = resolve;
  });

  ws.on("message", (raw) => {
    try {
      const payload = JSON.parse(raw.toString());
      if (payload.type === "chunk" && typeof payload.data === "string") {
        chunkHandler?.(payload.data);
      }
      if (payload.type === "done") {
        completionResolver?.();
      }
    } catch (error) {
      console.warn("Failed to parse Cartesia payload", error);
    }
  });

  ws.on("close", () => {
    completionResolver?.();
  });

  return {
    async sendSegment(segment, { continueStream }) {
      if (!segment && continueStream) return;
      try {
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn("WebSocket not open, skipping segment");
          return;
        }
        ws.send(
          JSON.stringify({
            model_id: "sonic-turbo",
            transcript: segment,
            voice: { mode: "id", id: voiceId },
            language: "en",
            context_id: contextId,
            continue: continueStream,
            output_format: {
              container: "raw",
              encoding: "pcm_f32le",
              sample_rate: 24000,
            },
          })
        );
      } catch (error) {
        console.error("Failed to send WebSocket message:", error);
        // Don't throw to avoid breaking the stream
      }
    },
    onChunk(handler) {
      chunkHandler = handler;
    },
    async waitForCompletion() {
      await completion;
      ws.close();
    },
    close() {
      try {
        ws.close();
      } catch {}
    },
  };
}

async function getTranscript(input: string | File) {
  if (typeof input === "string") return input.trim();
  if (!input.size) return null;
  try {
    const { text } = await groq.audio.transcriptions.create({
      file: input,
      model: "whisper-large-v3-turbo",
    });
    return text.trim();
  } catch (error) {
    console.error("Transcription failed", error);
    return null;
  }
}

async function getAgentConfig(agent: Agent): Promise<{
  systemPrompt: string;
  agentConfig: {
    model: string;
    temperature: number;
    voiceId: string;
  };
}> {
  if (!agent.systemInstructions?.trim()) {
    throw new Error("Agent must have system instructions");
  }

  const voiceMapping: Record<string, string> = {
    alloy: "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
    echo: "820a3788-2b37-4d21-847a-b65d8a68c99a",
    fable: "fb26447f-308b-471e-8b00-8e9f04284eb5",
  };

  const systemPromptLines = [agent.systemInstructions.trim()];
  systemPromptLines.push("\nCONTEXT INFORMATION:");
  systemPromptLines.push(`- User location: ${await location()}`);
  systemPromptLines.push(`- Local time: ${await time()}`);
  systemPromptLines.push("\nVOICE GUIDELINES:");
  systemPromptLines.push("- Keep replies to 1-3 sentences.");
  systemPromptLines.push("- Do not use markdown or emojis.");
  systemPromptLines.push("- Produce speakable, concise text.");

  systemPromptLines.push("\nAGENT PROFILE:");
  systemPromptLines.push(`- Name: ${agent.name}`);
  if (agent.description) systemPromptLines.push(`- Description: ${agent.description}`);
  if (agent.company) systemPromptLines.push(`- Company: ${agent.company}`);
  systemPromptLines.push(`- Voice preset: ${agent.voice || "alloy"}`);

  const model = agent.model || "moonshotai/kimi-k2-instruct-0905";
  const temperature = typeof agent.temperature === "number" ? agent.temperature : 0.7;
  const voiceId = voiceMapping[agent.voice || "alloy"] || voiceMapping.alloy;

  return {
    systemPrompt: systemPromptLines.join("\n"),
    agentConfig: {
      model,
      temperature,
      voiceId,
    },
  };
}

async function location() {
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country");
  const region = headersList.get("x-vercel-ip-country-region");
  const city = headersList.get("x-vercel-ip-city");
  if (!country || !region || !city) return "unknown";
  return `${city}, ${region}, ${country}`;
}

async function time() {
  const headersList = await headers();
  const timeZone = headersList.get("x-vercel-ip-timezone") || undefined;
  return new Date().toLocaleString("en-US", { timeZone });
}
