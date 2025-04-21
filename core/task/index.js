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
    // Create initial task message for UI display
    const userMessage = {
      ts: Date.now(),
      type: 'ask',
      ask: 'followup',
      text: userInput
    }

    // Update API conversation history with user message
    this.apiConversationHistory.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: userInput
        }
      ]
    })

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
    // Handle the specific response format from the example
    if (response.id && response.id.startsWith('response-')) {
      // Create copilot message for UI display using the direct response format
      const copilotMessage = {
        ts: Date.now(),
        type: 'say',
        say: 'completion_result',
        text: response.content
      }

      // Update API conversation history with assistant message
      this.apiConversationHistory.push({
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: response.content
          }
        ]
      })

      return copilotMessage
    }

    // For other response formats, use the parser
    const { type, content, metadata } = this.parseResponse(response)

    // Create copilot message for UI display
    const copilotMessage = {
      ts: Date.now(),
      type: 'say',
      say: type, // 'api_req_started', 'tool', 'completion_result', etc.
      text: type === 'tool' ? JSON.stringify(metadata) : content
    }

    // Update API conversation history with assistant message
    this.apiConversationHistory.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: content
        }
      ]
    })

    // Return the copilot message to be added to the store
    return copilotMessage
  }

  // Parse API response
  parseResponse(response) {
    // Default to completion result for regular text responses
    let type = 'completion_result'
    let content = response.content || ''
    let metadata = {}

    // Handle different response formats
    if (response.id && response.id.startsWith('response-')) {
      // This is the format from your example
      type = 'completion_result'
      content = response.content
      metadata = response.metadata || {}
    }
    // Check for specific response types in the standard format
    else if (response.type === 'question') {
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
      // Handle explicit 'say' type
      type = 'completion_result'
    }

    return { type, content, metadata }
  }

  // Handle API errors
  handleAPIError(error) {
    // Create error message for UI display
    return {
      ts: Date.now(),
      type: 'say',
      say: 'error',
      text: `An error occurred: ${error.message}`
    }
  }

  // Handle tool use
  async handleToolUse(_toolData, metadata) {
    // Process tool use request
    // Implement tool-specific logic
    // Silently process tool use without console.log

    // Return a response based on the tool use for UI display
    const toolResponse = {
      ts: Date.now(),
      type: 'say',
      say: 'tool',
      text: JSON.stringify({
        tool: metadata.name || 'unknown',
        content: `Tool was used successfully.`
      })
    }

    // Update API conversation history with tool response
    this.apiConversationHistory.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: `Tool ${metadata.name || 'unknown'} was used successfully.`
        }
      ]
    })

    return toolResponse
  }
}

export default Task
