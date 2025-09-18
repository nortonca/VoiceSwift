"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CornerDownLeft, Loader2 } from "lucide-react";
import { usePlayer } from "@/lib/usePlayer";
import { track } from "@vercel/analytics";
import { utils } from "@ricky0123/vad-react";
import { VoiceControls } from "@/components/VoiceControls";
import { FeedbackModal } from "@/components/FeedbackModal";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Bot } from "lucide-react";

type Message = {
	role: "user" | "assistant";
	content: string;
	latency?: number;
};

export default function Home() {
	const [input, setInput] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const player = usePlayer();
	const [showFeedback, setShowFeedback] = useState(false);
	const [isPending, setIsPending] = useState(false);
	
	// Convex integration
	const apiAny = api as any;
	const createConversation = useMutation(apiAny.conversations?.create);
	const addMessage = useMutation(apiAny.messages?.add);
	const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
	
	// Use the same agent loading pattern as build page
	const agents = useQuery(apiAny.agents?.list, {});
	const [currentAgent, setCurrentAgent] = useState<any>(null);
	
	// Auto-select first agent when available (same as build page)
	useEffect(() => {
		if (agents && Array.isArray(agents) && agents.length > 0) {
			setCurrentAgent(agents[0]);
		}
	}, [agents]);

	const handleSpeechEnd = (audio: Float32Array) => {
		player.stop();
		const wav = utils.encodeWAV(audio);
		const blob = new Blob([wav], { type: "audio/wav" });
		void submit(blob);
	};

	useEffect(() => {
		function keyDown(e: KeyboardEvent) {
			if (e.key === "Enter") return inputRef.current?.focus();
			if (e.key === "Escape") return setInput("");
		}

		window.addEventListener("keydown", keyDown);
		return () => window.removeEventListener("keydown", keyDown);
	});

	const [messages, setMessages] = useState<Message[]>([]);
	
	// Helper to ensure conversation exists
	const ensureConversation = useCallback(
		async (firstMessage?: string) => {
			if (currentConversationId) return currentConversationId;
			const title = firstMessage ? `${firstMessage.substring(0, 30)}...` : "Live Session";
			const conv = await createConversation({ title });
			const id = (conv as any)?._id;
			if (id) setCurrentConversationId(id);
			return id;
		},
		[createConversation, currentConversationId]
	);
	
	const submit = useCallback(
		async (data: string | Blob) => {
			if (!currentAgent || isPending) return;

			const formData = new FormData();
			const submittedAt = Date.now();
			let transcriptValue = typeof data === "string" ? data : "";
			let assistantText = "";
			let streamError: string | null = null;
			let streamDone = false;
			let workingMessages = [...messages];
			let userIndex = -1;
			let assistantIndex = -1;

			if (typeof data === "string") {
				formData.append("input", data);
				track("Text input");
				workingMessages.push({ role: "user", content: data });
				userIndex = workingMessages.length - 1;
				setMessages([...workingMessages]);
			} else {
				formData.append("input", data, "audio.wav");
				track("Speech input");
			}

			if (currentAgent) {
				formData.append("agent", JSON.stringify(currentAgent));
			}
			for (const message of messages) {
				formData.append("message", JSON.stringify(message));
			}

			player.stop();
			setIsPending(true);

			try {
				const response = await fetch("/api", {
					method: "POST",
					body: formData,
				});

				if (!response.ok || !response.body) {
					const errorText = await safeReadError(response);
					throw new Error(errorText || "Request failed");
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				const updateMessages = () => {
					setMessages([...workingMessages]);
				};

				while (!streamDone && !streamError) {
					const { value, done } = await reader.read();
					if (done) break;
					buffer += decoder.decode(value, { stream: true });

					let newlineIndex = buffer.indexOf("\n");
					while (newlineIndex !== -1) {
						const line = buffer.slice(0, newlineIndex).trim();
						buffer = buffer.slice(newlineIndex + 1);

						if (line.length > 0) {
							try {
								const event = JSON.parse(line) as any;
								switch (event.type) {
									case "transcript": {
										if (typeof event.text === "string") {
											transcriptValue = event.text;
											setInput(event.text);
											if (userIndex === -1) {
												workingMessages.push({ role: "user", content: event.text });
												userIndex = workingMessages.length - 1;
											} else {
												workingMessages[userIndex] = {
													...workingMessages[userIndex],
													content: event.text,
												};
											}
											updateMessages();
										}
										break;
									}
									case "text-delta": {
										if (typeof event.delta === "string") {
											assistantText += event.delta;
											if (assistantIndex === -1) {
												workingMessages.push({ role: "assistant", content: assistantText });
												assistantIndex = workingMessages.length - 1;
											} else {
												workingMessages[assistantIndex] = {
													...workingMessages[assistantIndex],
													content: assistantText,
												};
											}
											updateMessages();
										}
										break;
									}
									case "text-final": {
										if (typeof event.text === "string") {
											assistantText = event.text;
											if (assistantIndex === -1) {
												workingMessages.push({ role: "assistant", content: assistantText });
												assistantIndex = workingMessages.length - 1;
											} else {
												workingMessages[assistantIndex] = {
													...workingMessages[assistantIndex],
													content: assistantText,
												};
											}
											updateMessages();
										}
										break;
									}
									case "audio": {
										if (typeof event.chunk === "string") {
											player.enqueueChunk(event.chunk);
										}
										break;
									}
									case "error": {
										streamError = typeof event.message === "string" ? event.message : "An error occurred.";
										streamDone = true;
										break;
									}
									case "done": {
										streamDone = true;
										break;
									}
								}
							} catch (error) {
								console.warn("Failed to parse stream event", error);
							}
						}

						if (streamDone || streamError) break;
						newlineIndex = buffer.indexOf("\n");
					}
				}

				player.finish();

				if (streamError) {
					player.stop();
					toast.error(streamError);
					setMessages(messages);
					return;
				}

				const latency = Date.now() - submittedAt;
				if (assistantIndex !== -1) {
					workingMessages[assistantIndex] = {
						...workingMessages[assistantIndex],
						content: assistantText,
						latency,
					};
				}
				if (userIndex !== -1) {
					workingMessages[userIndex] = {
						...workingMessages[userIndex],
						content: transcriptValue,
					};
				}
				setMessages([...workingMessages]);
				setInput(transcriptValue);

				try {
					const conversationId = await ensureConversation(transcriptValue);
					if (conversationId) {
						if (transcriptValue) {
							await addMessage({ conversationId, from: "user", text: transcriptValue });
						}
						if (assistantText) {
							await addMessage({ conversationId, from: "agent", text: assistantText });
						}
					}
				} catch (error) {
					console.error("Failed to save to Convex:", error);
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : "Unexpected error";
				toast.error(message);
				setMessages(messages);
			} finally {
				setIsPending(false);
			}
		},
		[addMessage, currentAgent, ensureConversation, isPending, messages, player]
	);

	function handleFormSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (input.trim() && currentAgent) {
			void submit(input);
		}
	}

	return (
		<>
			<div className="pb-4 min-h-28" />

			{/* Current Agent Display */}
			<div className="w-full max-w-3xl mb-4">
				{agents === undefined ? (
					// Loading state
					<div className="w-full flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white/60">
						<Bot className="w-4 h-4 text-emerald-400 mr-2" />
						Loading agent...
					</div>
				) : agents.length === 0 ? (
					// No agents state
					<div className="w-full flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white/60">
						<Bot className="w-4 h-4 text-emerald-400 mr-2" />
						No agents found. Create an agent in the Build page.
					</div>
				) : currentAgent ? (
					// Current agent display
					<div className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white">
						<div className="flex items-center gap-2">
							<Bot className="w-4 h-4 text-emerald-400" />
							<span className="font-medium">{currentAgent.name}</span>
							{currentAgent.description && (
								<span className="text-white/60 text-xs">— {currentAgent.description}</span>
							)}
							{currentAgent.systemInstructions && (
								<span className="text-emerald-400/60 text-xs">✓ Custom Instructions</span>
							)}
						</div>
						<div className="text-xs text-white/40">Using agent from Build page</div>
					</div>
				) : null}
			</div>

			<form
				className="flex items-center gap-3 w-full max-w-3xl"
				onSubmit={handleFormSubmit}
			>
				<div className="flex-1 relative">
					<input
						type="text"
						className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						placeholder={currentAgent ? "Ask me anything..." : "Create an agent in the Build page to start chatting..."}
						required
						value={input}
						onChange={(e) => setInput(e.target.value)}
						ref={inputRef}
						disabled={!currentAgent}
					/>
				</div>

				<button
					type="submit"
					disabled={isPending || !currentAgent}
					className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label="Submit"
				>
					{isPending ? (
						<Loader2 className="animate-spin h-5 w-5" />
					) : (
						<CornerDownLeft className="h-5 w-5" />
					)}
				</button>
			</form>

			{/* Voice Controls */}
			{currentAgent && (
				<div className="w-full max-w-3xl">
					<VoiceControls 
						onSpeechEnd={handleSpeechEnd}
						onStopped={() => {
							setShowFeedback(true);
							setCurrentConversationId(null); // Start fresh conversation next time
						}}
						onClearMessages={() => {
							setMessages([]);
							setCurrentConversationId(null);
						}}
					/>
				</div>
			)}

			<div className="text-neutral-400 dark:text-neutral-600 pt-4 text-center max-w-xl text-balance min-h-28 space-y-4">
				{messages.length > 0 && (
					<p>
						{messages.at(-1)?.content}
						<span className="text-xs font-mono text-neutral-300 dark:text-neutral-700">
							{" "}
							({messages.at(-1)?.latency}ms)
						</span>
					</p>
				)}

				{messages.length === 0 && (
					<>
						<p>
							A fast, open-source voice assistant powered by{" "}
							<A href="https://groq.com">Groq</A>,{" "}
							<A href="https://cartesia.ai">Cartesia</A>,{" "}
							<A href="https://www.vad.ricky0123.com/">VAD</A>, and{" "}
							<A href="https://vercel.com">Vercel</A>.{" "}
							<A href="https://github.com/ai-ng/swift" target="_blank">
								Learn more
							</A>
							.
						</p>

						<p>Use the voice controls above or type to start chatting.</p>
					</>
				)}
			</div>

		<FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
		</>
	);
}

async function safeReadError(response: Response) {
	try {
		return await response.text();
	} catch {
		return null;
	}
}

function A(props: any) {
	return (
		<a
			{...props}
			className="text-neutral-500 dark:text-neutral-500 hover:underline font-medium"
		/>
	);
}
