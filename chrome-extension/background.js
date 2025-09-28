/**
 * Background Script Entry Point - Legacy Compatibility
 * Redirects to the new modular architecture
 */

// Import and initialize the new background controller
import('./src/background/BackgroundController.js').catch(error => {
    console.error('Failed to load modular background script:', error);
    
    // Fallback to basic functionality
    console.log('Using fallback background script functionality');
    
    // Basic context menu setup
    chrome.runtime.onInstalled.addListener(() => {
        chrome.contextMenus.create({
            id: 'ask-ai',
            title: '🤖 Ask AI about this text',
            contexts: ['selection']
        });
    });
    
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === 'ask-ai') {
            chrome.tabs.sendMessage(tab.id, {
                action: 'openPopup',
                selectedText: info.selectionText
            });
        }
    });
});
