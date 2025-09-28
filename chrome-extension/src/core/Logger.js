/**
 * Logging Service
 * Centralized logging for the Chrome Extension
 */

class Logger {
    constructor() {
        this.enabled = true;
        this.prefix = '[AI Assistant]';
    }

    /**
     * Log info message
     */
    info(message, data = null) {
        if (!this.enabled) return;
        console.log(`${this.prefix} ${message}`, data || '');
    }

    /**
     * Log warning message
     */
    warn(message, data = null) {
        if (!this.enabled) return;
        console.warn(`${this.prefix} ${message}`, data || '');
    }

    /**
     * Log error message
     */
    error(message, data = null) {
        if (!this.enabled) return;
        console.error(`${this.prefix} ${message}`, data || '');
    }

    /**
     * Log debug message
     */
    debug(message, data = null) {
        if (!this.enabled) return;
        console.debug(`${this.prefix} ${message}`, data || '');
    }

    /**
     * Enable/disable logging
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Create service-specific logger
     */
    createServiceLogger(serviceName) {
        return {
            info: (message, data) => this.info(`[${serviceName}] ${message}`, data),
            warn: (message, data) => this.warn(`[${serviceName}] ${message}`, data),
            error: (message, data) => this.error(`[${serviceName}] ${message}`, data),
            debug: (message, data) => this.debug(`[${serviceName}] ${message}`, data)
        };
    }
}

// Export singleton instance
export default new Logger();
