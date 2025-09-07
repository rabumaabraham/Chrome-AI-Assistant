// AI Assistant Chrome Extension - Content Script
class ContentScript {
    constructor() {
        this.isFloatingButtonVisible = false;
        this.floatingButton = null;
        this.contextMenuEnabled = true;
        
        this.init();
    }

    init() {
        this.createFloatingButton();
        this.setupContextMenu();
        this.setupMessageListener();
        this.setupKeyboardShortcuts();
    }

    // Floating Action Button
    createFloatingButton() {
        // Create floating button container
        this.floatingButton = document.createElement('div');
        this.floatingButton.id = 'ai-assistant-floating-btn';
        this.floatingButton.innerHTML = `
            <div class="ai-btn-icon">🤖</div>
            <div class="ai-btn-tooltip">Ask AI about this page</div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #ai-assistant-floating-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #007bff, #0056b3);
                border-radius: 50%;
                cursor: pointer;
                z-index: 10000;
                box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                user-select: none;
            }
            
            #ai-assistant-floating-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(0, 123, 255, 0.4);
            }
            
            .ai-btn-icon {
                font-size: 24px;
                color: white;
            }
            
            .ai-btn-tooltip {
                position: absolute;
                bottom: 70px;
                right: 0;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
                transform: translateX(50%);
            }
            
            #ai-assistant-floating-btn:hover .ai-btn-tooltip {
                opacity: 1;
            }
            
            .ai-highlight {
                background-color: rgba(255, 255, 0, 0.3) !important;
                border-radius: 3px !important;
                transition: background-color 0.3s ease !important;
            }
            
            .ai-selected-text {
                background-color: rgba(0, 123, 255, 0.2) !important;
                border-radius: 3px !important;
                transition: background-color 0.3s ease !important;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.floatingButton);
        
        // Add click event
        this.floatingButton.addEventListener('click', () => {
            this.openPopup();
        });
        
        // Show/hide on scroll
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down
                this.floatingButton.style.transform = 'translateY(100px)';
            } else {
                // Scrolling up
                this.floatingButton.style.transform = 'translateY(0)';
            }
            lastScrollY = currentScrollY;
        });
    }

    // Context Menu for Text Selection
    setupContextMenu() {
        // Create context menu for selected text
        const contextMenu = document.createElement('div');
        contextMenu.id = 'ai-context-menu';
        contextMenu.innerHTML = `
            <div class="ai-context-item" data-action="ask-ai">
                <span class="ai-context-icon">🤖</span>
                Ask AI about this text
            </div>
            <div class="ai-context-item" data-action="explain">
                <span class="ai-context-icon">💡</span>
                Explain this text
            </div>
            <div class="ai-context-item" data-action="summarize">
                <span class="ai-context-icon">📝</span>
                Summarize this text
            </div>
        `;
        
        // Add context menu styles
        const contextStyle = document.createElement('style');
        contextStyle.textContent = `
            #ai-context-menu {
                position: fixed;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                z-index: 10001;
                display: none;
                min-width: 200px;
                overflow: hidden;
            }
            
            .ai-context-item {
                padding: 12px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
                color: #333;
                transition: background-color 0.2s ease;
            }
            
            .ai-context-item:hover {
                background-color: #f8f9fa;
            }
            
            .ai-context-icon {
                font-size: 16px;
            }
        `;
        
        document.head.appendChild(contextStyle);
        document.body.appendChild(contextMenu);
        
        // Handle context menu clicks
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.closest('.ai-context-item')?.dataset.action;
            if (action) {
                this.handleContextAction(action);
            }
            this.hideContextMenu();
        });
        
        // Hide context menu when clicking elsewhere
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
        
        // Show context menu on text selection
        document.addEventListener('mouseup', (e) => {
            const selection = window.getSelection();
            if (selection.toString().trim().length > 0) {
                this.showContextMenu(e, selection.toString());
            }
        });
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + A to open AI assistant
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.openPopup();
            }
            
            // Escape to close context menu
            if (e.key === 'Escape') {
                this.hideContextMenu();
            }
        });
    }

    // Message Listener for Communication with Popup
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'getPageContent':
                    sendResponse(this.getPageContent());
                    break;
                case 'highlightText':
                    this.highlightText(request.text);
                    sendResponse({ success: true });
                    break;
                case 'removeHighlights':
                    this.removeHighlights();
                    sendResponse({ success: true });
                    break;
                case 'injectResponse':
                    this.injectResponse(request.response, request.position);
                    sendResponse({ success: true });
                    break;
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        });
    }

    // Context Menu Actions
    handleContextAction(action) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (!selectedText) return;
        
        let question = '';
        switch (action) {
            case 'ask-ai':
                question = `Tell me about this text: "${selectedText}"`;
                break;
            case 'explain':
                question = `Explain this text in simple terms: "${selectedText}"`;
                break;
            case 'summarize':
                question = `Summarize this text: "${selectedText}"`;
                break;
        }
        
        // Send message to background script to open popup with question
        chrome.runtime.sendMessage({
            action: 'openPopupWithQuestion',
            question: question,
            selectedText: selectedText
        });
    }

    // Context Menu Display
    showContextMenu(event, selectedText) {
        if (!this.contextMenuEnabled || selectedText.length < 3) return;
        
        const contextMenu = document.getElementById('ai-context-menu');
        if (!contextMenu) return;
        
        // Position the context menu
        const x = event.pageX;
        const y = event.pageY;
        
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.display = 'block';
        
        // Adjust position if it goes off screen
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${y - rect.height}px`;
        }
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('ai-context-menu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
    }

    // Popup Management
    openPopup() {
        chrome.runtime.sendMessage({ action: 'openPopup' });
    }

    // Text Highlighting
    highlightText(text) {
        this.removeHighlights();
        
        if (!text) return;
        
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        
        while (node = walker.nextNode()) {
            if (node.textContent.toLowerCase().includes(text.toLowerCase())) {
                textNodes.push(node);
            }
        }
        
        textNodes.forEach(textNode => {
            const parent = textNode.parentNode;
            const text = textNode.textContent;
            const regex = new RegExp(`(${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            
            if (regex.test(text)) {
                const highlightedHTML = text.replace(regex, '<span class="ai-highlight">$1</span>');
                const wrapper = document.createElement('div');
                wrapper.innerHTML = highlightedHTML;
                
                while (wrapper.firstChild) {
                    parent.insertBefore(wrapper.firstChild, textNode);
                }
                parent.removeChild(textNode);
            }
        });
    }

    removeHighlights() {
        const highlights = document.querySelectorAll('.ai-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
    }

    // Response Injection
    injectResponse(response, position = 'bottom') {
        const responseContainer = document.createElement('div');
        responseContainer.id = 'ai-response-container';
        responseContainer.innerHTML = `
            <div class="ai-response-header">
                <h3>🤖 AI Response</h3>
                <button class="ai-response-close">&times;</button>
            </div>
            <div class="ai-response-content">${response}</div>
        `;
        
        // Add response styles
        const responseStyle = document.createElement('style');
        responseStyle.textContent = `
            #ai-response-container {
                position: fixed;
                ${position === 'top' ? 'top: 20px;' : 'bottom: 100px;'}
                right: 20px;
                width: 350px;
                max-height: 400px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                z-index: 10002;
                overflow: hidden;
            }
            
            .ai-response-header {
                background: #007bff;
                color: white;
                padding: 12px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .ai-response-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .ai-response-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .ai-response-content {
                padding: 16px;
                max-height: 300px;
                overflow-y: auto;
                font-size: 14px;
                line-height: 1.6;
            }
        `;
        
        document.head.appendChild(responseStyle);
        document.body.appendChild(responseContainer);
        
        // Add close functionality
        responseContainer.querySelector('.ai-response-close').addEventListener('click', () => {
            responseContainer.remove();
        });
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (responseContainer.parentNode) {
                responseContainer.remove();
            }
        }, 30000);
    }

    // Page Content Extraction
    getPageContent() {
        return {
            title: document.title,
            url: window.location.href,
            textContent: document.body.innerText || document.body.textContent || '',
            headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                .map(h => h.textContent.trim())
                .filter(h => h.length > 0),
            metaDescription: document.querySelector('meta[name="description"]')?.content || '',
            images: Array.from(document.querySelectorAll('img'))
                .map(img => ({
                    src: img.src,
                    alt: img.alt,
                    title: img.title
                }))
                .filter(img => img.src),
            links: Array.from(document.querySelectorAll('a[href]'))
                .map(a => ({
                    href: a.href,
                    text: a.textContent.trim()
                }))
                .filter(a => a.text && a.href)
        };
    }
}

// Initialize content script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ContentScript());
} else {
    new ContentScript();
}
