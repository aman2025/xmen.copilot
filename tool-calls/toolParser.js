import toolEventEmitter, { TOOL_EVENTS } from '../utils/events/toolEventEmitter'
import { parseXmlToolCalls } from '../utils/toolXmlParser'

/**
 * Parses tool calls from assistant messages and emits appropriate events
 * @param {Object} message - The assistant message containing tool calls as XML in content
 * @param {Function} sendMessage - Function to send messages back to the assistant
 */
export const parseToolCalls = (message, sendMessage) => {
  try {
    // Only parse XML from message content
    if (message.content && typeof message.content === 'string') {
      const xmlToolCalls = parseXmlToolCalls(message.content);
      
      if (xmlToolCalls.length > 0) {
        // Process each XML tool call
        xmlToolCalls.forEach(xmlToolCall => {
          const { name: toolName, params: toolArgs } = xmlToolCall;
          
          // Generate a unique ID for this tool call
          const toolCallId = `xml_tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Emit tool requested event
          toolEventEmitter.emit(TOOL_EVENTS.TOOL_REQUESTED, {
            toolName,
            toolArgs,
            toolCallId,
            message,
            sendMessage
          });
        });
      }
    }
  } catch (error) {
    console.error('Error parsing tool calls:', error)
  }
}
