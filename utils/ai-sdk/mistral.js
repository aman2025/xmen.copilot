import MistralClient from '@mistralai/mistralai'

/**
 * Creates a chat completion using Mistral AI API
 * @param {Array} messages - Array of message objects with role and content
 * @param {Array} tools - Array of tool objects
 * @returns {Promise<Object>} - Mistral API response
 */
export const createMistral = async (messages, tools) => {
  const client = new MistralClient(process.env.MISTRAL_API_KEY)

  const response = await client.chat({
    model: 'mistral-large-latest',
    messages,
    tools,
    temperature: 0.7,
    max_tokens: 1000,
    stream: false
  })

  return response
}

export const formatMistralResponse = async (response) => {
  const message = response.choices[0].message
  return {
    rawMessage: message
  }
}
