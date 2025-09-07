// AI Assistant Chrome Extension - Background Script
class BackgroundService {
    constructor() {
        this.init();
    }

    init() {
        this.setupMessageListener();
        this.setupContextMenus();
        this.setupInstallListener();
    }

    // Message Listener for Communication
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'openPopup':
                    this.openPopup();
                    sendResponse({ success: true });
                    break;
                    
                case 'openPopupWithQuestion':
                    this.openPopupWithQuestion(request.question, request.selectedText);
                    sendResponse({ success: true });
                    break;
                    
                case 'getActiveTab':
                    this.getActiveTab().then(tab => {
                        sendResponse({ success: true, tab });
                    });
                    return true; // Keep message channel open for async response
                    
                case 'executeScript':
                    this.executeScript(request.code, request.tabId).then(result => {
                        sendResponse({ success: true, result });
                    }).catch(error => {
                        sendResponse({ success: false, error: error.message });
                    });
                    return true; // Keep message channel open for async response
                    
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        });
    }

    // Context Menu Setup
    setupContextMenus() {
        // Remove existing context menus
        chrome.contextMenus.removeAll(() => {
            // Create main context menu
            chrome.contextMenus.create({
                id: 'ai-assistant-main',
                title: 'Ask AI Assistant',
                contexts: ['selection', 'page'],
                documentUrlPatterns: ['<all_urls>']
            });

            // Create submenu for selected text
            chrome.contextMenus.create({
                id: 'ai-explain',
                parentId: 'ai-assistant-main',
                title: 'Explain this text',
                contexts: ['selection']
            });

            chrome.contextMenus.create({
                id: 'ai-summarize',
                parentId: 'ai-assistant-main',
                title: 'Summarize this text',
                contexts: ['selection']
            });

            chrome.contextMenus.create({
                id: 'ai-translate',
                parentId: 'ai-assistant-main',
                title: 'Translate this text',
                contexts: ['selection']
            });

            chrome.contextMenus.create({
                id: 'ai-ask-about-page',
                parentId: 'ai-assistant-main',
                title: 'Ask about this page',
                contexts: ['page']
            });

            chrome.contextMenus.create({
                id: 'ai-screenshot-ocr',
                parentId: 'ai-assistant-main',
                title: 'Screenshot & OCR',
                contexts: ['page']
            });
        });

        // Handle context menu clicks
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });
    }

    // Context Menu Click Handler
    async handleContextMenuClick(info, tab) {
        try {
            switch (info.menuItemId) {
                case 'ai-explain':
                    await this.openPopupWithQuestion(
                        `Explain this text in simple terms: "${info.selectionText}"`,
                        info.selectionText
                    );
                    break;

                case 'ai-summarize':
                    await this.openPopupWithQuestion(
                        `Summarize this text: "${info.selectionText}"`,
                        info.selectionText
                    );
                    break;

                case 'ai-translate':
                    await this.openPopupWithQuestion(
                        `Translate this text to English: "${info.selectionText}"`,
                        info.selectionText
                    );
                    break;

                case 'ai-ask-about-page':
                    await this.openPopupWithQuestion(
                        'Tell me about this webpage and its main content',
                        null
                    );
                    break;

                case 'ai-screenshot-ocr':
                    await this.captureScreenshotAndOCR(tab);
                    break;
            }
        } catch (error) {
            console.error('Error handling context menu click:', error);
        }
    }

    // Popup Management
    async openPopup() {
        try {
            // Close existing popup if open
            await this.closeExistingPopup();
            
            // Open new popup
            await chrome.action.openPopup();
        } catch (error) {
            console.error('Error opening popup:', error);
            // Fallback: open in new tab
            chrome.tabs.create({
                url: chrome.runtime.getURL('popup.html')
            });
        }
    }

    async openPopupWithQuestion(question, selectedText = null) {
        try {
            // Store question and selected text for popup to retrieve
            await chrome.storage.local.set({
                pendingQuestion: question,
                selectedText: selectedText,
                timestamp: Date.now()
            });

            // Open popup
            await this.openPopup();
        } catch (error) {
            console.error('Error opening popup with question:', error);
        }
    }

    async closeExistingPopup() {
        try {
            // Try to close existing popup by sending a message
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                if (tab.url && tab.url.includes(chrome.runtime.id)) {
                    await chrome.tabs.remove(tab.id);
                }
            }
        } catch (error) {
            // Ignore errors when closing popup
        }
    }

    // Screenshot and OCR
    async captureScreenshotAndOCR(tab) {
        try {
            // Capture visible area
            const dataUrl = await chrome.tabs.captureVisibleTab();
            
            // Send to backend for OCR
            const response = await fetch('http://localhost:3000/ocr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: dataUrl,
                    url: tab.url
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Open popup with OCR text
                await this.openPopupWithQuestion(
                    `I captured a screenshot and extracted this text: "${result.text}". Please help me understand or answer questions about it.`,
                    result.text
                );
            } else {
                throw new Error(result.error || 'OCR failed');
            }

        } catch (error) {
            console.error('Error capturing screenshot:', error);
            // Show error notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'AI Assistant Error',
                message: `Screenshot error: ${error.message}`
            });
        }
    }

    // Utility Functions
    async getActiveTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    }

    async executeScript(code, tabId = null) {
        const tab = tabId ? { tabId } : await this.getActiveTab();
        const results = await chrome.scripting.executeScript({
            target: tab,
            function: new Function('return ' + code)
        });
        return results[0].result;
    }

    // Install/Update Listener
    setupInstallListener() {
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                // First time installation
                this.showWelcomeNotification();
                this.setDefaultSettings();
            } else if (details.reason === 'update') {
                // Extension updated
                this.showUpdateNotification(details.previousVersion);
            }
        });
    }

    async setDefaultSettings() {
        const defaultSettings = {
            backendUrl: 'http://localhost:3000',
            enableVoice: true,
            enableOCR: true,
            theme: 'light'
        };

        await chrome.storage.sync.set(defaultSettings);
    }

    showWelcomeNotification() {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'AI Assistant Installed!',
            message: 'Right-click on any text or use the floating button to get started.'
        });
    }

    showUpdateNotification(previousVersion) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'AI Assistant Updated!',
            message: `Updated from version ${previousVersion}. New features available!`
        });
    }
}

// Initialize background service
new BackgroundService();
