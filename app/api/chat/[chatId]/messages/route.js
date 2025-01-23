import { PrismaClient } from '@prisma/client'
import { INSTANCE_TOOLS, LOG_TOOLS, SYSTEM_PROMPT } from '@/prompts'
import { createMistral, formatMistralResponse } from '@/utils/ai-sdk/mistral'
const prisma = new PrismaClient()

export async function GET(request, { params }) {
  const { chatId } = params

  try {
    // Verify the chat exists
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!chat) {
      return new Response(JSON.stringify({ error: 'Chat not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ messages: chat.messages }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function POST(request, { params }) {
  const { chatId } = params

  try {
    const body = await request.json()
    const { content, role } = body

    // Verify the chat exists
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    })

    if (!chat) {
      return new Response(JSON.stringify({ error: 'Chat not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create the user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        role,
        chatId,
      },
    })

    // If it's a user message, generate AI response
    if (role === 'user') {
      // Call Mistral API
      const tools = [...INSTANCE_TOOLS, ...LOG_TOOLS]
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ]

      const mistralResponse = await createMistral(messages, tools)
      const { content: aiContent, toolCalls } = await formatMistralResponse(mistralResponse)
      console.log('aiContent:', aiContent)
      console.log('toolCalls:', toolCalls)

      // Create the assistant message
      const assistantMessage = await prisma.message.create({
        data: {
          content: aiContent,
          role: 'assistant',
          chatId,
        },
      })

      return new Response(JSON.stringify({ messages: [userMessage, assistantMessage] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ message: userMessage }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Failed to process message:', error)
    return new Response(JSON.stringify({ error: 'Failed to process message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
