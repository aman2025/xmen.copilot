import toolEventEmitter, { TOOL_EVENTS } from '../utils/events/toolEventEmitter'
import create_instance_name from './tools/create_instance_name'
import remove_instance from './tools/remove_instance'

// Registry of available tools
const toolRegistry = {
  create_instance_name,
  remove_instance
  // Add more tools here as needed
}

// Initialize tool event listeners
export const initializeToolRegistry = () => {
  // Track executed tool calls to prevent duplicates
  const executedToolCalls = new Set();
  
  // Listen for tool approval events
  toolEventEmitter.on(
    TOOL_EVENTS.TOOL_APPROVED,
    async ({ toolName, toolArgs, toolCallId, sendMessage }) => {
      try {
        // Prevent duplicate executions of the same tool call
        if (executedToolCalls.has(toolCallId)) {
          console.log(`Tool call ${toolCallId} already executed, skipping.`);
          return;
        }
        
        executedToolCalls.add(toolCallId);
        
        // Check if tool exists in registry
        if (!toolRegistry[toolName]) {
          throw new Error(`Tool ${toolName} not found in registry`)
        }

        // Execute the tool
        const result = await toolRegistry[toolName](toolArgs)

        // Emit tool executed event
        toolEventEmitter.emit(TOOL_EVENTS.TOOL_EXECUTED, {
          toolName,
          toolArgs,
          toolCallId,
          result
        })

        // Format response message
        const responseMessage = {
          success: true,
          data: result
        }

        // Send response to assistant
        sendMessage({
          content: JSON.stringify(responseMessage),
          role: 'tool',
          toolCallId: toolCallId
        })

        // Emit result sent event
        toolEventEmitter.emit(TOOL_EVENTS.TOOL_RESULT_SENT, {
          toolName,
          toolCallId,
          result: responseMessage
        })
      } catch (error) {
        console.error(`Error executing tool ${toolName}:`, error)

        // Emit tool failed event
        toolEventEmitter.emit(TOOL_EVENTS.TOOL_FAILED, {
          toolName,
          toolCallId,
          error: error.message
        })

        // Send error response to assistant
        sendMessage({
          content: JSON.stringify({
            success: false,
            error: `Failed to execute tool: ${error.message}`
          }),
          role: 'tool',
          toolCallId: toolCallId
        })
      }
    }
  )
}

export default toolRegistry
