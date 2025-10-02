# Chrome AI Assistant

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![version](https://img.shields.io/badge/version-1.1.10-blue)

Chrome AI Assistant is a powerful browser extension that brings AI-powered content analysis directly to any webpage. Simply click the extension icon on any website, PDF, or image, and get instant AI insights without leaving your current page. The extension automatically extracts content from webpages, reads text from images via OCR, processes PDF documents, and provides intelligent responses using advanced AI models.

## Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Installation](#installation)
4. [API Reference](#api-reference)
5. [Usage Examples](#usage-examples)

## Features

- **Universal Content Analysis** - Works on any webpage, PDF, or image
- **AI-Powered OCR** - Extract and understand text from images using Tesseract.js
- **PDF Text Extraction** - Read and analyze PDF documents directly in browser
- **Real-time Content Processing** - Instant analysis of webpage content
- **Voice Input Support** - Hands-free interaction with speech recognition
- **Professional Chat Interface** - Modern UI with light/dark themes
- **Smart Content Prioritization** - AI focuses on relevant content based on your questions
- **Cross-Platform Compatibility** - Works on all websites and content types

## Install Extension

- **Chrome Web Store**: [Install Extension](https://chromewebstore.google.com/detail/bcoaoaimnkbcajebhompljgmiaclbnkm?utm_source=item-share-cb)

## Tech Stack

### Chrome Extension
- **Manifest V3** - Latest Chrome extension standards
- **Vanilla JavaScript** - Pure JS for maximum performance and compatibility
- **CSS3** - Modern styling with responsive design
- **HTML5** - Semantic markup and accessibility

### Backend Services
- **Node.js** - JavaScript runtime for server-side processing
- **Express.js** - Fast, lightweight web framework
- **Tesseract.js** - Advanced OCR engine for image text extraction
- **pdf-parse** - PDF document text extraction
- **Sharp** - High-performance image processing

### AI Integration
- **OpenRouter API** - Access to multiple AI models (gpt-3.5-turbo, etc.)
- **Content Intelligence** - Smart content filtering and prioritization
- **Context-Aware Responses** - AI understands webpage context

### Browser APIs
- **Chrome Extensions API** - Tab management and content injection
- **Web Speech API** - Voice input and speech recognition
- **DOM Manipulation** - Advanced webpage content extraction

## Installation

### Development Setup

#### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/rabumaabraham/Chrome-AI-Assistant.git
cd Chrome-AI-Assistant

# Setup environment
cp .env.example .env
# Add your OpenRouter API key to .env

# Start with Docker
docker-compose up -d

# Load Extension in Chrome
# 1. Open Chrome and go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the chrome-extension folder
```

#### Option 2: Manual Setup

```bash
# Clone repository
git clone https://github.com/rabumaabraham/Chrome-AI-Assistant.git
cd Chrome-AI-Assistant

# Setup Backend
cd backend
npm install

# Setup environment
cp env.example .env
# Add your OpenRouter API key to .env

# Start backend server
npm start

# Load Extension in Chrome
# 1. Open Chrome and go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the chrome-extension folder
```

**Required API Keys:**
- OpenRouter API key (for AI responses)
- Backend server URL (for OCR and PDF processing)

### Production Installation

1. Download the extension from Chrome Web Store
2. Click "Add to Chrome" to install
3. No backend setup required - uses hosted services

## API Reference

**Base URL:** `http://localhost:3000` (Development) or `https://chrome-ai-assistant.onrender.com` (Production)

### AI Chat Endpoints
- **POST** `/api/ask-ai` - Send question with webpage context to AI
  ```json
  {
    "question": "What is this page about?",
    "context": {
      "url": "https://example.com",
      "title": "Page Title",
      "textContent": "Extracted page content...",
      "ocrText": "Text from images...",
      "pdfText": "PDF content..."
    }
  }
  ```

### OCR Processing
- **POST** `/api/ocr` - Extract text from images
  ```json
  {
    "imageData": "data:image/png;base64,...",
    "imageInfo": {
      "src": "image-url",
      "width": 800,
      "height": 600
    }
  }
  ```

### PDF Processing
- **POST** `/api/pdf/extract` - Extract text from PDF documents
  ```json
  {
    "pdfData": "data:application/pdf;base64,..."
  }
  ```

### Health Check
- **GET** `/api/health` - Server status and health monitoring

## Usage Examples

### Webpage Analysis
```
User: "What are the main topics discussed on this page?"
AI: Analyzes webpage content and provides a comprehensive summary of key topics, themes, and important information.
```

### Image Text Extraction
```
User: "What does this image say?"
AI: Uses OCR to read text from images, screenshots, memes, or documents and provides the extracted content with context.
```

### PDF Document Processing
```
User: "Summarize this PDF document"
AI: Extracts and analyzes PDF content, providing detailed summaries, key points, and relevant information.
```

### Voice Interaction
```
User: *Speaks* "Explain the main points from this article"
AI: Processes voice input, analyzes webpage content, and responds with comprehensive explanations.
```

## Screenshots

<p align="center">
  <img alt="Screenshot 1" src="chrome-extension/templates/screenshots/screenshot%201.png" width="28%">
  <img alt="Screenshot 2" src="chrome-extension/templates/screenshots/screenshot%202.png" width="28%">
  <img alt="Screenshot 3" src="chrome-extension/templates/screenshots/screenshot%203.png" width="28%">
</p>

<details>
  <summary><kbd>▶ View full-size screenshots</kbd></summary>

  <p align="center">
    <img alt="Screenshot 1 full" src="chrome-extension/templates/screenshots/screenshot%201.png">
    <img alt="Screenshot 2 full" src="chrome-extension/templates/screenshots/screenshot%202.png">
    <img alt="Screenshot 3 full" src="chrome-extension/templates/screenshots/screenshot%203.png">
  </p>
</details>

## Content Processing Features

### Intelligent Content Extraction
- **DOM Parsing** - Extracts headings, paragraphs, lists, and structured content
- **Image Detection** - Automatically finds and processes images with text
- **PDF Recognition** - Detects and processes PDF documents
- **Content Prioritization** - AI focuses on most relevant content for your questions

### Advanced OCR Capabilities
- **Multi-format Support** - PNG, JPEG, WebP, and other image formats
- **Text Recognition** - Accurate extraction from screenshots, photos, and documents
- **Context Understanding** - AI interprets extracted text in context
- **Performance Optimized** - Fast processing with timeout protection

### Smart AI Responses
- **Context-Aware** - Understands webpage content and user intent
- **Multi-modal Processing** - Combines text, images, and PDF content
- **Personalized Responses** - Tailored answers based on content type
- **Real-time Processing** - Instant responses with optimized performance

## Docker Deployment

For detailed Docker setup and deployment instructions, see [DOCKER_SETUP.md](DOCKER_SETUP.md).

### Quick Docker Commands
```bash
# Start development environment
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## Deployment

### Chrome Web Store
1. Package extension files
2. Upload to Chrome Web Store Developer Dashboard
3. Submit for review
4. Publish to users worldwide

### Backend Hosting
1. Deploy Node.js backend to hosting service (Heroku, Railway, etc.)
2. Set environment variables
3. Update extension with production backend URL
4. Monitor with health checks


## Performance Optimizations

- **OCR Timeouts** - Maximum 5 seconds per image processing
- **Content Limits** - Processes up to 3 images for optimal speed
- **Smart Filtering** - Skips non-text images (avatars, icons, etc.)
- **Efficient Processing** - Race conditions and timeout protection
- **Memory Management** - Optimized for long browsing sessions

## Security & Privacy

- **Local Processing** - Content extraction happens in browser
- **Secure API Calls** - Encrypted communication with backend
- **No Data Storage** - No user data or content is permanently stored
- **Privacy First** - Respects user privacy and website terms

## Contribution

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/example-feature`
3. Commit your changes: `git commit -m 'Add example feature'`
4. Push to the branch: `git push origin feature/example-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Email:** iamrabuma@gmail.com
- **Issues:** [GitHub Issues](https://github.com/rabumaabraham/Chrome-AI-Assistant/issues)

---

**Transform your browsing experience with AI-powered content analysis!**
