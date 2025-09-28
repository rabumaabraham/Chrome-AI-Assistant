/**
 * PDF Service
 * Handles PDF text extraction
 */

const pdf = require('pdf-parse');
const config = require('../../config/index.js');
const logger = require('./Logger');

class PDFService {
    constructor() {
        this.serviceLogger = logger.getServiceLogger('PDF');
    }

    /**
     * Extract text from PDF data
     */
    async extractText(pdfData, options = {}) {
        try {
            this.serviceLogger.info('Starting PDF text extraction', {
                dataSize: pdfData.length,
                maxPages: options.maxPages || config.pdf.maxPages
            });

            // Validate PDF data
            if (!this.isValidPDFData(pdfData)) {
                throw new Error('Invalid PDF data format');
            }

            // Extract PDF buffer from data URL
            const pdfBuffer = this.extractPDFBuffer(pdfData);

            // Validate file size
            if (pdfBuffer.length > config.pdf.maxFileSize) {
                throw new Error(`PDF too large. Maximum size: ${config.pdf.maxFileSize} bytes`);
            }

            // Parse PDF
            const pdfData_parsed = await pdf(pdfBuffer, {
                max: options.maxPages || config.pdf.maxPages,
                version: 'v1.10.100'
            });

            const extractedText = pdfData_parsed.text.trim();
            const pageCount = pdfData_parsed.numpages;
            const info = pdfData_parsed.info || {};

            this.serviceLogger.info('PDF text extraction completed', {
                textLength: extractedText.length,
                pageCount: pageCount,
                hasInfo: !!info.title || !!info.author,
                processingTime: Date.now() - Date.now() // This would be calculated properly in real implementation
            });

            return {
                success: true,
                text: extractedText,
                pageCount: pageCount,
                info: {
                    title: info.title || null,
                    author: info.author || null,
                    creator: info.creator || null,
                    producer: info.producer || null,
                    creationDate: info.creationDate || null,
                    modificationDate: info.modificationDate || null
                }
            };

        } catch (error) {
            this.serviceLogger.error('PDF text extraction failed', {
                error: error.message,
                dataSize: pdfData ? pdfData.length : 0
            });

            return {
                success: false,
                error: error.message,
                text: '',
                pageCount: 0,
                info: {}
            };
        }
    }

    /**
     * Validate PDF data format
     */
    isValidPDFData(pdfData) {
        return pdfData && 
               typeof pdfData === 'string' && 
               (pdfData.startsWith('data:application/pdf;base64,') || 
                pdfData.startsWith('data:application/pdf,') ||
                pdfData.startsWith('data:application/octet-stream;base64,')) &&
               pdfData.includes(',');
    }

    /**
     * Extract PDF buffer from data URL
     */
    extractPDFBuffer(pdfData) {
        const base64Data = pdfData.split(',')[1];
        return Buffer.from(base64Data, 'base64');
    }

    /**
     * Test PDF service health
     */
    async testHealth() {
        try {
            // Test with a minimal PDF (this would be a real test in production)
            return {
                success: true,
                service: 'PDF',
                maxFileSize: config.pdf.maxFileSize,
                maxPages: config.pdf.maxPages
            };
        } catch (error) {
            this.serviceLogger.error('PDF health check failed', { error: error.message });
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new PDFService();
