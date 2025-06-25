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
 * Creates a chat completion using Mistral AI API
 * @param {Array} messages - Array of message objects with role and content
 * @param {Array} tools - Array of tool objects
 * @returns {Promise<Object>} - Mistral API response
 */
export const createMistral = async (messages, tools) => {
  const client = new MistralClient(process.env.MISTRAL_API_KEY)

  // Log the messages to see if they have the proper formatting
  console.log('***********request messages:**********', JSON.stringify(messages, null, 2))

  // Preprocess messages to ensure each tool call has a corresponding tool response
  // and that tool calls are well-formed.
  const processedMessages = preprocessMessages(messages)

  try {
    const response = await client.chat({
      model: 'magistral-medium-2506',
      messages: processedMessages,
      tools,
      temperature: 0.7,
      prompt_mode: 'reasoning',
      max_tokens: 1000,
      stream: false
    })
    console.log('***********Mistral response:**********', response.choices[0].message)

    return response
  } catch (error) {
    console.error('Error in Mistral API call:', error)

    // Re-throw the error. The fallback logic for 'Not the same number of function calls and responses'
    // has been removed as per user request.
    throw error
  }
}

/**
 * Formats the Mistral API response and attempts to correct malformed tool calls.
 * @param {Object} response - The raw response object from the Mistral client.
 * @returns {Promise<Object>} - The assistant's message object, potentially corrected.
 */
export const formatMistralResponse = async (response) => {
  let message = response.choices[0].message

  // If we have content but no tool_calls, and the content starts with obvious text markers,
  // we should just return the message as-is
  if (
    (!message.tool_calls || message.tool_calls.length === 0) &&
    message.content &&
    typeof message.content === 'string' &&
    (message.content.startsWith('The') ||
      message.content.startsWith('|') ||
      message.content.includes('\n'))
  ) {
    return message
  }

  // Only attempt JSON parsing if the content looks like it might be JSON
  if (
    (!message.tool_calls || message.tool_calls.length === 0) &&
    message.content &&
    typeof message.content === 'string' &&
    (message.content.startsWith('[') || message.content.startsWith('{'))
  ) {
    try {
      const potentialToolCalls = JSON.parse(message.content)

      if (Array.isArray(potentialToolCalls) && potentialToolCalls.length > 0) {
        // Check if the first item looks like a tool call structure
        // (e.g., has 'name' and 'arguments' which is common for LLMs to put in content).
        const firstPotentialToolCall = potentialToolCalls[0]
        if (
          firstPotentialToolCall &&
          typeof firstPotentialToolCall.name === 'string' &&
          firstPotentialToolCall.arguments !== undefined
        ) {
          console.warn(
            'Mistral response seems to have tool_calls in message.content. Attempting to reformat.'
          )

          // Reformat the parsed content into the valid tool_calls structure.
          const newToolCalls = potentialToolCalls.map((tc, index) => {
            // Ensure arguments are stringified, as required by the Mistral API for tool_calls.
            const stringifiedArguments =
              typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments)

            return {
              // Generate a unique ID for the tool call if the LLM didn't provide one.
              // This is crucial for the tool execution flow.
              id: tc.id || `corr_tool_call_${Date.now()}_${index}`,
              type: 'function', // Standard type for tool calls
              function: {
                name: tc.name,
                arguments: stringifiedArguments
              }
            }
          })

          message.tool_calls = newToolCalls
          // Clear the content field or set it to a generic message,
          // as the tool call information has been moved.
          message.content = null
          console.log('Reformatted message with tool_calls:', message)
        }
      }
    } catch (e) {
      console.log('Content is not JSON format, returning original message')
      return message
    }
  }

  return message
}
