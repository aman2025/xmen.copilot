import ContextManager from '../context/context-management/ContextManager'
import useChatStore from '../../store/useChatStore'
import useGlobalStore from '../../store/useGlobalStore'
import { parseAssistantMessage } from '../assistant-message/parse-assistant-message'

class Task {
  constructor(
    chatId,
    initialUserInput = null,
    existingApiHistory = [],
    existingClineMessages = [],
    environmentDetails = null
  ) {
    this.chatId = chatId
    this.isInitialized = false
    this.apiConversationHistory = [...existingApiHistory] // Initialize with fetched history
    this.clineMessages = [...existingClineMessages] // Initialize with fetched history
    this.assistantMessageContent = null
    this.contextManager = new ContextManager()
    this.pendingToolCall = null
    this.waitingForApproval = false
    this.lastToolCallId = null
    
    // Use provided environmentDetails or get from useGlobalStore
    this.environmentDetails = environmentDetails || {
      user: useGlobalStore.getState().user,
      system: useGlobalStore.getState().system
    }
    
    console.log(`Task instantiated for chatId: ${this.chatId}`)
    console.log('Initial API History:', this.apiConversationHistory)
    console.log('Initial Cline Messages:', this.clineMessages)

    if (this.chatId && !initialUserInput && existingClineMessages.length > 0) {
      // Resuming task: populate store with loaded clineMessages
      // Ensure not to add duplicates if store already has them from a previous load
      useChatStore.getState().setClineMessages([...this.clineMessages]) // Use a setter to replace
      console.log(`Task for ${this.chatId} resumed, clineMessages restored to store.`)
      // Consider if any specific "resumption" message should be added to UI
      // this.say('text', '[Task Resumed]', true); // Example, true to persist
      this.isInitialized = true // Mark as initialized if loading existing
    }

    if (initialUserInput && this.chatId) {
      this.startTask(initialUserInput)
    } else if (!this.chatId) {
      console.error('Task initialized without a chatId!')
    }
  }

  // Renamed from getApiConversationHistory as it's now a local property
  getLocalApiConversationHistory() {
    return this.apiConversationHistory
  }

  async startTask(taskInputText) {
    console.log(`Task (${this.chatId}): startTask with input:`, taskInputText)

    // Format the user input with task and environment details tags
    const formattedInput = this.formatUserInput(taskInputText)

    // The first user message for a new task
    const userApiMessage = { role: 'user', content: formattedInput }
    // This initial message is saved by the POST /api/chat/[chatId]/messages route
    this.apiConversationHistory.push(userApiMessage)

    // The corresponding cline message for UI. Also saved by POST messages route.
    // But we add it to UI immediately.
    const userMessageExists = this.clineMessages.some(
      (msg) => msg.text === taskInputText && msg.role === 'user'
    )
    if (!userMessageExists) {
      await this.say('text', taskInputText, true, 'user')
    }

    this.isInitialized = true

    // The content for the AI should be just the user's input for the first turn
    await this.initiateTaskLoop(taskInputText)
  }

  // New method to handle subsequent user inputs in an ongoing task
  async handleUserProvidedInput(userInputText) {
    if (!this.isInitialized || !this.chatId) {
      console.error('Task not initialized or no chatId, cannot handle user input.')
      return
    }
    console.log(`Task (${this.chatId}): handleUserProvidedInput:`, userInputText)

    // The optimistic update in the controller already added the message to the UI.
    // The task just needs to proceed with the API request.
    // We ensure the message is saved if it wasn't already.
    const userMessageExists = this.clineMessages.some(
      (msg) => msg.text === userInputText && msg.role === 'user'
    )
    if (!userMessageExists) {
      await this.say('text', userInputText, true, 'user') // Persist this cline message
    }

    // Make API request with this new user input
    await this.initiateTaskLoop(userInputText)
  }

  async initiateTaskLoop(userContent) {
    // Check if userContent is a string (plain text input) or an object (tool response)
    const payloadForApi =
      typeof userContent === 'object' ? userContent : { role: 'user', content: userContent }

    // PROBLEM: Here we're using the raw userContent, not the formatted version
    // FIX: If it's a user message, format it with task and environment details
    if (payloadForApi.role === 'user') {
      payloadForApi.content = this.formatUserInput(payloadForApi.content)
    }

    // Add the formatted user message to the API conversation history
    await this.addToApiConversationHistory(payloadForApi, true)

    // Show API request started message with the actual user input instead of "Processing..."
    await this.say('api_req_started', JSON.stringify({ request: userContent }), true, 'assistant') // Use actual userContent

    try {
      const assistantRawApiMessage = await this.attemptApiRequest(payloadForApi)
      if (!assistantRawApiMessage || !assistantRawApiMessage.role) {
        throw new Error('Received invalid or empty response from API.')
      }

      // Update the API request message to show it's completed
      await this.updateClineMessage('api_req_started', { status: 'completed' })

      // Add AI's response to local API history. Backend already saved it.
      await this.addToApiConversationHistory(assistantRawApiMessage, false) // false: don't saveToBackend, it's already saved

      this.assistantMessageContent = parseAssistantMessage(assistantRawApiMessage)

      await this.presentAssistantMessage() // This will generate and save clineMessages
    } catch (error) {
      console.error(`Task (${this.chatId}): Error in task loop:`, error)
      await this.say('error', `Error: ${error.message}`, true, 'assistant') // Persist error message
    }
  }

  // This method is effectively GONE. The main loop logic is simplified.
  // async recursivelyMakeClineRequests(userContent) { ... }

  async presentAssistantMessage() {
    const block = this.assistantMessageContent
    if (!block) {
      console.warn(`Task (${this.chatId}): No assistant message content to present`)
      return
    }

    const { type } = block
    const completionMarker = 'TASK_COMPLETE:'

    switch (type) {
      case 'text': {
        let textToSay = block.content
        if (
          block.content &&
          typeof block.content === 'string' &&
          block.content.startsWith(completionMarker)
        ) {
          textToSay = block.content.substring(completionMarker.length).trim()
          // The 'completion_result' subType will be handled by this.say()
          await this.say('completion_result', textToSay, true, 'assistant') // true to persist
        } else {
          await this.say('text', textToSay, true, 'assistant') // true to persist
        }
        break
      }
      case 'tool_use': {
        this.pendingToolCall = {
          name: block.name,
          params: block.params,
          toolCallId: block.toolCallId
        }
        const needsApproval = this.doesToolNeedApproval() // Assuming this remains true for now
        if (needsApproval) {
          this.waitingForApproval = true
          await this.ask(
            'call_sys_tool',
            JSON.stringify({
              tool: block.name,
              parameters: block.params,
              toolCallId: block.toolCallId,
              description: `Execute ${block.name} with parameters: ${JSON.stringify(block.params)}`
            }),
            true // true to persist the 'ask' message
          )
        } else {
          await this.executeTool(block.name, block.params, block.toolCallId)
        }
        break
      }
      default: {
        console.warn(`Task (${this.chatId}): Unknown message type:`, type)
        await this.say('error', `Unknown assistant message type: ${type}`, true, 'assistant')
        break
      }
    }
  }

  doesToolNeedApproval() {
    return true
  }

  async handleApprovalResponse(response) {
    console.log(`Task (${this.chatId}): handleApprovalResponse with:`, response)
    if (!this.waitingForApproval || !this.pendingToolCall) {
      console.warn(`Task (${this.chatId}): No pending tool call or not waiting for approval.`)
      // Reset states just in case
      this.waitingForApproval = false
      this.pendingToolCall = null
      return
    }

    const { name, params, toolCallId } = this.pendingToolCall
    this.waitingForApproval = false
    this.pendingToolCall = null

    // The user's decision (approve/reject text) should have already been saved as a cline message by Controller.

    if (response === 'approved') {
      console.log(`Task (${this.chatId}): Executing tool ${name} with params:`, params)
      await this.executeTool(name, params, toolCallId)
    } else {
      console.log(`Task (${this.chatId}): Tool ${name} rejected.`)
      // Inform AI about rejection
      const rejectionMessageForAI = {
        role: 'user', // Or 'tool' with special content indicating rejection
        content: `The user rejected the execution of the tool: ${name}. What is the next step?`
      }
      // This message needs to be sent to the AI.
      // This implies another call to initiateTaskLoop or a similar flow.
      await this.initiateTaskLoop(rejectionMessageForAI.content) // Send simple text for now
    }
  }

  async executeTool(toolName, params, toolCallId) {
    try {
      if (!toolName) throw new Error('Tool name is required')
      const actualToolCallId = toolCallId || this.generateToolCallId() // Should always have toolCallId from AI
      this.lastToolCallId = actualToolCallId

      console.log(`Task (${this.chatId}): Executing tool ${toolName} (ID: ${actualToolCallId})`)
      await this.say(
        'tool_execution_started',
        JSON.stringify({ tool: toolName, params }),
        true,
        'assistant'
      )

      let toolModule
      try {
        toolModule = await import(`../../tool-calls/tools/${toolName}.js`)
      } catch (importError) {
        console.error(`Task (${this.chatId}): Error importing tool ${toolName}:`, importError)
        throw new Error(`Tool '${toolName}' not found`)
      }
      const toolFunction = toolModule.default
      if (typeof toolFunction !== 'function')
        throw new Error(`Tool '${toolName}' is not a function`)

      const result = await toolFunction(params)
      console.log(`Task (${this.chatId}): Tool ${toolName} result:`, result)

      // Persist tool result as a cline message for UI
      await this.say(
        'tool_result',
        JSON.stringify({ tool: toolName, result, toolCallId: actualToolCallId }),
        true, // true to persist
        'assistant'
      )

      // Prepare tool result message for AI
      const toolResultMessageForAI = {
        role: 'tool',
        tool_call_id: actualToolCallId,
        content: typeof result === 'string' ? result : JSON.stringify(result)
        // name: toolName // Mistral might expect 'name' here for 'tool' role messages
      }

      // Add AI's request for tool (the original assistant message with tool_calls) to local history
      // This should have been added when assistantRawApiMessage was received.
      // Ensure it's there. The AI's message that *contained* the tool_call.
      const assistantMessageWithToolCall = this.apiConversationHistory.find(
        (msg) =>
          msg.role === 'assistant' &&
          msg.tool_calls &&
          msg.tool_calls.some((tc) => tc.id === actualToolCallId)
      )
      if (!assistantMessageWithToolCall) {
        console.warn(
          `Task (${this.chatId}): Could not find original assistant message for tool_call_id ${actualToolCallId} in history. This is unexpected.`
        )
        // Potentially construct a placeholder if critical for context, though backend handles history now.
      }

      // Add the tool result to local API history. Backend will save it on next POST /messages call.
      // await this.addToApiConversationHistory(toolResultMessageForAI, false); // Already handled by backend

      // Continue the conversation by sending the tool result to the AI
      await this.initiateTaskLoop(toolResultMessageForAI)
    } catch (error) {
      console.error(`Task (${this.chatId}): Error executing tool ${toolName}:`, error)
      await this.say('error', `Error executing tool ${toolName}: ${error.message}`, true, 'assistant')
      // Inform AI about tool execution error
      const toolErrorMessageForAI = {
        role: 'tool',
        tool_call_id: toolCallId, // Use the original toolCallId
        content: JSON.stringify({ error: `Tool execution failed: ${error.message}` })
        // name: toolName
      }
      await this.initiateTaskLoop(toolErrorMessageForAI)
    }
  }

  // handleToolRejection logic is now partly in handleApprovalResponse
  // async handleToolRejection(toolName) { ... }

  async ask(askType, text, saveToBackend = false) {
    const askTs = Date.now()
    const clineMessage = {
      chatId: this.chatId, // Important for persistence
      ts: askTs,
      type: 'ask',
      ask: askType,
      text
    }
    await this.addToClineMessages(clineMessage, saveToBackend)
  }

  async say(sayType, text, saveToBackend = false, role = null) {
    const sayTs = Date.now()
    const clineMessage = {
      chatId: this.chatId, // Important for persistence
      ts: sayTs,
      type: 'say',
      say: sayType, // this 'say' is the subType from schema (e.g. 'text', 'tool_result')
      text,
      role
    }
    await this.addToClineMessages(clineMessage, saveToBackend)
  }

  async addToClineMessages(message, saveToBackend = false) {
    // Ensure message has chatId if not already present
    if (!message.chatId && this.chatId) {
      message.chatId = this.chatId
    }

    this.clineMessages.push(message) // Add to local cache
    // Update Zustand store. This should append, not replace, unless it's an initial load.
    useChatStore.getState().addClineMessage(message)

    if (saveToBackend && this.chatId && message.chatId === this.chatId) {
      try {
        // Prepare the payload for the backend, ensuring 'subType' is correctly mapped.
        const payloadForBackend = {
          ts: Number(message.ts), // Ensure ts is a number
          type: message.type,
          subType: message.type === 'say' ? message.say : message.ask,
          text: message.text,
          role: message.role
          // chatId is taken from the URL parameters on the backend, so not needed in the body here.
        }

        const response = await fetch(`/api/chat/${this.chatId}/cline-messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadForBackend) // Send the corrected payload
        })
        if (!response.ok) {
          console.error(
            `Task (${this.chatId}): Failed to save cline message to backend: ${response.statusText}`,
            await response.text()
          )
        } else {
          console.log(`Task (${this.chatId}): Cline message saved to backend successfully.`)
        }
      } catch (error) {
        console.error(`Task (${this.chatId}): Error saving cline message to backend`, error)
      }
    } else if (saveToBackend && !this.chatId) {
      console.warn(`Task (${this.chatId}): Cannot save cline message, chatId is missing.`)
    }
  }

  // addToApiConversationHistory: only adds to local history. Backend manages persistence.
  async addToApiConversationHistory(
    message,
    saveToBackend = false /* This param is now mostly ignored */
  ) {
    const isDuplicate = this.apiConversationHistory.some((msg) => {
      if (msg.role !== message.role) return false
      if (msg.role === 'assistant' && msg.tool_calls && message.tool_calls) {
        return msg.tool_calls.some((tc1) => message.tool_calls.some((tc2) => tc1.id === tc2.id))
      }
      if (msg.role === 'tool' && message.role === 'tool') {
        return msg.tool_call_id === message.tool_call_id
      }
      // For content comparison, ensure it's not just empty/null content for tool_calls messages
      if (
        message.role === 'assistant' &&
        (message.tool_calls?.length > 0 || msg.tool_calls?.length > 0)
      ) {
        return false
      }
      return msg.content === message.content
    })

    if (!isDuplicate) {
      this.apiConversationHistory.push(message)
      // No direct saving to backend here; it's handled by the main POST /messages flow
      // or if a specific API message needs ad-hoc saving (rare).
      console.log(
        `Task (${this.chatId}): Added to local apiConversationHistory:`,
        message.role,
        message.content
          ? message.content.substring(0, 50)
          : message.tool_calls
            ? 'Tool Call'
            : 'No Content'
      )
    } else {
      console.log(
        `Task (${this.chatId}): Prevented duplicate message addition to local apiConversationHistory.`
      )
    }
  }

  // saveClineMessagesAndUpdateHistory is replaced by addToClineMessages with saveToBackend flag
  // findLastIndex - utility, keep it if used, or remove.

  // validateConversationHistory - This logic is now primarily on the backend before calling Mistral.
  // The client sends individual messages, and the backend assembles and validates history.

  async attemptApiRequest(messagePayloadToPost) {
    // messagePayloadToPost is the user/tool message
    if (!this.chatId) {
      console.error(`Task (${this.chatId}): Cannot make API request without chatId.`)
      throw new Error('Chat ID is missing for API request.')
    }
    console.log(`Task (${this.chatId}): Attempting API request with payload:`, messagePayloadToPost)

    try {
      const response = await fetch(`/api/chat/${this.chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The body should be structured as the API expects, e.g., { message: messagePayloadToPost }
        body: JSON.stringify({ message: messagePayloadToPost })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Task (${this.chatId}): API request failed (${response.status}):`, errorText)
        throw new Error(`API request failed: ${response.status} ${errorText}`)
      }
      const assistantRawApiResponse = await response.json() // Expects the raw AI message object
      console.log(`Task (${this.chatId}): Received raw AI response:`, assistantRawApiResponse)
      return assistantRawApiResponse
    } catch (error) {
      console.error(`Task (${this.chatId}): Error in attemptApiRequest:`, error)
      // Return a structured error that can be parsed by parseAssistantMessage
      return {
        role: 'assistant',
        content: `I encountered an error trying to process your request: ${error.message}. Please try again.`
      }
    }
  }

  generateToolCallId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 9; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `clt_${result}` // Prefix to denote client-generated if ever needed for debugging
  }

  // Add a new method to format the user input
  formatUserInput(userInput) {
    const { user, system } = this.environmentDetails

    return `<task>
    ${userInput}
  </task>

  <environment_details>
    # User info
          Name: ${user.name}
          Email: ${user.email}
    # System info
          Mode: ${system.mode}
          Version: ${system.version}
  </environment_details>`
  }

  // Add a new method to update existing cline messages
  async updateClineMessage(sayType, updates) {
    // Get the current clineMessages from the store
    const store = useChatStore.getState()
    const clineMessages = [...store.clineMessages]

    // Find the index of the last message with the specified sayType by searching backwards
    let index = -1
    for (let i = clineMessages.length - 1; i >= 0; i--) {
      if (clineMessages[i].type === 'say' && clineMessages[i].say === sayType) {
        index = i
        break
      }
    }

    if (index !== -1) {
      // Update the message with the new properties
      clineMessages[index] = {
        ...clineMessages[index],
        ...updates
      }

      // Update the store
      store.setClineMessages(clineMessages)

      // If we need to persist this to the backend
      if (this.chatId) {
        try {
          await fetch(`/api/chat/${this.chatId}/cline-messages`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messageId: clineMessages[index].id,
              updates
            })
          })
        } catch (error) {
          console.error(`Task (${this.chatId}): Error updating cline message:`, error)
        }
      }
    }
  }
}

export default Task



