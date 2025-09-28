# Chrome AI Assistant - Testing Guide

## 🧪 Complete Testing Instructions

This guide will help you verify that all features of your Chrome AI Assistant are working correctly.

## 📋 Pre-Testing Checklist

### Backend Setup
- [ ] Backend server is running (`npm start` in backend directory)
- [ ] Health check passes: `http://localhost:3000/health`
- [ ] OpenRouter API key is configured in `.env`
- [ ] All dependencies are installed

### Extension Setup
- [ ] Chrome extension is loaded (Developer mode enabled)
- [ ] Extension appears in Chrome toolbar
- [ ] No errors in extension console
- [ ] Backend URL is set to `http://localhost:3000`

## 🚀 Step-by-Step Testing

### 1. Basic Text Content Testing

**Test Page**: Open `test-extension.html` in your browser

**Test Questions**:
```
"What is this page about?"
"Summarize the content on this page"
"What are the main sections?"
"Tell me about the test instructions"
```

**Expected Results**:
- ✅ AI should analyze the text content
- ✅ Should mention it's a test page for Chrome AI Assistant
- ✅ Should reference different sections (tables, images, PDFs)
- ✅ Response should be relevant and accurate

### 2. Table Data Analysis Testing

**Test Questions**:
```
"What data is in the table?"
"What products are in stock?"
"What's the most expensive item?"
"List all the categories"
```

**Expected Results**:
- ✅ AI should read and understand table structure
- ✅ Should correctly identify in-stock vs out-of-stock items
- ✅ Should identify prices and categories
- ✅ Should provide accurate answers about the data

### 3. Image OCR Testing

**Test Questions**:
```
"What do you see in the images?"
"Describe the first image"
"What text is in the images?"
"Tell me about the sample images"
```

**Expected Results**:
- ✅ AI should detect images on the page
- ✅ OCR should extract text from placeholder images
- ✅ Should mention "Sample Image 1" and "Another Test Image"
- ✅ Should describe image colors and content

### 4. PDF Content Testing

**Test Process**:
1. Click the PDF link in the test page
2. Wait for PDF to load in browser
3. Ask questions about the PDF content

**Test Questions**:
```
"Tell me about this CV"
"What information is in the PDF?"
"Who is this CV for?"
"What are the key details?"
```

**Expected Results**:
- ✅ Should detect PDF viewer
- ✅ Should extract text content from PDF
- ✅ Should provide specific information from the CV
- ✅ Should mention name, experience, or other CV details

### 5. Voice Input Testing (Optional)

**Test Process**:
1. Click the voice button in extension
2. Speak a question clearly
3. Verify text appears in input field

**Test Phrases**:
```
"What is this page about?"
"Tell me about the table"
"Describe the images"
```

**Expected Results**:
- ✅ Voice button should activate recording
- ✅ Speech should be converted to text
- ✅ Text should appear in question input
- ✅ Should work with different languages (if configured)

### 6. History and Settings Testing

**History Testing**:
1. Ask several questions
2. Click history button
3. Verify previous questions/answers appear
4. Click on history item to reload

**Settings Testing**:
1. Click settings button
2. Modify backend URL (if needed)
3. Toggle voice settings
4. Save settings and verify persistence

**Expected Results**:
- ✅ History should save questions and answers
- ✅ History should be clickable to reload
- ✅ Settings should save and persist
- ✅ Clear history should work

## 🔍 Advanced Testing Scenarios

### Real Website Testing

**Test on Various Sites**:
1. **News Websites**: Ask "What's the main story?"
2. **E-commerce**: Ask "What products are shown?"
3. **Documentation**: Ask "What does this page explain?"
4. **Social Media**: Ask "What posts are visible?"

### Edge Cases Testing

**Test These Scenarios**:
1. **Empty Pages**: Ask questions on blank pages
2. **Error Pages**: Test on 404 pages
3. **Dynamic Content**: Test on pages with JavaScript-generated content
4. **Large Pages**: Test on pages with lots of content
5. **Image-Heavy Pages**: Test on photo galleries
6. **PDF-Heavy Pages**: Test on pages with multiple PDFs

## 🐛 Troubleshooting Common Issues

### Backend Connection Issues

**Symptoms**: "Cannot connect to backend" error
**Solutions**:
1. Verify backend is running: `http://localhost:3000/health`
2. Check firewall/antivirus blocking port 3000
3. Verify backend URL in extension settings
4. Check browser console for CORS errors

### OCR Not Working

**Symptoms**: AI doesn't see image content
**Solutions**:
1. Check if images are visible and have text
2. Verify OCR service is running in backend
3. Check browser console for OCR errors
4. Test with simple text images first

### PDF Content Not Extracted

**Symptoms**: AI can't read PDF content
**Solutions**:
1. Ensure PDF is opened directly in browser
2. Check if PDF has selectable text (not scanned images)
3. Verify PDF service is running in backend
4. Test with a simple text-based PDF

### Voice Input Issues

**Symptoms**: Voice button doesn't work
**Solutions**:
1. Check browser permissions for microphone
2. Verify HTTPS connection (required for microphone)
3. Test in Chrome (best compatibility)
4. Check if voice service is enabled in settings

## 📊 Performance Testing

### Response Time Testing

**Measure**:
- Time from question submission to response
- OCR processing time for images
- PDF extraction time
- Overall user experience

**Target Performance**:
- Text questions: < 3 seconds
- Image OCR: < 10 seconds
- PDF processing: < 15 seconds

### Memory and Resource Testing

**Monitor**:
- Browser memory usage
- CPU usage during processing
- Network bandwidth usage
- Extension resource consumption

## ✅ Success Criteria

Your Chrome AI Assistant is working correctly if:

1. **Text Analysis**: ✅ Accurately answers questions about webpage text
2. **Table Understanding**: ✅ Can read and analyze table data
3. **Image OCR**: ✅ Extracts and understands text from images
4. **PDF Processing**: ✅ Reads and analyzes PDF content
5. **Voice Input**: ✅ Converts speech to text (if supported)
6. **History Management**: ✅ Saves and retrieves conversation history
7. **Settings Persistence**: ✅ Saves and applies configuration changes
8. **Error Handling**: ✅ Gracefully handles errors and provides feedback
9. **Performance**: ✅ Responds within acceptable time limits
10. **User Experience**: ✅ Provides helpful and relevant responses

## 🎯 Final Verification

**Complete this final test**:

1. Open `test-extension.html`
2. Ask: "What is this page about and what features can I test here?"
3. Verify AI mentions all test features (tables, images, PDFs)
4. Ask: "What products are in the table and which ones are in stock?"
5. Verify AI correctly identifies in-stock items
6. Ask: "What do you see in the images?"
7. Verify AI describes the placeholder images
8. Click the PDF link and ask: "Tell me about this document"
9. Verify AI provides specific information from the PDF

**If all tests pass, your Chrome AI Assistant is fully functional!** 🎉

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check backend logs in terminal
3. Verify all configuration settings
4. Test individual components separately
5. Review the troubleshooting section above

---

**Happy Testing!** 🚀
