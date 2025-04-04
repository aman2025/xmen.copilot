import toolEventEmitter, { TOOL_EVENTS } from '../utils/events/toolEventEmitter';
import { convertToolCallsToXml, parseXmlToolCalls } from '../utils/toolXmlParser';

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
    
    // Convert the message to XML format
    const xmlContent = convertToolCallsToXml(message);
    
    // Parse XML tool calls
    const toolCalls = parseXmlToolCalls(xmlContent);
    
    // Process each tool call
    toolCalls.forEach(toolCall => {
      const { name: toolName, params: toolArgs } = toolCall;
      
      // Generate a unique ID for this tool call if not present
      const toolCallId = message.toolCalls[0]?.id || `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Emit tool requested event
      toolEventEmitter.emit(TOOL_EVENTS.TOOL_REQUESTED, {
        toolName,
        toolArgs,
        toolCallId,
        message: {
          ...message,
          content: xmlContent // Replace content with XML-formatted content
        },
        sendMessage
      });
    });
  } catch (error) {
    console.error('Error parsing tool calls:', error);
  }
}; 