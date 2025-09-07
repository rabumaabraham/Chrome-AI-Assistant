// AI Assistant Chrome Extension - Popup Script
class AIAssistant {
    constructor() {
        this.backendUrl = 'http://localhost:3000';
        this.isRecording = false;
        this.recognition = null;
        this.history = [];
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadHistory();
        this.setupEventListeners();
        this.setupVoiceRecognition();
        this.updateUI();
    }

    // Settings Management
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'backendUrl',
                'apiKey',
                'enableVoice',
                'enableOCR',
                'theme'
            ]);
            
            this.backendUrl = result.backendUrl || 'http://localhost:3000';
            this.apiKey = result.apiKey || '';
            this.enableVoice = result.enableVoice !== false;
            this.enableOCR = result.enableOCR !== false;
            this.theme = result.theme || 'light';
            
            // Update UI elements
            document.getElementById('backendUrl').value = this.backendUrl;
            document.getElementById('apiKey').value = this.apiKey;
            document.getElementById('enableVoice').checked = this.enableVoice;
            document.getElementById('enableOCR').checked = this.enableOCR;
            
            // Apply theme
            document.documentElement.setAttribute('data-theme', this.theme);
            document.getElementById('themeToggle').textContent = this.theme === 'dark' ? '☀️' : '🌙';
            
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            const settings = {
                backendUrl: document.getElementById('backendUrl').value,
                apiKey: document.getElementById('apiKey').value,
                enableVoice: document.getElementById('enableVoice').checked,
                enableOCR: document.getElementById('enableOCR').checked,
                theme: this.theme
            };
            
            await chrome.storage.sync.set(settings);
            
            // Update instance variables
            this.backendUrl = settings.backendUrl;
            this.apiKey = settings.apiKey;
            this.enableVoice = settings.enableVoice;
            this.enableOCR = settings.enableOCR;
            
            this.showNotification('Settings saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error saving settings', 'error');
        }
    }

    // History Management
    async loadHistory() {
        try {
            const result = await chrome.storage.local.get(['aiHistory']);
            this.history = result.aiHistory || [];
            this.renderHistory();
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    async saveHistory() {
        try {
            await chrome.storage.local.set({ aiHistory: this.history });
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    addToHistory(question, answer) {
        const historyItem = {
            id: Date.now(),
            question,
            answer,
            timestamp: new Date().toISOString()
        };
        
        this.history.unshift(historyItem);
        
        // Keep only last 50 items
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        if (this.history.length === 0) {
            historyList.innerHTML = '<p class="text-center" style="opacity: 0.6; font-size: 13px;">No recent questions</p>';
            return;
        }
        
        historyList.innerHTML = this.history
            .slice(0, 10) // Show only last 10
            .map(item => `
                <div class="history-item" data-id="${item.id}">
                    <div style="font-weight: 500; margin-bottom: 4px;">${this.truncateText(item.question, 60)}</div>
                    <div style="opacity: 0.7; font-size: 12px;">${this.truncateText(item.answer, 80)}</div>
                </div>
            `).join('');
    }

    // Voice Recognition Setup
    setupVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
            this.isRecording = true;
            this.updateVoiceButton();
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('questionInput').value = transcript;
            this.isRecording = false;
            this.updateVoiceButton();
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isRecording = false;
            this.updateVoiceButton();
            this.showNotification('Voice recognition error', 'error');
        };
        
        this.recognition.onend = () => {
            this.isRecording = false;
            this.updateVoiceButton();
        };
    }

    updateVoiceButton() {
        const voiceBtn = document.getElementById('voiceBtn');
        if (!voiceBtn) return;
        
        if (this.isRecording) {
            voiceBtn.textContent = '🔴';
            voiceBtn.style.color = '#dc3545';
        } else {
            voiceBtn.textContent = '🎤';
            voiceBtn.style.color = '';
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Ask button
        document.getElementById('askBtn').addEventListener('click', () => this.askAI());
        
        // Voice button
        document.getElementById('voiceBtn').addEventListener('click', () => this.toggleVoiceRecording());
        
        // Screenshot button
        document.getElementById('screenshotBtn').addEventListener('click', () => this.captureScreenshot());
        
        // Copy button
        document.getElementById('copyBtn').addEventListener('click', () => this.copyResponse());
        
        // Clear history button
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Settings modal
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        
        // History items
        document.addEventListener('click', (e) => {
            if (e.target.closest('.history-item')) {
                const itemId = parseInt(e.target.closest('.history-item').dataset.id);
                this.loadHistoryItem(itemId);
            }
        });
        
        // Enter key to ask
        document.getElementById('questionInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.askAI();
            }
        });
    }

    // Main AI Functionality
    async askAI() {
        const question = document.getElementById('questionInput').value.trim();
        if (!question) {
            this.showNotification('Please enter a question', 'warning');
            return;
        }

        this.showLoading(true);
        this.hideResponse();

        try {
            // Get page content
            const pageContent = await this.getPageContent();
            
            // Send request to backend
            const response = await this.sendToBackend({
                question,
                context: pageContent,
                url: window.location.href
            });

            if (response.success) {
                this.showResponse(response.answer);
                this.addToHistory(question, response.answer);
            } else {
                throw new Error(response.error || 'Unknown error occurred');
            }

        } catch (error) {
            console.error('Error asking AI:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async getPageContent() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    // Extract text content from the page
                    const textContent = document.body.innerText || document.body.textContent || '';
                    
                    // Get page title
                    const title = document.title || '';
                    
                    // Get meta description
                    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
                    
                    // Get headings
                    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                        .map(h => h.textContent.trim())
                        .filter(h => h.length > 0);
                    
                    return {
                        title,
                        metaDescription,
                        headings,
                        textContent: textContent.substring(0, 10000) // Limit to 10k chars
                    };
                }
            });
            
            return results[0].result;
        } catch (error) {
            console.error('Error getting page content:', error);
            return { title: '', textContent: '', headings: [], metaDescription: '' };
        }
    }

    async sendToBackend(data) {
        const response = await fetch(`${this.backendUrl}/ask-ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    async captureScreenshot() {
        if (!this.enableOCR) {
            this.showNotification('OCR features are disabled in settings', 'warning');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Capture visible area
            const dataUrl = await chrome.tabs.captureVisibleTab();
            
            // Send to backend for OCR
            const response = await fetch(`${this.backendUrl}/ocr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: dataUrl,
                    url: window.location.href
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Add OCR text to question input
                const currentQuestion = document.getElementById('questionInput').value;
                const newQuestion = currentQuestion ? 
                    `${currentQuestion}\n\n[OCR Text]: ${result.text}` : 
                    `[OCR Text]: ${result.text}`;
                document.getElementById('questionInput').value = newQuestion;
                this.showNotification('Screenshot captured and text extracted!', 'success');
            } else {
                throw new Error(result.error || 'OCR failed');
            }

        } catch (error) {
            console.error('Error capturing screenshot:', error);
            this.showNotification(`Screenshot error: ${error.message}`, 'error');
        }
    }

    // UI Updates
    showLoading(show) {
        const loading = document.getElementById('loadingState');
        const askBtn = document.getElementById('askBtn');
        
        if (show) {
            loading.classList.remove('hidden');
            askBtn.disabled = true;
            askBtn.textContent = 'Thinking...';
        } else {
            loading.classList.add('hidden');
            askBtn.disabled = false;
            askBtn.textContent = 'Ask AI';
        }
    }

    showResponse(answer) {
        const responseSection = document.getElementById('responseSection');
        const responseContent = document.getElementById('responseContent');
        
        responseContent.textContent = answer;
        responseSection.classList.remove('hidden');
    }

    hideResponse() {
        const responseSection = document.getElementById('responseSection');
        responseSection.classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 4px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#007bff'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Utility Functions
    toggleVoiceRecording() {
        if (!this.enableVoice) {
            this.showNotification('Voice input is disabled in settings', 'warning');
            return;
        }
        
        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    copyResponse() {
        const responseContent = document.getElementById('responseContent');
        if (responseContent) {
            navigator.clipboard.writeText(responseContent.textContent).then(() => {
                this.showNotification('Response copied to clipboard!', 'success');
            }).catch(() => {
                this.showNotification('Failed to copy response', 'error');
            });
        }
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
        this.showNotification('History cleared', 'success');
    }

    loadHistoryItem(itemId) {
        const item = this.history.find(h => h.id === itemId);
        if (item) {
            document.getElementById('questionInput').value = item.question;
            this.showResponse(item.answer);
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        document.getElementById('themeToggle').textContent = this.theme === 'dark' ? '☀️' : '🌙';
        
        // Save theme preference
        chrome.storage.sync.set({ theme: this.theme });
    }

    closeSettings() {
        document.getElementById('settingsModal').classList.add('hidden');
    }

    updateUI() {
        // Update button states based on settings
        document.getElementById('voiceBtn').style.display = this.enableVoice ? 'block' : 'none';
        document.getElementById('screenshotBtn').style.display = this.enableOCR ? 'block' : 'none';
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// Initialize the AI Assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIAssistant();
});
