// Debug PDF extraction test
async function testPDF() {
    try {
        const response = await fetch('http://localhost:3000/pdf/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pdfData: 'data:application/pdf;base64,test'
            })
        });
        
        const result = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

testPDF();
