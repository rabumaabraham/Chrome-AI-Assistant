/**
 * Enhanced AI Controller
 * Uses ContentProcessor for intelligent content handling
 */

const EnhancedAIService = require('../services/EnhancedAIService');
const logger = require('../services/Logger');

class EnhancedAIController {
    constructor() {
        this.aiService = new EnhancedAIService();
        this.serviceLogger = logger.getServiceLogger('EnhancedAI');
    }

    /**
     * Handle enhanced AI question request
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

            this.serviceLogger.info('Enhanced AI request received', {
                questionLength: question.length,
                hasContext: !!context,
                hasSelectedText: !!(context.selectedText),
                url: url,
                contentType: context.isPdfViewer ? 'PDF' : 'Webpage',
                hasImages: !!(context.images && context.images.length > 0)
            });

            // Generate enhanced AI response
            const result = await this.aiService.generateResponse(question, context);

            if (result.success) {
                this.serviceLogger.info('Enhanced AI response generated', {
                    questionLength: question.length,
                    responseLength: result.answer.length,
                    tokensUsed: result.usage.total_tokens,
                    contentProcessed: !!result.processedContent
                });

                return res.json({
                    success: true,
                    answer: result.answer,
                    usage: result.usage,
                    metadata: result.processedContent,
                    enhanced: true
                });
            } else {
                this.serviceLogger.error('Enhanced AI response generation failed', {
                    error: result.error,
                    questionLength: question.length
                });

                return res.status(500).json({
                    success: false,
                    error: 'Failed to generate enhanced response',
                    details: result.error
                });
            }

        } catch (error) {
            this.serviceLogger.error('Enhanced AI controller error', {
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
     * Handle content-specific AI requests
     */
    async askContentSpecific(req, res) {
        try {
            const { question, context, contentType } = req.body;

            if (!question || !context || !contentType) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    message: 'Question, context, and contentType are required'
                });
            }

            // Process content
            const processedContent = await this.aiService.contentProcessor.processContent(context, question);

            // Generate content-specific response
            const answer = await this.aiService.generateContentSpecificResponse(
                question, 
                processedContent, 
                contentType.toUpperCase()
            );

            return res.json({
                success: true,
                answer,
                contentType,
                metadata: processedContent.metadata,
                enhanced: true
            });

        } catch (error) {
            this.serviceLogger.error('Content-specific AI error', {
                error: error.message,
                contentType: req.body.contentType
            });

            return res.status(500).json({
                success: false,
                error: 'Content-specific processing failed',
                details: error.message
            });
        }
    }

    /**
     * Health check for enhanced AI service
     */
    async healthCheck(req, res) {
        try {
            const health = await this.aiService.testHealth();
            
            return res.json({
                success: true,
                service: 'Enhanced AI Service',
                status: health ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                features: {
                    contentProcessing: true,
                    intelligentFiltering: true,
                    contentSpecificResponses: true,
                    metadataExtraction: true
                }
            });

        } catch (error) {
            this.serviceLogger.error('Enhanced AI health check failed', {
                error: error.message
            });

            return res.status(500).json({
                success: false,
                service: 'Enhanced AI Service',
                status: 'unhealthy',
                error: error.message
            });
        }
    }

    /**
     * Analyze content without generating response
     */
    async analyzeContent(req, res) {
        try {
            const { context } = req.body;

            if (!context) {
                return res.status(400).json({
                    success: false,
                    error: 'Context is required for analysis'
                });
            }

            const processedContent = await this.aiService.contentProcessor.processContent(context);

            return res.json({
                success: true,
                analysis: {
                    metadata: processedContent.metadata,
                    summary: processedContent.summary,
                    structure: processedContent.structured,
                    priorities: processedContent.prioritized
                }
            });

        } catch (error) {
            this.serviceLogger.error('Content analysis failed', {
                error: error.message
            });

            return res.status(500).json({
                success: false,
                error: 'Content analysis failed',
                details: error.message
            });
        }
    }
}

module.exports = EnhancedAIController;
