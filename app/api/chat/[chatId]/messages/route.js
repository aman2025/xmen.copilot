import { PrismaClient } from '@prisma/client'
import { SYSTEM_PROMPT } from '@/prompts'
import { INSTANCE_TOOLS } from '@/prompts/tools/instance'
import {
  createMistral,
  formatMistralResponse,
  createMistralStream,
  processStreamChunk,
  accumulateStreamChunks
} from '@/utils/ai-sdk/mistral'
import ContextManager from '@/core/context/context-management/ContextManager'
import EnvironmentContextManager from '@/core/context/EnvironmentContextManager'

const prisma = new PrismaClient()
const contextManager = new ContextManager()
const environmentContextManager = new EnvironmentContextManager()

// Fetches all messages (API and Cline) for a chat session
export async function GET(request, { params }) {
  const { chatId } = params

  if (!chatId) {
    return new Response(JSON.stringify({ error: 'Chat ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: chatId },
      include: {
        apiMessages: {
          orderBy: {
            timestamp: 'asc'
          }
        },
        clineMessages: {
          orderBy: {
            ts: 'asc' // Order by original timestamp
          }
        }
      }
    })

    if (!chatSession) {
      return new Response(JSON.stringify({ error: 'Chat session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Convert BigInt timestamps in clineMessages to strings for JSON serialization
    const serializableChatSession = {
      ...chatSession,
      clineMessages: chatSession.clineMessages.map((message) => ({
        ...message,
        ts: message.ts ? message.ts.toString() : null // Convert BigInt to string
      }))
    }

    return new Response(JSON.stringify(serializableChatSession), {
      // Returns the whole session including messages
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to fetch messages for chat session:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Handles a new message from the user, gets AI response, and saves messages
export async function POST(request, { params }) {
  const { chatId } = params
  const url = new URL(request.url)
  const stream = url.searchParams.get('stream') === 'true'

  try {
    const { message } = await request.json()

    // Log the incoming message to verify it has the proper formatting
    console.log('Received message in API route:', message)

    if (!message || !message.role || (message.role !== 'tool' && !message.content)) {
      return new Response(JSON.stringify({ error: 'Invalid message payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // --- First Transaction: Save incoming message and update session ---
    await prisma.$transaction(async (tx) => {
      // 1. Save the incoming (user or tool) ApiMessage
      await tx.apiMessage.create({
        data: {
          chatSessionId: chatId,
          role: message.role,
          content: message.content,
          tool_call_id: message.tool_call_id,
          name: message.name
        }
      })

      // 2. If it's a user message, create a corresponding ClineMessage
      if (message.role === 'user') {
        await tx.clineMessage.create({
          data: {
            chatSessionId: chatId,
            ts: BigInt(Date.now()),
            type: 'say',
            subType: 'text',
            text: message.content,
            role: 'user' // Explicitly set role for user messages
          }
        })
      }

      // 3. Update ChatSession's updatedAt timestamp
      await tx.chatSession.update({
        where: { id: chatId },
        data: { updatedAt: new Date() }
      })
    })

    // --- Fetch messages for AI (outside of a transaction) ---
    const currentApiMessages = await prisma.apiMessage.findMany({
      where: { chatSessionId: chatId },
      orderBy: { timestamp: 'asc' }
    })

    // --- Prepare messages for AI ---
    const messagesForAI = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...currentApiMessages.map((dbMsg) => {
        // Log each message from the database to verify formatting
        console.log('Message from DB:', dbMsg.role, dbMsg.content?.substring(0, 50))

        const messageOutput = {
          role: dbMsg.role,
          content:
            dbMsg.content === null || typeof dbMsg.content === 'undefined'
              ? dbMsg.role === 'assistant' && dbMsg.tool_calls && dbMsg.tool_calls.length > 0
                ? null
                : String(dbMsg.content || '')
              : String(dbMsg.content)
        }
        if (dbMsg.role === 'assistant') {
          if (dbMsg.tool_calls && Array.isArray(dbMsg.tool_calls) && dbMsg.tool_calls.length > 0) {
            messageOutput.tool_calls = dbMsg.tool_calls
          }
        } else if (dbMsg.role === 'tool') {
          messageOutput.tool_call_id = dbMsg.tool_call_id
          if (dbMsg.name) {
            messageOutput.name = dbMsg.name
          }

          // Ensure tool messages always include environment context
          let toolContent =
            typeof dbMsg.content === 'string' ? dbMsg.content : JSON.stringify(dbMsg.content)

          // Check if content already has environment details
          if (!toolContent.includes('<environment_details>')) {
            // Extract result content if it's wrapped in <result> tags
            const resultMatch = toolContent.match(/<result>(.*?)<\/result>/s)
            const resultContent = resultMatch ? resultMatch[1] : toolContent

            // Enhance with environment context
            toolContent = environmentContextManager.enhanceToolResult(
              resultContent,
              dbMsg.name || 'unknown_tool',
              { chatId: chatId }
            )
          }

          messageOutput.content = toolContent
        }
        return messageOutput
      })
    ]

    const optimizedMessages = contextManager.getUpdatedContextMessages(messagesForAI)
    // Log the optimized messages to see if formatting is preserved
    console.log(
      'Optimized messages:',
      optimizedMessages.map((m) => ({ role: m.role, content: m.content?.substring(0, 50) }))
    )
    // --- Call Mistral AI (outside of a transaction) ---
    if (stream) {
      // Handle streaming response
      return handleStreamingResponse(chatId, optimizedMessages, INSTANCE_TOOLS)
    } else {
      // Handle non-streaming response (existing logic)
      let aiRawResponse
      try {
        const mistralResponse = await createMistral(optimizedMessages, INSTANCE_TOOLS)
        aiRawResponse = await formatMistralResponse(mistralResponse)
      } catch (aiError) {
        console.error('Error calling Mistral API:', aiError)
        throw new Error(`AI API Error: ${aiError.message}`)
      }

      // --- Save the AI's ApiMessage (separate operation) ---
      const assistantApiMessage = await prisma.apiMessage.create({
        data: {
          chatSessionId: chatId,
          role: aiRawResponse.role || 'assistant',
          content: aiRawResponse.content,
          tool_calls: aiRawResponse.tool_calls || undefined
        }
      })

      return new Response(JSON.stringify(assistantApiMessage), {
        // Return the AI message
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error(`Failed to process message for chat ${chatId}:`, error)
    if (
      error.message &&
      error.message.includes('Not the same number of function calls and responses')
    ) {
      return new Response(
        JSON.stringify({ error: 'Tool call/response mismatch from AI', message: error.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    // Check for Prisma-specific transaction errors, though the main one should be resolved
    if (error.code && error.code.startsWith('P')) {
      // Prisma error codes start with P
      return new Response(
        JSON.stringify({
          error: 'Database operation failed',
          message: error.message,
          code: error.code
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    return new Response(
      JSON.stringify({ error: 'Failed to process message', message: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Handles streaming response from Mistral AI
 * @param {string} chatId - Chat session ID
 * @param {Array} messages - Optimized messages for AI
 * @param {Array} tools - Available tools
 * @returns {Response} - Streaming response
 */
async function handleStreamingResponse(chatId, messages, tools) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const mistralStream = await createMistralStream(messages, tools)
        const chunks = []
        let accumulatedContent = ''
        let accumulatedToolCalls = []

        // Generate unique streaming ID
        const streamingId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Send initial streaming start event
        const startEvent = {
          type: 'stream_start',
          streamingId,
          timestamp: Date.now()
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(startEvent)}\n\n`))

        // Process the async iterator from Mistral
        for await (const chunk of mistralStream) {
          console.log('Raw Mistral chunk:', chunk)
          const processedChunk = processStreamChunk(chunk)

          if (processedChunk) {
            chunks.push(processedChunk)
            console.log('Processed chunk:', processedChunk)

            if (processedChunk.type === 'content') {
              accumulatedContent += processedChunk.content

              // Send content chunk to client
              const contentEvent = {
                type: 'content_chunk',
                streamingId,
                content: processedChunk.content,
                accumulatedContent,
                timestamp: Date.now()
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(contentEvent)}\n\n`))
            } else if (processedChunk.type === 'tool_calls') {
              accumulatedToolCalls = processedChunk.tool_calls

              // Send tool calls chunk to client
              const toolEvent = {
                type: 'tool_calls_chunk',
                streamingId,
                tool_calls: processedChunk.tool_calls,
                timestamp: Date.now()
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(toolEvent)}\n\n`))
            } else if (processedChunk.type === 'finish') {
              // Stream finished, accumulate final message
              const finalMessage = accumulateStreamChunks(chunks)

              // Save the final AI message to database
              const assistantApiMessage = await prisma.apiMessage.create({
                data: {
                  chatSessionId: chatId,
                  role: finalMessage.role || 'assistant',
                  content: finalMessage.content || accumulatedContent,
                  tool_calls:
                    finalMessage.tool_calls ||
                    (accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined)
                }
              })

              // Send final completion event
              const completeEvent = {
                type: 'stream_complete',
                streamingId,
                finalMessage: assistantApiMessage,
                finish_reason: processedChunk.finish_reason,
                timestamp: Date.now()
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`))
              controller.close()
              return
            }
          }
        }

        // This block is now a fallback for streams that end without a 'finish' event.
        if (chunks.length > 0) {
          const finalMessage = accumulateStreamChunks(chunks)

          // Save the final AI message to database if not already saved
          const assistantApiMessage = await prisma.apiMessage.create({
            data: {
              chatSessionId: chatId,
              role: finalMessage.role || 'assistant',
              content: finalMessage.content || accumulatedContent,
              tool_calls:
                finalMessage.tool_calls ||
                (accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined)
            }
          })

          // Send final completion event
          const completeEvent = {
            type: 'stream_complete',
            streamingId,
            finalMessage: assistantApiMessage,
            finish_reason: 'stop',
            timestamp: Date.now()
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`))
        }

        controller.close()
      } catch (error) {
        console.error('Error in streaming response:', error)

        // Send error event
        const errorEvent = {
          type: 'stream_error',
          error: error.message,
          timestamp: Date.now()
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
