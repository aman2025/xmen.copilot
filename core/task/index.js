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
    await this.say(
      'api_req_started',
      JSON.stringify({
        request: 'start request Loading...'
      })
    )

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

    const lastApiReqIndex = this.findLastIndex(
      this.clineMessages,
      (m) => m.say === 'api_req_started'
    )
    this.clineMessages[lastApiReqIndex].text = JSON.stringify({
      request: userContent.map(() => '[Text:] or [Tool Use:]')
    })
    // 更新最后一个clineMessage
    await this.saveClineMessagesAndUpdateHistory(this.clineMessages[lastApiReqIndex])

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
          params: block.params
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
              description: `Execute ${block.name} with parameters: ${JSON.stringify(block.params)}`
            })
          )
        } else {
          // Auto-approve and execute the tool
          await this.executeToolCall(block.name, block.params)
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
    if (!this.pendingToolCall) {
      console.warn('No pending tool call to approve/reject')
      return
    }

    const { name, params } = this.pendingToolCall

    if (response === 'approved') {
      // Execute the tool
      await this.executeToolCall(name, params)
    } else {
      // Handle rejection
      await this.handleToolRejection(name)
    }

    // Reset approval state
    this.waitingForApproval = false
    this.pendingToolCall = null
  }

  // New method to execute a tool call
  async executeToolCall(toolName, params) {
    try {
      if (!toolName) {
        throw new Error('Tool name is required')
      }

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
      const result = await toolFunction(params)

      // Add tool result to the conversation
      await this.say(
        'tool_result',
        JSON.stringify({
          tool: toolName,
          result
        })
      )

      // Add API request started message for the tool result
      await this.say(
        'api_req_started',
        JSON.stringify({
          request: `<r>\n${JSON.stringify(result)}\n</r>`
        })
      )

      // Continue the conversation with the tool result
      await this.addToApiConversationHistory({
        role: 'assistant',
        tool_calls: [
          {
            id: Date.now().toString(),
            function: {
              name: toolName,
              arguments: JSON.stringify(params || {})
            }
          }
        ],
        content: ''
      })

      // Add the tool result to the API conversation
      // Format the result as a string as expected by the API
      await this.addToApiConversationHistory({
        role: 'tool',
        tool_call_id: Date.now().toString(),
        content: typeof result === 'string' ? result : JSON.stringify(result)
      })

      // After a tool message, we need to add an assistant message before continuing with user input
      // This is required by the Mistral API which expects assistant after tool, not user
      await this.addToApiConversationHistory({
        role: 'assistant',
        content: `I've received the result from the ${toolName} tool. Here's what I found: ${typeof result === 'string' ? result : JSON.stringify(result)}`
      })

      // Now we can continue with the next user message
      // Convert the tool result to a text message that the API can understand
      await this.say('text', `Tool ${toolName} returned: ${JSON.stringify(result)}`)

      // We don't need to call recursivelyMakeClineRequests here as it would add a user message
      // which would cause the "Unexpected role 'user' after role 'tool'" error
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error)
      await this.say('error', `Error executing tool ${toolName}: ${error.message}`)

      // Reset approval state since tool execution failed
      this.waitingForApproval = false
      this.pendingToolCall = null
    }
  }

  // New method to handle tool rejection
  async handleToolRejection(toolName) {
    await this.say('text', `Tool execution for ${toolName} was rejected.`)

    // Add assistant message to API conversation about the rejection
    // This follows the correct sequence: assistant -> user -> assistant
    await this.addToApiConversationHistory({
      role: 'assistant',
      content: `I understand that you don't want to execute the ${toolName} tool. Let me help you in another way.`
    })

    // Now we can display the rejection message to the user
    await this.say(
      'text',
      `The ${toolName} tool was not executed. Let me know if you need anything else.`
    )
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
    // Ensure the message is properly formatted for the API
    let formattedMessage = message

    // If the message has a content property that's an array, convert it to a string
    if (message.content && Array.isArray(message.content)) {
      formattedMessage = {
        ...message,
        content: message.content
          .map((item) => {
            if (typeof item === 'object' && item.type === 'text') {
              return item.text
            }
            return JSON.stringify(item)
          })
          .join('\n')
      }
    }

    this.apiConversationHistory.push(formattedMessage)
    await useChatStore.getState().saveApiConversationHistory(formattedMessage)
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

    return validatedMessages
  }

  async attemptApiRequest(messages) {
    // Validate the conversation history before making the API request
    const validatedMessages = this.validateConversationHistory(messages)

    return await fetch('/api/message-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: validatedMessages })
    }).then((res) => res.json())
  }

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
