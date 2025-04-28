import ContextManager from '../context/context-management/ContextManager'
import useChatStore from '../../store/useChatStore'
import { parseAssistantMessage } from '../assistant-message/parse-assistant-message'

/**
 * Task class handles individual conversation tasks and their processing
 * Manages the flow of messages between the UI, store, and AI service
 */
class Task {
  /**
   * Initialize a new task with optional configuration
   * @param {Object} options - Configuration options for the task
   */
  constructor(options = {}) {
    // Unique identifier for the task using timestamp
    this.taskId = Date.now().toString()
    this.options = options
    // Initialize context manager for message optimization
    this.contextManager = new ContextManager()
  }

  /**
   * Retrieves the current conversation history from the global store
   * Used for maintaining context across multiple messages
   * @returns {Array} Array of conversation messages
   */
  getApiConversationHistory() {
    return useChatStore.getState().apiConversationHistory
  }

  /**
   * Initializes a new conversation task with user input
   * Creates both UI and API message formats
   * @param {string} userInput - The initial user message
   * @returns {Object} Contains formatted messages for UI and API
   */
  async startTask(userInput) {
    // Format message for UI display
    const userMessage = {
      ts: Date.now(),
      type: 'ask',
      ask: 'followup',
      text: userInput
    }

    // Format message for API conversation history
    // Following the format expected by Mistral AI
    const apiMessage = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: userInput
        }
      ]
    }

    return { userMessage, apiMessage }
  }

  /**
   * Main task processing pipeline
   * Handles message formatting, API communication, and response processing
   * @param {Array} messages - Array of conversation messages
   * @returns {Object} Processed response with UI and API formats
   */
  async processTask(messages) {
    console.log('-------Processing task with messages:', messages)
    try {
      // Format messages according to API requirements
      const formattedMessages = this.formatMessagesForAPI(messages)

      // Send request to message-flow API endpoint
      const response = await this.makeAPIRequest(formattedMessages)

      // Process and format the API response
      return await this.processAPIResponse(response)
    } catch (error) {
      return this.handleAPIError(error)
    }
  }

  /**
   * Formats messages for API consumption using context optimization
   * @param {Array} messages - Raw conversation messages
   * @returns {Array} Optimized and formatted messages
   */
  formatMessagesForAPI(messages) {
    // Apply context optimization strategies through ContextManager
    const optimizedMessages = this.contextManager.getUpdatedContextMessages(messages)
    return optimizedMessages
  }

  /**
   * Makes the actual API request to the message-flow endpoint
   * @param {Array} messages - Formatted messages for API
   * @returns {Promise} API response
   */
  async makeAPIRequest(messages) {
    return await fetch('/api/message-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    }).then((res) => res.json())
  }

  /**
   * Processes API response and formats it for both UI and store
   * Handles different response types (completion, tool, question)
   * @param {Object} response - Raw API response
   * @returns {Object} Formatted messages for UI and store
   */
  async processAPIResponse(response) {
    const parsedMessage = parseAssistantMessage(response)
    const copilotMessage = {
      ts: Date.now(),
      type: 'say',
      say: parsedMessage.type === 'text' ? 'completion_result' : 'tool',
      text:
        parsedMessage.type === 'text'
          ? parsedMessage.content
          : JSON.stringify({
              tool: parsedMessage.name,
              content: parsedMessage.params
            })
    }

    const apiMessage = response

    return { copilotMessage, apiMessage }
  }

  /**
   * Parses different types of API responses
   * Handles completion, tool calls, questions, and other response types
   * @param {Object} response - API response object
   * @returns {Object} Parsed response with type, content, and metadata
   */
  parseResponse(response) {
    let type = 'completion_result'
    let content = response.content || ''
    let metadata = {}

    // Handle different response formats based on response structure
    if (response.id && response.id.startsWith('response-')) {
      type = 'completion_result'
      content = response.content
      metadata = response.metadata || {}
    } else if (response.type === 'question') {
      type = 'ask'
    } else if (response.type === 'tool') {
      type = 'tool'
      metadata = {
        tool: response.tool?.name || 'unknown',
        content: response.tool?.content || {}
      }
    } else if (response.type === 'api_req_started') {
      type = 'api_req_started'
    } else if (response.type === 'say') {
      type = 'completion_result'
    }

    return { type, content, metadata }
  }

  /**
   * Handles API errors and formats them for UI display
   * @param {Error} error - Error object from API call
   * @returns {Object} Formatted error message for UI
   */
  handleAPIError(error) {
    return {
      ts: Date.now(),
      type: 'say',
      say: 'error',
      text: `An error occurred: ${error.message}`
    }
  }

  /**
   * Handles tool usage requests and their responses
   * @param {string} toolData - Tool request data
   * @param {Object} metadata - Tool metadata
   * @returns {Object} Formatted tool response messages
   */
  async handleToolUse(_toolData, metadata) {
    const copilotMessage = {
      ts: Date.now(),
      type: 'say',
      say: 'tool',
      text: JSON.stringify({
        tool: metadata.name || 'unknown',
        content: `Tool was used successfully.`
      })
    }

    const apiMessage = {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: `Tool ${metadata.name || 'unknown'} was used successfully.`
        }
      ]
    }

    return { copilotMessage, apiMessage }
  }
}

export default Task
