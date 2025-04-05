import { PrismaClient } from '@prisma/client'
import { formatMistralResponse, createMistral } from '@/utils/ai-sdk/mistral'
import { NextResponse } from 'next/server'
import { INSTANCE_TOOLS, SYSTEM_PROMPT } from '@/prompts'

const prisma = new PrismaClient()

// Get messages from a chat
export async function GET(request, { params }) {
  try {
    const { chatId } = params

    const messages = await prisma.message.findMany({
      where: {
        chatId: chatId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// Create a new message in a chat
export async function POST(request, { params }) {
  try {
    const { chatId } = params
    const { content, role, toolCallId } = await request.json()

    // Create the new message in the database
    const newMessage = await prisma.message.create({
      data: {
        content,
        role,
        toolCallId,
        chatId
      }
    })

    // If this is a user message, generate an AI response
    if (role === 'user') {
      // Get all messages for context
      const chatMessages = await prisma.message.findMany({
        where: {
          chatId
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      // Create a temporary loading message
      const loadingMessage = await prisma.message.create({
        data: {
          content: 'loading',
          role: 'assistant',
          chatId
        }
      })

      // Format messages for the AI
      const messageHistory = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...chatMessages.map((msg) => {
          return {
            role: msg.role,
            content: msg.content,
            toolCallId: msg.toolCallId || undefined
          }
        })
      ]

      // Get tools definition from system prompt
      const toolsMatch = SYSTEM_PROMPT.match(/<tools>([\s\S]*?)<\/tools>/)
      const toolsXml = toolsMatch ? toolsMatch[0] : ''

      // Generate an AI response
      try {
        const tools = [...INSTANCE_TOOLS]
        const response = await createMistral(messageHistory, tools)
        const formattedResponse = await formatMistralResponse(response)

        // Update the loading message with the actual response
        await prisma.message.update({
          where: {
            id: loadingMessage.id
          },
          data: {
            content: formattedResponse.content
            // No need to store toolCalls separately as they're now in the content
          }
        })

        return NextResponse.json({ message: newMessage })
      } catch (error) {
        console.error('Error generating AI response:', error)

        // Update loading message to indicate error
        await prisma.message.update({
          where: {
            id: loadingMessage.id
          },
          data: {
            content: 'Sorry, I encountered an error while generating a response. Please try again.'
          }
        })

        return NextResponse.json({ message: newMessage })
      }
    }

    return NextResponse.json({ message: newMessage })
  } catch (error) {
    console.error('Failed to create message:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}
