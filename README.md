# AI Assistant Chrome Extension

A professional Chrome Extension that allows users to ask questions about webpage content, PDFs, and images using AI. The extension includes OCR capabilities, voice input, and a secure backend API.

## 🚀 Features

- **Webpage Analysis**: Ask questions about any webpage content
- **PDF Support**: Extract and analyze text from PDFs
- **Image OCR**: Extract text from images using Tesseract.js
- **Voice Input**: Use speech recognition for hands-free interaction
- **Screenshot OCR**: Capture and analyze screenshots
- **Context Menu**: Right-click on text for quick AI actions
- **Floating Button**: Easy access on every webpage
- **Secure Backend**: All AI processing happens on your server
- **Dark/Light Mode**: Customizable UI themes

## 📁 Project Structure

```
Chrome AI Assistant/
├── chrome-extension/          # Chrome Extension files
│   ├── manifest.json         # Extension manifest
│   ├── popup.html           # Extension popup UI
│   ├── popup.css            # Popup styles
│   ├── popup.js             # Popup functionality
│   ├── content.js           # Content script
│   ├── content.css          # Content script styles
│   ├── background.js        # Background service worker
│   └── icons/               # Extension icons
├── backend/                  # Backend API server
│   ├── index.js             # Main server file
│   ├── package.json         # Backend dependencies
│   ├── env.example          # Environment variables template
│   ├── routes/              # API routes
│   │   ├── ai.js           # AI question endpoint
│   │   ├── ocr.js          # OCR processing
│   │   ├── pdf.js          # PDF processing
│   │   └── health.js       # Health checks
│   └── middleware/          # Custom middleware
│       ├── auth.js         # Authentication
│       └── validation.js   # Request validation
└── README.md               # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ 
- Chrome browser
- OpenAI API key

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your settings:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the backend server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

   The API will be available at `http://localhost:3000`

### Chrome Extension Setup

1. **Open Chrome and go to Extensions:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

2. **Load the extension:**
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

3. **Configure the extension:**
   - Click the extension icon in Chrome toolbar
   - Click the settings button (⚙️)
   - Set the backend URL to `http://localhost:3000`
   - Add your OpenAI API key (optional, can use backend's key)

## 🔧 Configuration

### Backend Configuration

The backend can be configured using environment variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OCR Configuration
TESSERACT_LANG=eng
```

### Extension Configuration

The extension settings can be accessed through the popup:

- **Backend URL**: URL of your backend API
- **API Key**: Optional OpenAI API key (uses backend key if not provided)
- **Voice Input**: Enable/disable speech recognition
- **OCR Features**: Enable/disable image processing
- **Theme**: Light or dark mode

## 🚀 Usage

### Basic Usage

1. **Open any webpage**
2. **Click the floating AI button** (bottom right) or **extension icon**
3. **Type your question** or use voice input
4. **Get AI-powered answers** about the page content

### Advanced Features

- **Right-click on text** → Select "Ask AI about this text"
- **Screenshot OCR**: Click camera button to capture and analyze screenshots
- **PDF Analysis**: Upload PDFs for text extraction and analysis
- **Voice Input**: Click microphone button for speech recognition

### Keyboard Shortcuts

- `Ctrl/Cmd + Shift + A`: Open AI Assistant
- `Escape`: Close context menu

## 🔒 Security

- **API Keys**: Stored securely on backend, never exposed to frontend
- **CORS**: Configured to only allow requests from extension
- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: All requests are validated before processing
- **Error Handling**: Sensitive information is not leaked in error messages

## 📊 API Endpoints

### Health Check
- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed health with service checks

### AI Assistant
- `POST /ask-ai` - Ask questions about content
  ```json
  {
    "question": "What is this page about?",
    "context": {
      "title": "Page Title",
      "textContent": "Page content...",
      "headings": ["H1", "H2"]
    },
    "url": "https://example.com"
  }
  ```

### OCR Processing
- `POST /ocr` - Extract text from images
  ```json
  {
    "image": "data:image/png;base64,iVBORw0KGgo...",
    "language": "eng"
  }
  ```

### PDF Processing
- `POST /pdf/extract` - Extract text from PDFs
- `POST /pdf/analyze` - Analyze if PDF needs OCR
- `POST /pdf/ocr` - OCR processing for scanned PDFs

## 🚀 Deployment

### Backend Deployment

#### Option 1: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to backend directory: `cd backend`
3. Deploy: `vercel`
4. Set environment variables in Vercel dashboard

#### Option 2: Railway
1. Connect your GitHub repository to Railway
2. Select the backend folder as root directory
3. Set environment variables in Railway dashboard
4. Deploy automatically

#### Option 3: Render
1. Create new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Configure environment variables

### Extension Deployment

1. **Package the extension:**
   - Zip the `chrome-extension` folder
   - Update backend URL in popup.js if needed

2. **Publish to Chrome Web Store:**
   - Go to Chrome Developer Dashboard
   - Upload the zip file
   - Fill in store listing details
   - Submit for review

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Manual Testing
1. Start backend server
2. Load extension in Chrome
3. Test various features:
   - Ask questions about webpages
   - Test voice input
   - Try screenshot OCR
   - Test PDF upload

## 🔧 Troubleshooting

### Common Issues

1. **Extension not loading:**
   - Check Chrome Developer Console for errors
   - Ensure all files are in correct locations
   - Verify manifest.json syntax

2. **Backend connection failed:**
   - Check if backend server is running
   - Verify CORS configuration
   - Check network connectivity

3. **OpenAI API errors:**
   - Verify API key is correct
   - Check API quota and billing
   - Ensure model is available

4. **OCR not working:**
   - Check if Tesseract.js is properly installed
   - Verify image format is supported
   - Check browser console for errors

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub

---

**Built with ❤️ for the AI community**
