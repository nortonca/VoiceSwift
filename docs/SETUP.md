# Setup & Configuration Guide

This guide covers the installation, configuration, and deployment of VoiceSwift.

## 📦 Installation

### Prerequisites

- **Node.js**: Version 18 or higher
- **PNPM**: Package manager (recommended)
- **Git**: For cloning the repository

### Install PNPM (if not already installed)

```bash
# Using npm
npm install -g pnpm

# Or using curl
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd swift

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local
```

## 🔧 Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# Required API Keys
GROQ_API_KEY=your_groq_api_key_here
CARTESIA_API_KEY=your_cartesia_api_key_here

# Optional: Vercel Analytics
VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

### API Key Setup

#### Groq API Key
1. Visit [Groq Console](https://console.groq.com/)
2. Create a new API key
3. Add it to your `.env.local` file

#### Cartesia API Key
1. Visit [Cartesia Dashboard](https://play.cartesia.ai/)
2. Generate an API key
3. Add it to your `.env.local` file

## 🚀 Development

### Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
pnpm build
pnpm start
```

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add the API keys in Vercel dashboard
3. **Deploy**: Vercel will automatically deploy on git push

#### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fai-ng%2Fswift&env=GROQ_API_KEY,CARTESIA_API_KEY&envDescription=Groq%20and%20Cartesia's%20APIs%20are%20used%20for%20transcription%2C%20text%20generation%2C%20and%20speech%20synthesis.&project-name=swift&repository-name=swift&demo-title=Swift&demo-description=A%20fast%2C%20open-source%20voice%20assistant%20powered%20by%20Groq%2C%20Cartesia%2C%20and%20Vercel.&demo-url=https%3A%2F%2Fswift-ai.vercel.app&demo-image=https%3A%2F%2Fswift-ai.vercel.app%2Fopengraph-image.png)

### Manual Deployment

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 🔍 Testing

### Voice Input Testing
1. Allow microphone permissions in your browser
2. Click on the interface to activate voice input
3. Speak clearly and wait for the red glow to appear
4. The system should detect your speech and respond

### Text Input Testing
1. Use the text input field for manual entry
2. Press Enter or click the submit button
3. Verify the response appears correctly

## 🐛 Troubleshooting

### Common Issues

#### Microphone Not Working
- Check browser permissions for microphone access
- Ensure HTTPS is enabled (required for microphone access)
- Try refreshing the page and re-granting permissions

#### API Errors
- Verify API keys are correctly set in `.env.local`
- Check API key validity and quota limits
- Ensure network connectivity to external APIs

#### Audio Playback Issues
- Check browser compatibility (Chrome/Firefox recommended)
- Verify Web Audio API support
- Check for conflicting browser extensions

#### Build Errors
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Clear Next.js cache: `rm -rf .next`
- Verify Node.js version compatibility

## 📊 Performance Monitoring

### Vercel Analytics
- Automatically tracks user interactions
- Monitors latency and error rates
- Provides usage analytics

### Browser DevTools
- Use Network tab to monitor API calls
- Check Console for error messages
- Use Performance tab for timing analysis

## 🔒 Security Considerations

- Never commit API keys to version control
- Use environment variables for sensitive data
- Implement rate limiting for API endpoints
- Regularly rotate API keys
- Monitor API usage for unauthorized access

## 📞 Support

For additional help:
- Check the main project README
- Review GitHub Issues for similar problems
- Test with the provided demo deployment
- Contact the development team for specific issues
