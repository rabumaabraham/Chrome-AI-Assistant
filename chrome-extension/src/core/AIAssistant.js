/**
 * AI Assistant Core
 * Main class that orchestrates all AI Assistant functionality
 */

import Config from './Config.js';
import Logger from './Logger.js';
import StorageService from '../services/StorageService.js';
import APIService from '../services/APIService.js';
import DOMService from '../services/DOMService.js';
import VoiceService from '../services/VoiceService.js';

class AIAssistant {
    constructor() {
        this.config = Config;
        this.logger = Logger.createServiceLogger('AIAssistant');
        this.storage = StorageService;
        this.api = APIService;
        this.dom = DOMService;
        this.voice = VoiceService;
        
        this.state = {
            isLoading: false,
            isRecording: false,
            history: [],
            settings: {},
            currentQuestion: '',
            currentResponse: ''
        };

        this.initialize();
    }

    /**
     * Initialize the AI Assistant
     */
    async initialize() {
        try {
            this.logger.info('Initializing AI Assistant');
            
            // Load configuration and settings
            await this.config.loadFromStorage();
            await this.loadSettings();
            await this.loadHistory();
            
            // Setup voice service callbacks
            this.setupVoiceCallbacks();
            
            this.logger.info('AI Assistant initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize AI Assistant', error);
        }
    }

    /**
     * Setup voice service callbacks
     */
    setupVoiceCallbacks() {
        this.voice.setOnResult((event) => {
            const { final, interim } = this.voice.extractTranscript(event);
            
            if (final) {
                this.state.currentQuestion = final;
                this.updateQuestionInput(final);
                this.voice.stopRecording();
            }
        });

        this.voice.setOnError((event) => {
            this.logger.error('Voice recognition error', event.error);
            this.showNotification('Voice recognition error: ' + event.error, 'error');
            this.voice.stopRecording();
        });

        this.voice.setOnEnd(() => {
            this.state.isRecording = false;
            this.updateVoiceButton();
        });
    }

    /**
     * Load settings from storage
     */
    async loadSettings() {
        try {
            const settings = await this.storage.loadSettings();
            this.state.settings = { ...this.state.settings, ...settings };
            this.logger.debug('Settings loaded', this.state.settings);
        } catch (error) {
            this.logger.error('Failed to load settings', error);
        }
    }

    /**
     * Save settings to storage
     */
    async saveSettings() {
        try {
            await this.storage.saveSettings(this.state.settings);
            this.logger.debug('Settings saved', this.state.settings);
        } catch (error) {
            this.logger.error('Failed to save settings', error);
        }
    }

    /**
     * Load history from storage
     */
    async loadHistory() {
        try {
            const history = await this.storage.loadHistory();
            this.state.history = history;
            this.logger.debug('History loaded', { count: history.length });
        } catch (error) {
            this.logger.error('Failed to load history', error);
        }
    }

    /**
     * Extract content from the active tab
     */
    async extractContentFromActiveTab(question) {
        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            this.logger.info('Extracting content from tab', { 
                tabId: tab.id, 
                url: tab.url,
                title: tab.title 
            });

            // Check if this is a PDF URL
            const isPdfUrl = tab.url && tab.url.toLowerCase().includes('.pdf');
            if (isPdfUrl) {
                this.logger.info('PDF URL detected, attempting PDF content extraction', { url: tab.url });
                
                // Try to extract PDF content directly
                try {
                    const pdfContent = await this.extractPDFContentFromURL(tab.url);
                    if (pdfContent) {
                        this.logger.info('PDF content extracted successfully', { 
                            contentLength: pdfContent.length,
                            preview: pdfContent.substring(0, 200) + '...'
                        });
                        return {
                            url: tab.url,
                            title: tab.title || 'PDF Document',
                            textContent: pdfContent,
                            visibleText: pdfContent,
                            headings: [],
                            images: [],
                            tables: [],
                            pdfs: [],
                            isPdfViewer: true,
                            currentPdfContent: pdfContent,
                            targetedContent: `Page Title: ${tab.title || 'PDF Document'}\nURL: ${tab.url}\nDocument Type: PDF Document\nPDF Content: ${pdfContent.substring(0, 2000)}${pdfContent.length > 2000 ? '...' : ''}`
                        };
                    } else {
                        this.logger.warn('PDF content extraction returned null/empty content');
                    }
                } catch (pdfError) {
                    this.logger.error('PDF content extraction failed', { error: pdfError.message, stack: pdfError.stack });
                }
            }
            
            // Execute content extraction script in the tab
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: extractPageContentInTab,
                args: [question]
            });

            if (results && results[0] && results[0].result) {
                return results[0].result;
            } else {
                throw new Error('Failed to extract content from tab');
            }
        } catch (error) {
            this.logger.error('Failed to extract content from active tab', error);
            // Fallback to basic content extraction
            return {
                url: window.location.href,
                title: document.title || '',
                textContent: document.body.innerText || '',
                visibleText: document.body.innerText || '',
                headings: [],
                images: [],
                tables: [],
                pdfs: [],
                isPdfViewer: false,
                error: error.message
            };
        }
    }


    /**
     * Ask AI a question
     */
    async askAI(question) {
        if (!question || question.trim().length === 0) {
            this.showNotification('Please enter a question', 'warning');
            return;
        }

        try {
            this.state.isLoading = true;
            this.state.currentQuestion = question.trim();
            this.updateUI();

            this.logger.info('Processing AI question', { question: this.state.currentQuestion });

            // Extract page content from the active tab
            const pageContent = await this.extractContentFromActiveTab(this.state.currentQuestion);
            this.logger.info('Page content extracted', {
                url: pageContent.url,
                title: pageContent.title,
                isPdfViewer: pageContent.isPdfViewer,
                imagesCount: pageContent.images?.length || 0,
                pdfsCount: pageContent.pdfs?.length || 0,
                hasCurrentPdfContent: !!pageContent.currentPdfContent,
                pdfContentLength: pageContent.currentPdfContent?.length || 0,
                hasTargetedContent: !!pageContent.targetedContent,
                targetedContentLength: pageContent.targetedContent?.length || 0
            });

            // Check if we need to extract PDF content
            const shouldExtractPDF = this.shouldExtractPDFContent(this.state.currentQuestion, pageContent);
            if (shouldExtractPDF) {
                this.logger.info('Extracting PDF content');
                await this.extractPDFContent(pageContent);
            }

            // Check if we need to extract image content
            const shouldExtractImage = this.shouldExtractImageContent(this.state.currentQuestion, pageContent);
            if (shouldExtractImage) {
                this.logger.info('Extracting image content via OCR');
                await this.extractImageContent(pageContent);
            }

            // Log final content summary
            this.logger.info('Content extraction summary', {
                hasPdfContent: !!pageContent.currentPdfContent,
                pdfContentLength: pageContent.currentPdfContent?.length || 0,
                hasImageOcrContent: !!pageContent.imageOcrContent,
                imageOcrCount: pageContent.imageOcrContent?.length || 0
            });

            // Send request to backend
            const response = await this.api.askAI(this.state.currentQuestion, pageContent);

            if (response.success) {
                this.state.currentResponse = response.answer;
                this.showResponse(this.state.currentResponse);
                await this.addToHistory(this.state.currentQuestion, this.state.currentResponse);
            } else {
                throw new Error(response.error || 'Unknown error occurred');
            }

        } catch (error) {
            this.logger.error('AI request failed', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.state.isLoading = false;
            this.updateUI();
        }
    }

    /**
     * Check if PDF content should be extracted
     */
    shouldExtractPDFContent(question, pageContent) {
        const questionLower = question.toLowerCase();
        
        // Always extract PDF content if we're viewing a PDF
        if (pageContent.isPdfViewer && pageContent.currentPdfContent) {
            return true;
        }
        
        // Check if question is about PDF content
        const isPdfQuestion = questionLower.includes('pdf') || questionLower.includes('cv') || questionLower.includes('resume') ||
                             questionLower.includes('document') || questionLower.includes('who') || questionLower.includes('what') || 
                             questionLower.includes('where') || questionLower.includes('when') || questionLower.includes('how') || 
                             questionLower.includes('about') || questionLower.includes('tell me') || questionLower.includes('explain');
        
        // Check if we're viewing a PDF or have PDFs on the page
        const hasPdfContent = pageContent.isPdfViewer || 
                             (pageContent.pdfs && pageContent.pdfs.length > 0) ||
                             (pageContent.url && pageContent.url.includes('.pdf'));
        
        return isPdfQuestion && hasPdfContent;
    }

    /**
     * Check if image content should be extracted
     */
    shouldExtractImageContent(question, pageContent) {
        const questionLower = question.toLowerCase();
        
        // Check if question is about image content
        const isImageQuestion = questionLower.includes('image') || questionLower.includes('picture') || questionLower.includes('photo') ||
                              questionLower.includes('see') || questionLower.includes('show') || questionLower.includes('read') ||
                              questionLower.includes('text') || questionLower.includes('what') || questionLower.includes('who') ||
                              questionLower.includes('describe') || questionLower.includes('analyze') || questionLower.includes('tell me') ||
                              questionLower.includes('explain') || questionLower.includes('look') || questionLower.includes('view');
        
        // Check if we have visible images on the page
        const hasVisibleImages = pageContent.images && 
                                pageContent.images.some(img => img.isVisible && img.width > 50 && img.height > 50);
        
        return isImageQuestion && hasVisibleImages;
    }

    /**
     * Extract PDF content directly from URL
     */
    async extractPDFContentFromURL(url) {
        try {
            this.logger.info('Extracting PDF content from URL', { url });
            
            // Fetch the PDF data
            const response = await fetch(url);
            const pdfBlob = await response.blob();
            
            // Convert to data URL
            const pdfData = await this.blobToDataURL(pdfBlob);
            
            // Extract text using backend API
            const result = await this.api.extractPDFText(pdfData);
            
            if (result.success && result.text) {
                this.logger.info('PDF content extracted successfully', { 
                    textLength: result.text.length,
                    pageCount: result.pageCount 
                });
                return result.text;
            } else {
                this.logger.warn('PDF extraction failed', result.error);
                return null;
            }
        } catch (error) {
            this.logger.error('PDF content extraction from URL failed', error);
            return null;
        }
    }

    /**
     * Extract PDF content
     */
    async extractPDFContent(pageContent) {
        try {
            // If we're viewing a PDF directly in the browser
            if (pageContent.isPdfViewer && pageContent.url) {
                this.logger.info('Attempting PDF content extraction', { 
                    url: pageContent.url,
                    hasCurrentContent: !!pageContent.currentPdfContent
                });

                // If we already have PDF content from the content script, use it
                if (pageContent.currentPdfContent && pageContent.currentPdfContent.trim().length > 0) {
                    this.logger.info('Using PDF content from content script', { 
                        textLength: pageContent.currentPdfContent.length
                    });
                    return;
                }

                // Try to extract text from the current PDF viewer
                const pdfText = this.extractTextFromPDFViewer();
                if (pdfText && pdfText.trim().length > 0) {
                    pageContent.currentPdfContent = pdfText;
                    this.logger.info('PDF content extracted from viewer', { 
                        textLength: pdfText.length
                    });
                    return;
                }

                // If direct extraction failed, fetch the PDF and extract via backend
                try {
                    this.logger.info('Attempting to fetch PDF from URL for backend extraction');
                    const response = await fetch(pageContent.url);
                    const pdfBlob = await response.blob();
                    const pdfData = await this.blobToDataURL(pdfBlob);
                    
                    const pdfContent = await this.api.extractPDFText(pdfData);
                    if (pdfContent.success) {
                        pageContent.currentPdfContent = pdfContent.text;
                        this.logger.info('PDF content extracted via API', { 
                            textLength: pdfContent.text.length,
                            pageCount: pdfContent.pageCount 
                        });
                    } else {
                        this.logger.warn('PDF extraction via API failed', pdfContent.error);
                    }
                } catch (fetchError) {
                    this.logger.warn('PDF fetch failed', fetchError);
                }
            }
        } catch (error) {
            this.logger.warn('PDF extraction failed', error);
        }
    }

    /**
     * Convert blob to data URL
     */
    async blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Extract text from PDF viewer (when PDF is opened directly in browser)
     */
    extractTextFromPDFViewer() {
        try {
            // Try multiple methods to extract text from PDF viewer
            const methods = [
                () => document.body.innerText,
                () => document.body.textContent,
                () => document.querySelector('embed, object, iframe')?.contentDocument?.body?.innerText,
                () => {
                    const walker = document.createTreeWalker(
                        document.body,
                        NodeFilter.SHOW_TEXT,
                        null,
                        false
                    );
                    let text = '';
                    let node;
                    while (node = walker.nextNode()) {
                        text += node.textContent + ' ';
                    }
                    return text;
                }
            ];

            for (const method of methods) {
                try {
                    const text = method();
                    if (text && text.trim().length > 50) { // Minimum content threshold
                        return text.trim();
                    }
                } catch (e) {
                    continue;
                }
            }
            
            return null;
        } catch (error) {
            this.logger.warn('PDF viewer text extraction failed', error);
            return null;
        }
    }

    /**
     * Extract image content via OCR
     */
    async extractImageContent(pageContent) {
        try {
            const ocrResults = [];
            const visibleImages = pageContent.images
                .filter(img => img.isVisible && img.width > 50 && img.height > 50)
                .slice(0, this.config.get('ocr.maxImages'));

            for (const image of visibleImages) {
                try {
                    // Fetch and convert image to data URL
                    const response = await fetch(image.src);
                    const blob = await response.blob();
                    const dataUrl = await this.blobToDataURL(blob);

                    // Extract text using OCR
                    const ocrResult = await this.api.extractImageText(dataUrl, {
                        src: image.src,
                        alt: image.alt,
                        title: image.title,
                        dimensions: `${image.width}x${image.height}`
                    });

                    if (ocrResult.success && ocrResult.text.trim().length > 0) {
                        ocrResults.push({
                            ...image,
                            extractedText: ocrResult.text,
                            confidence: ocrResult.confidence
                        });
                    }
                } catch (error) {
                    this.logger.warn('OCR failed for image', { src: image.src, error: error.message });
                }
            }

            if (ocrResults.length > 0) {
                pageContent.imageOcrContent = ocrResults;
                this.logger.info('Image OCR completed', { count: ocrResults.length });
            }

        } catch (error) {
            this.logger.warn('Image OCR failed', error);
        }
    }

    /**
     * Convert blob to data URL
     */
    blobToDataURL(blob) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Add item to history
     */
    async addToHistory(question, answer) {
        try {
            const historyItem = await this.storage.addToHistory(question, answer);
            if (historyItem) {
                this.state.history.push(historyItem);
                this.updateHistoryDisplay();
            }
        } catch (error) {
            this.logger.error('Failed to add to history', error);
        }
    }

    /**
     * Clear history
     */
    async clearHistory() {
        try {
            await this.storage.clearHistory();
            this.state.history = [];
            this.updateHistoryDisplay();
            this.showNotification('History cleared', 'success');
        } catch (error) {
            this.logger.error('Failed to clear history', error);
        }
    }

    /**
     * Toggle voice recording
     */
    toggleVoiceRecording() {
        if (!this.voice.isAvailable()) {
            this.showNotification('Voice input is not supported or disabled', 'warning');
            return;
        }

        if (this.state.isRecording) {
            this.voice.stopRecording();
        } else {
            this.voice.startRecording();
            this.state.isRecording = true;
            this.updateVoiceButton();
        }
    }

    /**
     * Show response in UI
     */
    showResponse(response) {
        const responseElement = document.getElementById('responseContent');
        if (responseElement) {
            responseElement.innerHTML = response;
            responseElement.style.display = 'block';
        }
    }

    /**
     * Hide response
     */
    hideResponse() {
        const responseElement = document.getElementById('responseContent');
        if (responseElement) {
            responseElement.style.display = 'none';
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // This would be implemented in the UI layer
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    /**
     * Update UI state
     */
    updateUI() {
        this.updateLoadingState();
        this.updateVoiceButton();
    }

    /**
     * Update loading state
     */
    updateLoadingState() {
        const loadingElement = document.getElementById('loading');
        const askButton = document.getElementById('askBtn');
        
        if (loadingElement) {
            loadingElement.style.display = this.state.isLoading ? 'block' : 'none';
        }
        
        if (askButton) {
            askButton.disabled = this.state.isLoading;
        }
    }

    /**
     * Update voice button
     */
    updateVoiceButton() {
        const voiceButton = document.getElementById('voiceBtn');
        if (voiceButton) {
            voiceButton.textContent = this.state.isRecording ? '🎤 Stop' : '🎤 Voice';
            voiceButton.className = this.state.isRecording ? 'recording' : '';
        }
    }

    /**
     * Update question input
     */
    updateQuestionInput(text) {
        const input = document.getElementById('questionInput');
        if (input) {
            input.value = text;
        }
    }

    /**
     * Update history display
     */
    updateHistoryDisplay() {
        // This would be implemented in the UI layer
        this.logger.debug('History updated', { count: this.state.history.length });
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Reset assistant
     */
    reset() {
        this.state = {
            isLoading: false,
            isRecording: false,
            history: this.state.history,
            settings: this.state.settings,
            currentQuestion: '',
            currentResponse: ''
        };
        this.updateUI();
    }
}

/**
 * Function to be executed in the tab context for content extraction
 * This function runs in the webpage context, not the extension context
 */
function extractPageContentInTab(question) {
    try {
        // This function runs in the webpage context
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

        const extractTables = () => {
            return Array.from(document.querySelectorAll('table'))
                .map(table => {
                    const rows = Array.from(table.querySelectorAll('tr'))
                        .map(row => Array.from(row.querySelectorAll('td, th'))
                            .map(cell => cell.textContent.trim())
                            .filter(cell => cell.length > 0)
                        )
                        .filter(row => row.length > 0);
                    return { rows, caption: table.caption?.textContent || '' };
                })
                .filter(table => table.rows.length > 0);
        };

        const isPDFViewer = () => {
            console.log('Checking if this is a PDF viewer...');
            console.log('URL:', window.location.href);
            
            // Check if URL ends with .pdf
            if (window.location.href.toLowerCase().includes('.pdf')) {
                console.log('PDF detected: URL contains .pdf');
                return true;
            }
            
            // Check for PDF embeds/objects
            const embed = document.querySelector('embed[type="application/pdf"]');
            const object = document.querySelector('object[type="application/pdf"]');
            if (embed || object) {
                console.log('PDF detected: Found embed/object element');
                return true;
            }
            
            // Check for PDF.js viewer (common browser PDF viewer)
            const viewer = document.querySelector('#viewer, .pdfViewer, .pdf-viewer, [data-pdf-viewer]');
            if (viewer) {
                console.log('PDF detected: Found PDF viewer element');
                return true;
            }
            
            // Check for common PDF viewer indicators
            const bodyText = document.body.innerText || document.body.textContent || '';
            if (bodyText.includes('PDF') && 
                (bodyText.includes('Download') || bodyText.includes('View') || bodyText.includes('Page'))) {
                console.log('PDF detected: Found PDF indicators in body text');
                return true;
            }
            
            // Check for PDF.js specific elements
            if (document.querySelector('.textLayer, .annotationLayer, .canvas')) {
                console.log('PDF detected: Found PDF.js specific elements');
                return true;
            }
            
            // Check for Chrome's PDF viewer
            if (document.querySelector('embed[type="application/pdf"]') || 
                document.querySelector('iframe[src*=".pdf"]')) {
                console.log('PDF detected: Found Chrome PDF viewer');
                return true;
            }
            
            console.log('No PDF detected');
            return false;
        };

        const extractPDFContent = () => {
            if (!isPDFViewer()) return null;
            
            try {
                console.log('Attempting PDF content extraction...');
                
                // Method 1: Try to get text from PDF.js viewer (most common)
                const pdfViewer = document.querySelector('#viewer, .pdfViewer, .pdf-viewer');
                if (pdfViewer) {
                    console.log('Found PDF viewer element, extracting text...');
                    const viewerText = pdfViewer.innerText || pdfViewer.textContent || '';
                    if (viewerText.trim().length > 100) {
                        console.log('PDF content extracted from viewer:', viewerText.length, 'characters');
                        return viewerText.trim();
                    }
                }

                // Method 2: Try to get all visible text from page
                const allText = document.body.innerText || document.body.textContent || '';
                if (allText.trim().length > 100 && !allText.includes('chrome-extension://')) {
                    console.log('PDF content extracted from body text:', allText.length, 'characters');
                    return allText.trim();
                }

                // Method 3: Use TreeWalker to get all text nodes
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                let text = '';
                let node;
                while (node = walker.nextNode()) {
                    const nodeText = node.textContent || '';
                    if (nodeText.trim().length > 0) {
                        text += nodeText + ' ';
                    }
                }
                
                if (text.trim().length > 100) {
                    console.log('PDF content extracted via TreeWalker:', text.length, 'characters');
                    return text.trim();
                }

                // Method 4: Try to extract from embed/object elements
                const embed = document.querySelector('embed[type="application/pdf"]');
                if (embed && embed.contentDocument && embed.contentDocument.body) {
                    const embedText = embed.contentDocument.body.innerText || '';
                    if (embedText.trim().length > 100) {
                        console.log('PDF content extracted from embed:', embedText.length, 'characters');
                        return embedText.trim();
                    }
                }

                // Method 5: Try to get text from any element that might contain PDF content
                const possibleContainers = document.querySelectorAll('#pageContainer, .page, .textLayer, .canvas, .annotationLayer');
                for (const container of possibleContainers) {
                    const containerText = container.innerText || container.textContent || '';
                    if (containerText.trim().length > 100) {
                        console.log('PDF content extracted from container:', containerText.length, 'characters');
                        return containerText.trim();
                    }
                }

                console.log('No PDF content could be extracted');
                return null;
                
            } catch (error) {
                console.error('PDF content extraction failed:', error);
                return null;
            }
        };

        const extractVisibleText = () => {
            return Array.from(document.querySelectorAll('*'))
                .filter(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && 
                           style.visibility !== 'hidden' && 
                           style.opacity !== '0' &&
                           el.offsetWidth > 0 && 
                           el.offsetHeight > 0;
                })
                .map(el => el.textContent || '')
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const extractTargetedContent = (question) => {
            if (!question) return '';

            const questionLower = question.toLowerCase();
            let targetedContent = '';

            // Add basic page info
            targetedContent += `Page Title: ${document.title}\n`;
            targetedContent += `URL: ${window.location.href}\n`;
            
            // Check if this is a PDF and extract content
            const isPdf = isPDFViewer();
            if (isPdf) {
                targetedContent += `Document Type: PDF Document\n`;
                const pdfContent = extractPDFContent();
                if (pdfContent) {
                    targetedContent += `PDF Content: ${pdfContent.substring(0, 2000)}${pdfContent.length > 2000 ? '...' : ''}\n`;
                } else {
                    targetedContent += `PDF Content: Unable to extract text from PDF\n`;
                }
            } else {
                // Add main content for regular web pages
                const mainText = document.body.innerText || document.body.textContent || '';
                if (mainText) {
                    targetedContent += `Main Content: ${mainText.substring(0, 1000)}${mainText.length > 1000 ? '...' : ''}\n`;
                }
            }

            return targetedContent;
        };

        // Extract comprehensive content
        const isPdf = isPDFViewer();
        console.log('PDF Detection Result:', isPdf);
        
        const pdfContent = isPdf ? extractPDFContent() : null;
        console.log('PDF Content Extracted:', pdfContent ? pdfContent.length + ' characters' : 'null');
        
        const content = {
            url: window.location.href,
            title: document.title || '',
            metaDescription: document.querySelector('meta[name="description"]')?.content || '',
            
            // Content extraction
            headings: extractHeadings(),
            textContent: pdfContent || document.body.innerText || '',
            visibleText: pdfContent || extractVisibleText(),
            
            // PDF content
            isPdfViewer: isPdf,
            currentPdfContent: pdfContent,
            
            // Structured data
            tables: extractTables(),
            images: extractImages(),
            
            // Question-aware targeted content
            targetedContent: extractTargetedContent(question)
        };
        
        console.log('Final content object:', {
            url: content.url,
            title: content.title,
            isPdfViewer: content.isPdfViewer,
            pdfContentLength: content.currentPdfContent ? content.currentPdfContent.length : 0,
            textContentLength: content.textContent.length,
            targetedContentLength: content.targetedContent.length
        });

        return content;
    } catch (error) {
        console.error('Content extraction failed:', error);
        return {
            url: window.location.href,
            title: document.title || '',
            textContent: document.body.innerText || '',
            error: error.message
        };
    }
}

// Export singleton instance
export default new AIAssistant();
