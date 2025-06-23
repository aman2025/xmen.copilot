import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Saves a new ClineMessage to the database for a given chat session
export async function POST(request, { params }) {
  const { chatId } = params

  if (!chatId) {
    return new Response(JSON.stringify({ error: 'Chat ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const clineMessageData = await request.json()

    // Validate clineMessageData (basic validation)
    if (
      !clineMessageData ||
      typeof clineMessageData.ts !== 'number' ||
      !clineMessageData.type ||
      !clineMessageData.subType ||
      typeof clineMessageData.text !== 'string'
    ) {
      return new Response(JSON.stringify({ error: 'Invalid ClineMessage payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const savedClineMessage = await prisma.clineMessage.create({
      data: {
        chatSessionId: chatId,
        ts: BigInt(clineMessageData.ts), // Ensure ts is BigInt
        type: clineMessageData.type,
        subType: clineMessageData.subType,
        text: clineMessageData.text,
        role: clineMessageData.role || null // Store the role if provided
      }
    })

    // Update ChatSession's updatedAt timestamp
    await prisma.chatSession.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    })

    // Convert BigInt to string for JSON serialization
    const responseMessage = {
      ...savedClineMessage,
      ts: savedClineMessage.ts.toString()
    }

    return new Response(JSON.stringify(responseMessage), {
      status: 201, // 201 Created
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error(`Failed to save ClineMessage for chat ${chatId}:`, error)
    if (error.code === 'P2003') {
      // Foreign key constraint failed (chatId likely doesn't exist)
      return new Response(
        JSON.stringify({ error: 'Chat session not found for this ClineMessage' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    return new Response(
      JSON.stringify({ error: 'Failed to save ClineMessage', message: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
