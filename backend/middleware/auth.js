// Authentication Middleware
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/auth.log' })
    ]
});

// Simple API key authentication middleware
function authenticateRequest(req, res, next) {
    try {
        // Skip authentication in development mode if no API key is configured
        if (process.env.NODE_ENV === 'development' && !process.env.API_KEY) {
            logger.debug('Skipping authentication in development mode');
            return next();
        }

        // Check for API key in various locations
        const apiKey = getApiKeyFromRequest(req);
        
        if (!apiKey) {
            logger.warn('Authentication failed: No API key provided', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path
            });
            
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'API key is required for this endpoint'
            });
        }

        // Validate API key
        if (!isValidApiKey(apiKey)) {
            logger.warn('Authentication failed: Invalid API key', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path,
                keyPrefix: apiKey.substring(0, 8) + '...'
            });
            
            return res.status(401).json({
                success: false,
                error: 'Invalid API key',
                message: 'The provided API key is invalid'
            });
        }

        // Log successful authentication
        logger.debug('Authentication successful', {
            ip: req.ip,
            path: req.path,
            keyPrefix: apiKey.substring(0, 8) + '...'
        });

        // Add authentication info to request
        req.auth = {
            apiKey: apiKey,
            authenticated: true,
            timestamp: new Date().toISOString()
        };

        next();

    } catch (error) {
        logger.error('Authentication middleware error:', {
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            path: req.path
        });
        
        res.status(500).json({
            success: false,
            error: 'Authentication error',
            message: 'Internal authentication error'
        });
    }
}

// Extract API key from request
function getApiKeyFromRequest(req) {
    // Check various locations for API key
    const locations = [
        req.headers['x-api-key'],
        req.headers['authorization']?.replace('Bearer ', ''),
        req.headers['api-key'],
        req.query.apiKey,
        req.body.apiKey
    ];

    // Return the first valid API key found
    for (const key of locations) {
        if (key && typeof key === 'string' && key.trim().length > 0) {
            return key.trim();
        }
    }

    return null;
}

// Validate API key
function isValidApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
        return false;
    }

    // Check against configured API key
    const validApiKey = process.env.API_KEY;
    if (validApiKey) {
        return apiKey === validApiKey;
    }

    // If no API key is configured, allow any non-empty key in development
    if (process.env.NODE_ENV === 'development') {
        return apiKey.length >= 8; // Minimum length requirement
    }

    // In production, require a configured API key
    return false;
}

// Optional authentication middleware (doesn't fail if no key provided)
function optionalAuthenticate(req, res, next) {
    try {
        const apiKey = getApiKeyFromRequest(req);
        
        if (apiKey && isValidApiKey(apiKey)) {
            req.auth = {
                apiKey: apiKey,
                authenticated: true,
                timestamp: new Date().toISOString()
            };
        } else {
            req.auth = {
                authenticated: false,
                timestamp: new Date().toISOString()
            };
        }

        next();

    } catch (error) {
        logger.error('Optional authentication middleware error:', error);
        req.auth = { authenticated: false };
        next();
    }
}

// Rate limiting based on API key
function createApiKeyRateLimit(windowMs = 15 * 60 * 1000, maxRequests = 100) {
    const requests = new Map();

    return (req, res, next) => {
        const apiKey = req.auth?.apiKey || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean up old entries
        for (const [key, timestamps] of requests.entries()) {
            const validTimestamps = timestamps.filter(ts => ts > windowStart);
            if (validTimestamps.length === 0) {
                requests.delete(key);
            } else {
                requests.set(key, validTimestamps);
            }
        }

        // Check current key
        const keyRequests = requests.get(apiKey) || [];
        const recentRequests = keyRequests.filter(ts => ts > windowStart);

        if (recentRequests.length >= maxRequests) {
            logger.warn('Rate limit exceeded', {
                apiKey: apiKey.substring(0, 8) + '...',
                requests: recentRequests.length,
                limit: maxRequests,
                windowMs: windowMs
            });

            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: `Too many requests. Limit: ${maxRequests} per ${Math.round(windowMs / 1000)} seconds`,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // Add current request
        recentRequests.push(now);
        requests.set(apiKey, recentRequests);

        next();
    };
}

// CORS preflight handler for authenticated requests
function handleCorsPreflight(req, res, next) {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-key');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        return res.status(200).end();
    }
    next();
}

module.exports = {
    authenticateRequest,
    optionalAuthenticate,
    createApiKeyRateLimit,
    handleCorsPreflight,
    getApiKeyFromRequest,
    isValidApiKey
};
