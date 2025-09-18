# VoiceSwift Documentation

Welcome to the comprehensive documentation for **VoiceSwift** - a cutting-edge AI voice assistant built with modern web technologies.

## 📚 Documentation Overview

This documentation covers all aspects of the VoiceSwift application, including setup, configuration, features, and technical implementation details.

### 📖 Available Documentation

- **[SETUP.md](./SETUP.md)** - Installation and configuration guide
- **[MODELS.md](./MODELS.md)** - AI model configurations and updates
- **[PROMPT.md](./PROMPT.md)** - System prompt design and customization
- **[AUDIO_SYSTEM.md](./AUDIO_SYSTEM.md)** - Voice Activity Detection and audio processing
- **[FEATURES.md](./FEATURES.md)** - Comprehensive feature analysis
- **[API.md](./API.md)** - API endpoints and request/response formats
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and data flow

## 🚀 Quick Start

1. **Setup**: Follow [SETUP.md](./SETUP.md) for installation
2. **Configure Models**: Review [MODELS.md](./MODELS.md) for model settings
3. **Customize Prompt**: See [PROMPT.md](./PROMPT.md) for prompt configuration
4. **Explore Features**: Check [FEATURES.md](./FEATURES.md) for full capabilities

## 🎯 Key Features

- **Real-time Voice Activity Detection** with ML-powered speech recognition
- **Ultra-low latency** audio processing pipeline
- **Streaming text-to-speech** with interruption support
- **Multi-modal input** (voice + text)
- **Conversation memory** and context awareness
- **Cross-platform compatibility** with browser optimization

## 🏗️ Technical Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Audio Processing**: Web Audio API, @ricky0123/vad-react
- **AI Services**: Groq (inference), Cartesia (TTS), OpenAI Whisper
- **Deployment**: Vercel with regional optimization

## 📋 Recent Updates

### Model Updates
- ✅ Updated transcription model to **Whisper Large v3 Turbo**
- ✅ Updated TTS model to **Sonic Turbo** with custom voice
- ✅ Enhanced system prompt with detailed personality configuration

### Audio Enhancements
- ✅ Implemented interruption support for natural conversations
- ✅ Optimized streaming audio playback
- ✅ Added comprehensive VAD configuration

### Documentation
- ✅ Created comprehensive documentation suite
- ✅ Detailed feature analysis and architecture overview
- ✅ API documentation with examples

---

For questions or contributions, please refer to the specific documentation files or check the main project README.

# VoiceSwift UI Guidelines

A minimal, consistent UI built with Tailwind tokens and a small UI kit.

## Tokens
- Radii: `--vs-radius-sm`, `--vs-radius`, `--vs-radius-lg`
- Spacing: `--vs-space-1..8`
- Colors: `--vs-color-bg`, `--vs-color-fg`, `--vs-color-muted`, `--vs-color-border`, `--vs-color-elev`, `--vs-color-ring`, brand `--vs-brand`

## Components
- `Button` variants: primary, secondary, ghost; sizes: sm, md
- `Input` with start/end icons, focus ring
- `Card` surface via `vs-card`
- `Section` for titled panels
- `Badge` tone: ok, warn, info

## Patterns
- Page container: `max-w-5xl mx-auto px-4 py-6`
- Tabs: rounded-full group, `bg-white/10` active, `text-white/70` idle
- Focus: `:focus-visible { box-shadow: var(--vs-color-ring) }`
- Contrast: prefer AA; avoid very low opacity text

Adopt these components/styles across pages for consistency and minimalism.
