# AI Models Configuration

This document details all AI models used in VoiceSwift and the specific configurations we implemented.

## 🎯 Model Updates Summary

### Recent Updates Made
- ✅ **Transcription**: Updated from `whisper-large-v3` to `whisper-large-v3-turbo`
- ✅ **TTS**: Updated from `sonic-english` to `sonic-turbo` with custom voice
- ✅ **Voice ID**: Changed to `9626c31c-bec5-4cca-baa8-f8ba9e84c8bc`

## 📝 Speech-to-Text (Transcription)

### Current Configuration

```typescript
// File: app/api/route.ts
const { text } = await groq.audio.transcriptions.create({
    file: input,
    model: "whisper-large-v3-turbo",  // Updated model
});
```

### Model Details

#### Whisper Large v3 Turbo
- **Provider**: OpenAI (via Groq)
- **Use Case**: Speech-to-text transcription
- **Key Features**:
  - Ultra-fast inference through Groq
  - High accuracy for various accents
  - Support for multiple languages
  - Robust noise handling
- **Performance**: Significantly faster than standard v3
- **Compatibility**: Works with audio files and blobs

### Previous Configuration
- **Model**: `whisper-large-v3`
- **Migration Reason**: Turbo version provides better speed-performance balance

## 🗣️ Text-to-Speech (TTS)

### Current Configuration

```typescript
// File: app/api/route.ts
body: JSON.stringify({
    model_id: "sonic-turbo",  // Updated model
    transcript: response,
    voice: {
        mode: "id",
        id: "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",  // Custom voice
    },
    output_format: {
        container: "raw",
        encoding: "pcm_f32le",
        sample_rate: 24000,
    },
})
```

### Model Details

#### Sonic Turbo
- **Provider**: Cartesia
- **Use Case**: Text-to-speech synthesis
- **Key Features**:
  - Ultra-fast speech generation
  - High-quality natural voice
  - Streaming audio output
  - Custom voice support
- **Performance**: Optimized for real-time conversations
- **Audio Quality**: 24kHz sample rate, PCM format

### Voice Configuration
- **Voice ID**: `9626c31c-bec5-4cca-baa8-f8ba9e84c8bc`
- **Mode**: ID-based voice selection
- **Characteristics**: Custom trained voice for VoiceSwift

### Previous Configuration
- **Model**: `sonic-english`
- **Migration Reason**: Turbo version offers better speed and quality

## 🤖 Language Model (LLM)

### Current Configuration

```typescript
// File: app/api/route.ts
const completion = await groq.chat.completions.create({
    model: "moonshotai/kimi-k2-instruct-0905",
    messages: [
        {
            role: "system",
            content: `Hey there! I'm VoiceSwift, your super sassy...`
        },
        ...data.message,
        {
            role: "user",
            content: transcript,
        },
    ],
});
```

### Model Details

#### Kimi K2 Instruct
- **Provider**: Moonshot AI (via Groq)
- **Use Case**: Natural language processing and response generation
- **Key Features**:
  - Fast inference through Groq infrastructure
  - Instruction-tuned for conversational AI
  - Context-aware responses
  - Optimized for voice assistant interactions
- **Performance**: Ultra-low latency responses
- **Integration**: Seamless conversation flow

## 🎙️ Voice Activity Detection (VAD)

### Configuration

```typescript
// File: app/page.tsx
const vad = useMicVAD({
    startOnLoad: true,
    onSpeechEnd: (audio) => {
        // Process detected speech
    },
    positiveSpeechThreshold: 0.6,
    minSpeechFrames: 4,
});
```

### VAD Model Details

#### @ricky0123/vad-react
- **Provider**: Ricky0123 (Open source)
- **Use Case**: Real-time voice activity detection
- **Key Features**:
  - Machine learning-based speech detection
  - Configurable sensitivity thresholds
  - Browser-native implementation
  - Cross-platform compatibility
- **Technical**: ONNX Runtime for ML inference
- **Performance**: Sub-millisecond detection latency

### VAD Parameters
- **positiveSpeechThreshold**: 0.6 (60% confidence required)
- **minSpeechFrames**: 4 (minimum speech segments)
- **startOnLoad**: true (auto-start on page load)

## 🔄 Model Performance Comparison

| Model | Before | After | Improvement |
|-------|--------|-------|-------------|
| Transcription | whisper-large-v3 | whisper-large-v3-turbo | ⚡ Faster inference |
| TTS | sonic-english | sonic-turbo | 🎯 Better quality + speed |
| Voice | Generic | Custom ID | 🎭 Personalized experience |

## 📊 API Usage & Costs

### Rate Limits & Quotas
- **Groq**: Check dashboard for usage limits
- **Cartesia**: Monitor TTS request volumes
- **Implementation**: Built-in error handling for rate limits

### Cost Optimization
- **Streaming**: Reduces latency and perceived costs
- **Caching**: Conversation history management
- **Error Handling**: Prevents unnecessary API calls

## 🔧 Model Customization

### Voice Customization
```typescript
voice: {
    mode: "id",
    id: "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"
}
```
- Change the `id` to use different voices
- Requires Cartesia API access for custom voices

### Prompt Customization
- Modify the system prompt in `app/api/route.ts`
- Affects personality and response style
- See [PROMPT.md](./PROMPT.md) for detailed configuration

### VAD Tuning
- Adjust `positiveSpeechThreshold` for sensitivity
- Modify `minSpeechFrames` for detection timing
- Test different values for optimal performance

## 🐛 Troubleshooting Models

### Common Issues

#### Transcription Problems
- Check audio quality and format
- Verify API key permissions
- Monitor network connectivity

#### TTS Issues
- Confirm voice ID exists and is accessible
- Check output format compatibility
- Verify streaming implementation

#### LLM Response Issues
- Review system prompt configuration
- Check conversation history format
- Monitor API rate limits

### Debug Mode
Enable detailed logging by modifying the API route to include:
```typescript
console.log("Transcription result:", text);
console.log("TTS response:", voiceResponse);
console.log("LLM completion:", completion);
```

## 🚀 Future Model Updates

### Planned Improvements
- **Multilingual Support**: Expand language capabilities
- **Voice Cloning**: Custom voice training options
- **Emotion Detection**: Sentiment-aware responses
- **Context Awareness**: Enhanced conversation memory

### Model Monitoring
- Track performance metrics
- Monitor accuracy and latency
- A/B test different model versions

---

## 📚 Additional Resources

- [Groq Documentation](https://docs.groq.com/)
- [Cartesia API Docs](https://docs.cartesia.ai/)
- [Whisper Model Info](https://github.com/openai/whisper)
- [VAD Implementation](https://www.vad.ricky0123.com/)

For questions about model configuration, check the [API.md](./API.md) documentation or create an issue in the project repository.
