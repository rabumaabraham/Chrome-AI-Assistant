/**
 * PDF Controller
 * Handles PDF text extraction requests and responses
 */

const PDFService = require('../services/PDFService.js');
const logger = require('../services/Logger.js');

class PDFController {
    constructor() {
        this.serviceLogger = logger.getServiceLogger('PDF');
    }

    /**
     * Handle PDF text extraction request
     */
    async extractText(req, res) {
        try {
            const { pdfData, options } = req.body;

            this.serviceLogger.info('PDF extraction request received', {
                hasPdfData: !!pdfData,
                dataSize: pdfData ? pdfData.length : 0
            });

            const result = await PDFService.extractText(pdfData, options || {});

            if (result.success) {
                this.serviceLogger.info('PDF text extraction completed', {
                    pageCount: result.pageCount,
                    textLength: result.text.length,
                    hasInfo: !!result.info.title || !!result.info.author
                });

                return res.json({
                    success: true,
                    text: result.text,
                    pageCount: result.pageCount,
                    info: result.info
                });
            } else {
                this.serviceLogger.error('PDF extraction failed', {
                    error: result.error
                });

                return res.status(400).json({
                    success: false,
                    error: result.error,
                    text: '',
                    pageCount: 0,
                    info: {}
                });
            }

        } catch (error) {
            this.serviceLogger.error('PDF controller error', {
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
     * Health check for PDF service
     */
    async healthCheck(req, res) {
        try {
            const health = await PDFService.testHealth();
            
            if (health.success) {
                return res.json({
                    success: true,
                    service: 'PDF',
                    status: 'healthy',
                    maxFileSize: health.maxFileSize,
                    maxPages: health.maxPages
                });
            } else {
                return res.status(503).json({
                    success: false,
                    service: 'PDF',
                    status: 'unhealthy',
                    error: health.error
                });
            }
        } catch (error) {
            this.serviceLogger.error('PDF health check failed', { error: error.message });
            return res.status(503).json({
                success: false,
                service: 'PDF',
                status: 'unhealthy',
                error: error.message
            });
        }
    }
}

module.exports = new PDFController();
