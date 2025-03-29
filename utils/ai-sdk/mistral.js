import MistralClient from '@mistralai/mistralai'

/**
 * Creates a chat completion using Mistral AI API
 * @param {Array} messages - Array of message objects with role and content
 * @param {Array} tools - Array of tools available for the AI
 * @returns {Promise<Object>} - Mistral API response
 */
export const createMistral = async (messages, tools) => {
  const client = new MistralClient(process.env.MISTRAL_API_KEY)

  const response = await client.chat({
    model: 'mistral-large-latest',
    messages,
    tools,
    tool_choice: 'auto',
    temperature: 0.7,
    max_tokens: 1000
  })

  return response
}

/**
 * Formats the Mistral API response to extract content and tool calls
 * @param {Object} response - Raw response from Mistral API
 * @returns {Object} - Formatted response with content and toolCalls
 */
export const formatMistralResponse = async (response) => {
  const message = response.choices[0].message
  const isToolCall = response.choices[0].finish_reason === 'tool_calls'

  return {
    content: isToolCall ? '' : message.content,
    toolCalls: isToolCall ? message.tool_calls : []
  }
}
