// Configuration
const CONFIG = {
    backendUrl: 'https://chrome-ai-assistant.onrender.com/api',
    timeout: 30000
};

// State
let isLoading = false;
let currentQuestion = '';
let isRecording = false;
let recognition = null;

// DOM Elements
let questionInput, askButton, voiceButton, themeToggle, themeIcon, githubButton, messagesContainer, loading, notification;

// Theme state
let isDarkMode = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    setupEventListeners();
    checkBackendHealth();
});

/**
 * Initialize DOM elements
 */
function initializeElements() {
    questionInput = document.getElementById('questionInput');
    askButton = document.getElementById('askBtn');
    voiceButton = document.getElementById('voiceBtn');
    themeToggle = document.getElementById('themeToggle');
    themeIcon = document.getElementById('themeIcon');
    githubButton = document.getElementById('githubBtn');
    messagesContainer = document.getElementById('messagesContainer');
    loading = document.getElementById('loading');
    notification = document.getElementById('notification');
    
    // Auto-resize textarea
    if (questionInput) {
        questionInput.addEventListener('input', autoResizeTextarea);
    }
    
    // Load saved theme
    loadTheme();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    if (askButton) {
        askButton.addEventListener('click', handleAskQuestion);
    }
    
        if (questionInput) {
            questionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskQuestion();
                }
            });
        }
        
        // Add keyboard shortcut for voice input (Ctrl+Shift+V)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                handleVoiceToggle();
            }
        });
    
    if (themeToggle) {
        themeToggle.addEventListener('click', handleThemeToggle);
    }
    
    if (githubButton) {
        githubButton.addEventListener('click', handleGithubClick);
    }
    
    if (voiceButton) {
        voiceButton.addEventListener('click', handleVoiceToggle);
    }
}

/**
 * Handle ask question
 */
async function handleAskQuestion() {
    if (isLoading) {
        return;
    }
    
    const question = questionInput?.value?.trim();
    if (!question) {
        // No notification for empty question - just return
            return;
        }
        
    // Processing question
    
    // First, add user message immediately
    currentQuestion = question;
    addMessage(currentQuestion, 'user');
    
    // Clear input immediately
    if (questionInput) {
        questionInput.value = '';
        autoResizeTextarea();
    }
    
    try {
        // Create AI message bubble with "AI is thinking..." immediately
        const aiMessageId = addThinkingMessage();
        
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Extract page content
        const pageContent = await extractPageContent(tab);
        
        // Send to AI
        const response = await askAI(question, pageContent);
        
        if (response.success) {
            // Replace "AI is thinking..." with actual response
            updateMessage(aiMessageId, response.answer);
        } else {
            throw new Error(response.error || 'AI request failed');
        }
        
    } catch (error) {
        // If there's an error, remove the thinking message
        const aiMessage = document.querySelector('.ai-message[data-thinking="true"]');
        if (aiMessage) {
            aiMessage.remove();
        }
        showNotification(`Error: ${error.message}`, 'error');
    }
}

/**
 * Extract page content from current tab
 */
async function extractPageContent(tab) {
    try {
        // Check if it's a PDF
        const isPdfUrl = tab.url && tab.url.toLowerCase().includes('.pdf');
        
        if (isPdfUrl) {
            try {
                const pdfContent = await extractPDFFromURL(tab.url);
                if (pdfContent) {
                    return {
                        url: tab.url,
                        title: tab.title || 'PDF Document',
                        textContent: pdfContent,
                        visibleText: pdfContent,
                        isPdfViewer: true,
                        currentPdfContent: pdfContent
                    };
                }
            } catch (pdfError) {
                // PDF extraction failed, continue with regular extraction
            }
        }
        
        // Extract regular page content
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractPageContentInTab
        });
        
        const content = results[0]?.result || {};
        
        // Process images with OCR if there are any (limit to 3 images max for speed)
        console.log('Found images for OCR:', content.images?.length || 0);
        if (content.images && content.images.length > 0) {
            console.log('Processing images with OCR...');
            // Limit to first 3 images for faster processing
            const imagesToProcess = content.images.slice(0, 3);
            console.log('Images to process (limited to 3):', imagesToProcess.map(img => ({
                src: img.src?.substring(0, 50) || 'NO_SRC',
                dimensions: `${img.displayWidth}x${img.displayHeight}`,
                testId: img.dataTestId
            })));
            
            // Add timeout for OCR processing
            const ocrPromise = processImagesWithOCR(imagesToProcess);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('OCR timeout')), 10000) // 10 second timeout
            );
            
            try {
                const ocrResults = await Promise.race([ocrPromise, timeoutPromise]);
                console.log('OCR results:', ocrResults.length);
                if (ocrResults.length > 0) {
                    content.ocrText = ocrResults.join('\n\n');
                    // Add OCR text to the main text content
                    content.textContent = (content.textContent || '') + '\n\n' + content.ocrText;
                    content.visibleText = (content.visibleText || '') + '\n\n' + content.ocrText;
                    console.log('Added OCR text to content:', content.ocrText);
                } else {
                    console.log('No OCR text extracted from any images');
                }
            } catch (error) {
                console.log('OCR processing failed or timed out:', error.message);
                // Continue without OCR results
            }
        } else {
            console.log('No images found for OCR processing');
        }
        
        return {
            url: tab.url,
            title: tab.title,
            ...content
        };
        
    } catch (error) {
        return {
            url: tab.url,
            title: tab.title,
            textContent: '',
            visibleText: '',
            isPdfViewer: false
        };
    }
}

/**
 * Process images with OCR
 */
async function processImagesWithOCR(images) {
    const ocrResults = [];
    
    console.log('Processing', images.length, 'images for OCR');
    
    for (const image of images) {
        try {
            console.log('Processing image:', image.src.substring(0, 100), 'Dimensions:', image.width, 'x', image.height);
            
            // Skip certain image types that are unlikely to contain text
            if (image.src && (
                image.src.includes('.gif') || 
                image.src.includes('.svg') ||
                image.src.includes('avatar') ||
                image.src.includes('profile') ||
                image.src.includes('icon')
            )) {
                console.log('Skipping non-text image type:', image.src);
                continue;
            }
            
            // Only process visible images that might contain text
            if (!image.isVisible) {
                console.log('Skipping invisible image');
                continue;
            }
            
            // More lenient size requirements but still filter out very small images
            if (image.displayWidth < 100 || image.displayHeight < 100) {
                console.log('Skipping small image:', image.displayWidth, 'x', image.displayHeight);
                continue;
            }
            
            // Add timeout for individual image processing (5 seconds max per image)
            const imageProcessingPromise = (async () => {
                // Fetch the image
                console.log('Fetching image...');
                const response = await fetch(image.src);
                const blob = await response.blob();
                const imageData = await blobToDataURL(blob);
                
                console.log('Sending to OCR API...');
                // Send to OCR API
                const ocrResponse = await fetch(`${CONFIG.backendUrl}/ocr`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        imageData: imageData,
                        imageInfo: {
                            src: image.src,
                            width: image.width,
                            height: image.height
                        }
                    })
                });
                
                const ocrData = await ocrResponse.json();
                console.log('OCR response:', ocrData);
                
                if (ocrData.success && ocrData.text && ocrData.text.trim().length > 0) {
                    console.log('OCR success:', ocrData.text.trim());
                    return `Image text: ${ocrData.text.trim()}`;
                } else {
                    console.log('OCR failed or no text:', ocrData.error || 'No text extracted');
                    return null;
                }
            })();
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Image processing timeout')), 5000) // 5 second timeout per image
            );
            
            try {
                const result = await Promise.race([imageProcessingPromise, timeoutPromise]);
                if (result) {
                    ocrResults.push(result);
                }
            } catch (error) {
                console.log('Image processing failed or timed out:', error.message);
                // Continue to next image
            }
            
        } catch (error) {
            console.error('OCR processing failed for image:', image.src, error);
        }
    }
    
    console.log('OCR processing complete. Results:', ocrResults.length);
    return ocrResults;
}

/**
 * Extract PDF content from URL
 */
async function extractPDFFromURL(url) {
    try {
        const response = await fetch(url);
        const pdfBlob = await response.blob();
        const pdfData = await blobToDataURL(pdfBlob);
        
        const result = await fetch(`${CONFIG.backendUrl}/pdf/extract`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pdfData: pdfData
            })
        });
        
        const data = await result.json();
        
        if (data.success && data.text) {
            return data.text;
        } else {
            throw new Error(data.error || 'PDF extraction failed');
        }
        
    } catch (error) {
        return null;
    }
}

/**
 * Ask AI
 */
async function askAI(question, context) {
    try {
        const response = await fetch(`${CONFIG.backendUrl}/ask-ai`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                question: question,
                context: context,
                url: context.url
                })
            });

        const data = await response.json();
        return data;
        
    } catch (error) {
        throw error;
    }
}

/**
 * Handle clear
 */
function handleClear() {
    if (questionInput) questionInput.value = '';
    hideResponse();
    // Clear action completed - no notification needed
}

/**
 * Handle voice toggle
 */
function handleVoiceToggle() {
    if (isLoading) {
        // Request in progress - no notification needed
        return;
    }
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification('Speech recognition not supported', 'error');
        return;
    }
    
    if (isRecording) {
        stopVoiceRecording();
    } else {
        startVoiceRecording();
    }
}

/**
 * Start voice recording
 */
function startVoiceRecording() {
    try {
        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        // Update UI
        isRecording = true;
        updateVoiceButton();
        // Voice recording started - update button state only
        
        // Handle results
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (questionInput) {
                questionInput.value = transcript;
            }
            // Voice input received - no notification needed
        };
        
        // Handle errors
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            let errorMessage = 'Voice recognition failed';
            
            switch(event.error) {
                case 'no-speech':
                    errorMessage = 'No speech detected.';
                    break;
                case 'audio-capture':
                    errorMessage = 'Microphone not found.';
                    break;
                case 'not-allowed':
                    errorMessage = 'Microphone access denied.';
                    break;
                case 'network':
                    errorMessage = 'Network error.';
                    break;
                case 'service-not-allowed':
                    errorMessage = 'Speech service not allowed.';
                    break;
                case 'bad-grammar':
                    errorMessage = 'Speech recognition error.';
                    break;
                default:
                    errorMessage = 'Voice recognition failed.';
                    break;
            }
            
            showNotification(errorMessage, 'error');
            stopVoiceRecording();
        };
        
        // Handle end
        recognition.onend = () => {
            stopVoiceRecording();
            // Auto-send the question if there's text in the input
            if (questionInput && questionInput.value.trim()) {
                setTimeout(() => {
                    handleAskQuestion();
                }, 500); // Small delay to ensure UI updates
            }
        };
        
        // Start recognition
        recognition.start();

        } catch (error) {
        console.error('Voice recording setup failed:', error);
        showNotification('Voice recording failed', 'error');
        isRecording = false;
        updateVoiceButton();
    }
}

/**
 * Stop voice recording
 */
function stopVoiceRecording() {
    if (recognition && isRecording) {
        recognition.stop();
    }
    
    isRecording = false;
    updateVoiceButton();
}

/**
 * Update voice button appearance
 */
function updateVoiceButton() {
    if (voiceButton) {
        if (isRecording) {
            voiceButton.innerHTML = '🔴 Stop & Send';
            voiceButton.style.backgroundColor = '#dc3545';
            voiceButton.style.color = 'white';
            voiceButton.disabled = false;
        } else {
            // Keep the original microphone SVG icon
            voiceButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1C10.3431 1 9 2.34315 9 4V10C9 11.6569 10.3431 13 12 13C13.6569 13 15 11.6569 15 10V4C15 2.34315 13.6569 1 12 1Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M19 10V12C19 15.87 15.87 19 12 19S5 15.87 5 12V10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M12 19V23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M8 23H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
            voiceButton.style.backgroundColor = 'transparent';
            voiceButton.style.color = '#6b7280';
            voiceButton.disabled = false;
        }
    }
}

/**
 * Check backend health
 */
async function checkBackendHealth() {
    try {
        const response = await fetch(`${CONFIG.backendUrl}/health`);
        const data = await response.json();
        
        if (data.success) {
            // Backend connected - no notification needed
        } else {
            throw new Error('Backend health check failed');
        }
    } catch (error) {
        showNotification('Backend connection failed', 'error');
    }
}

/**
 * Set loading state
 */
function setLoading(loading) {
    isLoading = loading;
    
    if (askButton) {
        askButton.disabled = loading;
        // Keep the original SVG icon always
        askButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        askButton.style.backgroundColor = '#4f46e5';
        askButton.style.color = 'white';
    }
}

/**
 * Show response (deprecated - now handled directly in askQuestion)
 */
function showResponse(response) {
    // This function is no longer used - messages are handled directly in askQuestion
    addMessage(response, 'ai');
}

/**
 * Hide response
 */
function hideResponse() {
    // Not needed in new chat interface
}

/**
 * Add message to chat
 */
function addMessage(content, sender) {
    if (!messagesContainer) return;
    
    console.log('Adding message:', sender, content);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${sender}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = formatMessage(content);
    
    messageDiv.appendChild(messageContent);
    
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Add AI thinking message
 */
function addThinkingMessage() {
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'ai-message';
    messageDiv.setAttribute('data-thinking', 'true');
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; color: #1f2937;">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    messageDiv.appendChild(messageContent);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageDiv;
}

/**
 * Update message content
 */
function updateMessage(messageElement, newContent) {
    if (!messageElement) return;
    
    const messageContent = messageElement.querySelector('.message-content');
    if (messageContent) {
        messageContent.innerHTML = formatMessage(newContent);
        messageElement.removeAttribute('data-thinking');
    }
    
    // Scroll to bottom
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

/**
 * Format message content
 */
function formatMessage(content) {
    // Basic formatting for code blocks and links
    let formatted = content
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
    
    return formatted;
}

/**
 * Auto-resize textarea
 */
function autoResizeTextarea() {
    if (questionInput) {
        questionInput.style.height = 'auto';
        questionInput.style.height = Math.min(questionInput.scrollHeight, 120) + 'px';
    }
}

/**
 * Handle theme toggle
 */
function handleThemeToggle() {
    isDarkMode = !isDarkMode;
    applyTheme();
    saveTheme();
}

/**
 * Apply theme
 */
function applyTheme() {
    const body = document.body;
    
    if (isDarkMode) {
        body.classList.add('dark-theme');
        // Update icon to moon
        if (themeIcon) {
            themeIcon.innerHTML = `
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            `;
        }
    } else {
        body.classList.remove('dark-theme');
        // Update icon to sun
        if (themeIcon) {
            themeIcon.innerHTML = `
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                <path d="M12 1V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M12 21V23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M4.22 4.22L5.64 5.64" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M18.36 18.36L19.78 19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M1 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M21 12H23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M4.22 19.78L5.64 18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            `;
        }
    }
}

/**
 * Save theme to localStorage
 */
function saveTheme() {
    localStorage.setItem('isDarkMode', isDarkMode.toString());
}

/**
 * Load theme from localStorage
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('isDarkMode');
    if (savedTheme !== null) {
        isDarkMode = savedTheme === 'true';
    }
    applyTheme();
}

/**
 * Handle GitHub button click
 */
function handleGithubClick() {
    // Open GitHub repository in a new tab
    chrome.tabs.create({
        url: 'https://github.com/rabumaabraham/Chrome-AI-Assistant'
    });
}

/**
 * Show loading
 */
function showLoading() {
    if (loading) {
        loading.style.display = 'block';
    }
}

/**
 * Hide loading
 */
function hideLoading() {
    if (loading) {
        loading.style.display = 'none';
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    }
}

/**
 * Convert blob to data URL
 */
function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Extract page content (runs in tab context)
 */
function extractPageContentInTab() {
    try {
        const extractHeadings = () => {
            return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                .map(h => ({
                    level: parseInt(h.tagName.charAt(1)),
                    text: h.textContent.trim(),
                    id: h.id || null
                }))
                .filter(h => h.text.length > 0);
        };

        const extractImages = () => {
            // Enhanced selectors for social media and various platforms
            const selectors = [
                'img', 'picture img', '[role="img"]', '.image', '.photo', '.media',
                // Twitter/X specific
                '[data-testid="tweetPhoto"] img', '[data-testid="tweetPhoto"]',
                '[data-testid="tweet"] img', '[data-testid="tweet"] picture img',
                // Generic social media
                '.tweet img', '.post img', '.media-container img',
                '.image-container img', '.photo-container img',
                // Instagram, Facebook, etc.
                '[data-testid*="image"]', '[data-testid*="photo"]',
                '[aria-label*="image"]', '[aria-label*="photo"]'
            ];
            
            const allImages = Array.from(document.querySelectorAll(selectors.join(', ')));
            
            console.log('Total images found:', allImages.length);
            
            return allImages
                .map(img => {
                    // Get actual rendered dimensions
                    const rect = img.getBoundingClientRect();
                    const style = window.getComputedStyle(img);
                    
                    const imageData = {
                        src: img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy') || img.getAttribute('data-original'),
                        alt: img.alt,
                        title: img.title,
                        width: img.naturalWidth || img.width || rect.width,
                        height: img.naturalHeight || img.height || rect.height,
                        nearbyText: img.parentElement?.textContent?.substring(0, 200) || '',
                        isVisible: img.offsetWidth > 0 && img.offsetHeight > 0 && style.display !== 'none' && style.visibility !== 'hidden',
                        displayWidth: rect.width,
                        displayHeight: rect.height,
                        tagName: img.tagName,
                        className: img.className,
                        id: img.id,
                        dataTestId: img.getAttribute('data-testid')
                    };
                    
                    // Debug info
                    console.log('Processing image:', {
                        src: imageData.src?.substring(0, 100) || 'NO_SRC',
                        dimensions: `${imageData.displayWidth}x${imageData.displayHeight}`,
                        visible: imageData.isVisible,
                        testId: imageData.dataTestId,
                        className: imageData.className
                    });
                    
                    return imageData;
                })
                .filter(img => img.src && (img.src.startsWith('http') || img.src.startsWith('data:')))
                .filter(img => img.isVisible)
                .filter(img => img.displayWidth > 30 && img.displayHeight > 30) // Even lower threshold
                .sort((a, b) => (b.displayWidth * b.displayHeight) - (a.displayWidth * a.displayHeight)); // Sort by size, largest first
        };

        const isPDFViewer = () => {
            const url = window.location.href;
            const isPdfUrl = url.toLowerCase().includes('.pdf');
            
            const embed = document.querySelector('embed[type="application/pdf"]');
            const object = document.querySelector('object[type="application/pdf"]');
            const viewer = document.querySelector('#viewer, .pdfViewer, .pdf-viewer, [data-pdf-viewer]');
            
            return isPdfUrl || embed || object || viewer;
        };

        const extractPDFContent = () => {
            if (!isPDFViewer()) return null;
            
            try {
                // Try multiple methods to extract PDF text
                const methods = [
                    () => document.querySelector('#viewer')?.innerText,
                    () => document.querySelector('.pdfViewer')?.innerText,
                    () => document.body.innerText,
                    () => document.body.textContent
                ];
                
                for (const method of methods) {
                    try {
                        const text = method();
                        if (text && text.trim().length > 50) {
                            return text.trim();
                        }
                    } catch (e) {
                        continue;
                    }
                }
                
                return null;
            } catch (error) {
                console.error('PDF content extraction failed:', error);
                return null;
            }
        };

        const extractTextContent = () => {
            // Get all text from body - this should capture everything
            return document.body.innerText || document.body.textContent || '';
        };

        const extractVisibleText = () => {
            // Simple approach: get all text from visible elements
            let allText = '';
            
            // Try different methods to get comprehensive text
            const methods = [
                () => document.body.innerText,
                () => document.body.textContent,
                () => {
                    // Get text from all visible elements
                    const elements = document.querySelectorAll('*');
                    let text = '';
                    for (const el of elements) {
                        if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                            const elText = el.innerText || el.textContent || '';
                            if (elText.trim().length > 0) {
                                text += elText.trim() + ' ';
                            }
                        }
                    }
                    return text;
                }
            ];
            
            for (const method of methods) {
                try {
                    const text = method().trim();
                    if (text.length > allText.length) {
                        allText = text;
                    }
                } catch (e) {
                    // Continue with next method
                }
            }
            
            return allText;
        };

        const isPdf = isPDFViewer();
        const pdfContent = isPdf ? extractPDFContent() : null;
        const textContent = extractTextContent();
        const visibleText = extractVisibleText();
        const headings = extractHeadings();
        const images = extractImages();
        
        // Additional fallback: try to capture canvas elements that might contain images
        const extractCanvasImages = () => {
            const canvases = Array.from(document.querySelectorAll('canvas'));
            const canvasImages = [];
            
            canvases.forEach(canvas => {
                try {
                    if (canvas.width > 100 && canvas.height > 100) {
                        const dataURL = canvas.toDataURL('image/png');
                        canvasImages.push({
                            src: dataURL,
                            alt: 'Canvas content',
                            width: canvas.width,
                            height: canvas.height,
                            isVisible: true,
                            displayWidth: canvas.offsetWidth,
                            displayHeight: canvas.offsetHeight,
                            tagName: 'CANVAS',
                            isCanvas: true
                        });
                        console.log('Found canvas image:', canvas.width, 'x', canvas.height);
                    }
                } catch (e) {
                    console.log('Canvas extraction failed:', e.message);
                }
            });
            
            return canvasImages;
        };
        
        const canvasImages = extractCanvasImages();
        const allImages = [...images, ...canvasImages];

        // Use the most comprehensive text available
        const bestTextContent = pdfContent || visibleText || textContent;
        const bestVisibleText = pdfContent || visibleText || textContent;

        return {
            url: window.location.href,
            title: document.title,
            textContent: bestTextContent,
            visibleText: bestVisibleText,
            headings: headings,
            images: allImages,
            isPdfViewer: isPdf,
            currentPdfContent: pdfContent
        };

    } catch (error) {
        console.error('Content extraction failed:', error);
        return {
            url: window.location.href,
            title: document.title,
            textContent: '',
            visibleText: '',
            headings: [],
            images: [],
            isPdfViewer: false,
            currentPdfContent: null
        };
    }
}

/**
 * Cleanup function when popup is closed
 */
function cleanup() {
    if (isRecording && recognition) {
        stopVoiceRecording();
    }
}

// Cleanup when popup is about to close
window.addEventListener('beforeunload', cleanup);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cleanup();
    }
});

console.log('✅ Popup script loaded successfully with voice support');
