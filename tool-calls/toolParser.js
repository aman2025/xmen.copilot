import toolEventEmitter, { TOOL_EVENTS } from '../utils/events/toolEventEmitter';

/**
 * Parses tool calls from assistant messages and emits appropriate events
 * @param {Object} message - The assistant message containing tool calls
 * @param {Function} sendMessage - Function to send messages back to the assistant
 */
export const parseToolCalls = (message, sendMessage) => {
  try {
    // Check if message contains tool calls
    if (!message.toolCalls || message.toolCalls.length === 0) {
      return;
    }
    
    // Process each tool call in the message
    message.toolCalls.forEach(toolCall => {
      const { id: toolCallId, function: toolFunction } = toolCall;
      const { name: toolName, arguments: toolArgs } = toolFunction;
      
      // Parse tool arguments if they're a string
      const parsedArgs = typeof toolArgs === 'string' 
        ? JSON.parse(toolArgs) 
        : toolArgs;
      
      // Emit tool requested event
      toolEventEmitter.emit(TOOL_EVENTS.TOOL_REQUESTED, {
        toolName,
        toolArgs: parsedArgs,
        toolCallId,
        message,
        sendMessage
      });
    });
  } catch (error) {
    console.error('Error parsing tool calls:', error);
  }
}; 