/**
 * Background Controller
 * Handles background script functionality and service worker operations
 */

import Logger from '../core/Logger.js';

class BackgroundController {
    constructor() {
        this.logger = Logger.createServiceLogger('BackgroundController');
        this.initialize();
    }

    /**
     * Initialize the background controller
     */
    initialize() {
        try {
            this.logger.info('Initializing background controller');
            
            this.setupContextMenus();
            this.setupMessageListener();
            this.setupInstallHandler();
            this.setupUpdateHandler();
            
            this.logger.info('Background controller initialized');
        } catch (error) {
            this.logger.error('Failed to initialize background controller', error);
        }
    }

    /**
     * Setup context menus
     */
    setupContextMenus() {
        // Create context menu items
        chrome.contextMenus.create({
            id: 'ask-ai-selection',
            title: '🤖 Ask AI about this text',
            contexts: ['selection']
        });

        chrome.contextMenus.create({
            id: 'explain-text',
            title: '📝 Explain this text',
            contexts: ['selection']
        });

        chrome.contextMenus.create({
            id: 'summarize-text',
            title: '📋 Summarize this text',
            contexts: ['selection']
        });

        chrome.contextMenus.create({
            id: 'ask-ai-page',
            title: '🤖 Ask AI about this page',
            contexts: ['page']
        });

        // Handle context menu clicks
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });

        this.logger.info('Context menus created');
    }

    /**
     * Handle context menu clicks
     */
    async handleContextMenuClick(info, tab) {
        try {
            this.logger.info('Context menu clicked', { menuItemId: info.menuItemId });

            switch (info.menuItemId) {
                case 'ask-ai-selection':
                    await this.openPopupWithSelection(tab, info.selectionText, 'Ask AI about this text');
                    break;

                case 'explain-text':
                    await this.openPopupWithSelection(tab, info.selectionText, 'Explain this text');
                    break;

                case 'summarize-text':
                    await this.openPopupWithSelection(tab, info.selectionText, 'Summarize this text');
                    break;

                case 'ask-ai-page':
                    await this.openPopup(tab);
                    break;

                default:
                    this.logger.warn('Unknown context menu item', info.menuItemId);
            }
        } catch (error) {
            this.logger.error('Failed to handle context menu click', error);
        }
    }

    /**
     * Open popup with selected text
     */
    async openPopupWithSelection(tab, selectedText, questionPrefix) {
        try {
            // Store the selected text and question prefix
            await chrome.storage.local.set({
                selectedText: selectedText,
                questionPrefix: questionPrefix,
                tabId: tab.id
            });

            // Open the popup
            await this.openPopup(tab);
        } catch (error) {
            this.logger.error('Failed to open popup with selection', error);
        }
    }

    /**
     * Open popup
     */
    async openPopup(tab) {
        try {
            // Get popup URL
            const popupUrl = chrome.runtime.getURL('popup.html');
            
            // Create or update popup window
            const windows = await chrome.windows.getAll();
            const existingPopup = windows.find(w => w.type === 'popup' && w.url?.includes('popup.html'));
            
            if (existingPopup) {
                // Focus existing popup
                await chrome.windows.update(existingPopup.id, { focused: true });
            } else {
                // Create new popup window
                await chrome.windows.create({
                    url: popupUrl,
                    type: 'popup',
                    width: 420,
                    height: 650,
                    focused: true
                });
            }

            this.logger.info('Popup opened', { tabId: tab.id });
        } catch (error) {
            this.logger.error('Failed to open popup', error);
        }
    }

    /**
     * Setup message listener
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.logger.debug('Background received message', request);

            switch (request.action) {
                case 'openPopup':
                    this.openPopup(sender.tab).then(() => {
                        sendResponse({ success: true });
                    });
                    return true; // Keep message channel open for async response

                case 'getTabInfo':
                    this.getTabInfo(sender.tab).then(sendResponse);
                    return true;

                case 'executeScript':
                    this.executeScript(request.script, sender.tab).then(sendResponse);
                    return true;

                default:
                    this.logger.warn('Unknown message action', request.action);
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        });
    }

    /**
     * Get tab information
     */
    async getTabInfo(tab) {
        try {
            return {
                success: true,
                tab: {
                    id: tab.id,
                    url: tab.url,
                    title: tab.title,
                    active: tab.active
                }
            };
        } catch (error) {
            this.logger.error('Failed to get tab info', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute script in tab
     */
    async executeScript(script, tab) {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: new Function('return ' + script)
            });

            return { success: true, results };
        } catch (error) {
            this.logger.error('Failed to execute script', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Setup install handler
     */
    setupInstallHandler() {
        chrome.runtime.onInstalled.addListener((details) => {
            this.logger.info('Extension installed/updated', details);

            if (details.reason === 'install') {
                this.handleInstall();
            } else if (details.reason === 'update') {
                this.handleUpdate(details.previousVersion);
            }
        });
    }

    /**
     * Handle extension installation
     */
    async handleInstall() {
        try {
            // Set default settings
            await chrome.storage.sync.set({
                ai_assistant_settings: {
                    backendUrl: 'http://localhost:3000',
                    voiceEnabled: true,
                    voiceLanguage: 'en-US'
                }
            });

            // Show welcome notification
            this.showNotification('Chrome AI Assistant installed successfully!', 'basic');

            this.logger.info('Extension installed successfully');
        } catch (error) {
            this.logger.error('Failed to handle install', error);
        }
    }

    /**
     * Handle extension update
     */
    async handleUpdate(previousVersion) {
        try {
            this.logger.info('Extension updated', { from: previousVersion, to: chrome.runtime.getManifest().version });
            
            // Handle any necessary migrations or updates
            await this.migrateSettings(previousVersion);
            
            this.showNotification('Chrome AI Assistant updated!', 'basic');
        } catch (error) {
            this.logger.error('Failed to handle update', error);
        }
    }

    /**
     * Migrate settings from previous version
     */
    async migrateSettings(previousVersion) {
        try {
            // Add migration logic here if needed
            this.logger.info('Settings migration completed', { from: previousVersion });
        } catch (error) {
            this.logger.error('Failed to migrate settings', error);
        }
    }

    /**
     * Setup update handler
     */
    setupUpdateHandler() {
        chrome.runtime.onStartup.addListener(() => {
            this.logger.info('Extension started up');
        });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'basic') {
        try {
            chrome.notifications.create({
                type: type,
                iconUrl: chrome.runtime.getURL('icons/icon48.png'),
                title: 'Chrome AI Assistant',
                message: message
            });
        } catch (error) {
            this.logger.error('Failed to show notification', error);
        }
    }

    /**
     * Handle tab updates
     */
    handleTabUpdate(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.url) {
            this.logger.debug('Tab updated', { tabId, url: tab.url });
            
            // Inject content script if needed
            this.ensureContentScript(tab);
        }
    }

    /**
     * Ensure content script is injected
     */
    async ensureContentScript(tab) {
        try {
            // Check if content script is already injected
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => !!window.aiAssistantContentScript
            });

            if (!results[0]?.result) {
                // Inject content script
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });

                await chrome.scripting.insertCSS({
                    target: { tabId: tab.id },
                    files: ['content.css']
                });

                this.logger.info('Content script injected', { tabId: tab.id });
            }
        } catch (error) {
            this.logger.error('Failed to inject content script', error);
        }
    }
}

// Initialize background controller
new BackgroundController();
