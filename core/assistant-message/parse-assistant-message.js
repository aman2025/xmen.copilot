export function parseAssistantMessage(assistantMessage) {
  // Handle tool calls
  if (assistantMessage?.tool_calls?.length > 0) {
    const toolCall = assistantMessage.tool_calls[0]

    // Parse the arguments safely
    let params = {}
    try {
      params = JSON.parse(toolCall.function.arguments)
    } catch (error) {
      console.error('Error parsing tool arguments:', error)
      // Use empty object if parsing fails
    }

    return {
      type: 'tool_use',
      name: toolCall.function.name,
      params,
      toolCallId: toolCall.id
    }
  }

  // Handle normal text response
  return {
    type: 'text',
    content: assistantMessage?.content || ''
  }
}
