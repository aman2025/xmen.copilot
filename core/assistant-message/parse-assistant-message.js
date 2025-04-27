export function parseAssistantMessage(assistantMessage) {
  // Handle tool calls
  if (assistantMessage.tool_calls?.length > 0) {
    const toolCall = assistantMessage.tool_calls[0]
    return {
      type: 'tool_use',
      name: toolCall.function.name,
      params: JSON.parse(toolCall.function.arguments)
    }
  }

  // Handle normal text response
  return {
    type: 'text',
    content: assistantMessage.content
  }
}
