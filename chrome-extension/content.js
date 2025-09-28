/**
 * Chrome AI Assistant Content Script
 * Floating button completely removed
 */

// Remove any existing floating buttons immediately
function removeAllFloatingButtons() {
    // Remove by ID
    const existingBtn = document.getElementById('ai-assistant-floating-btn');
    if (existingBtn) {
        existingBtn.remove();
        console.log('Removed floating button by ID');
    }
    
    // Remove by class name (if any)
    const buttonsByClass = document.querySelectorAll('.ai-assistant-floating-btn');
    buttonsByClass.forEach(btn => {
        btn.remove();
        console.log('Removed floating button by class');
    });
    
    // Remove any element with the text "Ask AI"
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        if (el.textContent && el.textContent.includes('Ask AI') && el.textContent.includes('🤖')) {
            el.remove();
            console.log('Removed floating button by text content');
        }
    });
}

// Run immediately
removeAllFloatingButtons();

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeAllFloatingButtons);
} else {
    removeAllFloatingButtons();
}

// Run periodically to catch any buttons that might be added later
setInterval(removeAllFloatingButtons, 1000);
