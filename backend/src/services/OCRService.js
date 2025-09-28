/**
 * OCR Service
 * Handles Optical Character Recognition for images
 */

const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const config = require('../../config/index.js');
const logger = require('./Logger');

class OCRService {
    constructor() {
        this.serviceLogger = logger.getServiceLogger('OCR');
    }

    /**
     * Extract text from image using OCR
     */
    async extractText(imageData, options = {}) {
        try {
            this.serviceLogger.info('Starting OCR extraction', {
                imageDataSize: imageData.length,
                language: options.language || config.ocr.language
            });

            // Validate image format
            if (!this.isValidImageData(imageData)) {
                throw new Error('Invalid image data format');
            }

            // Extract image buffer from data URL
            const imageBuffer = this.extractImageBuffer(imageData);

            // Validate image size
            if (imageBuffer.length > config.ocr.maxImageSize) {
                throw new Error(`Image too large. Maximum size: ${config.ocr.maxImageSize} bytes`);
            }

            // Preprocess image for better OCR results
            const processedBuffer = await this.preprocessImage(imageBuffer, options);

            // Configure Tesseract options
            const tesseractOptions = {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        this.serviceLogger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            };

            // Perform OCR
            const result = await Tesseract.recognize(
                processedBuffer,
                options.language || config.ocr.language,
                tesseractOptions
            );

            const extractedText = result.data.text.trim();
            const confidence = result.data.confidence;

            this.serviceLogger.info('OCR extraction completed', {
                textLength: extractedText.length,
                confidence: confidence,
                processingTime: result.data.processingTime
            });

            return {
                success: true,
                text: extractedText,
                confidence: confidence,
                processingTime: result.data.processingTime
            };

        } catch (error) {
            this.serviceLogger.error('OCR extraction failed', {
                error: error.message,
                imageDataSize: imageData ? imageData.length : 0
            });

            return {
                success: false,
                error: error.message,
                text: '',
                confidence: 0
            };
        }
    }

    /**
     * Process multiple images
     */
    async extractTextFromImages(images) {
        const results = [];
        const validImages = images.filter(img => this.isValidImage(img)).slice(0, config.ocr.maxImagesPerRequest);

        for (const image of validImages) {
            try {
                const result = await this.extractText(image.imageData, image.options || {});
                results.push({
                    ...image,
                    ...result
                });
            } catch (error) {
                this.serviceLogger.warn('OCR failed for image', {
                    src: image.src,
                    error: error.message
                });
                results.push({
                    ...image,
                    success: false,
                    error: error.message,
                    text: '',
                    confidence: 0
                });
            }
        }

        return results;
    }

    /**
     * Preprocess image for better OCR results
     */
    async preprocessImage(imageBuffer, options = {}) {
        try {
            const pipeline = sharp(imageBuffer);

            // Resize if needed
            if (options.resize) {
                pipeline.resize(options.resize.width, options.resize.height, { 
                    fit: 'inside', 
                    withoutEnlargement: false 
                });
            } else {
                // Default resize for better OCR
                pipeline.resize(800, 600, { fit: 'inside', withoutEnlargement: false });
            }

            // Enhance image quality
            pipeline
                .sharpen()
                .normalize()
                .png();

            return await pipeline.toBuffer();
        } catch (error) {
            this.serviceLogger.warn('Image preprocessing failed, using original', {
                error: error.message
            });
            return imageBuffer;
        }
    }

    /**
     * Validate image data format
     */
    isValidImageData(imageData) {
        return imageData && 
               typeof imageData === 'string' && 
               imageData.startsWith('data:image/') &&
               imageData.includes(',');
    }

    /**
     * Extract image buffer from data URL
     */
    extractImageBuffer(imageData) {
        const base64Data = imageData.split(',')[1];
        return Buffer.from(base64Data, 'base64');
    }

    /**
     * Validate image object
     */
    isValidImage(image) {
        return image && 
               image.imageData && 
               this.isValidImageData(image.imageData) &&
               image.width >= config.ocr.minImageSize &&
               image.height >= config.ocr.minImageSize;
    }

    /**
     * Test OCR service health
     */
    async testHealth() {
        try {
            // Test with a minimal image
            const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            
            const result = await this.extractText(testImageData);
            
            return {
                success: true,
                service: 'OCR',
                tesseractVersion: Tesseract.version
            };
        } catch (error) {
            this.serviceLogger.error('OCR health check failed', { error: error.message });
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new OCRService();
