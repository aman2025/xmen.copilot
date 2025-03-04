import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(request, { params }) {
  try {
    const chatId = params.chatId

    // Delete the chat and all related messages in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all messages first
      await tx.message.deleteMany({
        where: {
          chatId: chatId
        }
      })

      // Then delete the chat
      await tx.chat.delete({
        where: {
          id: chatId
        }
      })
    })

    return new Response(JSON.stringify({ message: 'Chat deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to delete chat:', error)
    return new Response(JSON.stringify({ error: 'Failed to delete chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
