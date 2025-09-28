/**
 * Popup Entry Point
 * Main entry point for the Chrome extension popup
 */

import PopupController from './popup/PopupController.js';
import Logger from './core/Logger.js';

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        Logger.info('Initializing Chrome AI Assistant Popup');
        
        // Initialize popup controller
        const popupController = new PopupController();
        
        Logger.info('Chrome AI Assistant Popup initialized successfully');
    } catch (error) {
        Logger.error('Failed to initialize popup', error);
        console.error('Popup initialization error:', error);
    }
});

// Handle popup visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        Logger.debug('Popup became visible');
        // Refresh data when popup becomes visible
    }
});

// Export for potential external use
export { PopupController };
