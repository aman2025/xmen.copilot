import MistralClient from '@mistralai/mistralai'

/**
 * Preprocesses messages to ensure each tool call has a corresponding tool response
 * @param {Array} messages - Array of message objects
 * @returns {Array} - Processed messages
 */
const preprocessMessages = (messages) => {
  if (!messages || !Array.isArray(messages)) {
    return messages
  }

  console.log('Preprocessing messages for Mistral API...')

  // Create a deep copy of the messages to avoid modifying the original
  const processedMessages = JSON.parse(JSON.stringify(messages))

  // Maps to track tool calls and responses
  const toolCallMap = new Map()
  const toolResponseMap = new Map()

  // First pass: identify all tool calls and responses
  for (let i = 0; i < processedMessages.length; i++) {
    const message = processedMessages[i]

    // Track tool calls
    if (message.role === 'assistant' && message.tool_calls && Array.isArray(message.tool_calls)) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.id) {
          toolCallMap.set(toolCall.id, {
            index: i,
            toolCall,
            hasResponse: false
          })
        }
      }
    }

    // Track tool responses
    if (message.role === 'tool' && message.tool_call_id) {
      toolResponseMap.set(message.tool_call_id, {
        index: i,
        response: message
      })

      // Mark the corresponding tool call as having a response
      const toolCallInfo = toolCallMap.get(message.tool_call_id)
      if (toolCallInfo) {
        toolCallInfo.hasResponse = true
      }
    }
  }

  // Second pass: add missing tool responses
  const insertions = []

  for (const [id, info] of toolCallMap.entries()) {
    if (!info.hasResponse) {
      console.log(`Adding missing tool response for tool call ID: ${id}`)

      // Create a dummy tool response
      const dummyResponse = {
        role: 'tool',
        tool_call_id: id,
        content: JSON.stringify({ status: 'success', message: 'Tool executed successfully' })
      }

      // Store the insertion (index and response)
      // We'll insert after the assistant message containing the tool call
      insertions.push({
        index: info.index + 1,
        response: dummyResponse
      })
    }
  }

  // Apply insertions (in reverse order to avoid index shifting)
  insertions.sort((a, b) => b.index - a.index)

  for (const insertion of insertions) {
    processedMessages.splice(insertion.index, 0, insertion.response)
  }

  // Log the changes
  if (insertions.length > 0) {
    console.log(`Added ${insertions.length} missing tool responses`)
  } else {
    console.log('No missing tool responses found')
  }

  return processedMessages
}

/**
 * Creates a chat completion using Mistral AI API
 * @param {Array} messages - Array of message objects with role and content
 * @param {Array} tools - Array of tool objects
 * @returns {Promise<Object>} - Mistral API response
 */
export const createMistral = async (messages, tools) => {
  const client = new MistralClient(process.env.MISTRAL_API_KEY)

  // Preprocess messages to ensure each tool call has a corresponding tool response
  const processedMessages = preprocessMessages(messages)

  try {
    const response = await client.chat({
      model: 'mistral-large-latest',
      messages: processedMessages,
      tools,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    })

    return response
  } catch (error) {
    console.error('Error in Mistral API call:', error)

    // If the error is related to tool calls and responses, try again with a simplified conversation
    if (
      error.message &&
      error.message.includes('Not the same number of function calls and responses')
    ) {
      console.warn('Tool call/response mismatch detected. Retrying with simplified conversation...')

      // Create a simplified conversation with just the system message and the last user message
      const simplifiedMessages = processedMessages.filter(
        (msg) => msg.role === 'system' || (msg.role === 'user' && !msg.content.includes('tool'))
      )

      // Add the last user message if it doesn't exist
      if (!simplifiedMessages.some((msg) => msg.role === 'user')) {
        simplifiedMessages.push({
          role: 'user',
          content: 'Please continue with what you were explaining.'
        })
      }

      console.log('Retrying with simplified messages:', simplifiedMessages)

      const fallbackResponse = await client.chat({
        model: 'mistral-large-latest',
        messages: simplifiedMessages,
        tools,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      })

      return fallbackResponse
    }

    // Re-throw the error if it's not related to tool calls
    throw error
  }
}

export const formatMistralResponse = async (response) => {
  const message = response.choices[0].message
  return message
}
