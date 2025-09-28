/**
 * Configuration Management
 * Centralized configuration for the Chrome Extension
 */

class Config {
    constructor() {
        this.data = {
            // Backend Configuration
            backend: {
                url: 'http://localhost:3000',
                timeout: 30000,
                retries: 3
            },

            // AI Configuration
            ai: {
                maxContextLength: 8000,
                maxHistoryItems: 50,
                defaultLanguage: 'en'
            },

            // OCR Configuration
            ocr: {
                maxImages: 3,
                minImageSize: 50,
                supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            },

            // PDF Configuration
            pdf: {
                maxFileSize: 10 * 1024 * 1024, // 10MB
                supportedFormats: ['application/pdf']
            },

            // UI Configuration
            ui: {
                animationDuration: 300,
                notificationTimeout: 3000,
                popupWidth: 400,
                popupHeight: 600
            },

            // Voice Configuration
            voice: {
                enabled: true,
                language: 'en-US',
                continuous: false,
                interimResults: true
            },

            // Storage Configuration
            storage: {
                historyKey: 'ai_assistant_history',
                settingsKey: 'ai_assistant_settings',
                maxHistoryItems: 50
            }
        };
    }

    /**
     * Get configuration value by path
     */
    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.data);
    }

    /**
     * Set configuration value by path
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, this.data);
        target[lastKey] = value;
    }

    /**
     * Get all configuration data
     */
    getAll() {
        return this.data;
    }

    /**
     * Update configuration from storage
     */
    async loadFromStorage() {
        try {
            const stored = await chrome.storage.sync.get([this.data.storage.settingsKey]);
            if (stored[this.data.storage.settingsKey]) {
                this.data = { ...this.data, ...stored[this.data.storage.settingsKey] };
            }
        } catch (error) {
            console.warn('Failed to load config from storage:', error);
        }
    }

    /**
     * Save configuration to storage
     */
    async saveToStorage() {
        try {
            await chrome.storage.sync.set({
                [this.data.storage.settingsKey]: this.data
            });
        } catch (error) {
            console.warn('Failed to save config to storage:', error);
        }
    }
}

// Export singleton instance
export default new Config();
