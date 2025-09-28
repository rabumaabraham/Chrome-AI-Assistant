/**
 * Authentication Middleware
 * Handles API key authentication for secure endpoints
 */

const config = require('../../config/index.js');
const logger = require('../services/Logger.js');

/**
 * API Key Authentication Middleware
 */
function authenticateRequest(req, res, next) {
    try {
        // Skip authentication in development if not required
        if (config.server.environment === 'development' && !config.security.apiKeyRequired) {
            return next();
        }

        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

        if (!apiKey) {
            logger.getServiceLogger('Auth').warn('Authentication failed: No API key provided', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                url: req.url
            });

            return res.status(401).json({
                success: false,
                error: 'Authentication failed',
                message: 'No API key provided'
            });
        }

        // In a production environment, you would validate the API key against a database
        // For now, we'll use a simple check against environment variable
        const validApiKey = process.env.API_KEY || config.ai.apiKey;

        if (apiKey !== validApiKey) {
            logger.getServiceLogger('Auth').warn('Authentication failed: Invalid API key', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                url: req.url,
                providedKey: apiKey.substring(0, 8) + '...' // Log only first 8 chars for security
            });

            return res.status(401).json({
                success: false,
                error: 'Authentication failed',
                message: 'Invalid API key'
            });
        }

        // Authentication successful
        logger.getServiceLogger('Auth').debug('Authentication successful', {
            ip: req.ip,
            url: req.url
        });

        next();

    } catch (error) {
        logger.getServiceLogger('Auth').error('Authentication middleware error', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            success: false,
            error: 'Authentication error',
            message: 'Internal authentication error'
        });
    }
}

/**
 * Optional Authentication Middleware
 * Allows requests to proceed but adds user context if authenticated
 */
function optionalAuth(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

        if (apiKey) {
            const validApiKey = process.env.API_KEY || config.ai.apiKey;
            
            if (apiKey === validApiKey) {
                req.authenticated = true;
                req.user = { authenticated: true };
            } else {
                req.authenticated = false;
                req.user = { authenticated: false };
            }
        } else {
            req.authenticated = false;
            req.user = { authenticated: false };
        }

        next();

    } catch (error) {
        logger.getServiceLogger('Auth').error('Optional auth middleware error', {
            error: error.message,
            stack: error.stack
        });

        req.authenticated = false;
        req.user = { authenticated: false };
        next();
    }
}

module.exports = {
    authenticateRequest,
    optionalAuth
};
