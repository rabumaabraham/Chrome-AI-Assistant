// Request Validation Middleware
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/validation.log' })
    ]
});

// Validation function factory
function validateRequest(schema) {
    return (req, res, next) => {
        try {
            const errors = [];
            
            // Validate each field in the schema
            for (const [fieldName, fieldSchema] of Object.entries(schema)) {
                const value = req.body[fieldName];
                
                // Check if required field is missing
                if (fieldSchema.required && (value === undefined || value === null || value === '')) {
                    errors.push({
                        field: fieldName,
                        message: `${fieldName} is required`,
                        code: 'REQUIRED_FIELD'
                    });
                    continue;
                }
                
                // Skip validation if field is not required and not present
                if (!fieldSchema.required && (value === undefined || value === null)) {
                    continue;
                }
                
                // Type validation
                if (fieldSchema.type && !validateType(value, fieldSchema.type)) {
                    errors.push({
                        field: fieldName,
                        message: `${fieldName} must be of type ${fieldSchema.type}`,
                        code: 'INVALID_TYPE',
                        expected: fieldSchema.type,
                        actual: typeof value
                    });
                    continue;
                }
                
                // String-specific validations
                if (fieldSchema.type === 'string' && typeof value === 'string') {
                    // Length validations
                    if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} must be at least ${fieldSchema.minLength} characters long`,
                            code: 'MIN_LENGTH',
                            minLength: fieldSchema.minLength,
                            actualLength: value.length
                        });
                    }
                    
                    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} must be no more than ${fieldSchema.maxLength} characters long`,
                            code: 'MAX_LENGTH',
                            maxLength: fieldSchema.maxLength,
                            actualLength: value.length
                        });
                    }
                    
                    // Pattern validation
                    if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} format is invalid`,
                            code: 'INVALID_PATTERN',
                            pattern: fieldSchema.pattern
                        });
                    }
                    
                    // Format validation
                    if (fieldSchema.format === 'url' && !isValidUrl(value)) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} must be a valid URL`,
                            code: 'INVALID_URL'
                        });
                    }
                    
                    if (fieldSchema.format === 'email' && !isValidEmail(value)) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} must be a valid email address`,
                            code: 'INVALID_EMAIL'
                        });
                    }
                }
                
                // Array-specific validations
                if (fieldSchema.type === 'array' && Array.isArray(value)) {
                    if (fieldSchema.minItems && value.length < fieldSchema.minItems) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} must contain at least ${fieldSchema.minItems} items`,
                            code: 'MIN_ITEMS',
                            minItems: fieldSchema.minItems,
                            actualItems: value.length
                        });
                    }
                    
                    if (fieldSchema.maxItems && value.length > fieldSchema.maxItems) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} must contain no more than ${fieldSchema.maxItems} items`,
                            code: 'MAX_ITEMS',
                            maxItems: fieldSchema.maxItems,
                            actualItems: value.length
                        });
                    }
                }
                
                // Object-specific validations
                if (fieldSchema.type === 'object' && typeof value === 'object' && value !== null) {
                    if (fieldSchema.requiredFields) {
                        for (const requiredField of fieldSchema.requiredFields) {
                            if (!(requiredField in value)) {
                                errors.push({
                                    field: `${fieldName}.${requiredField}`,
                                    message: `${requiredField} is required in ${fieldName}`,
                                    code: 'REQUIRED_OBJECT_FIELD'
                                });
                            }
                        }
                    }
                }
            }
            
            if (errors.length > 0) {
                logger.warn('Validation failed', {
                    errors: errors,
                    body: sanitizeRequestBody(req.body),
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
                
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    message: 'Request validation failed',
                    details: errors
                });
            }
            
            next();
            
        } catch (error) {
            logger.error('Validation middleware error:', {
                error: error.message,
                stack: error.stack,
                body: sanitizeRequestBody(req.body)
            });
            
            res.status(500).json({
                success: false,
                error: 'Validation error',
                message: 'Internal validation error'
            });
        }
    };
}

// Type validation helper
function validateType(value, expectedType) {
    switch (expectedType) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && !isNaN(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'array':
            return Array.isArray(value);
        case 'object':
            return typeof value === 'object' && value !== null && !Array.isArray(value);
        case 'integer':
            return Number.isInteger(value);
        case 'float':
            return typeof value === 'number' && !isNaN(value);
        default:
            return true; // Unknown types pass validation
    }
}

// URL validation helper
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Sanitize request body for logging (remove sensitive data)
function sanitizeRequestBody(body) {
    const sensitiveFields = ['apiKey', 'password', 'token', 'secret', 'key'];
    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }
    
    return sanitized;
}

// Custom validation rules
const customValidators = {
    // Validate base64 data URL
    isBase64DataUrl: (value, type) => {
        if (typeof value !== 'string') return false;
        const base64DataUrlRegex = /^data:([a-zA-Z][a-zA-Z0-9]*\/[a-zA-Z0-9][a-zA-Z0-9]*);base64,([A-Za-z0-9+/=]+)$/;
        return base64DataUrlRegex.test(value);
    },
    
    // Validate image data URL
    isImageDataUrl: (value) => {
        if (typeof value !== 'string') return false;
        const imageDataUrlRegex = /^data:image\/(png|jpeg|jpg|gif|webp|bmp);base64,([A-Za-z0-9+/=]+)$/;
        return imageDataUrlRegex.test(value);
    },
    
    // Validate PDF data URL
    isPdfDataUrl: (value) => {
        if (typeof value !== 'string') return false;
        const pdfDataUrlRegex = /^data:application\/pdf;base64,([A-Za-z0-9+/=]+)$/;
        return pdfDataUrlRegex.test(value);
    }
};

// Add custom validators to the validation function
validateRequest.customValidators = customValidators;

module.exports = {
    validateRequest,
    customValidators
};
