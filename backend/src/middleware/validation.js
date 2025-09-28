/**
 * Request Validation Middleware
 * Centralized validation for all API endpoints
 */

const logger = require('../services/Logger.js');

/**
 * Validation function factory
 */
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
                    // Minimum length
                    if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} must be at least ${fieldSchema.minLength} characters long`,
                            code: 'MIN_LENGTH_VIOLATION',
                            expected: fieldSchema.minLength,
                            actual: value.length
                        });
                    }
                    
                    // Maximum length
                    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} must be no more than ${fieldSchema.maxLength} characters long`,
                            code: 'MAX_LENGTH_VIOLATION',
                            expected: fieldSchema.maxLength,
                            actual: value.length
                        });
                    }
                    
                    // Pattern validation
                    if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} format is invalid`,
                            code: 'PATTERN_VIOLATION',
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
                
                // Number-specific validations
                if (fieldSchema.type === 'number' && typeof value === 'number') {
                    if (fieldSchema.min !== undefined && value < fieldSchema.min) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} must be at least ${fieldSchema.min}`,
                            code: 'MIN_VALUE_VIOLATION',
                            expected: fieldSchema.min,
                            actual: value
                        });
                    }
                    
                    if (fieldSchema.max !== undefined && value > fieldSchema.max) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} must be no more than ${fieldSchema.max}`,
                            code: 'MAX_VALUE_VIOLATION',
                            expected: fieldSchema.max,
                            actual: value
                        });
                    }
                }
                
                // Array-specific validations
                if (fieldSchema.type === 'array' && Array.isArray(value)) {
                    if (fieldSchema.minItems && value.length < fieldSchema.minItems) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} must have at least ${fieldSchema.minItems} items`,
                            code: 'MIN_ITEMS_VIOLATION',
                            expected: fieldSchema.minItems,
                            actual: value.length
                        });
                    }
                    
                    if (fieldSchema.maxItems && value.length > fieldSchema.maxItems) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} must have no more than ${fieldSchema.maxItems} items`,
                            code: 'MAX_ITEMS_VIOLATION',
                            expected: fieldSchema.maxItems,
                            actual: value.length
                        });
                    }
                }
            }
            
            if (errors.length > 0) {
                logger.getServiceLogger('Validation').warn('Request validation failed', {
                    errors: errors,
                    url: req.url,
                    method: req.method
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
            logger.getServiceLogger('Validation').error('Validation middleware error', {
                error: error.message,
                stack: error.stack
            });
            
            return res.status(500).json({
                success: false,
                error: 'Validation error',
                message: 'Internal validation error'
            });
        }
    };
}

/**
 * Type validation helper
 */
function validateType(value, expectedType) {
    switch (expectedType) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && !isNaN(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'object':
            return typeof value === 'object' && value !== null && !Array.isArray(value);
        case 'array':
            return Array.isArray(value);
        case 'email':
            return typeof value === 'string' && isValidEmail(value);
        case 'url':
            return typeof value === 'string' && isValidUrl(value);
        default:
            return true;
    }
}

/**
 * URL validation helper
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Email validation helper
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

module.exports = {
    validateRequest
};
