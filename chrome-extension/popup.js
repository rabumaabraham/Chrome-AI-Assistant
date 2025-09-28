/**
 * Simple Popup Script
 * Working version without complex module imports
 */

// Chrome AI Assistant Popup

// Configuration
const CONFIG = {
    backendUrl: 'http://localhost:3000/api',
    timeout: 30000
};

// State
let isLoading = false;
let currentQuestion = '';

// DOM Elements
let questionInput, askButton, voiceButton, clearButton, responseContent, loading, notification;

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
    clearButton = document.getElementById('clearBtn');
    responseContent = document.getElementById('responseContent');
    loading = document.getElementById('loading');
    notification = document.getElementById('notification');
    
    // Elements initialized
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
    
    if (clearButton) {
        clearButton.addEventListener('click', handleClear);
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
        showNotification('Please enter a question', 'warning');
            return;
        }
        
    // Processing question
    
    try {
        setLoading(true);
        currentQuestion = question;
        
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Extract page content
        const pageContent = await extractPageContent(tab);
        
        // Send to AI
        const response = await askAI(question, pageContent);
        
        if (response.success) {
            showResponse(response.answer);
            showNotification('Response received', 'success');
        } else {
            throw new Error(response.error || 'AI request failed');
        }
        
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
    } finally {
        setLoading(false);
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
        
        // Process images with OCR if there are any
        console.log('Found images for OCR:', content.images?.length || 0);
        if (content.images && content.images.length > 0) {
            console.log('Processing images with OCR...');
            console.log('Images to process:', content.images.map(img => ({
                src: img.src?.substring(0, 50) || 'NO_SRC',
                dimensions: `${img.displayWidth}x${img.displayHeight}`,
                testId: img.dataTestId
            })));
            
            const ocrResults = await processImagesWithOCR(content.images);
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
        } else {
            console.log('No images found for OCR processing');
            // Special handling for Twitter/X - try to find images in a different way
            if (tab.url && tab.url.includes('x.com') || tab.url.includes('twitter.com')) {
                console.log('Twitter/X detected - attempting alternative image detection...');
                // This will be handled by the enhanced selectors above
            }
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
            
            // Only process visible images that might contain text
            if (!image.isVisible) {
                console.log('Skipping invisible image');
                continue;
            }
            
            // More lenient size requirements
            if (image.displayWidth < 50 || image.displayHeight < 50) {
                console.log('Skipping small image:', image.displayWidth, 'x', image.displayHeight);
                continue;
            }
            
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
                ocrResults.push(`Image text: ${ocrData.text.trim()}`);
                console.log('OCR success:', ocrData.text.trim());
            } else {
                console.log('OCR failed or no text:', ocrData.error || 'No text extracted');
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
    showNotification('Cleared', 'success');
}

/**
 * Handle voice toggle
 */
function handleVoiceToggle() {
    showNotification('Voice feature coming soon', 'info');
}

/**
 * Check backend health
 */
async function checkBackendHealth() {
    try {
        const response = await fetch(`${CONFIG.backendUrl}/health`);
        const data = await response.json();
        
        if (data.success) {
            showNotification('Connected to backend', 'success');
        } else {
            throw new Error('Backend health check failed');
        }
    } catch (error) {
        showNotification('Cannot connect to backend', 'error');
    }
}

/**
 * Set loading state
 */
function setLoading(loading) {
    isLoading = loading;
    
    if (askButton) {
        askButton.disabled = loading;
        askButton.textContent = loading ? 'Processing...' : 'Ask AI';
    }
    
    if (loading) {
        showLoading();
        hideResponse();
    } else {
        hideLoading();
    }
}

/**
 * Show response
 */
function showResponse(response) {
    if (responseContent) {
        responseContent.innerHTML = response;
        responseContent.style.display = 'block';
    }
}

/**
 * Hide response
 */
function hideResponse() {
    if (responseContent) {
        responseContent.style.display = 'none';
    }
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
        }, 3000);
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

console.log('✅ Popup script loaded successfully');
