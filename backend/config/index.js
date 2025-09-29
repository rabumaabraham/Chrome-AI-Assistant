/**
 * Configuration Management
 * Centralized configuration for the AI Assistant Backend
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0',
        environment: process.env.NODE_ENV || 'development'
    },

    // AI Configuration
    ai: {
        provider: 'openrouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
        maxTokens: parseInt(process.env.MAX_TOKENS) || 4000,
        temperature: parseFloat(process.env.TEMPERATURE) || 0.7
    },

    // CORS Configuration
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'chrome-extension://*',
            'https://rabumaabraham.github.io'
        ]
    },

    // Security Configuration
    security: {
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        apiKeyRequired: process.env.API_KEY_REQUIRED === 'true'
    },

    // OCR Configuration
    ocr: {
        language: process.env.OCR_LANGUAGE || 'eng',
        maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024, // 5MB
        maxImagesPerRequest: parseInt(process.env.MAX_IMAGES_PER_REQUEST) || 3,
        minImageSize: parseInt(process.env.MIN_IMAGE_SIZE) || 50 // minimum width/height
    },

    // PDF Configuration
    pdf: {
        maxFileSize: parseInt(process.env.MAX_PDF_SIZE) || 10 * 1024 * 1024, // 10MB
        maxPages: parseInt(process.env.MAX_PDF_PAGES) || 50
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        logDir: path.join(__dirname, '../logs'),
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
        maxSize: process.env.LOG_MAX_SIZE || '10m'
    },

    // Cache Configuration
    cache: {
        enabled: process.env.CACHE_ENABLED === 'true',
        ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
        maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 100
    }
};

// Validation
const validateConfig = () => {
    const errors = [];

    if (!config.ai.apiKey) {
        errors.push('OPENROUTER_API_KEY is required');
    }

    if (config.server.port < 1 || config.server.port > 65535) {
        errors.push('Invalid PORT configuration');
    }

    if (errors.length > 0) {
        throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
};

// Initialize configuration
validateConfig();

module.exports = config;
