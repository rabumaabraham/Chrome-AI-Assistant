/**
 * Background Script for Chrome AI Assistant
 */

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

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);
    
    if (request.action === 'openPopup') {
        console.log('Attempting to open popup...');
        try {
            // Try to open popup first
            chrome.action.openPopup();
            console.log('Popup opened successfully');
            sendResponse({ success: true });
        } catch (error) {
            console.error('Error opening popup:', error);
            
            // Fallback: Create a new tab with the extension
            try {
                chrome.tabs.create({
                    url: chrome.runtime.getURL('popup.html')
                });
                console.log('Opened extension in new tab');
                sendResponse({ success: true, fallback: true });
            } catch (tabError) {
                console.error('Error opening tab:', tabError);
                sendResponse({ success: false, error: tabError.message });
            }
        }
    }
    
    return true; // Keep the message channel open for async response
});
