import OpenAI from 'openai'
import { AGENT_SYSTEM_PROMPT } from './prompt'
import { VERIFICATION_INSTANCE_TEST_CASES } from './testCases/verification_instance'

export const verifyOpenAI = async (assistantMessage) => {
  const client = new OpenAI({
    baseURL: process.env.OPENAI_API_ENDPOINT,
    apiKey: process.env.OPENAI_API_KEY
  })

  // Extract tool call details
  const toolCall = assistantMessage.toolCalls[0]
  const { name: functionName, arguments: functionArgs } = toolCall.function

  // Find matching test case based on function name and args
  const relevantTestCase = VERIFICATION_INSTANCE_TEST_CASES.find(
    (testCase) => testCase.expectedFunction.name === functionName
  )

  // Prepare verification prompt
  const verificationPrompt = `
    Function called: ${functionName}
    Arguments: ${JSON.stringify(functionArgs)}
    Expected validation: ${JSON.stringify(relevantTestCase?.validation)}
    Current Test case: ${JSON.stringify(relevantTestCase)}
    All Test cases: ${JSON.stringify(VERIFICATION_INSTANCE_TEST_CASES)}
    
    Verify if this function call is correct based on the test cases and validation rules.
    Return JSON response with:
    {
      "isCorrect": boolean,
      "error": string | null,
      "reasoning": string,
      "correctedFunction": object | null
    }
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
  console.log('response: ', response)

  const verification = JSON.parse(response.choices[0].message.content)
  console.log('verification: ', verification)
  // If verification failed, create corrected message
  if (!verification.isCorrect && verification.correctedFunction) {
    return {
      isCorrect: false,
      correctedMessage: {
        ...assistantMessage,
        toolCalls: [
          {
            ...toolCall,
            function: verification.correctedFunction
          }
        ]
      }
    }
  }

  return {
    isCorrect: true,
    correctedMessage: null
  }
}
