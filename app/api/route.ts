import Groq from "groq-sdk";
import { headers } from "next/headers";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { after } from "next/server";

const groq = new Groq();

const schema = zfd.formData({
	input: z.union([zfd.text(), zfd.file()]),
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
	console.time("transcribe " + request.headers.get("x-vercel-id") || "local");

	const { data, success } = schema.safeParse(await request.formData());
	if (!success) return new Response("Invalid request", { status: 400 });

	const transcript = await getTranscript(data.input);
	if (!transcript) return new Response("Invalid audio", { status: 400 });

	console.timeEnd(
		"transcribe " + request.headers.get("x-vercel-id") || "local"
	);
	console.time(
		"text completion " + request.headers.get("x-vercel-id") || "local"
	);

	const completion = await groq.chat.completions.create({
		model: "moonshotai/kimi-k2-instruct-0905",
		messages: [
			{
				role: "system",
				content: `Hey there! I'm VoiceSwift, your super sassy and enthusiastic voice assistant!

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

I'm here to make our chat awesome and keep things moving! What's up?`,
			},
			...data.message,
			{
				role: "user",
				content: transcript,
			},
		],
	});

	const response = completion.choices[0].message.content;
	console.timeEnd(
		"text completion " + request.headers.get("x-vercel-id") || "local"
	);

	if (!response) return new Response("Invalid response", { status: 500 });

	console.time(
		"cartesia request " + request.headers.get("x-vercel-id") || "local"
	);

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
				id: "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
			},
			output_format: {
				container: "raw",
				encoding: "pcm_f32le",
				sample_rate: 24000,
			},
		}),
	});

	console.timeEnd(
		"cartesia request " + request.headers.get("x-vercel-id") || "local"
	);

	if (!voice.ok) {
		console.error(await voice.text());
		return new Response("Voice synthesis failed", { status: 500 });
	}

	console.time("stream " + request.headers.get("x-vercel-id") || "local");
	after(() => {
		console.timeEnd("stream " + request.headers.get("x-vercel-id") || "local");
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
