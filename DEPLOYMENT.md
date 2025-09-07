# Deployment Guide

This guide covers deploying the AI Assistant Chrome Extension and its backend API to various platforms.

## 🚀 Backend Deployment

### Option 1: Vercel (Recommended)

Vercel is ideal for Node.js APIs with automatic scaling and global CDN.

#### Prerequisites
- Vercel account
- GitHub repository
- Vercel CLI installed (`npm i -g vercel`)

#### Steps
1. **Prepare the backend:**
   ```bash
   cd backend
   npm install
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel
   ```

3. **Configure environment variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `env.example`

4. **Update extension configuration:**
   - Update backend URL in extension settings
   - Use the Vercel deployment URL

#### Vercel Configuration
Create `vercel.json` in backend folder:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Option 2: Railway

Railway provides simple deployment with automatic builds.

#### Steps
1. **Connect GitHub repository to Railway**
2. **Select backend folder as root directory**
3. **Set environment variables:**
   - Go to Project → Variables
   - Add all variables from `env.example`
4. **Deploy automatically**

#### Railway Configuration
Create `railway.json` in backend folder:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

### Option 3: Render

Render offers free tier with easy deployment.

#### Steps
1. **Create new Web Service on Render**
2. **Connect GitHub repository**
3. **Configure service:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** `backend`
4. **Set environment variables**
5. **Deploy**

### Option 4: Heroku

#### Prerequisites
- Heroku CLI installed
- Heroku account

#### Steps
1. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set OPENAI_API_KEY=your_key_here
   heroku config:set NODE_ENV=production
   # Add other variables as needed
   ```

3. **Deploy:**
   ```bash
   git subtree push --prefix=backend heroku main
   ```

4. **Scale the app:**
   ```bash
   heroku ps:scale web=1
   ```

### Option 5: DigitalOcean App Platform

#### Steps
1. **Create new app on DigitalOcean**
2. **Connect GitHub repository**
3. **Configure:**
   - **Source Directory:** `backend`
   - **Build Command:** `npm install`
   - **Run Command:** `npm start`
4. **Set environment variables**
5. **Deploy**

## 🔧 Environment Variables for Production

Set these environment variables in your deployment platform:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production

# Optional
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
PORT=3000
ALLOWED_ORIGINS=https://your-domain.com,chrome-extension://*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

## 🌐 Chrome Extension Deployment

### Option 1: Chrome Web Store (Recommended)

#### Prerequisites
- Chrome Developer account ($5 one-time fee)
- Extension packaged and tested
- Privacy policy and terms of service

#### Steps
1. **Package the extension:**
   ```bash
   # Create a zip file of the chrome-extension folder
   zip -r ai-assistant-extension.zip chrome-extension/
   ```

2. **Update configuration:**
   - Update backend URL in `popup.js`
   - Ensure all icons are present
   - Test thoroughly

3. **Upload to Chrome Web Store:**
   - Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Click "Add new item"
   - Upload the zip file
   - Fill in store listing details

4. **Store listing requirements:**
   - **Name:** AI Assistant
   - **Description:** Detailed description of features
   - **Screenshots:** 1-5 screenshots (1280x800 or 640x400)
   - **Icon:** 128x128 PNG icon
   - **Category:** Productivity
   - **Language:** English
   - **Privacy Policy:** Required
   - **Terms of Service:** Optional but recommended

5. **Submit for review:**
   - Review all information
   - Submit for review (takes 1-3 days)

### Option 2: Self-Hosted Distribution

#### For Enterprise/Internal Use

1. **Package the extension:**
   ```bash
   zip -r ai-assistant-extension.zip chrome-extension/
   ```

2. **Host on your server:**
   - Upload zip file to your web server
   - Provide download link to users

3. **Installation instructions:**
   - Download the zip file
   - Extract to a folder
   - Open Chrome → Extensions → Developer mode
   - Click "Load unpacked" → Select folder

## 🔒 Security Considerations

### Backend Security
- **HTTPS Only:** Always use HTTPS in production
- **API Key Protection:** Never expose API keys in frontend
- **Rate Limiting:** Implement proper rate limiting
- **CORS Configuration:** Restrict to specific origins
- **Input Validation:** Validate all inputs
- **Error Handling:** Don't leak sensitive information

### Extension Security
- **Content Security Policy:** Implement proper CSP
- **Permission Minimization:** Only request necessary permissions
- **Code Obfuscation:** Consider obfuscating sensitive code
- **Update Mechanism:** Implement secure update mechanism

## 📊 Monitoring and Analytics

### Backend Monitoring
- **Health Checks:** Implement `/health` endpoints
- **Logging:** Use structured logging (Winston)
- **Error Tracking:** Consider Sentry or similar
- **Performance Monitoring:** Monitor response times
- **Uptime Monitoring:** Use UptimeRobot or similar

### Extension Analytics
- **Usage Tracking:** Track feature usage (anonymously)
- **Error Reporting:** Implement error reporting
- **Performance Metrics:** Monitor extension performance
- **User Feedback:** Collect user feedback

## 🚀 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd backend
        npm ci
    
    - name: Run tests
      run: |
        cd backend
        npm test
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        working-directory: backend
```

## 🔧 Troubleshooting Deployment

### Common Issues

1. **Build Failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for syntax errors

2. **Environment Variables:**
   - Ensure all required variables are set
   - Check variable names and values
   - Verify no typos in variable names

3. **CORS Issues:**
   - Update ALLOWED_ORIGINS with correct URLs
   - Check if extension ID is correct
   - Verify HTTPS is used in production

4. **API Key Issues:**
   - Verify OpenAI API key is valid
   - Check API quota and billing
   - Ensure key has proper permissions

5. **Extension Loading Issues:**
   - Check manifest.json syntax
   - Verify all files are present
   - Test in different Chrome versions

### Debug Commands

```bash
# Check backend health
curl https://your-backend-url.com/health

# Test API endpoint
curl -X POST https://your-backend-url.com/ask-ai \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}'

# Check extension in Chrome
# Go to chrome://extensions/ and check for errors
```

## 📈 Performance Optimization

### Backend Optimization
- **Caching:** Implement Redis caching for frequent requests
- **CDN:** Use CDN for static assets
- **Database:** Consider database for storing user preferences
- **Load Balancing:** Use load balancer for high traffic
- **Monitoring:** Implement APM (Application Performance Monitoring)

### Extension Optimization
- **Lazy Loading:** Load resources only when needed
- **Caching:** Cache responses locally
- **Bundle Size:** Minimize extension size
- **Memory Usage:** Monitor memory usage
- **Background Scripts:** Optimize background script performance

## 🎯 Production Checklist

### Backend Checklist
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Error handling in place
- [ ] Logging configured
- [ ] Health checks working
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Security headers configured

### Extension Checklist
- [ ] All icons present and correct sizes
- [ ] Manifest.json syntax correct
- [ ] Backend URL updated
- [ ] Permissions minimized
- [ ] Content Security Policy configured
- [ ] Error handling implemented
- [ ] User feedback mechanism
- [ ] Update mechanism in place
- [ ] Privacy policy available
- [ ] Terms of service available

---

**Ready to deploy? Follow the steps above and your AI Assistant will be live! 🚀**
