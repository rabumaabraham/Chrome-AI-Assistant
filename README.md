# Chrome AI Assistant

A professional, scalable Chrome extension that provides AI-powered assistance for webpage content analysis, PDF reading, image OCR, and voice input. Built with modern architecture and best practices.

## 🌟 Features

- **🤖 AI-Powered Analysis**: Ask questions about any webpage content using OpenRouter's GPT models
- **📄 PDF Reading**: Automatically extract and analyze text from PDF documents
- **🖼️ Image OCR**: Extract text from images using optical character recognition
- **🎤 Voice Input**: Hands-free operation with speech recognition
- **🎯 Smart Context**: Question-aware content extraction for relevant answers
- **💾 History & Settings**: Persistent storage of conversations and preferences
- **🔒 Secure**: Professional security implementation with rate limiting and CORS

## 🏗️ Architecture

### Backend (Node.js + Express)
```
backend/
├── src/
│   ├── app.js              # Express application setup
│   ├── server.js           # Server entry point
│   ├── config/             # Configuration management
│   ├── controllers/        # Request controllers
│   ├── services/           # Business logic services
│   ├── middleware/         # Express middleware
│   └── routes/             # API route definitions
├── logs/                   # Application logs
└── package.json
```

### Frontend (Chrome Extension)
```
chrome-extension/
├── src/
│   ├── core/               # Core functionality
│   ├── services/           # Service layer
│   ├── content/            # Content script modules
│   ├── popup/              # Popup UI modules
│   └── background/         # Background script modules
├── icons/                  # Extension icons
├── manifest.json           # Extension manifest
└── popup.html              # Popup UI
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Chrome browser
- OpenRouter API key

### Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your OpenRouter API key
npm start
```

### Extension Setup
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `chrome-extension` folder
4. Configure the extension with your backend URL

### Environment Variables
```env
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-3.5-turbo
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
API_KEY_REQUIRED=false
RATE_LIMIT_MAX=100
```

## 🔧 Configuration

### Backend Configuration
The backend uses a centralized configuration system in `backend/config/index.js`:

- **Server Settings**: Port, host, environment
- **AI Settings**: Model, API key, token limits
- **Security Settings**: Rate limiting, CORS, authentication
- **OCR Settings**: Image processing, language detection
- **PDF Settings**: File size limits, page limits

### Extension Configuration
The extension uses a modular configuration system:

- **Backend URL**: API endpoint configuration
- **Voice Settings**: Language, enabled/disabled
- **UI Settings**: Theme, animations, notifications
- **Storage Settings**: History limits, cache settings

## 📚 API Documentation

### Endpoints

#### AI Analysis
```http
POST /ask-ai
Content-Type: application/json

{
  "question": "What is this page about?",
  "context": { /* page content */ },
  "url": "https://example.com"
}
```

#### OCR Processing
```http
POST /ocr
Content-Type: application/json

{
  "imageData": "data:image/png;base64,...",
  "imageInfo": {
    "src": "https://example.com/image.png",
    "alt": "Description",
    "dimensions": "800x600"
  }
}
```

#### PDF Extraction
```http
POST /pdf/extract
Content-Type: application/json

{
  "pdfData": "data:application/pdf;base64,...",
  "options": {
    "maxPages": 10
  }
}
```

### Response Format
```json
{
  "success": true,
  "answer": "AI response text",
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

## 🛠️ Development

### Project Structure
- **Modular Architecture**: Clean separation of concerns
- **Service Layer**: Reusable business logic
- **Configuration Management**: Centralized settings
- **Error Handling**: Comprehensive error management
- **Logging**: Structured logging throughout

### Code Style
- **ES6+ Modules**: Modern JavaScript with import/export
- **Async/Await**: Promise-based asynchronous code
- **Error Handling**: Try-catch blocks with proper error propagation
- **Documentation**: JSDoc comments for all functions
- **Type Safety**: Consistent data structures and validation

### Testing
```bash
# Backend tests
cd backend
npm test

# Extension tests (when implemented)
cd chrome-extension
npm test
```

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Secure cross-origin requests
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error messages
- **Authentication**: API key-based authentication (optional)

## 📊 Monitoring & Logging

### Backend Logging
- **Winston Logger**: Structured JSON logging
- **Service-Specific Logs**: Separate log files per service
- **Request Logging**: Detailed request/response logging
- **Error Tracking**: Comprehensive error logging

### Extension Logging
- **Console Logging**: Development debugging
- **Service Loggers**: Modular logging per service
- **Error Reporting**: Client-side error tracking

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Configure reverse proxy (nginx/Apache)
3. Set up SSL certificates
4. Configure logging and monitoring

### Extension Deployment
1. Build and test the extension
2. Create Chrome Web Store listing
3. Submit for review
4. Publish to store

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow the existing code style
- Add comprehensive documentation
- Include error handling
- Test thoroughly
- Update configuration as needed

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **OpenRouter**: AI model access
- **Tesseract.js**: OCR functionality
- **Sharp**: Image processing
- **Chrome Extensions API**: Browser integration

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

---

**Built with ❤️ for developers and power users**