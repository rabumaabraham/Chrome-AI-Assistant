/**
 * Security Middleware
 * Provides security features like rate limiting, CORS, and request validation
 */

const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const config = require('../../config/index.js');
const logger = require('../services/Logger.js');

/**
 * Rate Limiting Middleware
 */
function createRateLimit() {
    return rateLimit({
        windowMs: config.security.rateLimitWindowMs,
        max: config.security.rateLimitMaxRequests,
        message: {
            success: false,
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.getServiceLogger('Security').warn('Rate limit exceeded', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                url: req.url
            });
            
            res.status(429).json({
                success: false,
                error: 'Too many requests',
                message: 'Rate limit exceeded. Please try again later.'
            });
        }
    });
}

/**
 * CORS Configuration
 */
function createCorsOptions() {
    return {
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            const isAllowed = config.cors.allowedOrigins.some(allowedOrigin => {
                if (allowedOrigin.includes('*')) {
                    return origin.startsWith(allowedOrigin.replace('*', ''));
                }
                return origin === allowedOrigin;
            });
            
            if (isAllowed) {
                callback(null, true);
            } else {
                logger.getServiceLogger('Security').warn(`CORS blocked request from origin: ${origin}`, {
                    origin: origin,
                    allowedOrigins: config.cors.allowedOrigins
                });
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
    };
}

/**
 * Helmet Configuration for Security Headers
 */
function createHelmetConfig() {
    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false // Disable for Chrome extension compatibility
    });
}

/**
 * Request Logging Middleware
 */
function requestLogger(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        logger.getServiceLogger('Request').info('Request completed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: duration,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            contentLength: res.get('Content-Length') || 0
        });
    });
    
    next();
}

/**
 * Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
    logger.getServiceLogger('Error').error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Don't leak error details in production
    const isDevelopment = config.server.environment === 'development';
    
    res.status(err.status || 500).json({
        success: false,
        error: 'Internal server error',
        message: isDevelopment ? err.message : 'Something went wrong',
        ...(isDevelopment && { stack: err.stack })
    });
}

/**
 * Initialize all security middleware
 */
function initializeSecurity(app) {
    // Trust proxy for accurate IP addresses
    app.set('trust proxy', 1);
    
    // Security headers
    app.use(createHelmetConfig());
    
    // Compression
    app.use(compression());
    
    // CORS
    app.use(cors(createCorsOptions()));
    
    // Rate limiting
    app.use(createRateLimit());
    
    // Request logging
    app.use(requestLogger);
    
    // Error handling
    app.use(errorHandler);
}

module.exports = {
    initializeSecurity,
    createRateLimit,
    createCorsOptions,
    createHelmetConfig,
    requestLogger,
    errorHandler
};
