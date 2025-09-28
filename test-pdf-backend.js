// Test PDF extraction via backend API
// Run this in Node.js to test the backend PDF extraction

const fetch = require('node-fetch');

async function testPDFExtraction() {
    try {
        console.log('Testing PDF extraction via backend...');
        
        // Test with a sample PDF URL
        const pdfUrl = 'https://rabumaabraham.github.io/Rabuma_Abraham_Bekele_CV.pdf';
        
        // Fetch the PDF
        console.log('Fetching PDF from:', pdfUrl);
        const response = await fetch(pdfUrl);
        const pdfBuffer = await response.buffer();
        
        // Convert to base64
        const pdfData = pdfBuffer.toString('base64');
        const dataUrl = `data:application/pdf;base64,${pdfData}`;
        
        console.log('PDF data size:', dataUrl.length, 'characters');
        
        // Send to backend for extraction
        const backendResponse = await fetch('http://localhost:3000/pdf/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pdfData: dataUrl
            })
        });
        
        if (backendResponse.ok) {
            const result = await backendResponse.json();
            console.log('Backend response:', {
                success: result.success,
                textLength: result.text ? result.text.length : 0,
                pageCount: result.pageCount,
                error: result.error
            });
            
            if (result.success && result.text) {
                console.log('Extracted text preview:', result.text.substring(0, 300));
            }
        } else {
            console.error('Backend request failed:', backendResponse.status, backendResponse.statusText);
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testPDFExtraction();
