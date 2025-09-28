/**
 * Content Script Entry Point
 * Simple working version
 */

// Load the simple content script
import('./content-simple.js').catch(error => {
    console.error('Failed to load content script:', error);
    
    // Fallback to basic functionality
    console.log('Using fallback content script functionality');
    
    // Basic floating button functionality
    const floatingBtn = document.createElement('div');
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
    `;
    
    floatingBtn.addEventListener('click', () => {
        alert('Chrome AI Assistant - Please use the extension popup for full functionality');
    });
    
    document.body.appendChild(floatingBtn);
});
