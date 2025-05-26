import ContextManager from '../context/context-management/ContextManager'
import useChatStore from '../../store/useChatStore'
import { parseAssistantMessage } from '../assistant-message/parse-assistant-message'

class Task {
  constructor(task = null) {
    this.isInitialized = false
    this.apiConversationHistory = []
    this.clineMessages = []
    this.assistantMessageContent = null
    this.taskId = Date.now().toString()
    this.contextManager = new ContextManager()
    this.pendingToolCall = null
    this.waitingForApproval = false
    this.lastToolCallId = null // Track the last tool call ID for debugging

    // Start task if initial task is provided
    if (task) {
      this.startTask(task)
    }
  }

  getApiConversationHistory() {
    return useChatStore.getState().apiConversationHistory
  }

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

    // Construct the final text for the api_req_started message first.
    // This maps the userContent to a more descriptive request string.
    const apiReqStartedText = JSON.stringify({
      request: userContent.map((item) => {
        if (typeof item === 'object' && item.type === 'text') return '[Text Content]'
        if (typeof item === 'object' && item.type === 'tool_result') return '[Tool Result]'
        if (typeof item === 'string') return '[Text Content]' // Handle plain strings if they appear
        return '[Processing Content]' // Fallback for other types
      })
    })

    // Add the api_req_started message to clineMessages and the store once.
    await this.say('api_req_started', apiReqStartedText)

    // Format user content properly for the API
    let formattedContent = userContent

    // If userContent is an array, convert it to a string format the API expects
    if (Array.isArray(userContent)) {
      if (userContent.length === 1 && userContent[0].type === 'text') {
        formattedContent = userContent[0].text
      } else {
        formattedContent = userContent
          .map((item) => {
            if (typeof item === 'object' && item.type === 'text') {
              return item.text
            }
            return JSON.stringify(item)
          })
          .join('\n')
      }
    }

    // Check if the last message in the conversation history is a tool message
    // If so, we need to add an assistant message before adding a user message
    const lastMessage =
      this.apiConversationHistory.length > 0
        ? this.apiConversationHistory[this.apiConversationHistory.length - 1]
        : null

    if (lastMessage && lastMessage.role === 'tool') {
      // Add an assistant message to maintain the correct sequence
      await this.addToApiConversationHistory({
        role: 'assistant',
        content: 'I understand. Let me help you with that.'
      })
    }

    // Now we can add the user message
    await this.addToApiConversationHistory({
      role: 'user',
      content: formattedContent
    })
    console.log('apiConversationHistory: ', this.apiConversationHistory)
    console.log('clineMessages: ', this.clineMessages)

    // 发起api请求
    const assistantMessage = await this.attemptApiRequest(this.apiConversationHistory)
    this.assistantMessageContent = parseAssistantMessage(assistantMessage)

    // present content to user
    await this.presentAssistantMessage()

    // Only add to API conversation history if not waiting for approval
    if (!this.waitingForApproval) {
      await this.addToApiConversationHistory(assistantMessage)
    }
  }

  async presentAssistantMessage() {
    // Handle the message block from assistantMessageContent
    const block = this.assistantMessageContent

    // If no message content, log warning and return
    if (!block) {
      console.warn('No assistant message content to present')
      return
    }

    const { type } = block

    switch (type) {
      case 'text': {
        await this.say('text', block.content)
        break
      }
      case 'tool_use': {
        // Store the tool call for potential approval
        this.pendingToolCall = {
          name: block.name,
          params: block.params,
          toolCallId: block.toolCallId // Store the tool call ID from the assistant message
        }

        // Check if this tool needs approval
        const needsApproval = this.doesToolNeedApproval()

        if (needsApproval) {
          // Ask for user approval
          this.waitingForApproval = true
          await this.ask(
            'call_sys_tool',
            JSON.stringify({
              tool: block.name,
              parameters: block.params,
              toolCallId: block.toolCallId, // Include the tool call ID in the approval request
              description: `Execute ${block.name} with parameters: ${JSON.stringify(block.params)}`
            })
          )
        } else {
          // Auto-approve and execute the tool
          await this.executeTool(block.name, block.params, block.toolCallId)
        }
        break
      }
      default: {
        console.warn('Unknown message type:', type)
        break
      }
    }
  }

  // New method to check if a tool needs approval
  doesToolNeedApproval() {
    // For now, all tools need approval
    // This could be customized based on tool name or other factors in the future
    return true
  }

  // New method to handle user approval response
  async handleApprovalResponse(response) {
    console.log('handleApprovalResponse called with response:', response)
    console.log(
      'Current state - waitingForApproval:',
      this.waitingForApproval,
      'pendingToolCall:',
      this.pendingToolCall
    )

    if (!this.pendingToolCall) {
      console.warn('No pending tool call to approve/reject')
      return
    }

    // Store the current values before processing
    const { name, params, toolCallId } = this.pendingToolCall

    // Reset approval state immediately to prevent race conditions
    // We'll set it back to true if needed during tool execution
    this.waitingForApproval = false
    this.pendingToolCall = null

    if (response === 'approved') {
      console.log(`Executing tool ${name} with params:`, params)
      // Execute the tool with the stored tool call ID
      await this.executeTool(name, params, toolCallId)
    } else {
      console.log(`Rejecting tool ${name}`)
      // Handle rejection
      await this.handleToolRejection(name)
    }
  }

  // New method to execute a tool call
  async executeTool(toolName, params, toolCallId) {
    try {
      if (!toolName) {
        throw new Error('Tool name is required')
      }

      // If no tool call ID is provided, generate one
      const actualToolCallId = toolCallId || this.generateToolCallId()

      console.log(`Executing tool ${toolName} with ID ${actualToolCallId}`)

      // Store the tool call ID for later reference
      this.lastToolCallId = actualToolCallId

      // Import the tool dynamically
      let toolModule
      try {
        toolModule = await import(`../../tool-calls/tools/${toolName}.js`)
      } catch (importError) {
        console.error(`Error importing tool ${toolName}:`, importError)
        throw new Error(`Tool '${toolName}' not found`)
      }

      const toolFunction = toolModule.default

      if (typeof toolFunction !== 'function') {
        throw new Error(`Tool '${toolName}' is not a function`)
      }

      // Execute the tool
      console.log(`Calling tool function ${toolName} with params:`, params)
      const result = await toolFunction(params)
      console.log(`Tool ${toolName} returned result:`, result)

      // Add tool result to the clineMessages for UI display
      await this.say(
        'tool_result',
        JSON.stringify({
          tool: toolName,
          result
        })
      )

      // Add the assistant message (that initiated the tool call) to API history
      // This ensures the AI's request for the tool is recorded.
      console.log(`Adding assistant message with tool call ID: ${actualToolCallId} to API history`)
      await this.addToApiConversationHistory({
        role: 'assistant',
        tool_calls: [
          {
            id: actualToolCallId,
            type: 'function', // Ensure 'type: function' is included for Mistral compatibility
            function: {
              name: toolName,
              arguments: JSON.stringify(params || {})
            }
          }
        ],
        content: '' // Mistral allows null or empty content when tool_calls are present
      })

      // Then, add the tool result to the API conversation history
      console.log(`Adding tool response with tool_call_id: ${actualToolCallId} to API history`)
      await this.addToApiConversationHistory({
        role: 'tool',
        tool_call_id: actualToolCallId,
        content: typeof result === 'string' ? result : JSON.stringify(result)
      })

      // Add a user message to API history to prompt the AI with the tool's result.
      // This maintains the conversational flow for the AI.
      const userPromptAfterTool = `The ${toolName} tool was executed. Result: ${typeof result === 'string' ? result : JSON.stringify(result)}. What is the next step based on this information?`
      await this.addToApiConversationHistory({
        role: 'user',
        content: userPromptAfterTool
      })

      // Indicate in the UI that a new request to the AI is being made.
      await this.say(
        'api_req_started',
        JSON.stringify({
          request: 'Continuing conversation after tool execution and providing results to AI...'
        })
      )

      // Make a new API request to get the AI's response to the tool execution.
      const nextAssistantMessageFromAI = await this.attemptApiRequest(this.apiConversationHistory)
      this.assistantMessageContent = parseAssistantMessage(nextAssistantMessageFromAI)

      // Present the AI's actual response to the user.
      // `presentAssistantMessage` handles calling `this.say` with appropriate types.
      await this.presentAssistantMessage()

      // Add the AI's response to the API conversation history.
      // `addToApiConversationHistory` handles duplicate prevention.
      await this.addToApiConversationHistory(nextAssistantMessageFromAI)
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error)
      await this.say('error', `Error executing tool ${toolName}: ${error.message}`)

      // Error handling remains, approval state is managed by `handleApprovalResponse`
    }
  }

  // New method to handle tool rejection
  async handleToolRejection(toolName) {
    // Display a message to the user in the UI confirming the rejection.
    await this.say('text', `Tool execution for ${toolName} was rejected.`)

    // Add a user message to API history to inform the AI about the rejection and prompt the next action.
    await this.addToApiConversationHistory({
      role: 'user',
      content: `I have rejected the execution of the ${toolName} tool. What else can you help me with?`
    })

    // Indicate in the UI that a new request to the AI is being made.
    await this.say(
      'api_req_started',
      JSON.stringify({
        request: 'Continuing conversation after tool rejection...'
      })
    )

    // Make a new API request to get the AI's response to the tool rejection.
    const nextAssistantMessageFromAI = await this.attemptApiRequest(this.apiConversationHistory)
    this.assistantMessageContent = parseAssistantMessage(nextAssistantMessageFromAI)

    // Present the AI's actual response to the user.
    // `presentAssistantMessage` handles calling `this.say` with appropriate types.
    await this.presentAssistantMessage()

    // Add the AI's response to the API conversation history.
    // `addToApiConversationHistory` handles duplicate prevention.
    await this.addToApiConversationHistory(nextAssistantMessageFromAI)
  }

  // New method to ask for user input
  async ask(askType, text) {
    const askTs = Date.now()
    await this.addToClineMessages({
      ts: askTs,
      type: 'ask',
      ask: askType,
      text
    })
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
    // Helper method to prevent duplicate messages
    const isDuplicate = this.apiConversationHistory.some((msg) => {
      if (msg.role !== message.role) return false

      // For assistant messages with tool calls, check tool call IDs
      if (
        msg.role === 'assistant' &&
        msg.tool_calls &&
        Array.isArray(msg.tool_calls) &&
        message.tool_calls &&
        Array.isArray(message.tool_calls)
      ) {
        return msg.tool_calls.some((tc1) =>
          message.tool_calls.some((tc2) => tc1.id === tc2.id && tc1.function?.name === tc2.function?.name)
        )
      }

      // For tool responses, check tool_call_id
      if (msg.role === 'tool' && message.role === 'tool') {
        return msg.tool_call_id === message.tool_call_id
      }

      // For other messages (user, assistant with content), compare content
      // Avoid comparing content for assistant messages that primarily carry tool_calls (content might be "" or null)
      if (
        message.role === 'assistant' &&
        (message.tool_calls_length > 0 || (msg.tool_calls && msg.tool_calls_length > 0))
      ) {
        return false // Don't consider content for de-duplication if tool_calls are present
      }
      return msg.content === message.content
    })

    if (!isDuplicate) {
      this.apiConversationHistory.push(message)
    } else {
      console.log('Prevented duplicate message addition to conversation history:', {
        role: message.role,
        contentPreview: typeof message.content === 'string' ? message.content.substring(0, 50) : undefined,
        toolCallId: message.tool_calls?.[0]?.id || message.tool_call_id
      })
    }
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

  // Helper method to validate conversation history
  validateConversationHistory(messages) {
    // Use the preprocessMessages function from mistral.js
    // This is just a simplified version that handles the most common issues

    if (!messages || messages.length === 0) {
      return messages
    }

    const validatedMessages = [...messages]

    // Check for any sequence where a tool message is followed by a user message
    for (let i = 0; i < validatedMessages.length - 1; i++) {
      if (validatedMessages[i].role === 'tool' && validatedMessages[i + 1].role === 'user') {
        // Insert an assistant message between them
        validatedMessages.splice(i + 1, 0, {
          role: 'assistant',
          content: 'I understand. Let me help you with that.'
        })
        // Skip the newly inserted message in the next iteration
        i++
      }
    }

    // Check if the last message is from the assistant
    // Mistral API requires the last message to be from the user or a tool
    const lastMessage = validatedMessages[validatedMessages.length - 1]
    if (lastMessage && lastMessage.role === 'assistant') {
      // Add a user message to ensure the last message is from the user
      validatedMessages.push({
        role: 'user',
        content: 'Please continue with the information you found.'
      })
    }

    return validatedMessages
  }

  async attemptApiRequest(messages) {
    console.log(
      'Original messages before validation:',
      JSON.stringify(
        messages.map((m) => ({
          role: m.role,
          tool_call_id: m.tool_call_id,
          tool_calls: m.tool_calls ? m.tool_calls.map((tc) => tc.id) : undefined
        })),
        null,
        2
      )
    )

    // Validate the conversation history before making the API request
    const validatedMessages = this.validateConversationHistory(messages)

    try {
      const response = await fetch('/api/message-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: validatedMessages })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API request failed with status ${response.status}:`, errorText)
        throw new Error(`API request failed: ${response.status} ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error in attemptApiRequest:', error)
      // Return a fallback response
      return {
        role: 'assistant',
        content: `I'm sorry, but I encountered an error: ${error.message}. Please try again.`
      }
    }
  }

  // Generate a valid tool call ID (alphanumeric with length of 9)
  generateToolCallId() {
    // Generate a random string of alphanumeric characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 9; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  async handleToolUse(_toolData, metadata) {
    const clineMessage = {
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

    return { clineMessage, apiMessage }
  }
}

export default Task
