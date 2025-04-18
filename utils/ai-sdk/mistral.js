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
  })

  return response
}

/**
 * Formats the Mistral API response to extract content
 * @param {Object} response - Raw response from Mistral API
 * @returns {Object} - Formatted response with content
 */
export const formatMistralResponse = async (response) => {
  const message = response.choices[0].message
  return {
    content: message.content,
  }
}
