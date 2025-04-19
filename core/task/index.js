import ContextManager from '../context/context-management/ContextManager'

class Task {
  constructor(options = {}) {
    this.taskId = Date.now().toString()
    this.apiConversationHistory = []
    this.options = options
    this.contextManager = new ContextManager()
  }

  // Initialize a new task with user input
  async startTask(userInput) {
    // Create initial task message
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      createdAt: new Date().toISOString()
    }

    // Update conversation history with user message
    this.apiConversationHistory.push({ role: 'user', content: userInput })

    // Return the user message to be added to the store
    return userMessage
  }

  // Process the current task
  async processTask(messages) {
    try {
      // Format messages for API
      const formattedMessages = this.formatMessagesForAPI(messages)

      // Make API request
      const response = await this.makeAPIRequest(formattedMessages)

      // Process response
      return await this.processAPIResponse(response)
    } catch (error) {
      return this.handleAPIError(error)
    }
  }

  // Format messages for API request
  formatMessagesForAPI(messages) {
    // Apply context optimizations if needed
    const optimizedMessages = this.contextManager.getUpdatedContextMessages(messages)

    // Return the optimized messages
    return optimizedMessages
  }

  // Make API request
  async makeAPIRequest(messages) {
    // Use our dedicated message-flow API endpoint
    return await fetch('/api/message-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    }).then((res) => res.json())
  }

  // Process API response
  async processAPIResponse(response) {
    // Parse response and determine message type
    const { type, content, metadata } = this.parseResponse(response)

    // Create copilot message
    const copilotMessage = {
      id: `copilot-${Date.now()}`,
      role: 'assistant',
      type, // 'say', 'ask', 'tool', 'completion_result', etc.
      content,
      metadata,
      createdAt: new Date().toISOString()
    }

    // Update conversation history with assistant message
    this.apiConversationHistory.push({ role: 'assistant', content })

    // Return the copilot message to be added to the store
    return copilotMessage
  }

  // Parse API response
  parseResponse(response) {
    // Default to text response
    let type = 'say'
    let content = response.content || ''
    let metadata = {}

    // Check for specific response types
    if (response.type === 'question') {
      type = 'ask'
    } else if (response.type === 'tool') {
      type = 'tool'
      metadata = response.tool || {}
    } else if (response.type === 'completion') {
      type = 'completion_result'
    }

    return { type, content, metadata }
  }

  // Handle API errors
  handleAPIError(error) {
    // Create error message
    return {
      id: `copilot-${Date.now()}`,
      role: 'assistant',
      type: 'error',
      content: `An error occurred: ${error.message}`,
      createdAt: new Date().toISOString()
    }
  }

  // Handle tool use
  async handleToolUse(toolData, metadata) {
    // Process tool use request
    // Implement tool-specific logic
    console.log('Tool use:', toolData, metadata)

    // Return a response based on the tool use
    return {
      id: `copilot-${Date.now()}`,
      role: 'assistant',
      type: 'say',
      content: `Tool ${metadata.name || 'unknown'} was used successfully.`,
      metadata: { toolResult: true },
      createdAt: new Date().toISOString()
    }
  }
}

export default Task
