"use client";

import { AudioWaveform, X, Mic, MicOff } from "lucide-react";
import { useVadController } from "@/lib/useVadController";

interface VoiceControlsProps {
  onSpeechEnd?: (audio: Float32Array) => void;
  onStopped?: () => void;
  onClearMessages?: () => void;
}

export function VoiceControls({ onSpeechEnd, onStopped, onClearMessages }: VoiceControlsProps) {
  const { vadState, status, start, stop, mute, unmute } = useVadController({
    onSpeechEnd,
  });

  const handleStop = async () => {
    await stop();
    onStopped?.();
    onClearMessages?.();
  };

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-xs text-white/40">{status}</div>
      <div className="flex items-center gap-2">
        {vadState === "idle" ? (
          <button
            onClick={start}
            aria-label="Start listening"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-600/30 transition-colors"
            title="Start listening"
          >
            <AudioWaveform className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              onClick={handleStop}
              aria-label="Stop listening"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-600/30 transition-colors"
              title="Stop listening"
            >
              <X className="w-4 h-4" />
            </button>
            {vadState === "muted" ? (
              <button
                onClick={unmute}
                aria-label="Unmute microphone"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/30 transition-colors"
                title="Unmute"
              >
                <MicOff className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={mute}
                aria-label="Mute microphone"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/30 transition-colors"
                title="Mute"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
