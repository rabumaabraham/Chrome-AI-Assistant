/**
 * Popup Controller
 * Handles the popup UI interactions and state management
 */

import AIAssistant from '../core/AIAssistant.js';
import Logger from '../core/Logger.js';

class PopupController {
    constructor() {
        this.logger = Logger.createServiceLogger('PopupController');
        this.aiAssistant = AIAssistant;
        this.elements = {};
        this.state = {
            isVisible: false,
            currentTab: null
        };

        this.initialize();
    }

    /**
     * Initialize the popup controller
     */
    async initialize() {
        try {
            this.logger.info('Initializing popup controller');
            
            // Cache DOM elements
            this.cacheElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial state
            await this.loadInitialState();
            
            this.logger.info('Popup controller initialized');
        } catch (error) {
            this.logger.error('Failed to initialize popup controller', error);
        }
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            questionInput: document.getElementById('questionInput'),
            askButton: document.getElementById('askBtn'),
            voiceButton: document.getElementById('voiceBtn'),
            clearButton: document.getElementById('clearBtn'),
            historyButton: document.getElementById('historyBtn'),
            settingsButton: document.getElementById('settingsBtn'),
            responseContent: document.getElementById('responseContent'),
            loading: document.getElementById('loading'),
            notification: document.getElementById('notification'),
            historyList: document.getElementById('historyList'),
            settingsPanel: document.getElementById('settingsPanel')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Ask button
        if (this.elements.askButton) {
            this.elements.askButton.addEventListener('click', () => this.handleAskQuestion());
        }

        // Voice button
        if (this.elements.voiceButton) {
            this.elements.voiceButton.addEventListener('click', () => this.handleVoiceToggle());
        }

        // Clear button
        if (this.elements.clearButton) {
            this.elements.clearButton.addEventListener('click', () => this.handleClear());
        }

        // History button
        if (this.elements.historyButton) {
            this.elements.historyButton.addEventListener('click', () => this.toggleHistory());
        }

        // Settings button
        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener('click', () => this.toggleSettings());
        }

        // Question input enter key
        if (this.elements.questionInput) {
            this.elements.questionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleAskQuestion();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    /**
     * Load initial state
     */
    async loadInitialState() {
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.state.currentTab = tab;
            
            // Load history
            this.displayHistory();
            
            // Check backend connectivity
            await this.checkBackendHealth();
            
        } catch (error) {
            this.logger.error('Failed to load initial state', error);
        }
    }

    /**
     * Handle ask question
     */
    async handleAskQuestion() {
        const question = this.elements.questionInput?.value?.trim();
        if (!question) {
            this.showNotification('Please enter a question', 'warning');
            return;
        }

        try {
            this.hideResponse();
            await this.aiAssistant.askAI(question);
        } catch (error) {
            this.logger.error('Failed to ask question', error);
            this.showNotification('Failed to process question', 'error');
        }
    }

    /**
     * Handle voice toggle
     */
    handleVoiceToggle() {
        try {
            this.aiAssistant.toggleVoiceRecording();
        } catch (error) {
            this.logger.error('Failed to toggle voice recording', error);
            this.showNotification('Voice recording failed', 'error');
        }
    }

    /**
     * Handle clear
     */
    handleClear() {
        this.elements.questionInput.value = '';
        this.hideResponse();
        this.showNotification('Cleared', 'success');
    }

    /**
     * Toggle history panel
     */
    toggleHistory() {
        const historyList = this.elements.historyList;
        if (historyList) {
            const isVisible = historyList.style.display !== 'none';
            historyList.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.displayHistory();
            }
        }
    }

    /**
     * Toggle settings panel
     */
    toggleSettings() {
        const settingsPanel = this.elements.settingsPanel;
        if (settingsPanel) {
            const isVisible = settingsPanel.style.display !== 'none';
            settingsPanel.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.displaySettings();
            }
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'Enter':
                    event.preventDefault();
                    this.handleAskQuestion();
                    break;
                case 'v':
                    if (event.shiftKey) {
                        event.preventDefault();
                        this.handleVoiceToggle();
                    }
                    break;
                case 'h':
                    event.preventDefault();
                    this.toggleHistory();
                    break;
                case 's':
                    event.preventDefault();
                    this.toggleSettings();
                    break;
            }
        }
    }

    /**
     * Display history
     */
    displayHistory() {
        const historyList = this.elements.historyList;
        if (!historyList) return;

        const history = this.aiAssistant.getState().history;
        
        if (history.length === 0) {
            historyList.innerHTML = '<p class="no-history">No history available</p>';
            return;
        }

        historyList.innerHTML = history
            .slice(-10) // Show last 10 items
            .reverse() // Show newest first
            .map(item => `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-question">${this.escapeHtml(item.question)}</div>
                    <div class="history-answer">${this.escapeHtml(item.answer.substring(0, 100))}${item.answer.length > 100 ? '...' : ''}</div>
                    <div class="history-timestamp">${new Date(item.timestamp).toLocaleString()}</div>
                </div>
            `)
            .join('');

        // Add click handlers to history items
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const historyItem = history.find(h => h.id == id);
                if (historyItem) {
                    this.elements.questionInput.value = historyItem.question;
                    this.showResponse(historyItem.answer);
                }
            });
        });
    }

    /**
     * Display settings
     */
    displaySettings() {
        const settingsPanel = this.elements.settingsPanel;
        if (!settingsPanel) return;

        const settings = this.aiAssistant.getState().settings;
        
        settingsPanel.innerHTML = `
            <div class="settings-section">
                <h3>Backend Configuration</h3>
                <label>
                    Backend URL:
                    <input type="url" id="backendUrl" value="${settings.backendUrl || 'http://localhost:3000'}">
                </label>
            </div>
            <div class="settings-section">
                <h3>Voice Settings</h3>
                <label>
                    <input type="checkbox" id="voiceEnabled" ${settings.voiceEnabled ? 'checked' : ''}>
                    Enable Voice Input
                </label>
                <label>
                    Language:
                    <select id="voiceLanguage">
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es-ES">Spanish</option>
                        <option value="fr-FR">French</option>
                        <option value="de-DE">German</option>
                    </select>
                </label>
            </div>
            <div class="settings-actions">
                <button id="saveSettings">Save Settings</button>
                <button id="clearHistory">Clear History</button>
            </div>
        `;

        // Setup settings event listeners
        const saveButton = settingsPanel.querySelector('#saveSettings');
        const clearHistoryButton = settingsPanel.querySelector('#clearHistory');

        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveSettings());
        }

        if (clearHistoryButton) {
            clearHistoryButton.addEventListener('click', () => this.clearHistory());
        }
    }

    /**
     * Save settings
     */
    async saveSettings() {
        try {
            const settingsPanel = this.elements.settingsPanel;
            const backendUrl = settingsPanel.querySelector('#backendUrl')?.value;
            const voiceEnabled = settingsPanel.querySelector('#voiceEnabled')?.checked;
            const voiceLanguage = settingsPanel.querySelector('#voiceLanguage')?.value;

            const settings = {
                backendUrl,
                voiceEnabled,
                voiceLanguage
            };

            // Update AI Assistant settings
            this.aiAssistant.state.settings = { ...this.aiAssistant.state.settings, ...settings };
            await this.aiAssistant.saveSettings();

            this.showNotification('Settings saved', 'success');
            this.toggleSettings();
        } catch (error) {
            this.logger.error('Failed to save settings', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }

    /**
     * Clear history
     */
    async clearHistory() {
        try {
            await this.aiAssistant.clearHistory();
            this.displayHistory();
        } catch (error) {
            this.logger.error('Failed to clear history', error);
            this.showNotification('Failed to clear history', 'error');
        }
    }

    /**
     * Check backend health
     */
    async checkBackendHealth() {
        try {
            const health = await this.aiAssistant.api.checkHealth();
            if (!health.success) {
                this.showNotification('Backend not available', 'warning');
            }
        } catch (error) {
            this.showNotification('Cannot connect to backend', 'error');
        }
    }

    /**
     * Show response
     */
    showResponse(response) {
        if (this.elements.responseContent) {
            this.elements.responseContent.innerHTML = response;
            this.elements.responseContent.style.display = 'block';
        }
    }

    /**
     * Hide response
     */
    hideResponse() {
        if (this.elements.responseContent) {
            this.elements.responseContent.style.display = 'none';
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = this.elements.notification;
        if (!notification) return;

        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export default PopupController;
