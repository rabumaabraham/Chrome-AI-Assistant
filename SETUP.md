# AI Assistant Chrome Extension - Setup Guide

## Quick Setup

### 1. Backend Setup
```bash
cd backend
npm install
```

### 2. Configure OpenRouter API Key
Create a `.env` file in the `backend` directory:
```env
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-3.5-turbo
OPENROUTER_MAX_TOKENS=2000
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Get OpenRouter API Key
1. Go to [OpenRouter.ai](https://openrouter.ai)
2. Sign up and get your API key
3. Add credits to your account
4. Replace `your_openrouter_api_key_here` in `.env`

### 4. Start Backend
```bash
cd backend
npm start
```

### 5. Load Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension` folder

### 6. Test the Extension
1. Open any webpage
2. Click the AI Assistant extension icon
3. Ask a question about the page content
4. The AI will analyze the DOM and respond

## Features

- **Smart DOM Reading**: Extracts page content, tables, forms, images
- **Question-Aware Targeting**: Focuses on relevant content based on your question
- **Voice Input**: Speak your questions
- **Screenshot OCR**: Extract text from images
- **History**: Save and revisit previous questions
- **Dark/Light Theme**: Toggle between themes

## Usage Examples

- "What products are in the table?"
- "What form fields are available?"
- "Summarize this article"
- "What images are on this page?"
- "Explain this code snippet"

## Troubleshooting

### Backend Issues
- Check if port 3000 is available
- Verify OpenRouter API key is correct
- Check console logs for errors

### Extension Issues
- Reload the extension in Chrome
- Check browser console for errors
- Ensure backend is running on localhost:3000

### API Issues
- Verify OpenRouter account has credits
- Check API key permissions
- Monitor rate limits
