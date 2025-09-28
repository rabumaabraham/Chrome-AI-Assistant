/**
 * OCR Controller
 * Handles OCR-related requests and responses
 */

const OCRService = require('../services/OCRService.js');
const logger = require('../services/Logger.js');

class OCRController {
    constructor() {
        this.serviceLogger = logger.getServiceLogger('OCR');
    }

    /**
     * Handle single image OCR request
     */
    async extractText(req, res) {
        try {
            const { imageData, imageInfo, language, options } = req.body;

            this.serviceLogger.info('OCR request received', {
                hasImageData: !!imageData,
                imageSize: imageData ? imageData.length : 0,
                language: language || 'eng',
                imageInfo: imageInfo
            });

            const result = await OCRService.extractText(imageData, { language, ...options });

            if (result.success) {
                this.serviceLogger.info('OCR extraction completed', {
                    textLength: result.text.length,
                    confidence: result.confidence,
                    processingTime: result.processingTime
                });

                return res.json({
                    success: true,
                    text: result.text,
                    confidence: result.confidence,
                    processingTime: result.processingTime
                });
            } else {
                this.serviceLogger.error('OCR extraction failed', {
                    error: result.error
                });

                return res.status(400).json({
                    success: false,
                    error: result.error,
                    text: '',
                    confidence: 0
                });
            }

        } catch (error) {
            this.serviceLogger.error('OCR controller error', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                details: error.message
            });
        }
    }

    /**
     * Health check for OCR service
     */
    async healthCheck(req, res) {
        try {
            const health = await OCRService.testHealth();
            
            if (health.success) {
                return res.json({
                    success: true,
                    service: 'OCR',
                    status: 'healthy',
                    tesseractVersion: health.tesseractVersion
                });
            } else {
                return res.status(503).json({
                    success: false,
                    service: 'OCR',
                    status: 'unhealthy',
                    error: health.error
                });
            }
        } catch (error) {
            this.serviceLogger.error('OCR health check failed', { error: error.message });
            return res.status(503).json({
                success: false,
                service: 'OCR',
                status: 'unhealthy',
                error: error.message
            });
        }
    }
}

module.exports = new OCRController();
