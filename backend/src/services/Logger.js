/**
 * Centralized Logging Service
 * Provides structured logging throughout the application
 */

const winston = require('winston');
const path = require('path');
const config = require('../../config/index.js');

class Logger {
    constructor() {
        this.logger = this.createLogger();
    }

    createLogger() {
        const logFormat = winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
        );

        const transports = [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        ];

        // Add file transports for each service
        const services = ['app', 'ai', 'ocr', 'pdf', 'auth', 'validation'];
        services.forEach(service => {
            transports.push(
                new winston.transports.File({
                    filename: path.join(config.logging.logDir, `${service}.log`),
                    level: config.logging.level,
                    format: logFormat,
                    maxFiles: config.logging.maxFiles,
                    maxsize: config.logging.maxSize
                })
            );
        });

        return winston.createLogger({
            level: config.logging.level,
            format: logFormat,
            transports,
            exitOnError: false
        });
    }

    // Service-specific loggers
    getServiceLogger(serviceName) {
        return {
            info: (message, meta = {}) => this.logger.info(message, { service: serviceName, ...meta }),
            warn: (message, meta = {}) => this.logger.warn(message, { service: serviceName, ...meta }),
            error: (message, meta = {}) => this.logger.error(message, { service: serviceName, ...meta }),
            debug: (message, meta = {}) => this.logger.debug(message, { service: serviceName, ...meta })
        };
    }

    // General logging methods
    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }
}

module.exports = new Logger();
