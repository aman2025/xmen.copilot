import { PrismaClient } from '@prisma/client'
import { SYSTEM_PROMPT } from '@/prompts'
import { INSTANCE_TOOLS } from '@/prompts/tools/instance'
import { createMistral, formatMistralResponse } from '@/utils/ai-sdk/mistral'
import ContextManager from '@/core/context/context-management/ContextManager'

const prisma = new PrismaClient()
const contextManager = new ContextManager()

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
      clineMessages: chatSession.clineMessages.map(message => ({
        ...message,
        ts: message.ts ? message.ts.toString() : null // Convert BigInt to string
      }))
    }

    return new Response(JSON.stringify(serializableChatSession), { // Returns the whole session including messages
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

  if (!chatId) {
    return new Response(JSON.stringify({ error: 'Chat ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await request.json()
    const incomingMessage = body.message

    if (!incomingMessage || !incomingMessage.role || (incomingMessage.role !== 'tool' && !incomingMessage.content)) {
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
          role: incomingMessage.role,
          content: incomingMessage.content,
          tool_call_id: incomingMessage.tool_call_id,
          name: incomingMessage.name,
        }
      })

      // 2. If it's a user message, create a corresponding ClineMessage
      if (incomingMessage.role === 'user') {
        await tx.clineMessage.create({
          data: {
            chatSessionId: chatId,
            ts: BigInt(Date.now()),
            type: 'say',
            subType: 'text',
            text: incomingMessage.content
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
      ...currentApiMessages.map(dbMsg => {
        const messageOutput = {
          role: dbMsg.role,
          content: (dbMsg.content === null || typeof dbMsg.content === 'undefined')
                   ? (dbMsg.role === 'assistant' && dbMsg.tool_calls && dbMsg.tool_calls.length > 0 ? null : String(dbMsg.content || ""))
                   : String(dbMsg.content)
        };
        if (dbMsg.role === 'assistant') {
          if (dbMsg.tool_calls && Array.isArray(dbMsg.tool_calls) && dbMsg.tool_calls.length > 0) {
            messageOutput.tool_calls = dbMsg.tool_calls;
          }
        } else if (dbMsg.role === 'tool') {
          messageOutput.tool_call_id = dbMsg.tool_call_id;
          if (dbMsg.name) {
            messageOutput.name = dbMsg.name;
          }
          messageOutput.content = typeof dbMsg.content === 'string' ? dbMsg.content : JSON.stringify(dbMsg.content);
        }
        return messageOutput;
      })
    ]
    
    const optimizedMessages = contextManager.getUpdatedContextMessages(messagesForAI)

    // --- Call Mistral AI (outside of a transaction) ---
    let aiRawResponse
    try {
      const mistralResponse = await createMistral(optimizedMessages, INSTANCE_TOOLS)
      aiRawResponse = await formatMistralResponse(mistralResponse)
    } catch (aiError) {
      console.error('Error calling Mistral API:', aiError)
      throw new Error(`AI API Error: ${aiError.message}`);
    }

    // --- Save the AI's ApiMessage (separate operation) ---
    const assistantApiMessage = await prisma.apiMessage.create({
      data: {
        chatSessionId: chatId,
        role: aiRawResponse.role || 'assistant',
        content: aiRawResponse.content,
        tool_calls: aiRawResponse.tool_calls || undefined,
      }
    })
    
    return new Response(JSON.stringify(assistantApiMessage), { // Return the AI message
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error(`Failed to process message for chat ${chatId}:`, error)
    if (error.message && error.message.includes('Not the same number of function calls and responses')) {
        return new Response(JSON.stringify({ error: 'Tool call/response mismatch from AI', message: error.message }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
        });
    }
    // Check for Prisma-specific transaction errors, though the main one should be resolved
    if (error.code && error.code.startsWith('P')) { // Prisma error codes start with P
        return new Response(JSON.stringify({ error: 'Database operation failed', message: error.message, code: error.code }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
    return new Response(JSON.stringify({ error: 'Failed to process message', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
