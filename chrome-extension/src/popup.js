/**
 * Popup Main Entry Point
 * Initializes the popup controller when the popup is opened
 */

import PopupController from './popup/PopupController.js';

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new PopupController();
    } catch (error) {
        console.error('Failed to initialize popup:', error);
        
        // Fallback UI
        const questionInput = document.getElementById('questionInput');
        const askButton = document.getElementById('askBtn');
        
        if (askButton && questionInput) {
            askButton.addEventListener('click', () => {
                const question = questionInput.value.trim();
                if (question) {
                    alert('Extension not properly loaded. Please reload the extension.');
                }
            });
        }
    }
});
