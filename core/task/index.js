import ContextManager from '../context/context-management/ContextManager'
import useChatStore from '../../store/useChatStore'

class Task {
  constructor(options = {}) {
    this.taskId = Date.now().toString()
    this.options = options
    this.contextManager = new ContextManager()
  }

  // Get the current API conversation history from the store
  getApiConversationHistory() {
    return useChatStore.getState().apiConversationHistory
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

    // Create API message for conversation history
    const apiMessage = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: userInput
        }
      ]
    }

    // Return both messages to be added to the store
    return { userMessage, apiMessage }
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

      // Create API message for conversation history
      const apiMessage = {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: response.content
          }
        ]
      }

      return { copilotMessage, apiMessage }
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

    // Create API message for conversation history
    const apiMessage = {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: content
        }
      ]
    }

    // Return both messages to be added to the store
    return { copilotMessage, apiMessage }
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

    // Create copilot message for UI display
    const copilotMessage = {
      ts: Date.now(),
      type: 'say',
      say: 'tool',
      text: JSON.stringify({
        tool: metadata.name || 'unknown',
        content: `Tool was used successfully.`
      })
    }

    // Create API message for conversation history
    const apiMessage = {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: `Tool ${metadata.name || 'unknown'} was used successfully.`
        }
      ]
    }

    // Return both messages to be added to the store
    return { copilotMessage, apiMessage }
  }
}

export default Task
