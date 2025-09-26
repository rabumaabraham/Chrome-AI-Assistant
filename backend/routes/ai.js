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

// Initialize OpenRouter client
const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Assistant Chrome Extension"
    }
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
router.post('/', validateRequest(askAISchema), async (req, res) => {
    try {
        const { question, context = {}, url, selectedText } = req.body;
        
        logger.info('AI request received', {
            question: question.substring(0, 100) + '...',
            hasContext: !!context,
            hasSelectedText: !!selectedText,
            url: url
        });

        // Build enhanced context string from provided data
        let contextString = '';
        
        if (context.title) {
            contextString += `Page Title: ${context.title}\n`;
        }
        
        if (context.metaDescription) {
            contextString += `Page Description: ${context.metaDescription}\n`;
        }
        
        // Enhanced headings with hierarchy
        if (context.headings && context.headings.length > 0) {
            const headingText = context.headings
                .map(h => `${'  '.repeat(h.level - 1)}${h.text}`)
                .join('\n');
            contextString += `Page Structure:\n${headingText}\n`;
        }
        
        // Prioritize viewport content (what user actually sees)
        if (context.viewportContent) {
            contextString += `Currently Visible Content: ${context.viewportContent}\n`;
        }
        
        // Add current PDF content if viewing a PDF
        if (context.isPdfViewer && context.currentPdfContent) {
            contextString += `\n📄 CURRENT PDF CONTENT:\n${context.currentPdfContent.substring(0, 8000)}\n`;
        }
        
        // Add question-aware targeted content (highest priority)
        if (context.targetedContent) {
            contextString += `\n🎯 TARGETED CONTENT (Most Relevant to Question):\n${context.targetedContent}\n`;
        }
        
        // Add main content
        if (context.textContent) {
            const maxContextLength = 6000; // Reduced to make room for other data
            const truncatedText = context.textContent.length > maxContextLength 
                ? context.textContent.substring(0, maxContextLength) + '...'
                : context.textContent;
            contextString += `Page Content: ${truncatedText}\n`;
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
                contextString += `List ${i+1}: ${list.slice(0, 3).join(', ')}${list.length > 3 ? '...' : ''}\n`;
            });
        }
        
        if (context.forms && context.forms.length > 0) {
            contextString += `Forms Found: ${context.forms.length} form(s)\n`;
            context.forms.forEach((form, i) => {
                const inputTypes = form.inputs.map(input => input.type).join(', ');
                contextString += `Form ${i+1} Inputs: ${inputTypes}\n`;
            });
        }
        
        if (context.images && context.images.length > 0) {
            contextString += `Images Found: ${context.images.length} image(s)\n`;
            context.images.slice(0, 3).forEach((img, i) => {
                if (img.alt) contextString += `Image ${i+1}: ${img.alt}\n`;
            });
        }
        
        if (context.pdfs && context.pdfs.length > 0) {
            contextString += `PDFs Found: ${context.pdfs.length} PDF document(s)\n`;
            context.pdfs.forEach((pdf, i) => {
                contextString += `PDF ${i+1}: ${pdf.text} (${pdf.src})\n`;
            });
        }
        
        if (context.embeddedDocs && context.embeddedDocs.length > 0) {
            contextString += `Embedded Documents: ${context.embeddedDocs.length} document(s)\n`;
            context.embeddedDocs.slice(0, 3).forEach((doc, i) => {
                contextString += `Document ${i+1}: ${doc.text} (${doc.type})\n`;
            });
        }
        
        if (selectedText) {
            contextString += `Selected Text: ${selectedText}\n`;
        }
        
        if (url) {
            contextString += `Page URL: ${url}\n`;
        }
        
        // Add page structure info
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

        // Prepare the enhanced prompt for OpenAI
        const systemPrompt = `You are an expert AI assistant that analyzes webpage content with high accuracy. 
        You have access to comprehensive DOM data from the webpage the user is currently viewing:
        
        ${contextString}
        
        You can see:
        - The exact text content the user sees on screen
        - Page structure with hierarchical headings
        - Tables, lists, forms, and images
        - PDF documents and embedded files on the page
        - Current PDF content if viewing a PDF document
        - Currently visible viewport content
        - Page layout and navigation elements
        
        Please provide a helpful, accurate, and detailed answer to the user's question based on the provided context. 
        
        Guidelines for maximum accuracy:
        - Quote exact text from the page when relevant
        - Reference specific headings, tables, or sections by name
        - If asked about data in tables, provide the actual values
        - If asked about forms, describe the specific input fields and their purposes
        - If asked about images, reference their alt text and context
        - If asked about PDFs or documents, describe what documents are available on the page
        - If viewing a PDF, you can read and analyze the actual PDF content
        - IMPORTANT: If the page contains PDF content (marked as "CURRENT PDF CONTENT"), prioritize this content over other page elements
        - When analyzing PDF content, provide specific details from the document text
        - If asked about navigation, describe the actual menu structure
        - If the question is about page structure, use the hierarchical headings
        - Prioritize currently visible content when relevant
        - If you're unsure about something, say so rather than guessing
        - Be specific about what you can and cannot see on the page`;

        const userPrompt = `Question: ${question}`;

        // Make request to OpenRouter
        let answer;
        let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error('OpenRouter API key not configured');
        }

        const completion = await openai.chat.completions.create({
            model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
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
            max_tokens: parseInt(process.env.OPENROUTER_MAX_TOKENS) || 2000,
            temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE) || 0.7,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        });

        answer = completion.choices[0].message.content;
        usage = completion.usage || usage;
        
        // Log successful response
        logger.info('AI response generated', {
            questionLength: question.length,
            contextLength: contextString.length,
            responseLength: answer.length,
            tokensUsed: usage.total_tokens || 'unknown'
        });

        res.json({
            success: true,
            answer: answer,
            usage: {
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens
            },
            model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Error processing AI request:', {
            error: error.message,
            stack: error.stack,
            question: req.body.question?.substring(0, 100)
        });

        // Handle specific OpenRouter errors
        if (error.code === 'insufficient_quota') {
            return res.status(402).json({
                success: false,
                error: 'OpenRouter API quota exceeded',
                message: 'Please check your OpenRouter API billing and quota limits'
            });
        }
        
        if (error.code === 'invalid_api_key') {
            return res.status(401).json({
                success: false,
                error: 'Invalid OpenRouter API key',
                message: 'Please check your OpenRouter API key configuration'
            });
        }
        
        if (error.code === 'rate_limit_exceeded') {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: 'Too many requests to OpenRouter API, please try again later'
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
        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(503).json({
                success: false,
                status: 'unhealthy',
                error: 'OpenRouter API key not configured',
                timestamp: new Date().toISOString()
            });
        }

        // Test OpenRouter connection with a simple request
        const testCompletion = await openai.chat.completions.create({
            model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 5
        });

        res.json({
            success: true,
            status: 'healthy',
            openrouter: {
                connected: true,
                model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
                lastTest: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('AI health check failed:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            openrouter: {
                connected: false,
                error: error.message
            },
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
