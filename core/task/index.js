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
   * @param {string} [task] - Initial task/message to start with
   */
  constructor(task = null) {
    // Class properties initialization
    this.isInitialized = false
    this.apiConversationHistory = []
    this.clineMessages = []
    this.assistantMessageContent = []
    // Unique identifier for the task using timestamp
    this.taskId = Date.now().toString()
    // Initialize context manager for message optimization
    this.contextManager = new ContextManager()

    // Start task if initial task is provided
    if (task) {
      this.startTask(task)
    }
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
   * Initializes a new conversation task
   * Creates both UI and API message formats
   * @param {string} task - The task/message to process
   * @returns {Object} Contains formatted messages for UI and API
   */
  async startTask(task) {
    console.log('Task: startTask')
    this.clineMessages = []
    this.apiConversationHistory = []

    await this.say('text', task)

    this.isInitialized = true

    await this.initiateTaskLoop([
      {
        type: 'text',
        text: `<task>\n${task}\n</task>`
      }
    ])
  }

  async initiateTaskLoop(userContent) {
    let nextUserContent = userContent
    await this.recursivelyMakeClineRequests(nextUserContent)
  }
  async recursivelyMakeClineRequests(userContent) {
    // previousApiReqIndex 具体使用多少个历史记录
    // get previous api req's index to check token usage and determine if we need to truncate conversation history
    // const previousApiReqIndex = findLastIndex(
    //   this.clineMessages,
    //   (m) => m.say === 'api_req_started'
    // )
    await this.say(
      'api_req_started',
      JSON.stringify({
        request: 'start request Loading...'
      })
    )

    await this.addToApiConversationHistory({
      role: 'user',
      content: userContent
    })
    console.log(this.apiConversationHistory, this.clineMessages)

    const lastApiReqIndex = findLastIndex(this.clineMessages, (m) => m.say === 'api_req_started')
    this.clineMessages[lastApiReqIndex].text = JSON.stringify({
      request: userContent.map(() => '[Text:] or [Tool Use:]')
    })
    // 更新最后一个clineMessage
    await this.saveClineMessagesAndUpdateHistory(this.clineMessages[lastApiReqIndex])

    // 发起api请求
    const assistantMessage = await this.attemptApiRequest(this.clineMessages)
    this.assistantMessageContent = parseAssistantMessage(assistantMessage)

    // present content to user
    this.presentAssistantMessage()

    await this.addToApiConversationHistory(assistantMessage)
  }

  async presentAssistantMessage() {
    // Handle the message block from assistantMessageContent
    const block = this.assistantMessageContent
    const { type, content } = block

    switch (type) {
      case 'text': {
        await this.say('text', content)
        break
      }
      case 'tool_use': {
        await this.say('tool', content)
        break
      }
      default: {
        console.warn('Unknown message type:', type)
        break
      }
    }
  }

  async say(type, text) {
    const sayTs = Date.now()
    await this.addToClineMessages({
      ts: sayTs,
      type: 'say',
      say: type,
      text
    })
  }

  async addToClineMessages(message) {
    this.clineMessages.push(message)
    await this.saveClineMessagesAndUpdateHistory(message)
  }

  async addToApiConversationHistory(message) {
    this.apiConversationHistory.push(message)
    await useChatStore.getState().saveApiConversationHistory(message)
  }

  async saveClineMessagesAndUpdateHistory(message) {
    useChatStore.getState().saveClineMessages(message)
  }

  findLastIndex(array, predicate) {
    let l = array.length
    while (l--) {
      if (predicate(array[l], l, array)) {
        return l
      }
    }
    return -1
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
  async attemptApiRequest(messages) {
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
    const assistantMessageContent = parseAssistantMessage(response)
    const copilotMessage = {
      ts: Date.now(),
      type: 'say',
      say: assistantMessageContent.type === 'text' ? 'completion_result' : 'tool',
      text:
        assistantMessageContent.type === 'text'
          ? assistantMessageContent.content
          : JSON.stringify({
              tool: assistantMessageContent.name,
              content: assistantMessageContent.params
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
