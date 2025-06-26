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

    // Check if there's also content along with the tool call
    const content = assistantMessage?.content || ''

    if (content.trim()) {
      // Return both content and tool call information
      return {
        type: 'tool_use_with_content',
        content: content,
        name: toolCall.function.name,
        params,
        toolCallId: toolCall.id
      }
    } else {
      // Only tool call, no content
      return {
        type: 'tool_use',
        name: toolCall.function.name,
        params,
        toolCallId: toolCall.id
      }
    }
  }

  // Handle normal text response
  return {
    type: 'text',
    content: assistantMessage?.content || ''
  }
}
