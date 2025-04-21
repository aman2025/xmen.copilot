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
  async handleUserMessage(text, currentMessages) {
    if (!this.task) {
      // Initialize a new task if none exists
      const userMessage = await this.initTask(text)

      // Process the task
      const copilotMessage = await this.task.processTask([
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: text }
      ])

      return { userMessage, copilotMessage }
    } else {
      // Add user message
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString()
      }

      // Update conversation history
      const messages = [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        ...currentMessages.map((m) => ({
          role: m.role,
          content: m.content
        })),
        { role: 'user', content: text }
      ]

      // Process the task
      const copilotMessage = await this.task.processTask(messages)

      return { userMessage, copilotMessage }
    }
  }

  // Handle user response to a question
  async handleUserResponse(response, text, currentMessages) {
    if (!this.task) {
      return null
    }

    // Add user response as a message
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text || (response === 'approve' ? 'I approve.' : 'I reject.'),
      createdAt: new Date().toISOString()
    }

    // Update conversation history
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      ...currentMessages.map((m) => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: userMessage.content }
    ]

    // Process the response
    let copilotMessage

    if (response === 'approve') {
      // For tool requests, handle the tool use
      const lastMessage = currentMessages[currentMessages.length - 1]
      if (lastMessage && lastMessage.type === 'tool') {
        copilotMessage = await this.task.handleToolUse(lastMessage.content, lastMessage.metadata)
      } else {
        // Process the task normally
        copilotMessage = await this.task.processTask(messages)
      }
    } else if (response === 'reject') {
      // Handle rejection
      copilotMessage = {
        id: `copilot-${Date.now()}`,
        role: 'assistant',
        type: 'say',
        content: 'Request rejected. What would you like me to do instead?',
        createdAt: new Date().toISOString()
      }
    }

    return { userMessage, copilotMessage }
  }
}

export default Controller
