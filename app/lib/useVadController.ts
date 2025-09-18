"use client";

import { useState, useMemo, useCallback } from "react";
import { useMicVAD } from "@ricky0123/vad-react";

export type VadState = "idle" | "listening" | "muted";

interface VadControllerOptions {
  onSpeechEnd?: (audio: Float32Array) => void;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

const VAD_SAMPLE_RATE = 16000;
const FRAME_SAMPLES = 512; // supported size that keeps latency low
const FRAME_DURATION_MS = (FRAME_SAMPLES / VAD_SAMPLE_RATE) * 1000;
const PRE_SPEECH_PAD_FRAMES = Math.max(1, Math.round(300 / FRAME_DURATION_MS));
const REDEMPTION_FRAMES = Math.max(1, Math.round(500 / FRAME_DURATION_MS));

export function useVadController(options: VadControllerOptions = {}) {
  const [vadState, setVadState] = useState<VadState>("idle");
  const [micGranted, setMicGranted] = useState<boolean>(false);

  const vad = useMicVAD({
    startOnLoad: false,
    onSpeechEnd: options.onSpeechEnd,
    onPermissionDenied: () => {
      setMicGranted(false);
      options.onPermissionDenied?.();
    },
    onPermissionGranted: () => {
      setMicGranted(true);
      options.onPermissionGranted?.();
    },
    positiveSpeechThreshold: 0.5,
    negativeSpeechThreshold: 0.35,
    frameSamples: FRAME_SAMPLES,
    preSpeechPadFrames: PRE_SPEECH_PAD_FRAMES,
    redemptionFrames: REDEMPTION_FRAMES,
    minSpeechFrames: 4,
  });

  const start = useCallback(async () => {
    if (vadState !== "idle") return;
    try {
      await vad.start();
      setVadState("listening");
    } catch (error) {
      console.warn("Error starting VAD:", error);
      setMicGranted(false);
    }
  }, [vadState, vad]);

  const stop = useCallback(async () => {
    try {
      if (vad.pause) {
        vad.pause();
      }
      
      // Manual cleanup to fully stop microphone
      const vadAny = vad as any;
      if (vadAny.audioContext) {
        await vadAny.audioContext.close();
      }
      
      if (vadAny.stream) {
        vadAny.stream.getTracks().forEach((track: MediaStreamTrack) => {
          track.stop();
        });
      }
    } catch (error) {
      console.warn("Error stopping VAD:", error);
    } finally {
      setVadState("idle");
    }
  }, [vad]);

  const mute = useCallback(() => {
    if (vadState !== "listening") return;
    try {
      vad.pause();
      setVadState("muted");
    } catch {}
  }, [vadState, vad]);

  const unmute = useCallback(() => {
    if (vadState !== "muted") return;
    try {
      vad.start();
      setVadState("listening");
    } catch {}
  }, [vadState, vad]);

  const status = useMemo(() => {
    if (vadState === "idle") return "Press the play button to start";
    if (vadState === "muted") return "Muted — tap mic to unmute or play button to stop";
    return "Listening… tap play button to stop";
  }, [vadState]);

  return { 
    vadState, 
    micGranted, 
    status, 
    start, 
    stop, 
    mute, 
    unmute,
    vad: {
      loading: vad.loading,
      errored: vad.errored,
      userSpeaking: vad.userSpeaking
    }
  };
}
