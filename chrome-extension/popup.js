// AI Assistant Chrome Extension - Popup Script
class AIAssistant {
    constructor() {
        this.config = {
            backendUrl: 'http://localhost:3000',
            maxHistoryItems: 50,
            maxContextLength: 15000
        };
        this.state = {
            isRecording: false,
            recognition: null,
            history: []
        };
        
        this.init();
    }

    async init() {
        try {
        await this.loadSettings();
        await this.loadHistory();
        this.setupEventListeners();
        this.setupVoiceRecognition();
        this.updateUI();
        } catch (error) {
            console.error('Failed to initialize AI Assistant:', error);
            this.showNotification('Failed to initialize extension', 'error');
        }
    }

    // Settings Management
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'backendUrl',
                'apiKey',
                'enableVoice',
                'enableOCR',
                'theme'
            ]);
            
            this.config.backendUrl = result.backendUrl || 'http://localhost:3000';
            this.apiKey = result.apiKey || '';
            this.enableVoice = result.enableVoice !== false;
            this.enableOCR = result.enableOCR !== false;
            this.theme = result.theme || 'light';
            
            // Update UI elements
            document.getElementById('backendUrl').value = this.config.backendUrl;
            document.getElementById('apiKey').value = this.apiKey;
            document.getElementById('enableVoice').checked = this.enableVoice;
            document.getElementById('enableOCR').checked = this.enableOCR;
            
            // Apply theme
            document.documentElement.setAttribute('data-theme', this.theme);
            document.getElementById('themeToggle').textContent = this.theme === 'dark' ? '☀️' : '🌙';
            
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            const settings = {
                backendUrl: document.getElementById('backendUrl').value,
                apiKey: document.getElementById('apiKey').value,
                enableVoice: document.getElementById('enableVoice').checked,
                enableOCR: document.getElementById('enableOCR').checked,
                theme: this.theme
            };
            
            await chrome.storage.sync.set(settings);
            
            // Update instance variables
            this.config.backendUrl = settings.backendUrl;
            this.apiKey = settings.apiKey;
            this.enableVoice = settings.enableVoice;
            this.enableOCR = settings.enableOCR;
            
            this.showNotification('Settings saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error saving settings', 'error');
        }
    }

    // History Management
    async loadHistory() {
        try {
            const result = await chrome.storage.local.get(['aiHistory']);
            this.state.history = result.aiHistory || [];
            this.renderHistory();
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    async saveHistory() {
        try {
            await chrome.storage.local.set({ aiHistory: this.state.history });
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    addToHistory(question, answer) {
        const historyItem = {
            id: Date.now(),
            question,
            answer,
            timestamp: new Date().toISOString()
        };
        
        this.state.history.unshift(historyItem);
        
        // Keep only last N items
        if (this.state.history.length > this.config.maxHistoryItems) {
            this.state.history = this.state.history.slice(0, this.config.maxHistoryItems);
        }
        
        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        if (this.state.history.length === 0) {
            historyList.innerHTML = '<p class="text-center" style="opacity: 0.6; font-size: 13px;">No recent questions</p>';
            return;
        }
        
        historyList.innerHTML = this.state.history
            .slice(0, 10) // Show only last 10
            .map(item => `
                <div class="history-item" data-id="${item.id}">
                    <div style="font-weight: 500; margin-bottom: 4px;">${this.truncateText(item.question, 60)}</div>
                    <div style="opacity: 0.7; font-size: 12px;">${this.truncateText(item.answer, 80)}</div>
                </div>
            `).join('');
    }

    // Voice Recognition Setup
    setupVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.state.recognition = new SpeechRecognition();
        
        this.state.recognition.continuous = false;
        this.state.recognition.interimResults = false;
        this.state.recognition.lang = 'en-US';
        
        this.state.recognition.onstart = () => {
            this.state.isRecording = true;
            this.updateVoiceButton();
        };
        
        this.state.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('questionInput').value = transcript;
            this.state.isRecording = false;
            this.updateVoiceButton();
        };
        
        this.state.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.state.isRecording = false;
            this.updateVoiceButton();
            this.showNotification('Voice recognition error', 'error');
        };
        
        this.state.recognition.onend = () => {
            this.state.isRecording = false;
            this.updateVoiceButton();
        };
    }

    updateVoiceButton() {
        const voiceBtn = document.getElementById('voiceBtn');
        if (!voiceBtn) return;
        
        if (this.state.isRecording) {
            voiceBtn.textContent = '🔴';
            voiceBtn.style.color = '#dc3545';
        } else {
            voiceBtn.textContent = '🎤';
            voiceBtn.style.color = '';
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Ask button
        document.getElementById('askBtn').addEventListener('click', () => this.askAI());
        
        // Voice button
        document.getElementById('voiceBtn').addEventListener('click', () => this.toggleVoiceRecording());
        
        // Screenshot button
        document.getElementById('screenshotBtn').addEventListener('click', () => this.captureScreenshot());
        
        // Upload button
        document.getElementById('uploadBtn').addEventListener('click', () => this.triggerFileUpload());
        
        // File input
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Copy button
        document.getElementById('copyBtn').addEventListener('click', () => this.copyResponse());
        
        // Clear history button
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Settings modal
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        
        // History items
        document.addEventListener('click', (e) => {
            if (e.target.closest('.history-item')) {
                const itemId = parseInt(e.target.closest('.history-item').dataset.id);
                this.loadHistoryItem(itemId);
            }
        });
        
        // Enter key to ask
        document.getElementById('questionInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.askAI();
            }
        });
    }

    // Main AI Functionality
    async askAI() {
        const question = document.getElementById('questionInput').value.trim();
        if (!question) {
            this.showNotification('Please enter a question', 'warning');
            return;
        }

        this.showLoading(true);
        this.hideResponse();

        try {
            // Get page content with question-aware targeting
            const pageContent = await this.getPageContent(question);
            
            // Check if we need to extract PDF content
            const questionLower = question.toLowerCase();
            const isPdfQuestion = questionLower.includes('pdf') || questionLower.includes('cv') || questionLower.includes('resume') ||
                                 questionLower.includes('who') || questionLower.includes('what') || questionLower.includes('where') ||
                                 questionLower.includes('when') || questionLower.includes('how') || questionLower.includes('about');
            
            if (isPdfQuestion && pageContent.isPdfViewer && pageContent.url && pageContent.url.includes('.pdf')) {
                
                try {
                    // Extract PDF content
                    const pdfContent = await this.extractPdfContent(pageContent.url);
                    if (pdfContent) {
                        pageContent.currentPdfContent = pdfContent;
                        console.log('PDF content extracted:', pdfContent.substring(0, 200) + '...');
                    }
                } catch (error) {
                    console.warn('PDF extraction failed:', error);
                }
            }
            
            // Send request to backend
            const response = await this.sendToBackend({
                question,
                context: pageContent,
                url: window.location.href
            });

            if (response.success) {
                this.showResponse(response.answer);
                this.addToHistory(question, response.answer);
            } else {
                throw new Error(response.error || 'Unknown error occurred');
            }

        } catch (error) {
            console.error('Error asking AI:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async getPageContent(question = '') {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                args: [question],
                function: async (question) => {
                    // Enhanced DOM reading for better accuracy with question-aware targeting
                    
                    // Get page title
                    const title = document.title || '';
                    
                    // Get meta description
                    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
                    
                    // Get headings with hierarchy
                    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                        .map(h => ({
                            level: parseInt(h.tagName.charAt(1)),
                            text: h.textContent.trim(),
                            id: h.id || null
                        }))
                        .filter(h => h.text.length > 0);
                    
                    // Get main content areas (more accurate than full body)
                    const mainContent = document.querySelector('main, article, .content, .main, #content, #main') || document.body;
                    const textContent = mainContent.innerText || mainContent.textContent || '';
                    
                    // Get visible text only (exclude hidden elements)
                    const visibleText = Array.from(document.querySelectorAll('*'))
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
                    
                    // Get structured data (tables, lists)
                    const tables = Array.from(document.querySelectorAll('table'))
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
                    
                    // Get lists
                    const lists = Array.from(document.querySelectorAll('ul, ol'))
                        .map(list => Array.from(list.querySelectorAll('li'))
                            .map(li => li.textContent.trim())
                            .filter(li => li.length > 0)
                        )
                        .filter(list => list.length > 0);
                    
                    // Get form elements and their values
                    const forms = Array.from(document.querySelectorAll('form'))
                        .map(form => {
                            const inputs = Array.from(form.querySelectorAll('input, select, textarea'))
                                .map(input => ({
                                    type: input.type || input.tagName.toLowerCase(),
                                    name: input.name || input.id || '',
                                    value: input.value || input.textContent || '',
                                    placeholder: input.placeholder || ''
                                }))
                                .filter(input => input.name || input.value);
                            return { inputs, action: form.action || '' };
                        })
                        .filter(form => form.inputs.length > 0);
                    
                    // Get images with better context
                    const images = Array.from(document.querySelectorAll('img'))
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
                    
                    // Get PDFs and documents on the page
                    const pdfs = Array.from(document.querySelectorAll('a[href*=".pdf"], embed[src*=".pdf"], object[data*=".pdf"], iframe[src*=".pdf"]'))
                        .map(pdf => ({
                            src: pdf.href || pdf.src || pdf.data,
                            text: pdf.textContent?.trim() || pdf.alt || pdf.title || 'PDF Document',
                            type: 'pdf'
                        }))
                        .filter(pdf => pdf.src);
                    
                    // Check if current page is a PDF viewer
                    const isPdfViewer = window.location.href.includes('.pdf') || 
                                       document.querySelector('embed[type="application/pdf"]') ||
                                       document.querySelector('object[type="application/pdf"]') ||
                                       document.querySelector('iframe[src*=".pdf"]');
                    
                    // Get PDF content from current page if it's a PDF
                    let currentPdfContent = '';
                    if (isPdfViewer) {
                        // Try multiple methods to extract PDF text
                        let pdfText = '';
                        
                        // Method 1: Try to get text from PDF viewer elements
                        const pdfElements = document.querySelectorAll('canvas, svg, div[role="textbox"], .textLayer, .page');
                        for (const element of pdfElements) {
                            const text = element.innerText || element.textContent || '';
                            if (text && text.length > 10) {
                                pdfText += text + ' ';
                            }
                        }
                        
                        // Method 2: Try to get text from all text nodes
                        if (!pdfText || pdfText.length < 100) {
                            const walker = document.createTreeWalker(
                                document.body,
                                NodeFilter.SHOW_TEXT,
                                null,
                                false
                            );
                            
                            let node;
                            while (node = walker.nextNode()) {
                                const text = node.textContent?.trim();
                                if (text && text.length > 3 && !text.match(/^\d+$/)) {
                                    pdfText += text + ' ';
                                }
                            }
                        }
                        
                        // Method 3: Try to get text from specific PDF viewer containers
                        if (!pdfText || pdfText.length < 100) {
                            const containers = document.querySelectorAll('#viewer, .pdfViewer, .document, .pageContainer, [data-page-number]');
                            for (const container of containers) {
                                const text = container.innerText || container.textContent || '';
                                if (text && text.length > 50) {
                                    pdfText += text + ' ';
                                }
                            }
                        }
                        
                        // Method 4: Try to get text from the entire document
                        if (!pdfText || pdfText.length < 100) {
                            pdfText = document.body.innerText || document.body.textContent || '';
                        }
                        
                        // Clean up the text
                        if (pdfText) {
                            currentPdfContent = pdfText
                                .replace(/\s+/g, ' ')
                                .replace(/\n+/g, ' ')
                                .trim();
                        }
                    }
                    
                    // Get embedded images and documents
                    const embeddedDocs = Array.from(document.querySelectorAll('embed, object, iframe'))
                        .map(doc => ({
                            src: doc.src || doc.data,
                            type: doc.type || 'unknown',
                            text: doc.title || doc.alt || 'Embedded Document'
                        }))
                        .filter(doc => doc.src);
                    
                    // Get links with context
                    const links = Array.from(document.querySelectorAll('a[href]'))
                        .map(a => ({
                            href: a.href,
                            text: a.textContent.trim(),
                            title: a.title || '',
                            isExternal: !a.href.startsWith(window.location.origin)
                        }))
                        .filter(a => a.text && a.href);
                    
                    // Get current viewport content (what user actually sees)
                    const viewportHeight = window.innerHeight;
                    const scrollTop = window.pageYOffset;
                    const viewportElements = Array.from(document.querySelectorAll('*'))
                        .filter(el => {
                            const rect = el.getBoundingClientRect();
                            return rect.top >= 0 && rect.top <= viewportHeight;
                        })
                        .map(el => el.textContent || '')
                        .join(' ')
                        .substring(0, 5000); // Focus on visible content
                    
                    // Question-aware content targeting
                    let targetedContent = '';
                    if (question) {
                        const questionLower = question.toLowerCase();
                        
                        // If question mentions specific elements, target them
                        if (questionLower.includes('table') || questionLower.includes('data')) {
                            const tableContent = tables.map((table, i) => 
                                `Table ${i+1}: ${table.rows.map(row => row.join(' | ')).join('\n')}`
                            ).join('\n\n');
                            targetedContent += `\nTargeted Table Data:\n${tableContent}\n`;
                        }
                        
                        if (questionLower.includes('form') || questionLower.includes('input') || questionLower.includes('field')) {
                            const formContent = forms.map((form, i) => 
                                `Form ${i+1}: ${form.inputs.map(input => `${input.name} (${input.type}): ${input.value || input.placeholder}`).join(', ')}`
                            ).join('\n');
                            targetedContent += `\nTargeted Form Data:\n${formContent}\n`;
                        }
                        
                        if (questionLower.includes('image') || questionLower.includes('picture') || questionLower.includes('photo') || questionLower.includes('text in image') || questionLower.includes('what does the image say')) {
                            const visibleImages = images.filter(img => img.isVisible);
                            if (visibleImages.length > 0) {
                                // Process images for OCR
                                const imagePromises = visibleImages.slice(0, 3).map(async (img, i) => {
                                    try {
                                        const response = await fetch(img.src);
                                        const blob = await response.blob();
                                        const dataUrl = await new Promise((resolve) => {
                                            const reader = new FileReader();
                                            reader.onload = () => resolve(reader.result);
                                            reader.readAsDataURL(blob);
                                        });
                                        
                                        // Send to OCR endpoint
                                        const ocrResponse = await fetch('http://localhost:3000/ocr', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ image: dataUrl })
                                        });
                                        
                                        if (ocrResponse.ok) {
                                            const ocrResult = await ocrResponse.json();
                                            return `Image ${i+1}: ${img.alt || 'Image'} - OCR Text: "${ocrResult.text || 'No text detected'}"`;
                                        }
                                    } catch (error) {
                                        console.warn('OCR failed for image:', error);
                                    }
                                    return `Image ${i+1}: ${img.alt || 'Image'} (${img.width}x${img.height}) - OCR failed`;
                                });
                                
                                const imageResults = await Promise.allSettled(imagePromises);
                                const imageContent = imageResults
                                    .filter(result => result.status === 'fulfilled')
                                    .map(result => result.value)
                                    .join('\n');
                                
                                if (imageContent) {
                                    targetedContent += `\nTargeted Image OCR Data:\n${imageContent}\n`;
                                }
                            }
                        }
                        
                        if (questionLower.includes('pdf') || questionLower.includes('document') || questionLower.includes('pdf content') || questionLower.includes('what does the pdf say') || questionLower.includes('cv') || questionLower.includes('resume')) {
                            // If we're viewing a PDF directly, try to extract content
                            if (isPdfViewer && window.location.href.includes('.pdf')) {
                                // Note: PDF extraction will be handled in popup context
                                targetedContent += `\n📄 PDF DETECTED: Currently viewing PDF at ${window.location.href}\n`;
                            }
                            
                            const pdfContent = pdfs.map((pdf, i) => 
                                `PDF ${i+1}: ${pdf.text} - ${pdf.src}`
                            ).join('\n');
                            if (pdfContent) {
                                targetedContent += `\nTargeted PDF Data:\n${pdfContent}\n`;
                            }
                            
                            const docContent = embeddedDocs.map((doc, i) => 
                                `Document ${i+1}: ${doc.text} (${doc.type}) - ${doc.src}`
                            ).join('\n');
                            if (docContent) {
                                targetedContent += `\nTargeted Document Data:\n${docContent}\n`;
                            }
                        }
                        
                        if (questionLower.includes('link') || questionLower.includes('url') || questionLower.includes('href')) {
                            const linkContent = links.slice(0, 10).map((link, i) => 
                                `Link ${i+1}: "${link.text}" -> ${link.href}`
                            ).join('\n');
                            targetedContent += `\nTargeted Link Data:\n${linkContent}\n`;
                        }
                        
                        // Search for question keywords in page content
                        const questionWords = questionLower.split(' ').filter(word => word.length > 3);
                        const relevantElements = Array.from(document.querySelectorAll('*'))
                            .filter(el => {
                                const text = el.textContent?.toLowerCase() || '';
                                return questionWords.some(word => text.includes(word));
                            })
                            .map(el => el.textContent?.trim())
                            .filter(text => text && text.length > 10 && text.length < 500)
                            .slice(0, 5);
                        
                        if (relevantElements.length > 0) {
                            targetedContent += `\nRelevant Content (based on question keywords):\n${relevantElements.join('\n---\n')}\n`;
                        }
                    }
                    
                    // Get page structure
                    const pageStructure = {
                        hasHeader: !!document.querySelector('header, .header, #header'),
                        hasNav: !!document.querySelector('nav, .nav, #nav, .navigation'),
                        hasMain: !!document.querySelector('main, .main, #main'),
                        hasSidebar: !!document.querySelector('aside, .sidebar, .side'),
                        hasFooter: !!document.querySelector('footer, .footer, #footer')
                    };
                    
                    return {
                        title,
                        metaDescription,
                        headings,
                        textContent: textContent.substring(0, 15000), // Increased limit
                        visibleText: visibleText.substring(0, 10000),
                        viewportContent: viewportElements,
                        targetedContent, // Question-aware targeted content
                        tables,
                        lists,
                        forms,
                        images,
                        pdfs,
                        embeddedDocs,
                        links,
                        pageStructure,
                        isPdfViewer,
                        currentPdfContent,
                        url: window.location.href,
                        timestamp: new Date().toISOString()
                    };
                }
            });
            
            return results[0].result;
        } catch (error) {
            console.error('Error getting page content:', error);
            return { 
                title: '', 
                textContent: '', 
                headings: [], 
                metaDescription: '',
                visibleText: '',
                viewportContent: '',
                tables: [],
                lists: [],
                forms: [],
                images: [],
                links: [],
                pageStructure: {}
            };
        }
    }

    async sendToBackend(data) {
        const response = await fetch(`${this.config.backendUrl}/ask-ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    async captureScreenshot() {
        if (!this.enableOCR) {
            this.showNotification('OCR features are disabled in settings', 'warning');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Capture visible area
            const dataUrl = await chrome.tabs.captureVisibleTab();
            
            // Send to backend for OCR
            const response = await fetch(`${this.config.backendUrl}/ocr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: dataUrl,
                    url: window.location.href
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Add OCR text to question input
                const currentQuestion = document.getElementById('questionInput').value;
                const newQuestion = currentQuestion ? 
                    `${currentQuestion}\n\n[OCR Text]: ${result.text}` : 
                    `[OCR Text]: ${result.text}`;
                document.getElementById('questionInput').value = newQuestion;
                this.showNotification('Screenshot captured and text extracted!', 'success');
            } else {
                throw new Error(result.error || 'OCR failed');
            }

        } catch (error) {
            console.error('Error capturing screenshot:', error);
            this.showNotification(`Screenshot error: ${error.message}`, 'error');
        }
    }

    // File upload functionality
    triggerFileUpload() {
        document.getElementById('fileInput').click();
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileType = file.type;
        const fileName = file.name;

        try {
            this.showLoading(true);
            this.showNotification(`Processing ${fileName}...`, 'info');

            if (fileType === 'application/pdf') {
                await this.processPDF(file);
            } else if (fileType.startsWith('image/')) {
                await this.processImage(file);
            } else {
                throw new Error('Unsupported file type. Please upload PDF or image files.');
            }

        } catch (error) {
            console.error('Error processing file:', error);
            this.showNotification(`File processing error: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
            // Reset file input
            event.target.value = '';
        }
    }

    async processPDF(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const base64Data = e.target.result;
                    
                    const response = await fetch(`${this.config.backendUrl}/pdf/extract`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            pdfData: base64Data,
                            url: window.location.href
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    
                    if (result.success) {
                        const currentQuestion = document.getElementById('questionInput').value;
                        const newQuestion = currentQuestion ? 
                            `${currentQuestion}\n\n[PDF Content]: ${result.text}` : 
                            `[PDF Content]: ${result.text}`;
                        document.getElementById('questionInput').value = newQuestion;
                        this.showNotification('PDF processed successfully!', 'success');
                        resolve();
                    } else {
                        throw new Error(result.error || 'PDF processing failed');
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    async processImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const dataUrl = e.target.result;
                    
                    const response = await fetch(`${this.config.backendUrl}/ocr`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            image: dataUrl,
                            url: window.location.href
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    
                    if (result.success) {
                        const currentQuestion = document.getElementById('questionInput').value;
                        const newQuestion = currentQuestion ? 
                            `${currentQuestion}\n\n[Image Text]: ${result.text}` : 
                            `[Image Text]: ${result.text}`;
                        document.getElementById('questionInput').value = newQuestion;
                        this.showNotification('Image processed successfully!', 'success');
                        resolve();
                    } else {
                        throw new Error(result.error || 'Image processing failed');
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    // UI Updates
    showLoading(show) {
        const loading = document.getElementById('loadingState');
        const askBtn = document.getElementById('askBtn');
        
        if (show) {
            loading.classList.remove('hidden');
            askBtn.disabled = true;
            askBtn.textContent = 'Thinking...';
        } else {
            loading.classList.add('hidden');
            askBtn.disabled = false;
            askBtn.textContent = 'Ask AI';
        }
    }

    showResponse(answer) {
        const responseSection = document.getElementById('responseSection');
        const responseContent = document.getElementById('responseContent');
        
        responseContent.textContent = answer;
        responseSection.classList.remove('hidden');
    }

    hideResponse() {
        const responseSection = document.getElementById('responseSection');
        responseSection.classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 4px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#007bff'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // PDF Extraction
    async extractPdfContent(pdfUrl) {
        try {
            // Fetch the PDF
            const response = await fetch(pdfUrl);
            const blob = await response.blob();
            
            // Convert to data URL
            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
            
            // Send to backend for text extraction
            const extractResponse = await fetch('http://localhost:3000/pdf/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdfData: dataUrl })
            });
            
            if (extractResponse.ok) {
                const result = await extractResponse.json();
                return result.text;
            } else {
                throw new Error('PDF extraction failed');
            }
        } catch (error) {
            console.error('PDF extraction error:', error);
            return null;
        }
    }

    // Utility Functions
    toggleVoiceRecording() {
        if (!this.enableVoice) {
            this.showNotification('Voice input is disabled in settings', 'warning');
            return;
        }
        
        if (this.state.isRecording) {
            this.state.recognition.stop();
        } else {
            this.state.recognition.start();
        }
    }

    copyResponse() {
        const responseContent = document.getElementById('responseContent');
        if (responseContent) {
            navigator.clipboard.writeText(responseContent.textContent).then(() => {
                this.showNotification('Response copied to clipboard!', 'success');
            }).catch(() => {
                this.showNotification('Failed to copy response', 'error');
            });
        }
    }

    clearHistory() {
        this.state.history = [];
        this.saveHistory();
        this.renderHistory();
        this.showNotification('History cleared', 'success');
    }

    loadHistoryItem(itemId) {
        const item = this.state.history.find(h => h.id === itemId);
        if (item) {
            document.getElementById('questionInput').value = item.question;
            this.showResponse(item.answer);
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        document.getElementById('themeToggle').textContent = this.theme === 'dark' ? '☀️' : '🌙';
        
        // Save theme preference
        chrome.storage.sync.set({ theme: this.theme });
    }

    closeSettings() {
        document.getElementById('settingsModal').classList.add('hidden');
    }

    updateUI() {
        // Update button states based on settings
        document.getElementById('voiceBtn').style.display = this.enableVoice ? 'block' : 'none';
        document.getElementById('screenshotBtn').style.display = this.enableOCR ? 'block' : 'none';
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// Initialize the AI Assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIAssistant();
});
