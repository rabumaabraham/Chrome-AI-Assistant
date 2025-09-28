/**
 * Voice Service
 * Handles voice input and speech recognition
 */

import Config from '../core/Config.js';
import Logger from '../core/Logger.js';

class VoiceService {
    constructor() {
        this.logger = Logger.createServiceLogger('Voice');
        this.config = Config;
        this.recognition = null;
        this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        this.isRecording = false;
        this.onResult = null;
        this.onError = null;
        this.onEnd = null;
        
        this.initializeRecognition();
    }

    /**
     * Initialize speech recognition
     */
    initializeRecognition() {
        if (!this.isSupported) {
            this.logger.warn('Speech recognition not supported');
            return;
        }

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = this.config.get('voice.continuous');
            this.recognition.interimResults = this.config.get('voice.interimResults');
            this.recognition.lang = this.config.get('voice.language');

            this.recognition.onresult = (event) => {
                if (this.onResult) {
                    this.onResult(event);
                }
            };

            this.recognition.onerror = (event) => {
                this.logger.error('Speech recognition error', event.error);
                if (this.onError) {
                    this.onError(event);
                }
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                if (this.onEnd) {
                    this.onEnd();
                }
            };

            this.logger.info('Speech recognition initialized');

        } catch (error) {
            this.logger.error('Failed to initialize speech recognition', error);
            this.isSupported = false;
        }
    }

    /**
     * Start voice recording
     */
    startRecording() {
        if (!this.isSupported || !this.recognition) {
            throw new Error('Speech recognition not supported');
        }

        if (this.isRecording) {
            this.logger.warn('Already recording');
            return;
        }

        try {
            this.recognition.start();
            this.isRecording = true;
            this.logger.info('Voice recording started');
        } catch (error) {
            this.logger.error('Failed to start voice recording', error);
            throw error;
        }
    }

    /**
     * Stop voice recording
     */
    stopRecording() {
        if (!this.recognition || !this.isRecording) {
            this.logger.warn('Not currently recording');
            return;
        }

        try {
            this.recognition.stop();
            this.logger.info('Voice recording stopped');
        } catch (error) {
            this.logger.error('Failed to stop voice recording', error);
        }
    }

    /**
     * Toggle voice recording
     */
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    /**
     * Set result callback
     */
    setOnResult(callback) {
        this.onResult = callback;
    }

    /**
     * Set error callback
     */
    setOnError(callback) {
        this.onError = callback;
    }

    /**
     * Set end callback
     */
    setOnEnd(callback) {
        this.onEnd = callback;
    }

    /**
     * Extract final transcript from recognition result
     */
    extractTranscript(event) {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        return {
            final: finalTranscript.trim(),
            interim: interimTranscript.trim(),
            confidence: event.results[event.resultIndex]?.[0]?.confidence || 0
        };
    }

    /**
     * Check if voice service is available
     */
    isAvailable() {
        return this.isSupported && this.config.get('voice.enabled');
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return [
            { code: 'en-US', name: 'English (US)' },
            { code: 'en-GB', name: 'English (UK)' },
            { code: 'es-ES', name: 'Spanish' },
            { code: 'fr-FR', name: 'French' },
            { code: 'de-DE', name: 'German' },
            { code: 'it-IT', name: 'Italian' },
            { code: 'pt-BR', name: 'Portuguese (Brazil)' },
            { code: 'ru-RU', name: 'Russian' },
            { code: 'ja-JP', name: 'Japanese' },
            { code: 'ko-KR', name: 'Korean' },
            { code: 'zh-CN', name: 'Chinese (Simplified)' }
        ];
    }

    /**
     * Update language
     */
    updateLanguage(language) {
        if (this.recognition) {
            this.recognition.lang = language;
            this.config.set('voice.language', language);
            this.logger.info('Voice language updated', { language });
        }
    }

    /**
     * Reset recognition
     */
    reset() {
        if (this.recognition) {
            this.stopRecording();
            this.initializeRecognition();
            this.logger.info('Voice service reset');
        }
    }
}

// Export singleton instance
export default new VoiceService();
