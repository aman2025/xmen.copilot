import { EventEmitter } from 'events';

// Create a singleton event emitter for tool-related events
const toolEventEmitter = new EventEmitter();

// Set higher limit for event listeners to avoid memory leak warnings
toolEventEmitter.setMaxListeners(50);

// Define standard event types as constants
export const TOOL_EVENTS = {
  TOOL_REQUESTED: 'tool:requested',
  TOOL_APPROVED: 'tool:approved',
  TOOL_REJECTED: 'tool:rejected',
  TOOL_EXECUTED: 'tool:executed',
  TOOL_FAILED: 'tool:failed',
  TOOL_RESULT_SENT: 'tool:result:sent'
};

export default toolEventEmitter;