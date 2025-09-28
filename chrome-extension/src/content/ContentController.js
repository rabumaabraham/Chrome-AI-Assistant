/**
 * Content Controller
 * Handles content script functionality and DOM interactions
 */

import Logger from '../core/Logger.js';
import Config from '../core/Config.js';

class ContentController {
    constructor() {
        this.logger = Logger.createServiceLogger('ContentController');
        this.config = Config;
        this.state = {
            isFloatingButtonVisible: false,
            floatingButton: null,
            contextMenuEnabled: true,
            selectedText: ''
        };

        this.initialize();
    }

    /**
     * Initialize the content controller
     */
    initialize() {
        try {
            this.logger.info('Initializing content controller');
            
            this.setupFloatingButton();
            this.setupContextMenu();
            this.setupKeyboardShortcuts();
            this.setupMessageListener();
            
            this.logger.info('Content controller initialized');
        } catch (error) {
            this.logger.error('Failed to initialize content controller', error);
        }
    }

    /**
     * Setup floating AI button
     */
    setupFloatingButton() {
        // Create floating button
        this.state.floatingButton = document.createElement('div');
        this.state.floatingButton.id = 'ai-assistant-floating-btn';
        this.state.floatingButton.innerHTML = '🤖 Ask AI';
        this.state.floatingButton.className = 'ai-assistant-floating-btn';
        
        // Add click handler
        this.state.floatingButton.addEventListener('click', () => {
            this.openPopup();
        });

        // Initially hide the button
        this.state.floatingButton.style.display = 'none';
        document.body.appendChild(this.state.floatingButton);

        // Show/hide based on scroll and selection
        this.setupFloatingButtonVisibility();
    }

    /**
     * Setup floating button visibility logic
     */
    setupFloatingButtonVisibility() {
        let isScrolling = false;
        let scrollTimeout;

        // Show button on text selection
        document.addEventListener('selectionchange', () => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (selectedText.length > 0) {
                this.state.selectedText = selectedText;
                this.showFloatingButton();
            } else {
                this.hideFloatingButton();
            }
        });

        // Hide button when scrolling
        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                isScrolling = true;
                this.hideFloatingButton();
            }
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 150);
        });

        // Hide button on click outside
        document.addEventListener('click', (e) => {
            if (!this.state.floatingButton.contains(e.target)) {
                this.hideFloatingButton();
            }
        });
    }

    /**
     * Show floating button
     */
    showFloatingButton() {
        if (this.state.floatingButton) {
            this.state.floatingButton.style.display = 'block';
            this.state.isFloatingButtonVisible = true;
            
            // Position button near selection
            this.positionFloatingButton();
        }
    }

    /**
     * Hide floating button
     */
    hideFloatingButton() {
        if (this.state.floatingButton) {
            this.state.floatingButton.style.display = 'none';
            this.state.isFloatingButtonVisible = false;
        }
    }

    /**
     * Position floating button near selection
     */
    positionFloatingButton() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            const button = this.state.floatingButton;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            button.style.position = 'absolute';
            button.style.top = `${rect.bottom + scrollTop + 5}px`;
            button.style.left = `${rect.left + scrollLeft}px`;
            button.style.zIndex = '10000';
        }
    }

    /**
     * Setup context menu
     */
    setupContextMenu() {
        if (!this.state.contextMenuEnabled) return;

        // Listen for context menu messages
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'createContextMenu') {
                this.createContextMenu();
            }
        });
    }

    /**
     * Create context menu items
     */
    createContextMenu() {
        // This would typically be done in the background script
        // but we can handle context menu clicks here
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+A to open AI assistant
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.openPopup();
            }
            
            // Escape to hide floating button
            if (e.key === 'Escape') {
                this.hideFloatingButton();
            }
        });
    }

    /**
     * Setup message listener
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.logger.debug('Content script received message', request);

            switch (request.action) {
                case 'getPageContent':
                    this.getPageContent().then(sendResponse);
                    return true; // Keep message channel open for async response

                case 'highlightText':
                    this.highlightText(request.text);
                    sendResponse({ success: true });
                    break;

                case 'injectResponse':
                    this.injectResponse(request.response, request.position);
                    sendResponse({ success: true });
                    break;

                case 'toggleFloatingButton':
                    this.toggleFloatingButton();
                    sendResponse({ success: true });
                    break;

                default:
                    this.logger.warn('Unknown message action', request.action);
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        });
    }

    /**
     * Get page content for AI analysis
     */
    async getPageContent() {
        try {
            // This would integrate with DOMService
            const content = {
                url: window.location.href,
                title: document.title,
                textContent: document.body.innerText,
                selectedText: this.state.selectedText
            };

            return { success: true, content };
        } catch (error) {
            this.logger.error('Failed to get page content', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Highlight text on the page
     */
    highlightText(text) {
        try {
            // Remove existing highlights
            this.removeHighlights();

            // Create highlight for the text
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let node;
            while (node = walker.nextNode()) {
                const nodeText = node.textContent;
                if (nodeText.includes(text)) {
                    const regex = new RegExp(`(${text})`, 'gi');
                    const highlightedHTML = nodeText.replace(regex, '<mark class="ai-highlight">$1</mark>');
                    
                    if (highlightedHTML !== nodeText) {
                        const wrapper = document.createElement('div');
                        wrapper.innerHTML = highlightedHTML;
                        node.parentNode.replaceChild(wrapper, node);
                    }
                }
            }

            this.logger.info('Text highlighted', { text });
        } catch (error) {
            this.logger.error('Failed to highlight text', error);
        }
    }

    /**
     * Remove all highlights
     */
    removeHighlights() {
        const highlights = document.querySelectorAll('.ai-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
    }

    /**
     * Inject AI response into the page
     */
    injectResponse(response, position = 'bottom') {
        try {
            // Remove existing response if any
            this.removeInjectedResponse();

            // Create response element
            const responseElement = document.createElement('div');
            responseElement.id = 'ai-assistant-response';
            responseElement.className = 'ai-assistant-response';
            responseElement.innerHTML = `
                <div class="ai-response-header">
                    <span class="ai-response-title">🤖 AI Response</span>
                    <button class="ai-response-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="ai-response-content">${response}</div>
            `;

            // Insert based on position
            switch (position) {
                case 'top':
                    document.body.insertBefore(responseElement, document.body.firstChild);
                    break;
                case 'bottom':
                default:
                    document.body.appendChild(responseElement);
                    break;
            }

            // Scroll to response
            responseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            this.logger.info('AI response injected', { position });
        } catch (error) {
            this.logger.error('Failed to inject response', error);
        }
    }

    /**
     * Remove injected response
     */
    removeInjectedResponse() {
        const existing = document.getElementById('ai-assistant-response');
        if (existing) {
            existing.remove();
        }
    }

    /**
     * Toggle floating button visibility
     */
    toggleFloatingButton() {
        if (this.state.isFloatingButtonVisible) {
            this.hideFloatingButton();
        } else {
            this.showFloatingButton();
        }
    }

    /**
     * Open popup
     */
    openPopup() {
        chrome.runtime.sendMessage({ action: 'openPopup' });
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
}

// Initialize content controller when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ContentController();
    });
} else {
    new ContentController();
}

export default ContentController;
