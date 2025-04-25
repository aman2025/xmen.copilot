import { SYSTEM_PROMPT } from '@/prompts'
import { INSTANCE_TOOLS } from '@/prompts/tools/instance'
import { createMistral, formatMistralResponse } from '@/utils/ai-sdk/mistral'
import ContextManager from '@/core/context/context-management/ContextManager'

export async function POST(request) {
  try {
    const body = await request.json()
    const { messages } = body

    console.log('Incoming messages to API:', messages)

    // Initialize ContextManager
    const contextManager = new ContextManager()

    // Prepare messages for AI with system prompt
    const formattedMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...(messages || [])]
    console.log('Formatted messages for AI:', formattedMessages)

    // Apply context optimizations
    const optimizedMessages = contextManager.getUpdatedContextMessages(formattedMessages)

    // Get AI response with tools
    const mistralResponse = await createMistral(optimizedMessages, INSTANCE_TOOLS)
    // const { rawMessage } = await formatMistralResponse(mistralResponse)

    console.log('Raw AI Response:', JSON.stringify(mistralResponse.choices[0].message))

    // Create response object with raw AI response
    const response = {
      id: `response-${Date.now()}`,
      raw_response: mistralResponse,
      createdAt: new Date().toISOString()
    }

    // Log response before sending
    console.log('API Response:', response)

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
