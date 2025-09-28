/**
 * Popup Entry Point - Legacy Compatibility
 * Redirects to the new modular architecture
 */

// Import and initialize the new popup controller
import('./src/popup.js').catch(error => {
    console.error('Failed to load modular popup:', error);
    
    // Fallback to basic functionality
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Using fallback popup functionality');
        
        const questionInput = document.getElementById('questionInput');
        const askButton = document.getElementById('askBtn');
        
        if (askButton && questionInput) {
            askButton.addEventListener('click', () => {
                const question = questionInput.value.trim();
                if (question) {
                    alert('Please use the modular version for full functionality. Question: ' + question);
                }
            });
        }
    });
});
