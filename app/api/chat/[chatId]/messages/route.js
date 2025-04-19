import { PrismaClient } from '@prisma/client'
import { SYSTEM_PROMPT } from '@/prompts'
import { createMistral, formatMistralResponse } from '@/utils/ai-sdk/mistral'
import Task from '@/core/task'
import { ContextManager } from '@/core/context/context-management/ContextManager'

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  const { chatId } = params

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!chat) {
      return new Response(JSON.stringify({ error: 'Chat not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ messages: chat.messages }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function POST(request, { params }) {
  const { chatId } = params

  try {
    const body = await request.json()
    const { content, role, messageType } = body

    // Verify the chat exists and get previous messages
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!chat) {
      return new Response(JSON.stringify({ error: 'Chat not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create the user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        role,
        chatId
      }
    })

    // If it's a user message, generate AI response using our Task architecture
    if (role === 'user') {
      // Initialize Task and ContextManager
      const task = new Task()
      const contextManager = new ContextManager()

      // Prepare messages for AI
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...chat.messages.map((msg) => ({
          role: msg.role,
          content: msg.content
        })),
        { role, content }
      ]

      // Apply context optimizations
      const optimizedMessages = contextManager.getUpdatedContextMessages(messages)

      // Get AI response
      const mistralResponse = await createMistral(optimizedMessages)
      const { content: aiContent } = await formatMistralResponse(mistralResponse)

      // Parse the response to determine message type
      let messageType = 'say'
      let metadata = {}

      // Check for specific patterns in the response
      if (aiContent.includes('?') && aiContent.toLowerCase().includes('would you like')) {
        messageType = 'ask'
      } else if (aiContent.includes('```') && aiContent.includes('```')) {
        messageType = 'tool'
        metadata = { tool: 'code', language: 'javascript' } // Default, could be more sophisticated
      }

      // Create the assistant message
      const assistantMessage = await prisma.message.create({
        data: {
          content: aiContent,
          role: 'assistant',
          toolCalls: metadata && Object.keys(metadata).length > 0 ? metadata : null,
          chatId
        }
      })

      return new Response(
        JSON.stringify({
          messages: [assistantMessage],
          messageType,
          metadata
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(JSON.stringify({ messages: [userMessage] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to process message:', error)
    return new Response(JSON.stringify({ error: 'Failed to process message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
