import { toolCalls } from './index'

/**
 * Processes tool calls in fullscreen mode by directly fetching data
 * @param {string} toolName - Name of the tool to execute
 * @param {object} toolArgs - Arguments for the tool
 * @param {string} toolCallId - ID of the tool call
 * @param {function} sendMessage - Function to send message back to assistant
 * @returns {Promise<void>}
 */
export const processToolCall = async (toolName, toolArgs, toolCallId, sendMessage) => {
  try {
    // Find the corresponding tool function from toolCalls array
    const toolFunction = toolCalls.find((tool) => tool.name === toolName)
    console.log('toolName: ', toolName)
    console.log('toolArgs: ', toolArgs)

    if (toolFunction) {
      // Execute the tool function
      const data = await toolFunction(JSON.parse(toolArgs))
      const responseMessage =
        data.retCode === 0
          ? {
              success: true,
              data: data.result
            }
          : {
              success: false,
              error: data.error
            }
      console.log(responseMessage)

      // Send the result back to the assistant
      sendMessage({
        content: JSON.stringify(responseMessage),
        role: 'tool',
        toolCallId: toolCallId
      })
    } else {
      console.warn(`Tool ${toolName} not found in toolCalls array`)
    }
  } catch (error) {
    console.error('Error processing fullscreen tool call:', error)
    // Send error response to assistant
    sendMessage({
      content: JSON.stringify({ error: 'Failed to process tool call' }),
      role: 'tool',
      toolCallId: toolCallId
    })
  }
}
