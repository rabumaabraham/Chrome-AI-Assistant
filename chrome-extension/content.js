/**
 * Simple Content Script
 * Working version without complex module imports
 */

// Chrome AI Assistant Content Script

// Simple floating button functionality
function createFloatingButton() {
    // Remove existing button if any
    const existingBtn = document.getElementById('ai-assistant-floating-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    const floatingBtn = document.createElement('div');
    floatingBtn.id = 'ai-assistant-floating-btn';
    floatingBtn.innerHTML = '🤖 Ask AI';
    floatingBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #667eea;
        color: white;
        padding: 10px 15px;
        border-radius: 20px;
        cursor: pointer;
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;
    
    // Hover effects
    floatingBtn.addEventListener('mouseenter', () => {
        floatingBtn.style.background = '#5a67d8';
        floatingBtn.style.transform = 'scale(1.05)';
    });
    
    floatingBtn.addEventListener('mouseleave', () => {
        floatingBtn.style.background = '#667eea';
        floatingBtn.style.transform = 'scale(1)';
    });
    
    // Click handler
    floatingBtn.addEventListener('click', () => {
        // Send message to background script to open popup
        chrome.runtime.sendMessage({ action: 'openPopup' });
    });
    
    document.body.appendChild(floatingBtn);
}

// Production ready - debug functions removed

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingButton);
} else {
    createFloatingButton();
}
