// PDF Processing Routes
const express = require('express');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const winston = require('winston');
const { validateRequest } = require('../middleware/validation');
const { authenticateRequest } = require('../middleware/auth');

const router = express.Router();
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/pdf.log' })
    ]
});

// Validation schemas
const pdfExtractSchema = {
    pdfData: {
        type: 'string',
        required: true,
        minLength: 1
    },
    url: {
        type: 'string',
        required: false,
        format: 'url'
    },
    options: {
        type: 'object',
        required: false
    }
};

// POST /pdf/extract - Extract text from PDF
router.post('/extract', authenticateRequest, validateRequest(pdfExtractSchema), async (req, res) => {
    try {
        const { pdfData, url, options = {} } = req.body;
        
        logger.info('PDF extraction request received', {
            hasPdfData: !!pdfData,
            dataSize: pdfData ? pdfData.length : 0,
            url: url
        });

        // Validate PDF data format
        if (!pdfData.startsWith('data:application/pdf;base64,')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid PDF format',
                message: 'PDF data must be a valid base64 data URL starting with data:application/pdf;base64,'
            });
        }

        // Extract PDF data from data URL
        const base64Data = pdfData.split(',')[1];
        const pdfBuffer = Buffer.from(base64Data, 'base64');

        // Extract text using pdf-parse
        const startTime = Date.now();
        const pdfData_result = await pdfParse(pdfBuffer, {
            max: 0, // No page limit
            version: 'v1.10.100', // Use specific version for consistency
            ...options
        });

        const processingTime = Date.now() - startTime;
        
        // Clean up the extracted text
        const cleanedText = cleanExtractedText(pdfData_result.text);
        
        logger.info('PDF text extraction completed', {
            textLength: cleanedText.length,
            pageCount: pdfData_result.numpages,
            processingTime: processingTime,
            hasInfo: !!pdfData_result.info
        });

        res.json({
            success: true,
            text: cleanedText,
            metadata: {
                pageCount: pdfData_result.numpages,
                title: pdfData_result.info?.Title || null,
                author: pdfData_result.info?.Author || null,
                subject: pdfData_result.info?.Subject || null,
                creator: pdfData_result.info?.Creator || null,
                producer: pdfData_result.info?.Producer || null,
                creationDate: pdfData_result.info?.CreationDate || null,
                modificationDate: pdfData_result.info?.ModDate || null
            },
            processingTime: processingTime,
            originalSize: pdfBuffer.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('PDF extraction error:', {
            error: error.message,
            stack: error.stack,
            url: req.body.url
        });

        res.status(500).json({
            success: false,
            error: 'PDF extraction failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to extract text from PDF'
        });
    }
});

// POST /pdf/ocr - Extract text from PDF using OCR (for scanned PDFs)
router.post('/ocr', authenticateRequest, validateRequest(pdfExtractSchema), async (req, res) => {
    try {
        const { pdfData, url, options = {} } = req.body;
        
        logger.info('PDF OCR request received', {
            hasPdfData: !!pdfData,
            dataSize: pdfData ? pdfData.length : 0,
            url: url
        });

        // This is a placeholder for PDF OCR functionality
        // In a real implementation, you would:
        // 1. Convert PDF pages to images
        // 2. Process each image with Tesseract
        // 3. Combine the results
        
        // For now, return an error suggesting to use the regular text extraction first
        res.status(501).json({
            success: false,
            error: 'PDF OCR not implemented',
            message: 'PDF OCR functionality is not yet implemented. Please try the regular PDF text extraction endpoint first.',
            suggestion: 'Use /pdf/extract endpoint for text-based PDFs'
        });

    } catch (error) {
        logger.error('PDF OCR error:', {
            error: error.message,
            stack: error.stack,
            url: req.body.url
        });

        res.status(500).json({
            success: false,
            error: 'PDF OCR failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to process PDF with OCR'
        });
    }
});

// POST /pdf/analyze - Analyze PDF and determine if OCR is needed
router.post('/analyze', authenticateRequest, validateRequest(pdfExtractSchema), async (req, res) => {
    try {
        const { pdfData, url, options = {} } = req.body;
        
        logger.info('PDF analysis request received', {
            hasPdfData: !!pdfData,
            dataSize: pdfData ? pdfData.length : 0,
            url: url
        });

        // Extract PDF data from data URL
        const base64Data = pdfData.split(',')[1];
        const pdfBuffer = Buffer.from(base64Data, 'base64');

        // Try text extraction first
        const startTime = Date.now();
        const pdfData_result = await pdfParse(pdfBuffer, {
            max: 1, // Only analyze first page
            version: 'v1.10.100'
        });

        const processingTime = Date.now() - startTime;
        const extractedText = pdfData_result.text.trim();
        
        // Determine if OCR is needed based on text length and quality
        const needsOCR = extractedText.length < 100 || isLikelyScanned(extractedText);
        
        logger.info('PDF analysis completed', {
            textLength: extractedText.length,
            needsOCR: needsOCR,
            processingTime: processingTime
        });

        res.json({
            success: true,
            analysis: {
                needsOCR: needsOCR,
                textLength: extractedText.length,
                confidence: needsOCR ? 'low' : 'high',
                recommendation: needsOCR ? 'Use OCR processing' : 'Use regular text extraction'
            },
            sampleText: extractedText.substring(0, 200),
            processingTime: processingTime,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('PDF analysis error:', {
            error: error.message,
            stack: error.stack,
            url: req.body.url
        });

        res.status(500).json({
            success: false,
            error: 'PDF analysis failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to analyze PDF'
        });
    }
});

// GET /pdf/info - Get PDF processing capabilities
router.get('/info', (req, res) => {
    res.json({
        success: true,
        capabilities: {
            textExtraction: true,
            ocrProcessing: false, // Not implemented yet
            metadataExtraction: true,
            pageAnalysis: true
        },
        supportedFormats: ['PDF'],
        maxFileSize: '10MB',
        maxPages: 100,
        timestamp: new Date().toISOString()
    });
});

// Helper function to determine if PDF is likely scanned
function isLikelyScanned(text) {
    if (!text || text.length < 50) return true;
    
    // Check for common OCR artifacts
    const ocrArtifacts = [
        /\s{3,}/g, // Multiple spaces
        /[^\w\s.,!?;:()\-'"]/g, // Non-standard characters
        /\b\w{1}\s+\w{1}\b/g, // Single letters separated by spaces
    ];
    
    let artifactCount = 0;
    ocrArtifacts.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) artifactCount += matches.length;
    });
    
    // If more than 10% of characters are artifacts, likely scanned
    return (artifactCount / text.length) > 0.1;
}

// Helper function to clean extracted text
function cleanExtractedText(text) {
    if (!text) return '';
    
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
        .replace(/\s+/g, ' ')
        .trim();
}

module.exports = router;
