import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(request, { params }) {
  try {
    const chatId = params.chatId

    if (!chatId) {
      return new Response(JSON.stringify({ error: 'Chat ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Prisma's `onDelete: Cascade` in the schema for ApiMessage and ClineMessage
    // should handle the deletion of related messages when a ChatSession is deleted.
    // If you want to be explicit or if cascade is not working as expected:
    /*
    await prisma.$transaction(async (tx) => {
      await tx.apiMessage.deleteMany({
        where: { chatSessionId: chatId },
      });
      await tx.clineMessage.deleteMany({
        where: { chatSessionId: chatId },
      });
      await tx.chatSession.delete({
        where: { id: chatId },
      });
    });
    */

    // Relying on onDelete: Cascade
    await prisma.chatSession.delete({
      where: {
        id: chatId
      }
    })

    return new Response(JSON.stringify({ message: 'Chat session deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to delete chat session:', error)
    if (error.code === 'P2025') {
      // Prisma error code for record not found
      return new Response(JSON.stringify({ error: 'Chat session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify({ error: 'Failed to delete chat session' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
