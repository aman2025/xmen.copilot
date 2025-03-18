import OpenAI from 'openai'
import { AGENT_SYSTEM_PROMPT } from './prompt'

export const verifyOpenAI = async (assistantMessage) => {
  const client = new OpenAI({
    baseURL: process.env.OPENAI_API_ENDPOINT,
    apiKey: process.env.OPENAI_API_KEY
  })

  // Extract tool call details
  const toolCall = assistantMessage.toolCalls[0]
  const { name: functionName, arguments: functionArgs } = toolCall.function

  // Prepare verification promp
  const verificationPrompt = `
    Function called: ${functionName}
    Arguments: ${JSON.stringify(functionArgs)}
    
    Verify if this function call is correct based on the test cases.
    Return JSON response with:
    {
      "isCorrect": boolean,
      "error": string (max 50 chars) | null,
      "reasoning": string (max 100 chars),
      "correctedFunction": { name: string, arguments: object } | null
    }
    
    Keep the response brief and focused on essential validation results.
  `

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: AGENT_SYSTEM_PROMPT },
      { role: 'user', content: verificationPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1000
  })

  console.log('------7-assistantMessage:', assistantMessage)

  try {
    const verification = JSON.parse(response.choices[0].message.content)
    console.log('8-verification: ', verification)

    // If verification failed, create corrected message
    if (!verification.isCorrect) {
      return {
        isCorrect: false,
        message: {
          ...assistantMessage,
          content: verification.reasoning,
          toolCalls: null
        }
      }
    }

    return {
      isCorrect: true,
      message: null
    }
  } catch (error) {
    console.error('Failed to parse verification response:', error)
    return {
      isCorrect: false,
      message: {
        ...assistantMessage,
        toolCalls: null,
        content: 'Verification failed due to internal error'
      }
    }
  }
}
