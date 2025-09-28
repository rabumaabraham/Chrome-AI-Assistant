/**
 * Debug Test Script
 * Simple test to verify Chrome extension functionality
 */

console.log('🔧 Chrome AI Assistant Debug Test');

// Test 1: Check if we're in a PDF viewer
function testPDFDetection() {
    console.log('📄 Testing PDF Detection...');
    
    const url = window.location.href;
    const isPdfUrl = url.toLowerCase().includes('.pdf');
    
    console.log('URL:', url);
    console.log('Is PDF URL:', isPdfUrl);
    
    // Check for PDF elements
    const embed = document.querySelector('embed[type="application/pdf"]');
    const object = document.querySelector('object[type="application/pdf"]');
    const viewer = document.querySelector('#viewer, .pdfViewer, .pdf-viewer, [data-pdf-viewer]');
    
    console.log('PDF Embed:', !!embed);
    console.log('PDF Object:', !!object);
    console.log('PDF Viewer:', !!viewer);
    
    const isPdfViewer = isPdfUrl || embed || object || viewer;
    console.log('Is PDF Viewer:', isPdfViewer);
    
    return isPdfViewer;
}

// Test 2: Try to extract text content
function testTextExtraction() {
    console.log('📝 Testing Text Extraction...');
    
    let textContent = '';
    
    if (document.body.innerText) {
        textContent = document.body.innerText;
    } else if (document.body.textContent) {
        textContent = document.body.textContent;
    }
    
    console.log('Text Content Length:', textContent.length);
    console.log('First 200 chars:', textContent.substring(0, 200));
    
    return textContent;
}

// Test 3: Check for images
function testImageDetection() {
    console.log('🖼️ Testing Image Detection...');
    
    const images = document.querySelectorAll('img');
    console.log('Images Found:', images.length);
    
    images.forEach((img, index) => {
        if (index < 3) { // Show first 3 images
            console.log(`Image ${index + 1}:`, {
                src: img.src,
                alt: img.alt,
                width: img.width,
                height: img.height,
                visible: img.offsetWidth > 0 && img.offsetHeight > 0
            });
        }
    });
    
    return images.length;
}

// Run all tests
function runDebugTests() {
    console.log('🚀 Running Debug Tests...');
    
    const pdfDetected = testPDFDetection();
    const textContent = testTextExtraction();
    const imageCount = testImageDetection();
    
    console.log('📊 Test Results:', {
        pdfDetected,
        textLength: textContent.length,
        imageCount,
        url: window.location.href,
        title: document.title
    });
    
    return {
        pdfDetected,
        textContent,
        imageCount,
        url: window.location.href,
        title: document.title
    };
}

// Auto-run tests
runDebugTests();

// Also run after a delay to catch dynamic content
setTimeout(() => {
    console.log('🔄 Running delayed tests...');
    runDebugTests();
}, 2000);

// Export for manual testing
window.debugAI = {
    testPDFDetection,
    testTextExtraction,
    testImageDetection,
    runDebugTests
};

console.log('✅ Debug functions available at window.debugAI');
