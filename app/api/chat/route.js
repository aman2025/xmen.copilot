import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST() {
  try {
    // Create a new chat
    const chat = await prisma.chat.create({
      data: {},
    })
    
    return new Response(JSON.stringify({ chatId: chat.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Failed to create chat:', error)
    return new Response(JSON.stringify({ error: 'Failed to create chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Get chat history
export async function GET(req) {
  const searchParams = req.nextUrl.searchParams
  const chatId = searchParams.get('chatId')

  if (!chatId) {
    return new Response(JSON.stringify({ error: 'Chat ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        chatId: chatId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return new Response(JSON.stringify({ messages }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Failed to fetch chat messages:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch chat messages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}