// OCR Routes for Image Text Extraction
const express = require('express');
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
        new winston.transports.File({ filename: 'logs/ocr.log' })
    ]
});

// Validation schemas
const ocrSchema = {
    image: {
        type: 'string',
        required: true,
        minLength: 1
    },
    url: {
        type: 'string',
        required: false,
        format: 'url'
    },
    language: {
        type: 'string',
        required: false,
        pattern: '^[a-z]{2,3}(-[A-Z]{2})?$'
    },
    options: {
        type: 'object',
        required: false
    }
};

// POST /ocr - Extract text from image using Tesseract.js
router.post('/', authenticateRequest, validateRequest(ocrSchema), async (req, res) => {
    try {
        const { image, url, language = 'eng', options = {} } = req.body;
        
        logger.info('OCR request received', {
            hasImage: !!image,
            imageSize: image ? image.length : 0,
            language: language,
            url: url
        });

        // Validate image format
        if (!image.startsWith('data:image/')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid image format',
                message: 'Image must be a valid data URL starting with data:image/'
            });
        }

        // Extract image data from data URL
        const base64Data = image.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Preprocess image for better OCR results
        const processedImageBuffer = await preprocessImage(imageBuffer, options);

        // Configure Tesseract options
        const tesseractOptions = {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
            },
            ...options
        };

        // Perform OCR
        const startTime = Date.now();
        const { data: { text, confidence } } = await Tesseract.recognize(
            processedImageBuffer,
            language,
            tesseractOptions
        );

        const processingTime = Date.now() - startTime;
        
        // Clean up the extracted text
        const cleanedText = cleanExtractedText(text);
        
        logger.info('OCR completed', {
            textLength: cleanedText.length,
            confidence: confidence,
            processingTime: processingTime,
            language: language
        });

        res.json({
            success: true,
            text: cleanedText,
            confidence: confidence,
            language: language,
            processingTime: processingTime,
            originalImageSize: imageBuffer.length,
            processedImageSize: processedImageBuffer.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('OCR processing error:', {
            error: error.message,
            stack: error.stack,
            url: req.body.url
        });

        res.status(500).json({
            success: false,
            error: 'OCR processing failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to extract text from image'
        });
    }
});

// POST /ocr/batch - Process multiple images
router.post('/batch', authenticateRequest, async (req, res) => {
    try {
        const { images, language = 'eng', options = {} } = req.body;
        
        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid images array',
                message: 'Images must be a non-empty array'
            });
        }

        if (images.length > 10) {
            return res.status(400).json({
                success: false,
                error: 'Too many images',
                message: 'Maximum 10 images allowed per batch request'
            });
        }

        logger.info('Batch OCR request received', {
            imageCount: images.length,
            language: language
        });

        const results = await Promise.allSettled(
            images.map(async (imageData, index) => {
                try {
                    const base64Data = imageData.split(',')[1];
                    const imageBuffer = Buffer.from(base64Data, 'base64');
                    const processedImageBuffer = await preprocessImage(imageBuffer, options);
                    
                    const { data: { text, confidence } } = await Tesseract.recognize(
                        processedImageBuffer,
                        language,
                        { logger: () => {} }
                    );
                    
                    return {
                        index,
                        success: true,
                        text: cleanExtractedText(text),
                        confidence: confidence
                    };
                } catch (error) {
                    return {
                        index,
                        success: false,
                        error: error.message
                    };
                }
            })
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
        const failed = results.filter(r => r.status === 'rejected' || !r.value.success);

        res.json({
            success: true,
            results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }),
            summary: {
                total: images.length,
                successful: successful.length,
                failed: failed.length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Batch OCR processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Batch OCR processing failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to process images'
        });
    }
});

// GET /ocr/languages - Get supported languages
router.get('/languages', (req, res) => {
    const supportedLanguages = [
        { code: 'eng', name: 'English' },
        { code: 'spa', name: 'Spanish' },
        { code: 'fra', name: 'French' },
        { code: 'deu', name: 'German' },
        { code: 'ita', name: 'Italian' },
        { code: 'por', name: 'Portuguese' },
        { code: 'rus', name: 'Russian' },
        { code: 'jpn', name: 'Japanese' },
        { code: 'kor', name: 'Korean' },
        { code: 'chi_sim', name: 'Chinese (Simplified)' },
        { code: 'chi_tra', name: 'Chinese (Traditional)' },
        { code: 'ara', name: 'Arabic' },
        { code: 'hin', name: 'Hindi' },
        { code: 'tha', name: 'Thai' },
        { code: 'vie', name: 'Vietnamese' }
    ];

    res.json({
        success: true,
        languages: supportedLanguages,
        default: 'eng',
        timestamp: new Date().toISOString()
    });
});

// Helper function to preprocess image for better OCR
async function preprocessImage(imageBuffer, options = {}) {
    try {
        const {
            resize = true,
            grayscale = true,
            enhance = true,
            denoise = true,
            ...sharpOptions
        } = options;

        let pipeline = sharp(imageBuffer);

        // Resize if image is too large (OCR works better on smaller images)
        if (resize) {
            pipeline = pipeline.resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Convert to grayscale for better OCR
        if (grayscale) {
            pipeline = pipeline.grayscale();
        }

        // Enhance contrast and brightness
        if (enhance) {
            pipeline = pipeline.normalize().modulate({
                brightness: 1.2,
                contrast: 1.1
            });
        }

        // Apply denoising
        if (denoise) {
            pipeline = pipeline.median(3);
        }

        // Apply any additional sharp options
        if (Object.keys(sharpOptions).length > 0) {
            pipeline = pipeline.modulate(sharpOptions);
        }

        return await pipeline.png().toBuffer();
    } catch (error) {
        logger.warn('Image preprocessing failed, using original:', error.message);
        return imageBuffer;
    }
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
