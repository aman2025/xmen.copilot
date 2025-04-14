/**
 * Converts Mistral tool calls to UI-friendly XML format
 * @param {Object} toolCall - The tool call object from Mistral
 * @returns {string} Formatted XML string for UI rendering
 */
export const convertToolCallToUiXml = (toolCall) => {
  if (!toolCall || !toolCall.function) return ''

  const { name, arguments: argsStr } = toolCall.function
  const args = JSON.parse(argsStr)

  switch (name) {
    case 'ask_followup_question':
      return formatFollowUpQuestion(args)
    case 'attempt_completion':
      return formatAttemptCompletion(args)
    // Add other tool formatters here
    default:
      return convertGenericToolCall(name, args)
  }
}

/**
 * Formats follow-up question tool call for UI
 * @param {Object} args - The tool arguments
 * @returns {string} Formatted XML
 */
const formatFollowUpQuestion = (args) => {
  const { question, options } = args
  return `<ask_followup_question>
<question>${question}</question>
<options>[${options?.map((opt) => `"${opt}"`).join(',')}]</options>
</ask_followup_question>`
}

/**
 * Formats attempt completion tool call for UI
 * @param {Object} args - The tool arguments
 * @returns {string} Formatted XML
 */
const formatAttemptCompletion = (args) => {
  const { result } = args
  return `<attempt_completion>
<result>${result}</result>
</attempt_completion>`
}

/**
 * Formats generic tool calls for UI
 * @param {string} name - Tool name
 * @param {Object} args - Tool arguments
 * @returns {string} Formatted XML
 */
const convertGenericToolCall = (name, args) => {
  const argTags = Object.entries(args)
    .map(([key, value]) => `<${key}>${value}</${key}>`)
    .join('\n')

  return `<${name}>\n${argTags}\n</${name}>`
}
