/**
 * AI Controller
 * Handles AI-related requests and responses
 */

const AIService = require('../services/AIService.js');
const logger = require('../services/Logger.js');

class AIController {
    constructor() {
        this.serviceLogger = logger.getServiceLogger('AI');
    }

    /**
     * Handle AI question request
     */
    async askAI(req, res) {
        try {
            const { question, context, url } = req.body;

            // Validate request
            if (!question || !context) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    message: 'Question and context are required'
                });
            }

            this.serviceLogger.info('AI request received', {
                questionLength: question.length,
                hasContext: !!context,
                hasSelectedText: !!(context.selectedText),
                url: url
            });

            // Build context string
            const contextString = this.buildContextString(context);

            // Generate AI response
            const result = await AIService.generateResponse(question, contextString);

            if (result.success) {
                this.serviceLogger.info('AI response generated', {
                    questionLength: question.length,
                    responseLength: result.answer.length,
                    tokensUsed: result.usage.total_tokens
                });

                return res.json({
                    success: true,
                    answer: result.answer,
                    usage: result.usage
                });
            } else {
                this.serviceLogger.error('AI response generation failed', {
                    error: result.error,
                    questionLength: question.length
                });

                return res.status(500).json({
                    success: false,
                    error: 'Failed to generate response',
                    details: result.error
                });
            }

        } catch (error) {
            this.serviceLogger.error('AI controller error', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                details: error.message
            });
        }
    }

    /**
     * Build comprehensive context string from page data
     */
    buildContextString(context) {
        let contextString = '';

        // Add basic page information
        if (context.url) contextString += `URL: ${context.url}\n`;
        if (context.title) contextString += `Page Title: ${context.title}\n`;
        if (context.metaDescription) contextString += `Meta Description: ${context.metaDescription}\n`;

        // Prioritize viewport content (what user actually sees)
        if (context.viewportContent) {
            contextString += `Currently Visible Content: ${context.viewportContent}\n`;
        }

        // Add current PDF content if viewing a PDF (highest priority)
        if (context.isPdfViewer && context.currentPdfContent) {
            contextString += `\n📄 CURRENT PDF CONTENT (HIGHEST PRIORITY):\n${context.currentPdfContent.substring(0, 8000)}${context.currentPdfContent.length > 8000 ? '...' : ''}\n`;
        }

        // Add image OCR content if available
        if (context.imageOcrContent && context.imageOcrContent.length > 0) {
            contextString += `\n🖼️ IMAGE OCR CONTENT:\n`;
            context.imageOcrContent.forEach((image, index) => {
                contextString += `Image ${index + 1} (${image.dimensions}):\n`;
                if (image.alt) contextString += `Alt text: ${image.alt}\n`;
                if (image.title) contextString += `Title: ${image.title}\n`;
                contextString += `Extracted text: ${image.extractedText}\n`;
                contextString += `Confidence: ${image.confidence}\n\n`;
            });
        }

        // Add question-aware targeted content (highest priority)
        if (context.targetedContent) {
            contextString += `\n🎯 TARGETED CONTENT (Most Relevant to Question):\n${context.targetedContent}\n`;
        }

        // If we have targeted content, it already includes the main content, so skip duplicate
        const hasTargetedContent = context.targetedContent && context.targetedContent.includes('Main Content:');

        // Add main content (prioritize visibleText over textContent, but skip if already in targeted content)
        if (!hasTargetedContent) {
            const mainContent = context.visibleText || context.textContent;
            if (mainContent) {
                const maxContextLength = 6000;
                const truncatedText = mainContent.length > maxContextLength 
                    ? mainContent.substring(0, maxContextLength) + '...'
                    : mainContent;
                contextString += `Page Content: ${truncatedText}\n`;
            }
        }

        // Add structured data if present
        if (context.tables && context.tables.length > 0) {
            contextString += `Tables Found: ${context.tables.length} table(s)\n`;
            context.tables.slice(0, 2).forEach((table, i) => {
                if (table.caption) contextString += `Table ${i+1} Caption: ${table.caption}\n`;
                if (table.rows.length > 0) {
                    contextString += `Table ${i+1} Sample Data: ${table.rows[0].join(' | ')}\n`;
                }
            });
        }

        if (context.lists && context.lists.length > 0) {
            contextString += `Lists Found: ${context.lists.length} list(s)\n`;
            context.lists.slice(0, 2).forEach((list, i) => {
                if (list.length > 0) {
                    contextString += `List ${i+1} Items: ${list.slice(0, 3).join(', ')}${list.length > 3 ? '...' : ''}\n`;
                }
            });
        }

        if (context.forms && context.forms.length > 0) {
            contextString += `Forms Found: ${context.forms.length} form(s)\n`;
            context.forms.slice(0, 2).forEach((form, i) => {
                if (form.inputs.length > 0) {
                    const inputTypes = form.inputs.map(input => input.type).join(', ');
                    contextString += `Form ${i+1} Input Types: ${inputTypes}\n`;
                }
            });
        }

        // Add headings hierarchy
        if (context.headings && context.headings.length > 0) {
            contextString += `Page Structure:\n`;
            context.headings.forEach(heading => {
                const indent = '  '.repeat(heading.level - 1);
                contextString += `${indent}${'#'.repeat(heading.level)} ${heading.text}\n`;
            });
        }

        // Add page structure information
        if (context.pageStructure) {
            const structure = [];
            if (context.pageStructure.hasHeader) structure.push('Header');
            if (context.pageStructure.hasNav) structure.push('Navigation');
            if (context.pageStructure.hasMain) structure.push('Main Content');
            if (context.pageStructure.hasSidebar) structure.push('Sidebar');
            if (context.pageStructure.hasFooter) structure.push('Footer');
            if (structure.length > 0) {
                contextString += `Page Structure: ${structure.join(', ')}\n`;
            }
        }

        return contextString;
    }

    /**
     * Health check for AI service
     */
    async healthCheck(req, res) {
        try {
            const health = await AIService.testHealth();
            
            if (health.success) {
                return res.json({
                    success: true,
                    service: 'AI',
                    provider: health.provider,
                    model: health.model,
                    status: 'healthy'
                });
            } else {
                return res.status(503).json({
                    success: false,
                    service: 'AI',
                    status: 'unhealthy',
                    error: health.error
                });
            }
        } catch (error) {
            this.serviceLogger.error('AI health check failed', { error: error.message });
            return res.status(503).json({
                success: false,
                service: 'AI',
                status: 'unhealthy',
                error: error.message
            });
        }
    }
}

module.exports = new AIController();
