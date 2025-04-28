import Task from '../task'
import useChatStore from '../../store/useChatStore'

/**
 * Controller class manages the high-level conversation flow
 * Coordinates between UI, Task processing, and state management
 */
class Controller {
  constructor() {
    // Current active task instance
    this.task = null
  }

  /**
   * Initializes a new conversation task
   * Creates initial messages and updates store
   * @param {string} userInput - Initial user message
   * @returns {Object} Formatted user message for UI
   */
  async initTask(userInput) {
    // Create new task instance
    this.task = new Task()

    // Initialize task with user input
    const { userMessage, apiMessage } = await this.task.startTask(userInput)

    // Update global store with API message
    useChatStore.getState().addApiMessage(apiMessage)

    return userMessage
  }

  /**
   * Cleans up current task resources
   * @returns {boolean} Success status
   */
  clearTask() {
    if (this.task) {
      this.task = null
    }
    return true
  }

  /**
   * Main handler for user messages
   * Manages task lifecycle and message processing
   * @param {string} text - User message text
   * @returns {Object} Formatted messages for UI update
   */
  async handleUserMessage(text) {
    if (!this.task) {
      // First message in conversation - initialize new task
      const userMessage = await this.initTask(text)

      // Create processing indicator message
      const apiRequestStartedMessage = {
        ts: Date.now() + 100,
        type: 'say',
        say: 'api_req_started',
        text: JSON.stringify({ request: text })
      }

      // Get current conversation history
      const apiConversationHistory = useChatStore.getState().apiConversationHistory
      console.log('API Conversation History after user message:', apiConversationHistory)

      // Process initial message with system prompt
      const { copilotMessage, apiMessage } = await this.task.processTask([
        apiConversationHistory[0]
      ])

      // Update store with AI response
      useChatStore.getState().addApiMessage(apiMessage)
      const store = useChatStore.getState()
      console.log('Store state after processing:', {
        apiHistory: store.apiConversationHistory,
        copilotMsgs: store.copilotMessages
      })

      return { userMessage, apiRequestStartedMessage, copilotMessage }
    } else {
      // Continuation of existing conversation
      // Format user message for UI
      const userMessage = {
        ts: Date.now(),
        type: 'ask',
        ask: 'followup',
        text: text
      }

      // Format message for API history
      const apiMessage = {
        role: 'user',
        content: [{ type: 'text', text: text }]
      }

      // Update store
      useChatStore.getState().addApiMessage(apiMessage)

      // Create processing indicator
      const apiRequestStartedMessage = {
        ts: Date.now() + 100,
        type: 'say',
        say: 'api_req_started',
        text: JSON.stringify({ request: text })
      }

      // Get updated conversation history
      const apiConversationHistory = useChatStore.getState().apiConversationHistory

      // Process message with full context
      const messages = [...apiConversationHistory]

      // Get AI response
      const { copilotMessage, apiMessage: responseApiMessage } =
        await this.task.processTask(messages)
      console.log('AI Response11111:', copilotMessage, responseApiMessage)

      // Update store with AI response
      useChatStore.getState().addApiMessage(responseApiMessage)

      return { userMessage, apiRequestStartedMessage, copilotMessage }
    }
  }

  /**
   * Handles user responses to AI questions or tool requests
   * @param {string} response - User response type ('approve' or 'reject')
   * @param {string} text - Optional response text
   * @param {Array} currentMessages - Current conversation messages
   * @returns {Object} Formatted messages for UI update
   */
  async handleUserResponse(response, text, currentMessages) {
    if (!this.task) {
      return null
    }

    // Format response text
    const responseText = text || (response === 'approve' ? 'I approve.' : 'I reject.')

    // Create user response message for UI
    const userMessage = {
      ts: Date.now(),
      type: 'ask',
      ask: 'followup',
      text: responseText
    }

    // Format response for API history
    const apiMessage = {
      role: 'user',
      content: [{ type: 'text', text: responseText }]
    }

    // Update store
    useChatStore.getState().addApiMessage(apiMessage)

    // Create processing indicator
    const apiRequestStartedMessage = {
      ts: Date.now() + 100,
      type: 'say',
      say: 'api_req_started',
      text: JSON.stringify({ request: responseText })
    }

    // Process response based on type
    let copilotMessage, responseApiMessage

    if (response === 'approve') {
      // Handle tool execution if last message was a tool request
      const lastMessage = currentMessages[currentMessages.length - 1]
      if (lastMessage && lastMessage.say === 'tool') {
        const result = await this.task.handleToolUse(lastMessage.text, JSON.parse(lastMessage.text))
        copilotMessage = result.copilotMessage
        responseApiMessage = result.apiMessage
      } else {
        // Process normal approval response
        const apiConversationHistory = useChatStore.getState().apiConversationHistory
        const messages = [...apiConversationHistory]

        const result = await this.task.processTask(messages)
        copilotMessage = result.copilotMessage
        responseApiMessage = result.apiMessage
      }

      // Update store with AI response
      useChatStore.getState().addApiMessage(responseApiMessage)
    } else if (response === 'reject') {
      // Handle rejection with standard response
      copilotMessage = {
        ts: Date.now(),
        type: 'say',
        say: 'completion_result',
        text: 'Request rejected. What would you like me to do instead?'
      }

      responseApiMessage = {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Request rejected. What would you like me to do instead?'
          }
        ]
      }

      // Update store with rejection response
      useChatStore.getState().addApiMessage(responseApiMessage)
    }

    return { userMessage, apiRequestStartedMessage, copilotMessage }
  }
}

export default Controller
