export const runtime = "nodejs";

import Groq from "groq-sdk";
import { headers } from "next/headers";
import { after } from "next/server";
import { randomUUID } from "crypto";
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

type StreamEvent =
  | { type: "transcript"; text: string }
  | { type: "text-delta"; delta: string }
  | { type: "text-final"; text: string }
  | { type: "audio"; chunk: string }
  | { type: "done" }
  | { type: "error"; message: string };

export async function POST(request: Request) {
  const requestId = request.headers.get("x-vercel-id") || "local";
  const startTime = Date.now();
  console.time("transcribe " + requestId);

  const { data, success, error } = schema.safeParse(await request.formData());
  if (!success) {
    console.error("Schema validation failed:", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const transcript = await getTranscript(data.input);
  if (!transcript) {
    return new Response(JSON.stringify({ error: "Invalid audio" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  console.timeEnd("transcribe " + requestId);
  console.time("text completion " + requestId);

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array>();
  const writer = writable.getWriter();

  const headersOut = new Headers();
  headersOut.set("Content-Type", "application/x-ndjson");
  headersOut.set("X-Transcript", encodeURIComponent(transcript));


  (async () => {
    let cartesia: CartesiaStream | null = null;
    try {
      console.time("agent-config " + requestId);
      const { systemPrompt, agentConfig } = await getAgentConfig(data.agent);
      console.timeEnd("agent-config " + requestId);

      // Emit initial transcript event so the client can show the user's text immediately.
      await writer.write(encodeEvent({ type: "transcript", text: transcript }, encoder));

      const voiceId = agentConfig.voiceId || "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc";
      cartesia = await createCartesiaStream({ voiceId });

      cartesia.onChunk(async (chunk) => {
        try {
          await writer.write(
            encodeEvent(
              {
                type: "audio",
                chunk,
              },
              encoder,
            ),
          );
        } catch (error) {
          console.warn("Failed to forward audio chunk", error);
        }
      });

      const completionStream = await groq.chat.completions.create({
        model: agentConfig.model || "moonshotai/kimi-k2-instruct-0905",
        temperature: agentConfig.temperature ?? 0.7,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...data.message,
          {
            role: "user",
            content: transcript,
          },
        ],
        stream: true,
      });

      let pendingText = "";
      let cartesiaBuffer = "";

      const flushCartesia = async ({ force = false } = {}) => {
        if (!cartesiaBuffer.length) return;
        let cutoff = -1;

        for (let i = cartesiaBuffer.length - 1; i >= 0; i--) {
          const char = cartesiaBuffer[i];
          if (/[\.?!]/.test(char)) {
            cutoff = i + 1;
            break;
          }
          if (force && /[\s,;]/.test(char)) {
            cutoff = i + 1;
            break;
          }
        }

        if (cutoff === -1 && (force || cartesiaBuffer.length > 60)) {
          cutoff = cartesiaBuffer.length;
        }

        if (cutoff === -1) return;

        const segment = cartesiaBuffer.slice(0, cutoff);
        cartesiaBuffer = cartesiaBuffer.slice(cutoff);
        if (segment.trim().length === 0) return;
        if (!cartesia) return;
        await cartesia.sendSegment(segment, { continueStream: true });
      };

      for await (const chunk of completionStream) {
        const delta = chunk.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          pendingText += delta;
          cartesiaBuffer += delta;

          await writer.write(
            encodeEvent(
              {
                type: "text-delta",
                delta,
              },
              encoder,
            ),
          );

          await flushCartesia();
        }

        if (chunk.choices?.[0]?.finish_reason) {
          break;
        }
      }

      await flushCartesia({ force: true });

      if (!cartesia) {
        throw new Error("Cartesia stream unavailable");
      }

      if (cartesiaBuffer.length) {
        await cartesia.sendSegment(cartesiaBuffer, { continueStream: false });
        cartesiaBuffer = "";
      } else {
        await cartesia.sendSegment("", { continueStream: false });
      }

      if (pendingText.length > 0) {
        await writer.write(
          encodeEvent(
            {
              type: "text-final",
              text: pendingText,
            },
            encoder,
          ),
        );
      }
      await cartesia.waitForCompletion();

      await writer.write(encodeEvent({ type: "done" }, encoder));
    } catch (err) {
      console.error("Streaming pipeline failed", err);
      const message = err instanceof Error ? err.message : "Unexpected error";
      try {
        await writer.write(encodeEvent({ type: "error", message }, encoder));
      } catch {}
      try {
        // Close Cartesia stream if it was created
        cartesia?.close();
      } catch {}
    } finally {
      try {
        cartesia?.close();
      } catch {}
      try {
        writer.close();
      } catch {}
      console.timeEnd("text completion " + requestId);
      console.time(
        "stream " + requestId,
      );
      after(() => {
        console.timeEnd("stream " + requestId);
        console.log("Total latency", Date.now() - startTime, "ms");
      });
    }
  })();

  return new Response(readable, {
    headers: headersOut,
  });
}

function encodeEvent(event: StreamEvent, encoder: TextEncoder): Uint8Array {
  return encoder.encode(JSON.stringify(event) + "\n");
}

type CartesiaStream = {
  sendSegment: (segment: string, options: { continueStream: boolean }) => Promise<void>;
  onChunk: (handler: (chunk: string) => void) => void;
  waitForCompletion: () => Promise<void>;
  close: () => void;
};

async function createCartesiaStream({ voiceId }: { voiceId: string }): Promise<CartesiaStream> {
  const { WebSocket } = await import("ws");
  const url = new URL("wss://api.cartesia.ai/tts/websocket");
  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    throw new Error("Missing CARTESIA_API_KEY");
  }
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("cartesia_version", "2025-04-16");

  const contextId = randomUUID();
  const ws = new WebSocket(url.toString());

  await new Promise<void>((resolve, reject) => {
    ws.once("open", () => resolve());
    ws.once("error", (err) => reject(err));
  });

  let chunkHandler: ((chunk: string) => void) | null = null;
  let doneResolve: (() => void) | null = null;
  const donePromise = new Promise<void>((resolve) => {
    doneResolve = resolve;
  });

  ws.on("message", (raw) => {
    try {
      const payload = JSON.parse(raw.toString());
      if (payload.type === "chunk" && typeof payload.data === "string") {
        chunkHandler?.(payload.data);
      }
      if (payload.type === "done") {
        doneResolve?.();
      }
    } catch (error) {
      console.warn("Failed to parse Cartesia payload", error);
    }
  });

  ws.on("close", () => {
    doneResolve?.();
  });

  return {
    async sendSegment(segment, { continueStream }) {
      if (!segment && continueStream) return;
      ws.send(
        JSON.stringify({
          model_id: "sonic-turbo",
          transcript: segment,
          voice: {
            mode: "id",
            id: voiceId,
          },
          language: "en",
          context_id: contextId,
          continue: continueStream,
          output_format: {
            container: "raw",
            encoding: "pcm_f32le",
            sample_rate: 24000,
          },
        }),
      );
    },
    onChunk(handler) {
      chunkHandler = handler;
    },
    async waitForCompletion() {
      await donePromise;
      ws.close();
    },
    close() {
      try {
        ws.close();
      } catch {}
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

async function getTranscript(input: string | File) {
  if (typeof input === "string") return input;

  try {
    const { text } = await groq.audio.transcriptions.create({
      file: input,
      model: "whisper-large-v3-turbo",
    });

    return text.trim() || null;
  } catch {
    return null; // Empty audio file
  }
}

async function getAgentConfig(agent?: Agent): Promise<{
  systemPrompt: string;
  agentConfig: {
    model?: string;
    temperature?: number;
    voiceId?: string;
    voice?: string;
  };
}> {
  if (!agent) {
    console.error("No agent provided");
    throw new Error("Agent is required");
  }

  if (!agent.systemInstructions || !agent.systemInstructions.trim()) {
    console.error("Agent has no systemInstructions");
    throw new Error("Agent must have systemInstructions configured");
  }

  let systemPrompt = agent.systemInstructions.trim();

  systemPrompt += `\n\nCONTEXT INFORMATION:
- User's current location: ${await location()}
- Current time: ${await time()}

TECHNICAL SPECIFICATIONS:
- Keep responses to 1-3 sentences for voice optimization
- No markdown, emojis, or fancy formatting - pure speakable text
- Optimized for text-to-speech software compatibility

AGENT PROFILE:
- Agent Name: ${agent.name}`;

  if (agent.description) {
    systemPrompt += `\n- Description: ${agent.description}`;
  }
  if (agent.company) {
    systemPrompt += `\n- Company: ${agent.company}`;
  }

  systemPrompt += `\n- Voice Model: ${agent.voice || "sonic-turbo"}
- Temperature: ${agent.temperature || 0.7}`;

  const voiceMapping: Record<string, string> = {
    alloy: "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
    echo: "820a3788-2b37-4d21-847a-b65d8a68c99a",
    fable: "fb26447f-308b-471e-8b00-8e9f04284eb5",
  };

  const agentConfig = {
    model: agent.model || "moonshotai/kimi-k2-instruct-0905",
    temperature: agent.temperature || 0.7,
    voiceId: voiceMapping[agent.voice || "alloy"] || voiceMapping["alloy"],
    voice: agent.voice,
  };

  return {
    systemPrompt,
    agentConfig,
  };
}
