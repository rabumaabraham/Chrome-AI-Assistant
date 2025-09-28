/**
 * API Service
 * Handles communication with the backend API
 */

import Config from '../core/Config.js';
import Logger from '../core/Logger.js';

class APIService {
    constructor() {
        this.logger = Logger.createServiceLogger('API');
        this.config = Config;
        this.baseURL = this.config.get('backend.url');
        this.timeout = this.config.get('backend.timeout');
    }

    /**
     * Make HTTP request to backend
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(options.data),
            ...options
        };

        try {
            this.logger.debug(`Making request to: ${url}`, { options: requestOptions });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...requestOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.logger.debug(`Request successful: ${url}`, { status: response.status });
            return data;

        } catch (error) {
            if (error.name === 'AbortError') {
                this.logger.error(`Request timeout: ${url}`);
                throw new Error('Request timeout');
            }

            this.logger.error(`Request failed: ${url}`, error);
            throw error;
        }
    }

    /**
     * Ask AI a question
     */
    async askAI(question, context) {
        try {
            this.logger.info('Sending AI request', {
                questionLength: question.length,
                hasContext: !!context
            });

            const response = await this.request('/ask-ai', {
                data: {
                    question,
                    context,
                    url: window.location.href
                }
            });

            if (response.success) {
                this.logger.info('AI response received', {
                    responseLength: response.answer.length,
                    tokensUsed: response.usage?.total_tokens
                });
                return response;
            } else {
                throw new Error(response.error || 'AI request failed');
            }

        } catch (error) {
            this.logger.error('AI request failed', error);
            throw error;
        }
    }

    /**
     * Extract text from image using OCR
     */
    async extractImageText(imageData, imageInfo = {}) {
        try {
            this.logger.info('Sending OCR request', {
                imageDataSize: imageData.length,
                imageInfo
            });

            const response = await this.request('/ocr', {
                data: {
                    imageData,
                    imageInfo,
                    language: 'eng'
                }
            });

            if (response.success) {
                this.logger.info('OCR response received', {
                    textLength: response.text.length,
                    confidence: response.confidence
                });
                return response;
            } else {
                throw new Error(response.error || 'OCR request failed');
            }

        } catch (error) {
            this.logger.error('OCR request failed', error);
            throw error;
        }
    }

    /**
     * Extract text from PDF
     */
    async extractPDFText(pdfData, options = {}) {
        try {
            this.logger.info('Sending PDF extraction request', {
                pdfDataSize: pdfData.length,
                options
            });

            const response = await this.request('/pdf/extract', {
                data: {
                    pdfData,
                    options
                }
            });

            if (response.success) {
                this.logger.info('PDF extraction response received', {
                    textLength: response.text.length,
                    pageCount: response.pageCount
                });
                return response;
            } else {
                throw new Error(response.error || 'PDF extraction failed');
            }

        } catch (error) {
            this.logger.error('PDF extraction request failed', error);
            throw error;
        }
    }

    /**
     * Check backend health
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                const data = await response.json();
                this.logger.debug('Backend health check successful', data);
                return data;
            } else {
                throw new Error(`Health check failed: ${response.status}`);
            }

        } catch (error) {
            this.logger.error('Backend health check failed', error);
            throw error;
        }
    }

    /**
     * Test backend connectivity
     */
    async testConnection() {
        try {
            const health = await this.checkHealth();
            return {
                success: true,
                backend: health,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Export singleton instance
export default new APIService();
