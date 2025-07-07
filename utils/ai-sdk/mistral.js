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
  let processedMessages = JSON.parse(JSON.stringify(messages))

  // First, remove duplicate assistant messages with the same tool_call ID
  const seenToolCallIds = new Set()
  processedMessages = processedMessages.filter((message, index) => {
    if (message.role === 'assistant' && message.tool_calls && Array.isArray(message.tool_calls)) {
      // For each tool_call in the message
      for (const toolCall of message.tool_calls) {
        if (toolCall.id) {
          if (seenToolCallIds.has(toolCall.id)) {
            // We've seen this tool_call ID before, so filter out this message
            console.log(`Removing duplicate assistant message with tool_call ID: ${toolCall.id}`)
            return false
          }
          seenToolCallIds.add(toolCall.id)
        }
      }
    }
    return true
  })

  // Clean tool_calls in assistant messages
  for (const message of processedMessages) {
    if (message.role === 'assistant' && message.tool_calls && Array.isArray(message.tool_calls)) {
      const cleanedToolCalls = []
      for (const toolCall of message.tool_calls) {
        if (
          toolCall.id &&
          toolCall.function &&
          typeof toolCall.function.name === 'string' &&
          toolCall.function.arguments !== undefined
        ) {
          // Ensure arguments are stringified, as required by the Mistral API.
          const stringifiedArguments =
            typeof toolCall.function.arguments === 'string'
              ? toolCall.function.arguments
              : JSON.stringify(toolCall.function.arguments)

          cleanedToolCalls.push({
            id: toolCall.id,
            type: 'function', // Standard type for tool calls
            function: {
              name: toolCall.function.name,
              arguments: stringifiedArguments // Use stringified arguments
            }
          })
        } else {
          console.warn(
            'Encountered a potentially malformed tool_call during preprocessing:',
            toolCall
          )
        }
      }
      message.tool_calls = cleanedToolCalls
    }
  }

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
        content: JSON.stringify({
          status: 'missing_tool_execution',
          message: 'Tool execution was expected but not found in history.'
        })
      }

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

  return processedMessages
}

/**
 * Creates a streaming chat completion using Mistral AI API
 * This is the primary method for AI communication - all responses are streamed
 * @param {Array} messages - Array of message objects with role and content
 * @param {Array} tools - Array of tool objects
 * @returns {Promise<AsyncIterable>} - Streaming response iterator
 */
export const createMistralStream = async (messages, tools) => {
  const client = new MistralClient(process.env.MISTRAL_API_KEY)

  // Log the messages to see if they have the proper formatting
  console.log('***********request messages:**********', JSON.stringify(messages, null, 2))

  // Preprocess messages to ensure each tool call has a corresponding tool response
  // and that tool calls are well-formed.
  const processedMessages = preprocessMessages(messages)

  try {
    const streamResponse = client.chatStream({
      model: 'magistral-medium-2506',
      messages: processedMessages,
      tools,
      temperature: 0.7,
      prompt_mode: 'reasoning',
      max_tokens: 1000
    })

    console.log('***********Mistral streaming started**********')
    return streamResponse
  } catch (error) {
    console.error('Error in Mistral streaming API call:', error)
    throw error
  }
}

/**
 * Processes streaming chunks from Mistral AI API v1.7.2+
 * @param {Object} chunk - Individual chunk from the stream
 * @returns {Object} - Processed chunk data
 */
export const processStreamChunk = (chunk) => {
  try {
    // Log the raw chunk for debugging
    console.log('RAW CHUNK:', JSON.stringify(chunk, null, 2))

    // Mistral v1.7.2+ streaming format: chunk.choices[0].delta (OpenAI-compatible)
    // The chunk data may be wrapped in a `data` property.
    const data = chunk.data || chunk
    if (!data || !data.choices || data.choices.length === 0) {
      return null
    }

    const choice = data.choices[0]
    const delta = choice.delta

    // Log the delta object for debugging
    console.log('DELTA OBJECT:', JSON.stringify(delta, null, 2))

    // Handle content streaming
    if (delta && delta.content) {
      const result = {
        type: 'content',
        content: delta.content,
        role: delta.role || 'assistant'
      }
      console.log('CONTENT CHUNK:', JSON.stringify(result, null, 2))
      return result
    }

    // Handle tool calls streaming
    if (delta && delta.tool_calls && delta.tool_calls.length > 0) {
      const result = {
        type: 'tool_calls',
        tool_calls: delta.tool_calls,
        role: delta.role || 'assistant'
      }
      console.log('TOOL CALLS CHUNK:', JSON.stringify(result, null, 2))
      return result
    }

    // Handle finish reason
    if (choice.finish_reason) {
      const result = {
        type: 'finish',
        finish_reason: choice.finish_reason
      }
      console.log('FINISH CHUNK:', JSON.stringify(result, null, 2))
      return result
    }

    return null
  } catch (error) {
    console.error('Error processing stream chunk:', error)
    return null
  }
}

/**
 * Accumulates streaming chunks into a complete message
 * @param {Array} chunks - Array of processed chunks
 * @returns {Object} - Complete message object
 */
export const accumulateStreamChunks = (chunks) => {
  const message = {
    role: 'assistant',
    content: '',
    tool_calls: []
  }

  const toolCallsMap = new Map()

  for (const chunk of chunks) {
    if (!chunk) continue

    if (chunk.type === 'content') {
      message.content += chunk.content
      message.role = chunk.role
    } else if (chunk.type === 'tool_calls') {
      for (const toolCall of chunk.tool_calls) {
        if (toolCall.index !== undefined) {
          const index = toolCall.index
          if (!toolCallsMap.has(index)) {
            toolCallsMap.set(index, {
              id: toolCall.id || `tool_call_${index}`,
              type: 'function',
              function: {
                name: toolCall.function?.name || '',
                arguments: toolCall.function?.arguments || ''
              }
            })
          } else {
            const existing = toolCallsMap.get(index)
            if (toolCall.function?.name) {
              existing.function.name += toolCall.function.name
            }
            if (toolCall.function?.arguments) {
              existing.function.arguments += toolCall.function.arguments
            }
          }
        }
      }
    }
  }

  // Convert tool calls map to array
  if (toolCallsMap.size > 0) {
    message.tool_calls = Array.from(toolCallsMap.values())
  } else {
    delete message.tool_calls
  }

  // Clean up empty content
  if (!message.content) {
    delete message.content
  }

  // Add debug logging for final accumulated message
  console.log('FINAL ACCUMULATED MESSAGE:', JSON.stringify(message, null, 2))

  return message
}
