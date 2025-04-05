import { PrismaClient } from '@prisma/client'
import { INSTANCE_TOOLS, SYSTEM_PROMPT } from '@/prompts'
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
      const tools = [...INSTANCE_TOOLS]
      
      // For tool responses, find the corresponding assistant message with tool_calls
      let assistantToolCallId = toolCallId;
      
      // If it's a tool response with an XML-generated ID, find the actual tool call ID from the assistant message
      if (role === 'tool' && toolCallId && toolCallId.startsWith('xml_tool_')) {
        // Find the most recent assistant message with tool calls
        const assistantWithToolCalls = [...chat.messages]
          .reverse()
          .find(msg => msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0);
          
        if (assistantWithToolCalls && assistantWithToolCalls.toolCalls && assistantWithToolCalls.toolCalls.length > 0) {
          // Use the first tool call ID from the assistant message
          assistantToolCallId = assistantWithToolCalls.toolCalls[0].id;
        }
      }
      
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...chat.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          ...(msg.toolCallId && { tool_call_id: msg.toolCallId }),
          ...(msg.toolCalls && { tool_calls: msg.toolCalls })
        })),
        // For tool responses, include the tool response with the correct tool_call_id
        role === 'tool' ? { role, content, tool_call_id: assistantToolCallId } : { role, content }
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
