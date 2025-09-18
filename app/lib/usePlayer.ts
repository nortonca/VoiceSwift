import { useRef, useState } from "react";

const SAMPLE_RATE = 24000;

export function usePlayer() {
	const [isPlaying, setIsPlaying] = useState(false);
	const audioContext = useRef<AudioContext | null>(null);
	const nextStartTime = useRef(0);
	const activeSources = useRef(0);
	const onFinished = useRef<(() => void) | null>(null);

	const ensureContext = () => {
		if (!audioContext.current) {
			audioContext.current = new AudioContext({ sampleRate: SAMPLE_RATE });
			nextStartTime.current = audioContext.current.currentTime;
		}
		return audioContext.current;
	};

	const cleanup = () => {
		audioContext.current?.close().catch(() => undefined);
		audioContext.current = null;
		nextStartTime.current = 0;
		activeSources.current = 0;
		onFinished.current = null;
		setIsPlaying(false);
	};

	const scheduleBuffer = (floatData: Float32Array) => {
		if (!floatData || floatData.length === 0) return;
		const ctx = ensureContext();
		const audioBuffer = ctx.createBuffer(1, floatData.length, ctx.sampleRate);
		audioBuffer.copyToChannel(floatData, 0);
		const source = ctx.createBufferSource();
		source.buffer = audioBuffer;
		source.connect(ctx.destination);
		const startTime = Math.max(nextStartTime.current, ctx.currentTime + 0.02);
		source.start(startTime);
		nextStartTime.current = startTime + audioBuffer.duration;
		activeSources.current += 1;
		setIsPlaying(true);
		source.onended = () => {
			activeSources.current = Math.max(0, activeSources.current - 1);
			if (activeSources.current === 0) {
				setIsPlaying(false);
				onFinished.current?.();
				onFinished.current = null;
			}
		};
	};

	const enqueueChunk = (base64Chunk: string) => {
		if (!base64Chunk) return;
		const floatData = decodeBase64ToFloat32(base64Chunk);
		if (!floatData || floatData.length === 0) return;
		scheduleBuffer(floatData);
	};

	const play = async (stream: ReadableStream, callback: () => void) => {
		stop();
		const reader = stream.getReader();
		let leftover = new Uint8Array();
		let result = await reader.read();

		while (!result.done) {
			const chunk = result.value;
			if (chunk) {
				const combined = new Uint8Array(leftover.length + chunk.length);
				combined.set(leftover);
				combined.set(chunk, leftover.length);

				const usable = Math.floor(combined.length / 4) * 4;
				if (usable > 0) {
					const floatData = new Float32Array(combined.buffer.slice(0, usable));
					scheduleBuffer(floatData);
				}

				leftover = combined.slice(usable);
			}
			result = await reader.read();
		}

		if (leftover.length > 0) {
			const floatData = new Float32Array(
				leftover.buffer.slice(leftover.byteOffset, leftover.byteOffset + leftover.byteLength)
			);
			scheduleBuffer(floatData);
		}

		finish(callback);
	};

	const finish = (callback?: () => void) => {
		if (callback) onFinished.current = callback;
		if (activeSources.current === 0) {
			setIsPlaying(false);
			onFinished.current?.();
			onFinished.current = null;
		}
	};

	const stop = () => {
		cleanup();
	};

	return {
		isPlaying,
		enqueueChunk,
		finish,
		stop,
		play,
	};
}

function decodeBase64ToFloat32(base64: string): Float32Array | null {
	try {
		const binary = atob(base64);
		const len = binary.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return new Float32Array(bytes.buffer);
	} catch (error) {
		console.warn("Failed to decode audio chunk", error);
		return null;
	}
}
