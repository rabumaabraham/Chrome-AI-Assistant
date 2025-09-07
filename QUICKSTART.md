# Quick Start Guide

Get your AI Assistant Chrome Extension up and running in 5 minutes!

## 🚀 Quick Setup (5 Minutes)

### Step 1: Backend Setup (2 minutes)

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp env.example .env
   ```

4. **Add your OpenAI API key to `.env`:**
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

   ✅ Backend running at `http://localhost:3000`

### Step 2: Chrome Extension Setup (2 minutes)

1. **Open Chrome Extensions:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)

2. **Load the extension:**
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

3. **Configure the extension:**
   - Click the AI Assistant icon in Chrome toolbar
   - Click settings (⚙️) if needed
   - Backend URL should be `http://localhost:3000`

   ✅ Extension loaded and ready!

### Step 3: Test It Out (1 minute)

1. **Go to any webpage** (e.g., Wikipedia)
2. **Click the floating AI button** (bottom right) or extension icon
3. **Ask a question** like "What is this page about?"
4. **Get your AI answer!** 🎉

## 🎯 Quick Features Test

### Test Basic Functionality
- [ ] Ask about page content
- [ ] Try voice input (click 🎤)
- [ ] Test screenshot OCR (click 📷)
- [ ] Right-click on text → "Ask AI about this text"

### Test Advanced Features
- [ ] Upload a PDF and ask questions
- [ ] Take a screenshot and extract text
- [ ] Use keyboard shortcut: `Ctrl+Shift+A`
- [ ] Switch between light/dark themes

## 🔧 Quick Troubleshooting

### Backend Issues
```bash
# Check if backend is running
curl http://localhost:3000/health

# Check logs
cd backend && npm run dev
```

### Extension Issues
- **Not loading?** Check Chrome Developer Console (`F12`)
- **Can't connect?** Verify backend URL in settings
- **No response?** Check if OpenAI API key is valid

### Common Fixes
1. **"Connection failed"** → Check if backend is running
2. **"Invalid API key"** → Verify OpenAI key in `.env`
3. **"Extension not loading"** → Check manifest.json syntax
4. **"CORS error"** → Update backend URL in extension settings

## ⚡ Quick Configuration

### Backend Configuration
Edit `backend/.env`:
```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4
PORT=3000
```

### Extension Configuration
- **Backend URL:** `http://localhost:3000`
- **Voice Input:** Enabled by default
- **OCR Features:** Enabled by default
- **Theme:** Auto (follows system)

## 🚀 Quick Deployment

### Deploy Backend to Vercel (1 minute)
```bash
cd backend
npm i -g vercel
vercel
# Follow prompts, add environment variables
```

### Deploy Extension to Chrome Web Store
1. Zip the `chrome-extension` folder
2. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Upload zip file
4. Fill in store details
5. Submit for review

## 📱 Mobile/Alternative Setup

### For Mobile Testing
- Use Chrome on Android/iOS
- Load extension via Chrome DevTools
- Test voice input functionality

### For Other Browsers
- **Firefox:** Convert manifest to v2, use WebExtensions API
- **Edge:** Should work with minimal changes
- **Safari:** Requires Safari App Extension conversion

## 🎨 Customization

### Change AI Model
Edit `backend/.env`:
```env
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4, claude-3, etc.
```

### Customize UI
Edit `chrome-extension/popup.css`:
```css
:root {
  --accent-color: #your-color;
  --bg-color: #your-bg;
}
```

### Add Custom Features
- Edit `chrome-extension/popup.js` for UI changes
- Edit `backend/routes/ai.js` for AI behavior
- Edit `chrome-extension/content.js` for page interaction

## 🔒 Security Quick Tips

### Backend Security
- ✅ Never commit `.env` file
- ✅ Use HTTPS in production
- ✅ Set proper CORS origins
- ✅ Implement rate limiting

### Extension Security
- ✅ Minimize permissions in manifest.json
- ✅ Validate all user inputs
- ✅ Use Content Security Policy
- ✅ Regular security updates

## 📊 Quick Monitoring

### Check Backend Health
```bash
curl http://localhost:3000/health
```

### Check Extension Status
- Go to `chrome://extensions/`
- Look for error messages
- Check "Errors" button if available

### Monitor Usage
- Check backend logs
- Monitor OpenAI API usage
- Track extension analytics

## 🆘 Need Help?

### Quick Resources
- **Full Documentation:** See `README.md`
- **Deployment Guide:** See `DEPLOYMENT.md`
- **API Reference:** Check backend routes
- **Extension API:** Check Chrome Extensions docs

### Common Issues
1. **"Module not found"** → Run `npm install` in backend
2. **"Permission denied"** → Check Chrome extension permissions
3. **"API quota exceeded"** → Check OpenAI billing
4. **"CORS error"** → Update backend CORS settings

### Getting Support
- Check the troubleshooting section
- Review error messages carefully
- Test with simple requests first
- Check browser console for errors

---

**That's it! You should now have a fully functional AI Assistant Chrome Extension. Happy coding! 🎉**
