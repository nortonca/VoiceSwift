import Groq from "groq-sdk";
import { headers } from "next/headers";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { after } from "next/server";
import { ConvexHttpClient } from "convex/browser";

const groq = new Groq();
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const schema = zfd.formData({
	input: z.union([zfd.text(), zfd.file()]),
	agentId: zfd.text().optional(),
	message: zfd.repeatableOfType(
		zfd.json(
			z.object({
				role: z.enum(["user", "assistant"]),
				content: z.string(),
			})
		)
	),
});

export async function POST(request: Request) {
	const requestId = request.headers.get("x-vercel-id") || "local";
	console.time("transcribe " + requestId);

	const { data, success } = schema.safeParse(await request.formData());
	if (!success) return new Response("Invalid request", { status: 400 });

	const transcript = await getTranscript(data.input);
	if (!transcript) return new Response("Invalid audio", { status: 400 });

	console.timeEnd("transcribe " + requestId);
	console.time("text completion " + requestId);

	// Get agent configuration
	const { systemPrompt, agentConfig } = await getAgentConfig(data.agentId);

	const completion = await groq.chat.completions.create({
		model: agentConfig.model || "moonshotai/kimi-k2-instruct-0905",
		temperature: agentConfig.temperature || 0.7,
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
	});

	const response = completion.choices[0].message.content;
	console.timeEnd("text completion " + requestId);

	if (!response) return new Response("Invalid response", { status: 500 });

	console.time("cartesia request " + requestId);

	const voice = await fetch("https://api.cartesia.ai/tts/bytes", {
		method: "POST",
		headers: {
			"Cartesia-Version": "2024-06-30",
			"Content-Type": "application/json",
			"X-API-Key": process.env.CARTESIA_API_KEY!,
		},
		body: JSON.stringify({
			model_id: "sonic-turbo",
			transcript: response,
			voice: {
				mode: "id",
				id: agentConfig.voiceId || "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
			},
			output_format: {
				container: "raw",
				encoding: "pcm_f32le",
				sample_rate: 24000,
			},
		}),
	});

	console.timeEnd("cartesia request " + requestId);

	if (!voice.ok) {
		console.error(await voice.text());
		return new Response("Voice synthesis failed", { status: 500 });
	}

	console.time("stream " + requestId);
	after(() => {
		console.timeEnd("stream " + requestId);
	});

	return new Response(voice.body, {
		headers: {
			"X-Transcript": encodeURIComponent(transcript),
			"X-Response": encodeURIComponent(response),
		},
	});
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

async function getAgentConfig(agentId?: string): Promise<{
	systemPrompt: string;
	agentConfig: {
		model?: string;
		temperature?: number;
		voiceId?: string;
		voice?: string;
	};
}> {
	// Default fallback prompt
	const defaultPrompt = `Hey there! I'm VoiceSwift, your super sassy and enthusiastic voice assistant!

I'm all about keeping conversations quick, fun, and totally engaging. Think of me as that witty friend who's always got something clever to say!

PERSONALITY & TONE:
- Sassy and enthusiastic with a fun, playful vibe
- Cell phone conversational style - casual and natural
- Keep responses to 1-3 sentences for voice optimization
- No markdown, emojis, or fancy formatting - pure speakable text

CORE CAPABILITIES:
- Friendly and helpful voice assistant
- Respond briefly to user requests without unnecessary details
- Ask for clarification if I don't understand something
- No access to real-time data or external information
- Cannot perform actions beyond responding to users
- Optimized for text-to-speech software compatibility

LOCATION & TIME CONTEXT:
- User's current location: ${await location()}
- Current time: ${await time()}

TECHNICAL BACKBONE:
- Large Language Model: Kimi K2 by Moonshot AI
- Hosted on Groq infrastructure for lightning-fast AI processing
- Text-to-Speech: Sonic Turbo model by Cartesia
- Voice ID: 9626c31c-bec5-4cca-baa8-f8ba9e84c8bc
- Built with Next.js framework
- Deployed on Vercel platform
- Audio transcription powered by Whisper Large v3 Turbo

I'm here to make our chat awesome and keep things moving! What's up?`;

	const defaultConfig = {
		model: "moonshotai/kimi-k2-instruct-0905",
		temperature: 0.7,
		voiceId: "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
	};

	if (!agentId) {
		return {
			systemPrompt: defaultPrompt,
			agentConfig: defaultConfig,
		};
	}

	try {
		// Import the API helper for type safety
		const { api } = await import("../../convex/_generated/api");
		
		// Get agent from database
		const agent = await convex.query(api.agents.getById, { id: agentId as any });
		
		if (!agent) {
			return defaultPrompt;
		}

		// Build system prompt from agent configuration
		let systemPrompt = agent.systemInstructions || agent.name || "You are a helpful assistant.";
		
		// Add context information
		systemPrompt += `\n\nCONTEXT INFORMATION:
- User's current location: ${await location()}
- Current time: ${await time()}

TECHNICAL SPECIFICATIONS:
- Keep responses to 1-3 sentences for voice optimization
- No markdown, emojis, or fancy formatting - pure speakable text
- Optimized for text-to-speech software compatibility

AGENT CONFIGURATION:
- Agent Name: ${agent.name}
- Voice Model: ${agent.voice || "sonic-turbo"}
- Temperature: ${agent.temperature || 0.7}`;

		if (agent.description) {
			systemPrompt += `\n- Description: ${agent.description}`;
		}
		if (agent.company) {
			systemPrompt += `\n- Company: ${agent.company}`;
		}

		return systemPrompt;
		
	} catch (error) {
		console.error("Error fetching agent:", error);
		return defaultPrompt;
	}
}
