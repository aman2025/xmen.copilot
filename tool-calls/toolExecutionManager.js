import toolEventEmitter, { TOOL_EVENTS } from '../utils/events/toolEventEmitter';
import { parseToolCalls } from './toolParser';
import { initializeToolRegistry } from './toolRegistry';

/**
 * Initializes the tool execution system
 */
export const initializeToolExecution = () => {
  // Initialize the tool registry
  initializeToolRegistry();
  
  // Set up logging for debugging (optional)
  if (process.env.NODE_ENV === 'development') {
    setupDebugLogging();
  }
};

/**
 * Processes an assistant message to extract and handle tool calls
 * @param {Object} message - The assistant message
 * @param {Function} sendMessage - Function to send messages back to the assistant
 */
export const processAssistantMessage = (message, sendMessage) => {
  // Parse tool calls from the message
  parseToolCalls(message, sendMessage);
};

/**
 * Sets up debug logging for tool events
 */
const setupDebugLogging = () => {
  Object.values(TOOL_EVENTS).forEach(eventType => {
    toolEventEmitter.on(eventType, (data) => {
      console.log(`[Tool Event] ${eventType}:`, data);
    });
  });
}; 