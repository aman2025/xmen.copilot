/**
 * Processes tool calls using dialog-based UI components
 * @param {string} toolName - Name of the tool to execute
 * @param {object} toolArgs - Arguments for the tool
 * @param {object} message - Original message containing the tool call
 * @param {function} setToolState - Function to update tool state
 */
export const processBoxToolCall = (toolName, toolArgs, message, setToolState) => {
  try {
    const parsedArgs = typeof toolArgs === 'string' ? JSON.parse(toolArgs) : toolArgs

    setToolState({
      isOpen: true,
      tool: toolName,
      params: parsedArgs,
      toolCallId: message.toolCalls[0].id
    })
  } catch (error) {
    console.error('Error processing dialog tool call:', error)
  }
}
