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
 * @returns {Object} - The processed message with XML content
 */
export const processAssistantMessage = (message, sendMessage) => {
  // Convert tool_calls to XML format in the message content if they exist
  if (message.toolCalls && message.toolCalls.length > 0) {
    console.log('Processing message with toolCalls')
    
    // Create a new message object with XML content
    const processedMessage = {
      ...message,
      content: convertToolCallsToXml(message),
      // Set toolCalls to null as we don't need to store them separately
      toolCalls: null
    }
    
    // Parse XML tool calls from the message content to trigger tool execution
    parseToolCalls(processedMessage, sendMessage)
    
    // Return the processed message for storage
    return processedMessage
  }
  
  // If there are XML tool calls in the content, process them
  if (message.content && message.content.includes('<') && message.content.includes('_')) {
    console.log('Processing message with XML content')
    parseToolCalls(message, sendMessage)
  }
  
  return message
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
