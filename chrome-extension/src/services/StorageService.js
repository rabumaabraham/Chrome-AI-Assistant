/**
 * Storage Service
 * Handles Chrome extension storage operations
 */

import Config from '../core/Config.js';
import Logger from '../core/Logger.js';

class StorageService {
    constructor() {
        this.logger = Logger.createServiceLogger('Storage');
        this.config = Config;
    }

    /**
     * Save data to Chrome storage
     */
    async save(key, data) {
        try {
            await chrome.storage.sync.set({ [key]: data });
            this.logger.debug(`Data saved to storage: ${key}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to save data to storage: ${key}`, error);
            return false;
        }
    }

    /**
     * Load data from Chrome storage
     */
    async load(key, defaultValue = null) {
        try {
            const result = await chrome.storage.sync.get([key]);
            const data = result[key] !== undefined ? result[key] : defaultValue;
            this.logger.debug(`Data loaded from storage: ${key}`);
            return data;
        } catch (error) {
            this.logger.error(`Failed to load data from storage: ${key}`, error);
            return defaultValue;
        }
    }

    /**
     * Remove data from Chrome storage
     */
    async remove(key) {
        try {
            await chrome.storage.sync.remove([key]);
            this.logger.debug(`Data removed from storage: ${key}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to remove data from storage: ${key}`, error);
            return false;
        }
    }

    /**
     * Clear all storage data
     */
    async clear() {
        try {
            await chrome.storage.sync.clear();
            this.logger.info('All storage data cleared');
            return true;
        } catch (error) {
            this.logger.error('Failed to clear storage data', error);
            return false;
        }
    }

    /**
     * Get all storage data
     */
    async getAll() {
        try {
            const data = await chrome.storage.sync.get();
            this.logger.debug('All storage data loaded');
            return data;
        } catch (error) {
            this.logger.error('Failed to load all storage data', error);
            return {};
        }
    }

    /**
     * Save conversation history
     */
    async saveHistory(history) {
        const trimmedHistory = history.slice(-this.config.get('storage.maxHistoryItems'));
        return await this.save(this.config.get('storage.historyKey'), trimmedHistory);
    }

    /**
     * Load conversation history
     */
    async loadHistory() {
        return await this.load(this.config.get('storage.historyKey'), []);
    }

    /**
     * Save settings
     */
    async saveSettings(settings) {
        return await this.save(this.config.get('storage.settingsKey'), settings);
    }

    /**
     * Load settings
     */
    async loadSettings() {
        return await this.load(this.config.get('storage.settingsKey'), {});
    }

    /**
     * Add item to history
     */
    async addToHistory(question, answer) {
        try {
            const history = await this.loadHistory();
            const newItem = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                question,
                answer
            };
            
            history.push(newItem);
            await this.saveHistory(history);
            
            this.logger.debug('Item added to history', { id: newItem.id });
            return newItem;
        } catch (error) {
            this.logger.error('Failed to add item to history', error);
            return null;
        }
    }

    /**
     * Clear history
     */
    async clearHistory() {
        return await this.remove(this.config.get('storage.historyKey'));
    }
}

// Export singleton instance
export default new StorageService();
