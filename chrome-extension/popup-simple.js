/**
 * Simple Popup Script
 * Working version without complex module imports
 */

console.log('🚀 Chrome AI Assistant Popup Loading...');

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
    console.log('📱 Popup DOM loaded');
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
    
    console.log('🔧 Elements initialized:', {
        questionInput: !!questionInput,
        askButton: !!askButton,
        voiceButton: !!voiceButton,
        clearButton: !!clearButton,
        responseContent: !!responseContent,
        loading: !!loading,
        notification: !!notification
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    if (askButton) {
        askButton.addEventListener('click', handleAskQuestion);
        console.log('✅ Ask button listener added');
    }
    
    if (questionInput) {
        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAskQuestion();
            }
        });
        console.log('✅ Question input listener added');
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', handleClear);
        console.log('✅ Clear button listener added');
    }
    
    if (voiceButton) {
        voiceButton.addEventListener('click', handleVoiceToggle);
        console.log('✅ Voice button listener added');
    }
}

/**
 * Handle ask question
 */
async function handleAskQuestion() {
    console.log('🤖 Ask question clicked');
    
    if (isLoading) {
        console.log('⏳ Already loading, ignoring request');
        return;
    }
    
    const question = questionInput?.value?.trim();
    if (!question) {
        showNotification('Please enter a question', 'warning');
        return;
    }
    
    console.log('📝 Processing question:', question);
    
    try {
        setLoading(true);
        currentQuestion = question;
        
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('📑 Current tab:', { id: tab.id, url: tab.url, title: tab.title });
        
        // Extract page content
        const pageContent = await extractPageContent(tab);
        console.log('📄 Page content extracted:', {
            url: pageContent.url,
            title: pageContent.title,
            isPdfViewer: pageContent.isPdfViewer,
            textLength: pageContent.textContent?.length || 0
        });
        
        // Send to AI
        const response = await askAI(question, pageContent);
        console.log('🤖 AI response received:', { success: response.success });
        
        if (response.success) {
            showResponse(response.answer);
            showNotification('Response received', 'success');
        } else {
            throw new Error(response.error || 'AI request failed');
        }
        
    } catch (error) {
        console.error('❌ Ask question failed:', error);
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
            console.log('📄 PDF detected, attempting extraction');
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
                console.warn('⚠️ PDF extraction failed:', pdfError);
            }
        }
        
        // Extract regular page content
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractPageContentInTab
        });
        
        const content = results[0]?.result || {};
        return {
            url: tab.url,
            title: tab.title,
            ...content
        };
        
    } catch (error) {
        console.error('❌ Content extraction failed:', error);
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
 * Extract PDF content from URL
 */
async function extractPDFFromURL(url) {
    try {
        console.log('📄 Fetching PDF from URL:', url);
        
        const response = await fetch(url);
        const pdfBlob = await response.blob();
        const pdfData = await blobToDataURL(pdfBlob);
        
        console.log('📄 PDF data prepared, sending to backend');
        
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
        console.log('📄 PDF extraction result:', { success: data.success });
        
        if (data.success && data.text) {
            return data.text;
        } else {
            throw new Error(data.error || 'PDF extraction failed');
        }
        
    } catch (error) {
        console.error('❌ PDF extraction failed:', error);
        return null;
    }
}

/**
 * Ask AI
 */
async function askAI(question, context) {
    try {
        console.log('🤖 Sending AI request');
        
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
        console.log('🤖 AI response:', { success: data.success });
        
        return data;
        
    } catch (error) {
        console.error('❌ AI request failed:', error);
        throw error;
    }
}

/**
 * Handle clear
 */
function handleClear() {
    console.log('🧹 Clear clicked');
    if (questionInput) questionInput.value = '';
    hideResponse();
    showNotification('Cleared', 'success');
}

/**
 * Handle voice toggle
 */
function handleVoiceToggle() {
    console.log('🎤 Voice toggle clicked');
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
            console.log('✅ Backend is healthy');
            showNotification('Connected to backend', 'success');
        } else {
            throw new Error('Backend health check failed');
        }
    } catch (error) {
        console.error('❌ Backend health check failed:', error);
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
            return Array.from(document.querySelectorAll('img'))
                .map(img => ({
                    src: img.src,
                    alt: img.alt,
                    title: img.title,
                    width: img.width,
                    height: img.height,
                    nearbyText: img.parentElement?.textContent?.substring(0, 200) || '',
                    isVisible: img.offsetWidth > 0 && img.offsetHeight > 0
                }))
                .filter(img => img.src);
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
            const bodyText = document.body.innerText || document.body.textContent || '';
            return bodyText.trim();
        };

        const extractVisibleText = () => {
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (!parent) return NodeFilter.FILTER_REJECT;
                        
                        const style = window.getComputedStyle(parent);
                        if (style.display === 'none' || style.visibility === 'hidden') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );
            
            let visibleText = '';
            let node;
            while (node = walker.nextNode()) {
                const text = node.textContent.trim();
                if (text.length > 0) {
                    visibleText += text + ' ';
                }
            }
            
            return visibleText.trim();
        };

        const isPdf = isPDFViewer();
        const pdfContent = isPdf ? extractPDFContent() : null;
        const textContent = extractTextContent();
        const visibleText = extractVisibleText();
        const headings = extractHeadings();
        const images = extractImages();

        return {
            url: window.location.href,
            title: document.title,
            textContent: pdfContent || textContent,
            visibleText: pdfContent || visibleText,
            headings: headings,
            images: images,
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
