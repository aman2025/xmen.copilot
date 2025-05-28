import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Creates a new chat session
export async function POST(request) {
  try {
    const body = await request.json()
    const { title } = body

    // Create a new chat session
    const chatSession = await prisma.chatSession.create({
      data: {
        title: title || 'New Chat' // Default title if not provided
      }
    })

    return new Response(
      JSON.stringify({
        chatId: chatSession.id,
        title: chatSession.title,
        createdAt: chatSession.createdAt
      }),
      {
        status: 201, // 201 Created
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Failed to create chat session:', error)
    return new Response(JSON.stringify({ error: 'Failed to create chat session' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Gets all chat sessions
export async function GET() {
  try {
    const chatSessions = await prisma.chatSession.findMany({
      orderBy: {
        updatedAt: 'desc' // Order by most recently updated
      },
      select: {
        // Select only necessary fields for the history list
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true
        // Optionally, include a snippet of the last message or message count
      }
    })

    return new Response(JSON.stringify({ chats: chatSessions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to fetch chat sessions:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch chat sessions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
