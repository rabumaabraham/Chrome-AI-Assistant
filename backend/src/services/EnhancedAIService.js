/**
 * Enhanced AI Service
 * Uses ContentProcessor for intelligent content handling
 */

const OpenAI = require('openai');
const config = require('../../config/index.js');
const ContentProcessor = require('./ContentProcessor');
const logger = require('./Logger');

class EnhancedAIService {
    constructor() {
        this.client = this.initializeClient();
        this.contentProcessor = new ContentProcessor();
        this.serviceLogger = logger.getServiceLogger('EnhancedAI');
    }

    initializeClient() {
        if (!config.ai.apiKey) {
            throw new Error('OpenRouter API key is required');
        }

        return new OpenAI({
            apiKey: config.ai.apiKey,
            baseURL: config.ai.baseUrl,
            defaultHeaders: {
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'SnapQuery'
            }
        });
    }

    /**
     * Generate enhanced AI response with intelligent content processing
     */
    async generateResponse(question, rawContext) {
        try {
            this.serviceLogger.info('Generating enhanced AI response', {
                questionLength: question.length,
                contextType: rawContext.isPdfViewer ? 'PDF' : 'Webpage',
                hasImages: !!(rawContext.images && rawContext.images.length > 0)
            });

            // Process content intelligently
            const processedContent = await this.contentProcessor.processContent(rawContext, question);

            // Build optimized prompts
            const systemPrompt = this.buildEnhancedSystemPrompt(processedContent);
            const userPrompt = this.buildEnhancedUserPrompt(question, processedContent);

            const response = await this.client.chat.completions.create({
                model: config.ai.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: config.ai.maxTokens,
                temperature: config.ai.temperature
            });

            const answer = response.choices[0]?.message?.content || 'No response generated';
            const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

            this.serviceLogger.info('Enhanced AI response generated', {
                responseLength: answer.length,
                tokensUsed: usage.total_tokens,
                model: config.ai.model,
                contentProcessed: !!processedContent.structured
            });

            return {
                success: true,
                answer,
                usage,
                processedContent: processedContent.metadata
            };

        } catch (error) {
            this.serviceLogger.error('Enhanced AI response generation failed', {
                error: error.message,
                questionLength: question.length,
                contextType: rawContext.isPdfViewer ? 'PDF' : 'Webpage'
            });

            return {
                success: false,
                error: 'Failed to generate enhanced AI response',
                details: error.message
            };
        }
    }

    /**
     * Build enhanced system prompt with processed content
     */
    buildEnhancedSystemPrompt(processedContent) {
        const { metadata, prioritized, summary } = processedContent;

        return `You are an expert AI assistant with access to intelligently processed content from the user's current webpage.

CONTENT METADATA:
- Page Type: ${metadata.type}
- Content Length: ${metadata.textLength} characters
- Has PDF: ${metadata.hasPdf}
- Has Images: ${metadata.hasImages} (${metadata.imageCount} images)
- Has OCR Text: ${metadata.hasOcr}

CONTENT SUMMARY:
- Main Topic: ${summary.mainTopic}
- Key Points: ${summary.keyPoints.join(', ')}
- Content Type: ${JSON.stringify(summary.contentType)}
- Important Sections: ${summary.importantSections.join(', ')}

PRIORITIZED CONTENT (in order of relevance):
${prioritized.map(item => `
${item.type} (Priority ${item.priority}): ${item.reason}
${item.content.substring(0, 2000)}${item.content.length > 2000 ? '...' : ''}
`).join('\n---\n')}

ANALYSIS GUIDELINES:
1. Use the prioritized content to focus on the most relevant information
2. Reference specific content types when relevant (PDF, OCR, etc.)
3. Provide structured answers based on the content summary
4. Quote exact text from the highest priority content
5. If the question is about data, focus on structured content
6. If the question is about images, prioritize OCR content
7. If the question is about documents, prioritize PDF content
8. Be specific about what type of content you're referencing
9. If content is unclear, mention which content type was unclear
10. Provide actionable insights based on the content structure

RESPONSE FORMAT:
- Start with the most relevant information
- Use the content type to provide context
- Quote specific text when helpful
- Reference the content structure when relevant
- Be concise but comprehensive`;
    }

    /**
     * Build enhanced user prompt with question context
     */
    buildEnhancedUserPrompt(question, processedContent) {
        const { relevant, summary } = processedContent;

        let prompt = `Question: ${question}`;

        if (relevant) {
            prompt += `\n\nRELEVANT CONTENT (extracted based on your question):\n${relevant}`;
        }

        if (summary.keyPoints.length > 0) {
            prompt += `\n\nKEY POINTS FROM PAGE:\n${summary.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}`;
        }

        prompt += `\n\nPlease provide a helpful answer based on the processed content above.`;

        return prompt;
    }

    /**
     * Generate content-specific response
     */
    async generateContentSpecificResponse(question, processedContent, contentType) {
        const contentSpecificPrompts = {
            PDF: this.buildPDFPrompt(question, processedContent),
            IMAGE: this.buildImagePrompt(question, processedContent),
            TABLE: this.buildTablePrompt(question, processedContent),
            FORM: this.buildFormPrompt(question, processedContent),
            ARTICLE: this.buildArticlePrompt(question, processedContent)
        };

        const specificPrompt = contentSpecificPrompts[contentType] || this.buildEnhancedUserPrompt(question, processedContent);

        const response = await this.client.chat.completions.create({
            model: config.ai.model,
            messages: [
                { role: 'system', content: this.buildEnhancedSystemPrompt(processedContent) },
                { role: 'user', content: specificPrompt }
            ],
            max_tokens: config.ai.maxTokens,
            temperature: config.ai.temperature
        });

        return response.choices[0]?.message?.content || 'No response generated';
    }

    /**
     * Build PDF-specific prompt
     */
    buildPDFPrompt(question, processedContent) {
        return `PDF Document Analysis Question: ${question}

The content above is from a PDF document. Please:
1. Focus specifically on the PDF content
2. Reference page sections or document structure when relevant
3. Quote specific text from the document
4. Provide document-specific insights
5. If the question is about document structure, use the headings and sections

Question: ${question}`;
    }

    /**
     * Build image-specific prompt
     */
    buildImagePrompt(question, processedContent) {
        return `Image Analysis Question: ${question}

The content above includes images with OCR text extraction. Please:
1. Focus on the visual content and extracted text
2. Describe what you can see in the images
3. Use the OCR text to provide specific details
4. Reference image context and positioning
5. If asked about text in images, use the extracted OCR content

Question: ${question}`;
    }

    /**
     * Build table-specific prompt
     */
    buildTablePrompt(question, processedContent) {
        return `Data Analysis Question: ${question}

The content above may contain tabular data. Please:
1. Focus on numerical and structured data
2. Extract specific values from tables
3. Provide data comparisons and insights
4. Reference table headers and structure
5. If asked about specific data points, provide exact values

Question: ${question}`;
    }

    /**
     * Build form-specific prompt
     */
    buildFormPrompt(question, processedContent) {
        return `Form Analysis Question: ${question}

The content above may contain form elements. Please:
1. Focus on input fields and form structure
2. Describe form fields and their purposes
3. Reference form actions and methods
4. Provide form-specific guidance
5. If asked about form functionality, explain the form structure

Question: ${question}`;
    }

    /**
     * Build article-specific prompt
     */
    buildArticlePrompt(question, processedContent) {
        return `Article Analysis Question: ${question}

The content above is from a structured article or webpage. Please:
1. Focus on the main content and structure
2. Use headings and sections to organize your response
3. Reference specific sections when relevant
4. Provide comprehensive analysis of the content
5. If asked about specific topics, reference the relevant sections

Question: ${question}`;
    }
}

module.exports = EnhancedAIService;
