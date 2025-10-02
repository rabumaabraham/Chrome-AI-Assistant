/**
 * Route Configuration
 * Centralized route management for the API
 */

const express = require('express');
const { validateRequest } = require('../middleware/validation.js');

// Controllers
const AIController = require('../controllers/AIController.js');
const OCRController = require('../controllers/OCRController.js');
const PDFController = require('../controllers/PDFController.js');

const router = express.Router();

// Validation Schemas
const schemas = {
    ai: {
        question: {
            type: 'string',
            required: true,
            minLength: 1,
            maxLength: 2000
        },
        context: {
            type: 'object',
            required: true
        },
        url: {
            type: 'string',
            required: false,
            format: 'url'
        }
    },
    
    ocr: {
        imageData: {
            type: 'string',
            required: true,
            minLength: 1
        },
        imageInfo: {
            type: 'object',
            required: false
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
    },
    
    pdf: {
        pdfData: {
            type: 'string',
            required: true,
            minLength: 1
        },
        options: {
            type: 'object',
            required: false
        }
    }
};

// AI Routes
router.post('/ask-ai', validateRequest(schemas.ai), AIController.askAI.bind(AIController));
router.get('/ai/health', AIController.healthCheck.bind(AIController));

// OCR Routes
router.post('/ocr', validateRequest(schemas.ocr), OCRController.extractText.bind(OCRController));
router.get('/ocr/health', OCRController.healthCheck.bind(OCRController));

// PDF Routes
router.post('/pdf/extract', validateRequest(schemas.pdf), PDFController.extractText.bind(PDFController));
router.get('/pdf/health', PDFController.healthCheck.bind(PDFController));

// Root Route
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Chrome AI Assistant API is running!',
        service: 'Chrome AI Assistant API',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            ai: '/api/ask-ai',
            ocr: '/api/ocr',
            pdf: '/api/pdf/extract'
        }
    });
});

// Health Check Route
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'Chrome AI Assistant API',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;
