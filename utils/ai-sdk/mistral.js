import MistralClient from '@mistralai/mistralai'

/**
 * Creates a chat completion using Mistral AI API
 * @param {Array} messages - Array of message objects with role and content
 * @returns {Promise<Object>} - Mistral API response
 */
export const createMistral = async (messages) => {
  const client = new MistralClient(process.env.MISTRAL_API_KEY)

  const response = await client.chat({
    model: 'mistral-large-latest',
    messages,
    temperature: 0.7,
    max_tokens: 1000,
    stream: false
  })

  return response
}

/**
 * Formats the Mistral API response to extract content and determine message type
 * @param {Object} response - Raw response from Mistral API
 * @returns {Object} - Formatted response with content and message type
 */
export const formatMistralResponse = async (response) => {
  const message = response.choices[0].message
  const content = message.content

  // Determine message type based on content patterns
  let type = 'say' // Default type
  let metadata = {}

  // Check for question patterns
  if (
    content.includes('?') &&
    (content.toLowerCase().includes('would you like') ||
      content.toLowerCase().includes('do you want') ||
      content.toLowerCase().includes('should i'))
  ) {
    type = 'ask'
  }
  // Check for code blocks that might indicate tool use
  else if (content.includes('```')) {
    // Extract language if specified
    const codeBlockMatch = content.match(/```([a-zA-Z0-9]*)/)
    const language = codeBlockMatch && codeBlockMatch[1] ? codeBlockMatch[1] : 'javascript'

    type = 'tool'
    metadata = {
      tool: 'code',
      language
    }
  }

  return {
    content: content,
    type,
    metadata
  }
}
