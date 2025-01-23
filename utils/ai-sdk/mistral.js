// 根据 Mistral ai的function calling 格式化响应格式
/*
{
    toolCall: {
        id: "LTaIqhlEM",
        function: {
            name: "get_weather",
            arguments: {
                location: "San Francisco, CA"
            }
        },
        index: 0
    }
}
*/

/**
 * Creates a chat completion using Mistral AI API
 * @param {Array} messages - Array of message objects with role and content
 * @param {Array} tools - Array of tools available for the AI
 * @returns {Promise<Response>} - Mistral API response
 */
export const createMistral = async (messages, tools) => {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate AI response')
  }

  return response
}

/**
 * Formats the Mistral API response to extract content and tool calls
 * @param {Object} response - Raw response from Mistral API
 * @returns {Object} - Formatted response with content and toolCalls
 * Added support for tool calls in the response format (which might be useful for future function calling features)
 */
export const formatMistralResponse = async (response) => {
  const data = await response.json()
  const message = data.choices[0].message

  return {
    content: message.content, // 没有找到对应的工具，这返回文字信息, 此时toolCalls:null
    toolCalls: message.tool_calls || [], // 如果响应的是工具调用，则返回工具调用，多个工具的数组 [{id: '', function: {name: '', arguments: {}}}, {}, {}], 此时content:空
  }
}
