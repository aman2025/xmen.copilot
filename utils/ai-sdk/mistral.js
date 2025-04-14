import MistralClient from '@mistralai/mistralai'
import { convertToolCallToUiXml } from '../../tool-calls/formatters/uiFormatters'

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
 * Formats the Mistral API response to extract content and convert tool calls to XML
 * @param {Object} response - Raw response from Mistral API
 * @returns {Object} - Formatted response with XML content for tool calls
 */
export const formatMistralResponse = async (response) => {
  const message = response.choices[0].message
  console.log('Raw Mistral message:', JSON.stringify(message))

  // If there are tool calls, convert them to XML format in the content
  if (message.tool_calls && message.tool_calls.length > 0) {
    console.log('Detected tool calls, converting to XML')

    // Convert the first tool call to UI XML format
    const xmlContent = convertToolCallToUiXml(message.tool_calls[0])

    return {
      content: xmlContent,
      toolCalls: null
    }
  }

  return {
    content: message.content || '',
    toolCalls: null
  }
}
