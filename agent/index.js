import OpenAI from 'openai'
import { AGENT_SYSTEM_PROMPT } from './prompt'
import { VERIFICATION_CASES as INSTANCE_CASES } from './cases/instance'
import { VERIFICATION_CASES as NODE_CASES } from './cases/node'
import { VERIFICATION_RULES as INSTANCE_RULES } from './rules/instance'
import { VERIFICATION_RULES as NODE_RULES } from './rules/node'

// Define function groups
const FUNCTION_GROUPS = {
  instance: {
    functions: ['get_services', 'get_instances', 'start_instance'],
    cases: INSTANCE_CASES,
    rules: INSTANCE_RULES
  },
  node: {
    functions: ['get_nodes', 'get_node_agent'],
    cases: NODE_CASES,
    rules: NODE_RULES
  }
}

// Helper to get relevant cases and rules
const getRelevantContent = (functionName) => {
  for (const [groupKey, group] of Object.entries(FUNCTION_GROUPS)) {
    if (group.functions.includes(functionName)) {
      return {
        cases: group.cases,
        rules: group.rules
      }
    }
  }
  return null
}

export const evaluator = async (assistantMessage) => {
  const client = new OpenAI({
    baseURL: process.env.OPENAI_API_ENDPOINT,
    apiKey: process.env.OPENAI_API_KEY
  })

  // Extract tool call details
  const toolCall = assistantMessage.toolCalls[0]
  const { name: functionName, arguments: functionArgs } = toolCall.function

  // Get relevant cases and rules
  const relevantContent = getRelevantContent(functionName)
  console.log('------15-relevantContent:', relevantContent)
  if (!relevantContent) {
    return {
      isCorrect: false,
      message: {
        ...assistantMessage,
        content: 'Unknown function type',
        toolCalls: null
      }
    }
  }

  // Prepare critique prompt with relevant cases and rules
  const critiquePrompt = `
    Function called: ${functionName}
    Arguments: ${JSON.stringify(functionArgs)}
    
    Critique examples for user queries:
    ${JSON.stringify(relevantContent.cases, null, 2)}
    
    Logical flow validation rules:
    ${relevantContent.rules}
    
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
