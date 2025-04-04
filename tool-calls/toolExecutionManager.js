import toolEventEmitter, { TOOL_EVENTS } from '../utils/events/toolEventEmitter'
import { parseToolCalls } from './toolParser'
import { initializeToolRegistry } from './toolRegistry'
import { convertToolCallsToXml } from '../utils/toolXmlParser'

/**
 * Initializes the tool execution system
 */
export const initializeToolExecution = () => {
  // Initialize the tool registry
  initializeToolRegistry()

  // Set up logging for debugging (optional)
  if (process.env.NODE_ENV === 'development') {
    setupDebugLogging()
  }
}

/**
 * Processes an assistant message to extract and handle tool calls
 * @param {Object} message - The assistant message
 * @param {Function} sendMessage - Function to send messages back to the assistant
 */
export const processAssistantMessage = (message, sendMessage) => {
  // Always convert tool_calls to XML format in the message content
  if (message.toolCalls && message.toolCalls.length > 0) {
    message = {
      ...message,
      content: convertToolCallsToXml(message)
    }
  }
  
  // Parse XML tool calls from the message content
  parseToolCalls(message, sendMessage)
}

/**
 * Sets up debug logging for tool events
 */
const setupDebugLogging = () => {
  Object.values(TOOL_EVENTS).forEach((eventType) => {
    toolEventEmitter.on(eventType, (data) => {
      console.log(`[Tool Event] ${eventType}:`, data)
    })
  })
}
