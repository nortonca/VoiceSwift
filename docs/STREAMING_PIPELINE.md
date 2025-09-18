# Streaming Pipeline Architecture

This document explains the end-to-end voice streaming flow introduced in the
VoiceSwift project, covering the request lifecycle, telemetry, and the UI
experience. Use it as the canonical guide when extending or debugging the
real-time system.

## 1. High-Level Overview

```
Client (browser)
   │ 1. multipart/form-data (audio or text)
   ▼
Next.js API Route (`app/api/route.ts`)
   │ ├─ Whisper transcription (Groq)
   │ ├─ Groq chat stream (token deltas)
   │ └─ Cartesia WebSocket (TTS chunks)
   ▼
NDJSON Event Stream                                 WebSocket (Cartesia)
   │ `transcript`, `text-delta`, `audio`, `stage`, `metrics`, `done`
   ▼
Client UI (`app/page.tsx`)
   ├─ Updates conversation state in real time
   ├─ Streams audio via `usePlayer`
   └─ Renders stage timeline + timings
```

Each `/api` request is fully isolated: we create a new WebSocket, collect
timings, and tear everything down once the response finishes.

## 2. Request Lifecycle

1. **Form submission** – The client collects user text or VAD-captured audio,
   adds the active agent payload, and posts a `FormData` object to `/api`.
2. **Transcription** – If the input is a blob, the server calls
   `groq.audio.transcriptions.create` (`whisper-large-v3-turbo`). The resulting
   text is streamed back immediately as a `transcript` event and a `stage`
   update.
3. **Generation** – The API calls `groq.chat.completions.create` with
   `stream:true`. As deltas arrive we collect them, forward `text-delta` events
   to the client, and buffer text for the TTS bridge.
4. **Cartesia WebSocket** – On the first buffered chunk we lazily open a socket
   connection (`createCartesiaStream`). Each time we flush text we send a
   payload to Cartesia and relay the resulting `chunk` messages as `audio` NDJSON
   events.
5. **Completion** – When Groq signals `finish_reason`, the server flushes any
   remaining text, tells Cartesia to close (`continue:false`), waits for the
   `done` message, emits final `stage` + `metrics`, and ends the NDJSON stream.

The API logs the duration of each stage and total latency using
`performance.now()`, mirroring the information exposed to the frontend.

## 3. NDJSON Event Protocol

Every line in the response body is a JSON object with a `type` property:

| Type          | Payload                                           | Purpose                                   |
| ------------- | ------------------------------------------------- | ----------------------------------------- |
| `transcript`  | `{ text }`                                        | First pass transcription emitted once.    |
| `text-delta`  | `{ delta }`                                       | Incremental LLM tokens for live UI.       |
| `text-final`  | `{ text }`                                        | Final concatenated assistant response.    |
| `audio`       | `{ chunk }` (base64 PCM f32le)                    | Audio buffers consumed by `usePlayer`.    |
| `stage`       | `{ stage, status, durationMs? }`                  | Stage transitions for transcription, LLM, TTS. |
| `tool`        | `{ name, arguments, result }`                     | Knowledge search inputs and results.      |
| `metrics`     | `{ timings: { transcription, generation, tts, total } }` | Final timing summary in milliseconds. |
| `error`       | `{ message }`                                     | Terminal error; stream closes afterward.  |
| `done`        | `{}`                                              | Graceful completion signal.               |

The client decodes these events inside the streaming reader loop
(`app/page.tsx`) to update UI state and audio playback.

### Stage Updates

- `status: "start"` is emitted right before work begins on that stage.
- `status: "end"` includes `durationMs`, computed as the elapsed time since the
  matching `start`.
- The client renders these in a three-step timeline (`Transcription` → `LLM
  Generation` → `TTS Synthesis`) with the latest duration and status.

### Metrics Event

The final metrics event provides redundant totals for ease of logging and UI
display. When the client receives it, all stages are forced into the
`completed` state, ensuring any late animations finish together.

## 4. WebSocket Details

- `createCartesiaStream` opens the socket with `api_key` & `cartesia_version`
  query parameters (headers are not available for browser WebSockets).
- We await the `open` event before continuing, so we never start streaming
  tokens before Cartesia is ready.
- Incoming messages are parsed, and `chunk` payloads are forwarded upstream via
  the NDJSON `audio` event. A `done` message resolves the internal promise and
  triggers cleanup.
- On any error or finalisation, we close the socket to avoid resource leaks.

## 5. Frontend Experience

### Stage Timeline

The home page maintains `stageStates` and `metrics` state. After each `stage`
or `metrics` event, the timeline updates the badge colour, label, and runtime.
Errors switch any running stages to `error`, letting users see where the pipeline
failed.

### Audio Playback

`usePlayer` exposes `enqueueChunk`, which decodes base64 PCM strings into
`Float32Array`s and schedules them with a 24 kHz `AudioContext`. Chunks are
queued as they arrive without waiting for the full response, giving the user an
almost instantaneous voice output.

### Conversation Persistence

Once streaming completes, the client writes the user/assistant turn **and** any
tool-call messages to Convex (`messages` table) using the existing
`ensureConversation` helper. Tool messages are persisted between the user and
assistant entries so the conversation history mirrors the on-screen flow.

## 6. Error Handling

- If the NDJSON stream reports an `error`, the client stops playback, marks the
  affected stages as failed, and reverts message state.
- Server-side exceptions (WebSocket failures, API key issues, etc.) also emit an
  `error` event before closing the writer, allowing the frontend to show the
  toast message and recover gracefully.
- We log stage timings in the server console so operators can correlate UI
  delays with backend hotspots.

## 7. Extending the System

- **Additional Stages** – Extend the `StageName` union and update
  `stageOrder`, `stageLabels`, and `stageMetricKey` in `app/page.tsx`. Emit the
  new stages in the API handler and ensure metrics cover the new timings.
- **Alternate Outputs** – If you want to stream alternative formats (e.g.,
  Opus), introduce a new event type and update `usePlayer` to handle decoding.
- **Proactive Logging** – The metrics event can be persisted to your analytics
  backend by listening to it client-side and forwarding it to Convex or another
  service.

Refer back to this document whenever you need to adjust the live pipeline,
instrument additional metrics, or wire the data into downstream features.
