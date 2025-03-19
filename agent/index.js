import OpenAI from 'openai'
import { AGENT_SYSTEM_PROMPT } from './prompt'

export const evaluator = async (assistantMessage) => {
  const client = new OpenAI({
    baseURL: process.env.OPENAI_API_ENDPOINT,
    apiKey: process.env.OPENAI_API_KEY
  })

  // Extract tool call details
  const toolCall = assistantMessage.toolCalls[0]
  const { name: functionName, arguments: functionArgs } = toolCall.function

  // Prepare critique promp
  const critiquePrompt = `
    Function called: ${functionName}
    Arguments: ${JSON.stringify(functionArgs)}
    
    Verify if this function call is correct based on the test cases.
    Return JSON response with:
    {
      "isCorrect": boolean,
      "error": string (max 50 chars) | null,
      "reasoning": string (max 100 chars)
    }
    
    Keep the response brief and focused on essential validation results.
  `

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: AGENT_SYSTEM_PROMPT },
      { role: 'user', content: critiquePrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1000
  })

  console.log('------7-assistantMessage:', assistantMessage)

  try {
    const critiqueResult = JSON.parse(response.choices[0].message.content)
    console.log('8-critiqueResult: ', critiqueResult)

    // If critique failed, create corrected message
    if (!critiqueResult.isCorrect) {
      return {
        isCorrect: false,
        message: {
          ...assistantMessage,
          content: critiqueResult.reasoning,
          toolCalls: null
        }
      }
    }

    return {
      isCorrect: true,
      message: null
    }
  } catch (error) {
    console.error('Failed to parse critique response:', error)
    return {
      isCorrect: false,
      message: {
        ...assistantMessage,
        toolCalls: null,
        content: 'critique failed due to internal error'
      }
    }
  }
}
