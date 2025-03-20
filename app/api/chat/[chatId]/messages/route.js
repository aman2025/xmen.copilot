import { PrismaClient } from '@prisma/client'
import { INSTANCE_TOOLS, LOG_TOOLS, SYSTEM_PROMPT } from '@/prompts'
import { evaluator } from '@/agent'
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
    const lastMessage = chat.messages[chat.messages.length - 1]

    // Only verify if last message is from assistant and has tool calls
    if (lastMessage.role === 'assistant' && lastMessage.toolCalls?.length > 0) {
      // Create concise messages array
      const conciseMessages = chat.messages.map((msg) => {
        const conciseMsg = {
          role: msg.role,
          content: msg.content,
          toolCalls: msg.toolCalls,
          toolCallId: msg.toolCallId
        }

        // Simplify tool response content
        if (msg.role === 'tool') {
          try {
            const parsedContent = JSON.parse(msg.content)
            conciseMsg.content = JSON.stringify({
              success: parsedContent.success,
              ...(parsedContent.error && { error: parsedContent.error })
            })
          } catch (e) {
            conciseMsg.content = msg.content
          }
        }

        return conciseMsg
      })
      console.log('---------1-conciseMessages:', conciseMessages)

      const evalResult = await evaluator(lastMessage, conciseMessages)
      console.log('---------5-evalResult-route:', evalResult)

      // If verification failed, store and return the corrected response
      if (!evalResult.isCorrect) {
        console.log('--------11-isCorrect: ', evalResult.isCorrect)

        // Update the last message in the database with the corrected content
        const updatedMessage = await prisma.message.update({
          where: { id: lastMessage.id },
          data: {
            content: evalResult.message.content,
            toolCalls: evalResult.message.toolCalls
          }
        })

        return new Response(
          JSON.stringify({
            messages: [...chat.messages.slice(0, -1), updatedMessage]
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
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
    const { content, role, toolCallId } = body

    // Verify the chat exists and get previous messages for context
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

    // Create the message with optional tool call fields
    const newMessage = await prisma.message.create({
      data: {
        content,
        role,
        toolCallId,
        chatId
      }
    })

    // If it's a user message or tool response, generate AI response
    if (role === 'user' || role === 'tool') {
      // Prepare context with all previous messages
      const tools = [...INSTANCE_TOOLS, ...LOG_TOOLS]
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...chat.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          ...(msg.toolCallId && { tool_call_id: msg.toolCallId }),
          ...(msg.toolCalls && { tool_calls: msg.toolCalls })
        })),
        // For tool responses, include the tool response with its tool_call_id
        role === 'tool' ? { role, content, tool_call_id: toolCallId } : { role, content }
      ]

      const mistralResponse = await createMistral(messages, tools)
      const { content: aiContent, toolCalls } = await formatMistralResponse(mistralResponse)

      // Create the assistant message with tool_calls
      const assistantMessage = await prisma.message.create({
        data: {
          content: aiContent,
          role: 'assistant',
          toolCalls: toolCalls.length ? toolCalls : undefined,
          chatId
        }
      })

      return new Response(JSON.stringify({ messages: [assistantMessage] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ messages: [newMessage] }), {
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
