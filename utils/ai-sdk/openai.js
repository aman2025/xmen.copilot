import OpenAI from 'openai'

/**
 * Creates a chat completion using OpenAI API
 * @param {Array} messages - Array of message objects with role and content
 * @param {Array} tools - Array of tools available for the AI
 * @returns {Promise<Object>} - OpenAI API response
 */
export const createOpenAI = async (messages, tools) => {
  const client = new OpenAI({
    baseURL: process.env.OPENAI_API_ENDPOINT,
    apiKey: process.env.OPENAI_API_KEY
  })

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools,
    tool_choice: 'auto',
    temperature: 0.7,
    max_tokens: 1000
  })

  return response
}

/**
 * Formats the OpenAI API response to extract content and tool calls
 * @param {Object} response - Raw response from OpenAI API
 * @returns {Object} - Formatted response with content and toolCalls
 */
export const formatOpenAIResponse = async (response) => {
  const message = response.choices[0].message
  const isToolCall = response.choices[0].finish_reason === 'tool_calls'

  return {
    content: isToolCall ? '' : message.content,
    toolCalls: isToolCall ? message.tool_calls : []
  }
}
