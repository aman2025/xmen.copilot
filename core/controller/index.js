import Task from '../task'

class Controller {
  constructor() {
    this.task = null
  }

  // Initialize a new task
  async initTask(userInput) {
    // Create a new task
    this.task = new Task()

    // Start the task with user input
    const userMessage = await this.task.startTask(userInput)

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

      // Process the task
      const copilotMessage = await this.task.processTask([
        { role: 'system', content: [{ type: 'text', text: 'You are a helpful AI assistant.' }] },
        this.task.apiConversationHistory[0] // Use the properly formatted user message
      ])

      return { userMessage, apiRequestStartedMessage, copilotMessage }
    } else {
      // Add user message for UI display
      const userMessage = {
        ts: Date.now(),
        type: 'ask',
        ask: 'followup',
        text: text
      }

      // Update API conversation history
      this.task.apiConversationHistory.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: text
          }
        ]
      })

      // Create API request started message
      const apiRequestStartedMessage = {
        ts: Date.now() + 100,
        type: 'say',
        say: 'api_req_started',
        text: JSON.stringify({
          request: text
        })
      }

      // Process the task with the updated API conversation history
      const messages = [
        { role: 'system', content: [{ type: 'text', text: 'You are a helpful AI assistant.' }] },
        ...this.task.apiConversationHistory
      ]

      // Process the task
      const copilotMessage = await this.task.processTask(messages)

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

    // Update API conversation history
    this.task.apiConversationHistory.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: responseText
        }
      ]
    })

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
    let copilotMessage

    if (response === 'approve') {
      // For tool requests, handle the tool use
      const lastMessage = currentMessages[currentMessages.length - 1]
      if (lastMessage && lastMessage.say === 'tool') {
        copilotMessage = await this.task.handleToolUse(
          lastMessage.text,
          JSON.parse(lastMessage.text)
        )
      } else {
        // Process the task with the updated API conversation history
        const messages = [
          { role: 'system', content: [{ type: 'text', text: 'You are a helpful AI assistant.' }] },
          ...this.task.apiConversationHistory
        ]

        // Process the task normally
        copilotMessage = await this.task.processTask(messages)
      }
    } else if (response === 'reject') {
      // Handle rejection
      copilotMessage = {
        ts: Date.now(),
        type: 'say',
        say: 'completion_result',
        text: 'Request rejected. What would you like me to do instead?'
      }

      // Update API conversation history with rejection response
      this.task.apiConversationHistory.push({
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Request rejected. What would you like me to do instead?'
          }
        ]
      })
    }

    return { userMessage, apiRequestStartedMessage, copilotMessage }
  }
}

export default Controller
