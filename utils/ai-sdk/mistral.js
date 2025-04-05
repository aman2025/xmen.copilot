import MistralClient from '@mistralai/mistralai'
import { convertToolCallsToXml } from '../toolXmlParser'

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
  console.log('Raw Mistral message:', message)

  // If there are tool calls, convert them to XML format in the content
  if (message.tool_calls && message.tool_calls.length > 0) {
    console.log('Detected tool calls, converting to XML')
    
    // Create a temporary message object for conversion
    const tempMessage = {
      content: message.content || '',
      toolCalls: message.tool_calls
    }
    
    // Convert tool calls to XML format
    const xmlContent = convertToolCallsToXml(tempMessage)
    
    return {
      content: xmlContent,
      toolCalls: null // Set toolCalls to null as we don't need to store them separately
    }
  }

  // If there's no tool calls, just return the content
  return {
    content: message.content || '',
    toolCalls: null
  }
}
