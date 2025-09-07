// AI Assistant Routes
const express = require('express');
const OpenAI = require('openai');
const winston = require('winston');
const { validateRequest } = require('../middleware/validation');
const { authenticateRequest } = require('../middleware/auth');

const router = express.Router();
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/ai.log' })
    ]
});

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Validation schemas
const askAISchema = {
    question: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 2000
    },
    context: {
        type: 'object',
        required: false
    },
    url: {
        type: 'string',
        required: false,
        format: 'url'
    },
    selectedText: {
        type: 'string',
        required: false,
        maxLength: 5000
    }
};

// POST /ask-ai - Main AI question endpoint
router.post('/', authenticateRequest, validateRequest(askAISchema), async (req, res) => {
    try {
        const { question, context = {}, url, selectedText } = req.body;
        
        logger.info('AI request received', {
            question: question.substring(0, 100) + '...',
            hasContext: !!context,
            hasSelectedText: !!selectedText,
            url: url
        });

        // Build context string from provided data
        let contextString = '';
        
        if (context.title) {
            contextString += `Page Title: ${context.title}\n`;
        }
        
        if (context.metaDescription) {
            contextString += `Page Description: ${context.metaDescription}\n`;
        }
        
        if (context.headings && context.headings.length > 0) {
            contextString += `Page Headings: ${context.headings.join(', ')}\n`;
        }
        
        if (context.textContent) {
            // Truncate text content to avoid token limits
            const maxContextLength = 8000;
            const truncatedText = context.textContent.length > maxContextLength 
                ? context.textContent.substring(0, maxContextLength) + '...'
                : context.textContent;
            contextString += `Page Content: ${truncatedText}\n`;
        }
        
        if (selectedText) {
            contextString += `Selected Text: ${selectedText}\n`;
        }
        
        if (url) {
            contextString += `Page URL: ${url}\n`;
        }

        // Prepare the prompt for OpenAI
        const systemPrompt = `You are a helpful AI assistant that answers questions about webpage content. 
        You have access to the following context from the webpage the user is currently viewing:
        
        ${contextString}
        
        Please provide a helpful, accurate, and concise answer to the user's question based on the provided context. 
        If the context doesn't contain enough information to answer the question, let the user know and suggest what additional information might be helpful.
        
        Guidelines:
        - Be specific and reference the actual content when possible
        - If asked about specific text, quote it accurately
        - If the question is about the page structure, refer to the headings and content organization
        - Keep responses concise but comprehensive
        - If you're unsure about something, say so rather than guessing`;

        const userPrompt = `Question: ${question}`;

        // Make request to OpenAI
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ],
            max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000,
            temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        });

        const answer = completion.choices[0].message.content;
        
        // Log successful response
        logger.info('AI response generated', {
            questionLength: question.length,
            contextLength: contextString.length,
            responseLength: answer.length,
            tokensUsed: completion.usage?.total_tokens || 'unknown'
        });

        res.json({
            success: true,
            answer: answer,
            usage: {
                promptTokens: completion.usage?.prompt_tokens,
                completionTokens: completion.usage?.completion_tokens,
                totalTokens: completion.usage?.total_tokens
            },
            model: process.env.OPENAI_MODEL || 'gpt-4',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Error processing AI request:', {
            error: error.message,
            stack: error.stack,
            question: req.body.question?.substring(0, 100)
        });

        // Handle specific OpenAI errors
        if (error.code === 'insufficient_quota') {
            return res.status(402).json({
                success: false,
                error: 'OpenAI API quota exceeded',
                message: 'Please check your OpenAI API billing and quota limits'
            });
        }
        
        if (error.code === 'invalid_api_key') {
            return res.status(401).json({
                success: false,
                error: 'Invalid OpenAI API key',
                message: 'Please check your OpenAI API key configuration'
            });
        }
        
        if (error.code === 'rate_limit_exceeded') {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: 'Too many requests to OpenAI API, please try again later'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to process AI request',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// GET /ask-ai/health - Health check for AI service
router.get('/health', async (req, res) => {
    try {
        // Test OpenAI connection with a simple request
        const testCompletion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 5
        });

        res.json({
            success: true,
            status: 'healthy',
            openai: {
                connected: true,
                model: process.env.OPENAI_MODEL || 'gpt-4',
                lastTest: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('AI health check failed:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            openai: {
                connected: false,
                error: error.message
            },
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
