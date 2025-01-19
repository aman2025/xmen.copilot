import { PrismaClient } from '@prisma/client'
import { INSTANCE_TOOLS, LOG_TOOLS, SYSTEM_PROMPT } from '@/prompts'

const prisma = new PrismaClient()

export async function POST(req) {
  const { prompt, chatId } = await req.json()
  const apiKey = process.env.MISTRAL_API_KEY

  // Store user message
  try {
    await prisma.message.create({
      data: {
        content: prompt,
        role: 'user',
        chatId: chatId,
      },
    })
  } catch (error) {
    console.error('Failed to store user message:', error)
  }

  // Define the all tools
  const tools = [...INSTANCE_TOOLS, ...LOG_TOOLS]

  // Define messages with the user's prompt
  const messages = [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: prompt,
    },
  ]

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Mistral API key is missing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: messages,
        tools: tools,
        tool_choice: 'auto', // Let the model decide whether to use tools
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Mistral API error:', errorData)
      return new Response(JSON.stringify({ error: 'Failed to generate content' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()

    // Check if the model wants to use a tool
    if (data.choices[0].message.tool_calls) {
      const toolCall = data.choices[0].message.tool_calls[0]
      // Here you would implement the actual weather fetching logic
      // For now, we'll just return the tool call details
      return new Response(
        JSON.stringify({
          toolCall: toolCall,
          message: 'Tool call requested',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // If no tool call, return the regular response
    const generatedText = data.choices[0].message.content
    await prisma.message.create({
      data: {
        content: generatedText,
        role: 'assistant',
        chatId: chatId,
      },
    })

    return new Response(JSON.stringify({ response: generatedText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error calling Mistral API:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
