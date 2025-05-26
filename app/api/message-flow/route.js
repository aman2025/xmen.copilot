import { SYSTEM_PROMPT } from '@/prompts'
import { INSTANCE_TOOLS } from '@/prompts/tools/instance'
import { createMistral, formatMistralResponse } from '@/utils/ai-sdk/mistral'
import ContextManager from '@/core/context/context-management/ContextManager'

export async function POST(request) {
  try {
    const body = await request.json()
    const { messages } = body

    console.log('Incoming messages to API:', messages)

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format: messages must be an array')
    }

    // Validate tool calls and responses
    const toolCalls = new Map()
    const toolResponses = new Map()

    for (const message of messages) {
      // Track tool calls
      if (message.role === 'assistant' && message.tool_calls) {
        for (const toolCall of message.tool_calls) {
          if (toolCall.id) {
            toolCalls.set(toolCall.id, toolCall)
          }
        }
      }

      // Track tool responses
      if (message.role === 'tool' && message.tool_call_id) {
        toolResponses.set(message.tool_call_id, message)
      }
    }

    // Check for missing tool responses
    for (const [id] of toolCalls.entries()) {
      if (!toolResponses.has(id)) {
        console.warn(`Missing tool response for tool call ID: ${id}`)
      }
    }

    // Initialize ContextManager
    const contextManager = new ContextManager()

    // Prepare messages for AI with system prompt
    const formattedMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...(messages || [])]
    // console.log('Formatted messages for AI:', formattedMessages)

    // Apply context optimizations
    const optimizedMessages = contextManager.getUpdatedContextMessages(formattedMessages)

    // Get AI response with tools
    let response
    try {
      const mistralResponse = await createMistral(optimizedMessages, INSTANCE_TOOLS)
      response = await formatMistralResponse(mistralResponse)

      console.log('Raw AI Response:', JSON.stringify(response))

      // Check if the response contains tool calls
      if (response.tool_calls && response.tool_calls.length > 0) {
        console.log(`Response contains ${response.tool_calls.length} tool calls`)
      }
    } catch (error) {
      console.error('Error calling Mistral API:', error)
      throw error
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to process message:', error)

    // Check if the error is related to tool calls and responses
    if (
      error.message &&
      error.message.includes('Not the same number of function calls and responses')
    ) {
      console.error(
        'Tool call/response mismatch detected. This usually means there are tool calls without corresponding responses.'
      )

      // Return a more specific error message
      return new Response(
        JSON.stringify({
          error: 'Tool call/response mismatch',
          message:
            'There are tool calls without corresponding responses. Please check the conversation history.',
          originalError: error.message
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

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
