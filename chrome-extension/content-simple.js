/**
 * Simple Content Script
 * Working version without complex module imports
 */

console.log('🚀 Chrome AI Assistant Content Script Loading...');

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
    console.log('✅ Floating button created');
}

// Debug functions for testing
window.debugAI = {
    testPDFDetection: () => {
        const url = window.location.href;
        const isPdfUrl = url.toLowerCase().includes('.pdf');
        
        const embed = document.querySelector('embed[type="application/pdf"]');
        const object = document.querySelector('object[type="application/pdf"]');
        const viewer = document.querySelector('#viewer, .pdfViewer, .pdf-viewer, [data-pdf-viewer]');
        
        const isPdfViewer = isPdfUrl || embed || object || viewer;
        
        console.log('📄 PDF Detection Test:', {
            url: url,
            isPdfUrl: isPdfUrl,
            hasEmbed: !!embed,
            hasObject: !!object,
            hasViewer: !!viewer,
            isPdfViewer: isPdfViewer
        });
        
        return isPdfViewer;
    },
    
    testTextExtraction: () => {
        const textContent = document.body.innerText || document.body.textContent || '';
        console.log('📝 Text Extraction Test:', {
            length: textContent.length,
            preview: textContent.substring(0, 200) + '...'
        });
        return textContent;
    },
    
    testImageDetection: () => {
        const images = document.querySelectorAll('img');
        console.log('🖼️ Image Detection Test:', {
            count: images.length,
            images: Array.from(images).slice(0, 3).map(img => ({
                src: img.src,
                alt: img.alt,
                visible: img.offsetWidth > 0 && img.offsetHeight > 0
            }))
        });
        return images.length;
    },
    
    runAllTests: () => {
        console.log('🚀 Running All Tests...');
        const results = {
            pdfDetected: window.debugAI.testPDFDetection(),
            textLength: window.debugAI.testTextExtraction().length,
            imageCount: window.debugAI.testImageDetection(),
            url: window.location.href,
            title: document.title
        };
        console.log('📊 Test Results:', results);
        return results;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📱 DOM loaded, initializing content script');
        createFloatingButton();
    });
} else {
    console.log('📱 DOM already loaded, initializing content script');
    createFloatingButton();
}

// Also run tests after a delay to catch dynamic content
setTimeout(() => {
    console.log('🔄 Running delayed tests...');
    window.debugAI.runAllTests();
}, 2000);

console.log('✅ Content script loaded successfully');
