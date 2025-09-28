# Setup Guide

## Prerequisites

Before setting up the Chrome AI Assistant, ensure you have the following:

- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **Chrome Browser**: Latest version recommended
- **OpenRouter API Key**: Get from [openrouter.ai](https://openrouter.ai/)
- **Git**: For version control (optional)

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-3.5-turbo
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Server Configuration
PORT=3000
NODE_ENV=development

# Security (Optional)
API_KEY_REQUIRED=false
RATE_LIMIT_MAX=100

# OCR Configuration
OCR_LANGUAGE=eng
MAX_IMAGE_SIZE=5242880
MAX_IMAGES_PER_REQUEST=3

# PDF Configuration
MAX_PDF_SIZE=10485760
MAX_PDF_PAGES=50

# Logging
LOG_LEVEL=info
```

### 3. Start the Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` by default.

### 4. Verify Backend Setup

Test the backend by visiting:
- Health check: `http://localhost:3000/health`
- API documentation: `http://localhost:3000/`

## Chrome Extension Setup

### 1. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. The extension should appear in your extensions list

### 2. Configure the Extension

1. Click on the extension icon in the Chrome toolbar
2. Click the settings gear (⚙️) in the popup
3. Verify the backend URL is set to `http://localhost:3000`
4. Enable voice input if desired
5. Save your settings

### 3. Test the Extension

1. Navigate to any webpage
2. Select some text and right-click
3. Choose "🤖 Ask AI about this text" from the context menu
4. Or click the extension icon and type a question

## Development Setup

### Backend Development

```bash
cd backend

# Install development dependencies
npm install --save-dev nodemon

# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Extension Development

```bash
cd chrome-extension

# Make changes to the source code
# The extension will automatically reload in Chrome

# For debugging:
# 1. Go to chrome://extensions/
# 2. Click "Inspect views: background page" for background script
# 3. Right-click extension icon → "Inspect popup" for popup debugging
```

## Configuration Options

### Backend Configuration

The backend uses a centralized configuration system. Key options:

- **PORT**: Server port (default: 3000)
- **OPENROUTER_API_KEY**: Your OpenRouter API key
- **OPENROUTER_MODEL**: AI model to use
- **RATE_LIMIT_MAX**: Maximum requests per window
- **OCR_LANGUAGE**: Language for OCR processing
- **MAX_IMAGE_SIZE**: Maximum image size for OCR (bytes)
- **MAX_PDF_SIZE**: Maximum PDF size for processing (bytes)

### Extension Configuration

The extension settings include:

- **Backend URL**: API server endpoint
- **Voice Enabled**: Enable/disable voice input
- **Voice Language**: Speech recognition language
- **History Limit**: Maximum conversation history items

## Troubleshooting

### Common Issues

#### Backend Won't Start
- Check if port 3000 is already in use
- Verify Node.js version is 18+
- Check environment variables are set correctly
- Review logs in `backend/logs/`

#### Extension Won't Load
- Ensure "Developer mode" is enabled
- Check for JavaScript errors in the console
- Verify all files are present in the extension folder
- Try reloading the extension

#### API Requests Failing
- Verify backend server is running
- Check CORS settings in backend
- Ensure OpenRouter API key is valid
- Check network connectivity

#### OCR Not Working
- Verify images are accessible (no CORS issues)
- Check image format is supported
- Ensure Tesseract.js is properly installed
- Review OCR logs for errors

#### PDF Processing Failing
- Check PDF file size limits
- Verify PDF is not password protected
- Ensure pdf-parse library is installed
- Review PDF processing logs

### Debug Mode

Enable debug logging by setting:

```env
LOG_LEVEL=debug
```

This will provide detailed logs for troubleshooting.

### Log Files

Backend logs are stored in `backend/logs/`:
- `app.log`: General application logs
- `ai.log`: AI service logs
- `ocr.log`: OCR processing logs
- `pdf.log`: PDF processing logs
- `auth.log`: Authentication logs
- `validation.log`: Request validation logs

## Production Deployment

### Backend Deployment

1. **Environment Setup**:
   ```env
   NODE_ENV=production
   PORT=3000
   OPENROUTER_API_KEY=your_production_key
   ```

2. **Process Management**:
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start src/server.js --name "ai-assistant"
   ```

3. **Reverse Proxy** (Nginx example):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **SSL Certificate**:
   Use Let's Encrypt or your preferred SSL provider.

### Extension Deployment

1. **Build for Production**:
   - Test thoroughly in development
   - Update version in `manifest.json`
   - Create production build if needed

2. **Chrome Web Store**:
   - Create developer account
   - Package extension as .zip
   - Submit for review
   - Publish when approved

## Security Considerations

### Backend Security
- Use HTTPS in production
- Set up proper CORS policies
- Implement rate limiting
- Use environment variables for secrets
- Regular security updates

### Extension Security
- Follow Chrome Web Store policies
- Validate all user inputs
- Use secure communication protocols
- Regular security audits

## Performance Optimization

### Backend Optimization
- Enable compression
- Use connection pooling
- Implement caching
- Monitor resource usage

### Extension Optimization
- Minimize bundle size
- Use efficient DOM manipulation
- Implement lazy loading
- Optimize API calls

## Support

For additional help:
- Check the [README.md](README.md) for general information
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Create an issue on GitHub for bugs
- Check the troubleshooting section above

## Next Steps

After successful setup:
1. Test all functionality
2. Configure your preferred settings
3. Explore the advanced features
4. Consider production deployment
5. Contribute to the project