import toolEventEmitter, { TOOL_EVENTS } from '../utils/events/toolEventEmitter'
import { parseToolCalls } from './toolParser'
import { initializeToolRegistry } from './toolRegistry'
import { containsXmlToolCalls } from '../utils/toolXmlParser'

// Flag to ensure initialization happens only once
let isToolExecutionInitialized = false;

/**
 * Initializes the tool execution system
 */
export const initializeToolExecution = () => {
  // Prevent multiple initializations
  if (isToolExecutionInitialized) {
    console.log('Tool execution system already initialized.');
    return;
  }
  isToolExecutionInitialized = true;
  console.log('Initializing tool execution system...');

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
 * @returns {Object} - The processed message (or original if no XML tool calls)
 */
export const processAssistantMessage = (message, sendMessage) => {
  // Check if the message content contains XML tool calls and parse them
  if (containsXmlToolCalls(message.content)) {
    console.log('Processing message with XML content:', message.id)
    parseToolCalls(message, sendMessage)
  }
  
  // Return the original message (parsing triggers events, doesn't modify the message object here)
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
