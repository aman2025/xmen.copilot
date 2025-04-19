import { SYSTEM_PROMPT } from '@/prompts'
import { createMistral, formatMistralResponse } from '@/utils/ai-sdk/mistral'
import ContextManager from '@/core/context/context-management/ContextManager'

export async function POST(request) {
  try {
    const body = await request.json()
    const { messages } = body

    // Initialize ContextManager
    const contextManager = new ContextManager()

    // Prepare messages for AI with system prompt
    const formattedMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...(messages || [])]

    // Apply context optimizations
    const optimizedMessages = contextManager.getUpdatedContextMessages(formattedMessages)

    // Get AI response
    const mistralResponse = await createMistral(optimizedMessages)
    const { content, type, metadata } = await formatMistralResponse(mistralResponse)

    // Create response object
    const response = {
      id: `response-${Date.now()}`,
      content,
      type: type || 'say',
      metadata: metadata || {},
      createdAt: new Date().toISOString()
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to process message:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process message',
        message: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
