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
export async function GET() {
  try {
    const chats = await prisma.chat.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return new Response(JSON.stringify({ chats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Failed to fetch chats:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch chats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}