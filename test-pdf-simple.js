// Simple test to verify PDF content extraction
// Run this in the browser console when viewing a PDF

console.log('=== PDF EXTRACTION TEST ===');

// Check if we're on a PDF page
const isPDF = window.location.href.toLowerCase().includes('.pdf');
console.log('Is PDF URL:', isPDF);
console.log('Current URL:', window.location.href);
console.log('Page Title:', document.title);

// Try to extract content
const bodyText = document.body.innerText || document.body.textContent || '';
console.log('Body text length:', bodyText.length);
console.log('Body text preview:', bodyText.substring(0, 300));

// Check for PDF viewer elements
const viewer = document.querySelector('#viewer, .pdfViewer, .pdf-viewer');
if (viewer) {
    console.log('Found PDF viewer element:', viewer);
    console.log('Viewer text length:', viewer.innerText.length);
    console.log('Viewer text preview:', viewer.innerText.substring(0, 300));
} else {
    console.log('No PDF viewer element found');
}

// Check for embed elements
const embed = document.querySelector('embed[type="application/pdf"]');
if (embed) {
    console.log('Found PDF embed:', embed);
} else {
    console.log('No PDF embed found');
}

// Try TreeWalker
const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
);
let text = '';
let node;
while (node = walker.nextNode()) {
    text += node.textContent + ' ';
}
console.log('TreeWalker text length:', text.length);
console.log('TreeWalker text preview:', text.substring(0, 300));

console.log('=== END TEST ===');
