import Task from '../task'
import useChatStore from '../../store/useChatStore'

class Controller {
  constructor() {
    this.task = null
  }

  // Initialize a new task
  async initTask(userInput) {
    // Create a new task
    this.task = new Task()

    // Start the task with user input
    const { userMessage, apiMessage } = await this.task.startTask(userInput)

    // Add API message to the store
    useChatStore.getState().addApiMessage(apiMessage)

    return userMessage
  }

  // Clear the current task
  clearTask() {
    if (this.task) {
      // Clean up task resources
      this.task = null
    }

    return true
  }

  // Handle user message
  async handleUserMessage(text) {
    if (!this.task) {
      // Initialize a new task if none exists
      const userMessage = await this.initTask(text)

      // Create API request started message
      const apiRequestStartedMessage = {
        ts: Date.now() + 100,
        type: 'say',
        say: 'api_req_started',
        text: JSON.stringify({
          request: text
        })
      }

      // Get API conversation history from store
      const apiConversationHistory = useChatStore.getState().apiConversationHistory
      console.log('API Conversation History after user message:', apiConversationHistory)

      // Process the task
      const { copilotMessage, apiMessage } = await this.task.processTask([
        { role: 'system', content: [{ type: 'text', text: 'You are a helpful AI assistant.' }] },
        apiConversationHistory[0] // Use the properly formatted user message
      ])

      // Add API message to the store
      useChatStore.getState().addApiMessage(apiMessage)
      const store = useChatStore.getState()
      console.log('Store state after processing:', {
        apiHistory: store.apiConversationHistory,
        copilotMsgs: store.copilotMessages
      })

      return { userMessage, apiRequestStartedMessage, copilotMessage }
    } else {
      // Add user message for UI display
      const userMessage = {
        ts: Date.now(),
        type: 'ask',
        ask: 'followup',
        text: text
      }

      // Create API message for conversation history
      const apiMessage = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: text
          }
        ]
      }

      // Add API message to the store
      useChatStore.getState().addApiMessage(apiMessage)

      // Create API request started message
      const apiRequestStartedMessage = {
        ts: Date.now() + 100,
        type: 'say',
        say: 'api_req_started',
        text: JSON.stringify({
          request: text
        })
      }

      // Get API conversation history from store
      const apiConversationHistory = useChatStore.getState().apiConversationHistory

      // Process the task with the updated API conversation history
      const messages = [
        { role: 'system', content: [{ type: 'text', text: 'You are a helpful AI assistant.' }] },
        ...apiConversationHistory
      ]

      // Process the task
      const { copilotMessage, apiMessage: responseApiMessage } =
        await this.task.processTask(messages)

      // Add API message to the store
      useChatStore.getState().addApiMessage(responseApiMessage)

      return { userMessage, apiRequestStartedMessage, copilotMessage }
    }
  }

  // Handle user response to a question
  async handleUserResponse(response, text, currentMessages) {
    if (!this.task) {
      return null
    }

    // Create response text based on the response type
    const responseText = text || (response === 'approve' ? 'I approve.' : 'I reject.')

    // Add user response as a message for UI display
    const userMessage = {
      ts: Date.now(),
      type: 'ask',
      ask: 'followup',
      text: responseText
    }

    // Create API message for conversation history
    const apiMessage = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: responseText
        }
      ]
    }

    // Add API message to the store
    useChatStore.getState().addApiMessage(apiMessage)

    // Create API request started message
    const apiRequestStartedMessage = {
      ts: Date.now() + 100,
      type: 'say',
      say: 'api_req_started',
      text: JSON.stringify({
        request: responseText
      })
    }

    // Process the response
    let copilotMessage, responseApiMessage

    if (response === 'approve') {
      // For tool requests, handle the tool use
      const lastMessage = currentMessages[currentMessages.length - 1]
      if (lastMessage && lastMessage.say === 'tool') {
        const result = await this.task.handleToolUse(lastMessage.text, JSON.parse(lastMessage.text))
        copilotMessage = result.copilotMessage
        responseApiMessage = result.apiMessage
      } else {
        // Get API conversation history from store
        const apiConversationHistory = useChatStore.getState().apiConversationHistory

        // Process the task with the updated API conversation history
        const messages = [
          { role: 'system', content: [{ type: 'text', text: 'You are a helpful AI assistant.' }] },
          ...apiConversationHistory
        ]

        // Process the task normally
        const result = await this.task.processTask(messages)
        copilotMessage = result.copilotMessage
        responseApiMessage = result.apiMessage
      }

      // Add API message to the store
      useChatStore.getState().addApiMessage(responseApiMessage)
    } else if (response === 'reject') {
      // Handle rejection
      copilotMessage = {
        ts: Date.now(),
        type: 'say',
        say: 'completion_result',
        text: 'Request rejected. What would you like me to do instead?'
      }

      // Create API message for rejection response
      responseApiMessage = {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Request rejected. What would you like me to do instead?'
          }
        ]
      }

      // Add API message to the store
      useChatStore.getState().addApiMessage(responseApiMessage)
    }

    return { userMessage, apiRequestStartedMessage, copilotMessage }
  }
}

export default Controller
