import ContextManager from '../context/context-management/ContextManager'
import EnvironmentContextManager from '../context/EnvironmentContextManager'
import useChatStore from '../../store/useChatStore'
import useGlobalStore from '../../store/useGlobalStore'
import { parseAssistantMessage } from '../assistant-message/parse-assistant-message'
import callTool, { ToolError, validateTool, hasToolAvailable, getTools, listTools } from '../../tool-calls/index.js'

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
    this.environmentContextManager = new EnvironmentContextManager()
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
      // Resuming task: The Controller now populates the store with transformed messages.
      // This ensures that historical data is correctly formatted for the UI before rendering.
      // useChatStore.getState().setClineMessages([...this.clineMessages]) // This is now redundant.
      console.log(`Task for ${this.chatId} resumed, clineMessages restored to store.`)
      // Consider if any specific "resumption" message should be added to UI
      // this.say('text', '[Task Resumed]', true); // Example, true to persist
      this.isInitialized = true // Mark as initialized if loading existing
    }

    if (!this.chatId) {
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
    // Enhanced duplicate check for user messages with file attachments
    const userMessageExists = this.clineMessages.some(
      (msg) => msg.text === taskInputText && msg.role === 'user' && msg.type === 'say'
    )
    if (!userMessageExists) {
      console.log(`Task (${this.chatId}): Adding user message to clineMessages (startTask)`)
      await this.say('text', taskInputText, true, 'user')
    } else {
      console.log(`Task (${this.chatId}): User message already exists in clineMessages (startTask)`)
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
    // Enhanced duplicate check for user messages with file attachments
    const userMessageExists = this.clineMessages.some(
      (msg) => msg.text === userInputText && msg.role === 'user' && msg.type === 'say'
    )
    if (!userMessageExists) {
      console.log(`Task (${this.chatId}): Adding user message to clineMessages (handleUserProvidedInput)`)
      await this.say('text', userInputText, true, 'user') // Persist this cline message
    } else {
      console.log(`Task (${this.chatId}): User message already exists in clineMessages (handleUserProvidedInput)`)
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
      // Use streaming for AI communication (streaming-only mode)
      const streamingResponse = await this.attemptApiRequest(payloadForApi)
      const assistantRawApiMessage = await this.handleStreamingResponse(streamingResponse)

      if (!assistantRawApiMessage || !assistantRawApiMessage.role) {
        throw new Error('Received invalid or empty response from API.')
      }

      // Update the API request message to show it's completed
      await this.updateClineMessage('api_req_started', {
        text: JSON.stringify({ request: userContent, status: 'completed' })
      })

      // Add AI's response to local API history. Backend already saved it.
      await this.addToApiConversationHistory(assistantRawApiMessage, false) // false: don't saveToBackend, it's already saved

      // If the message from the AI contains tool_calls, we need to process them.
      // Otherwise, streaming has already handled the text content.
      if (assistantRawApiMessage.tool_calls && assistantRawApiMessage.tool_calls.length > 0) {
        this.assistantMessageContent = parseAssistantMessage(assistantRawApiMessage)
        await this.presentAssistantMessage() // This will generate and save clineMessages
      }
    } catch (error) {
      console.error(`Task (${this.chatId}): Error in task loop:`, error)
      await this.say('error', `Error: ${error.message}`, true, 'assistant') // Persist error message

      // Reset streaming state on error
      useChatStore.getState().setIsStreaming(false)
      useChatStore.getState().setStreamingMessageId(null)
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

    // This is a defensive check to prevent duplicate messages after streaming.
    // If the last message in our local list has the same content as the current text block,
    // we can assume it was just added by the streaming handler and should not be added again.
    if (block.type === 'text') {
      const lastMessage = this.clineMessages[this.clineMessages.length - 1]
      if (
        lastMessage &&
        lastMessage.role === 'assistant' &&
        lastMessage.type === 'say' &&
        lastMessage.say === 'text' &&
        lastMessage.text === block.content
      ) {
        console.log(
          `Task (${this.chatId}): Skipping duplicate text presentation after streaming.`
        )
        return
      }
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
      case 'tool_use_with_content': {
        // First, display the content (which may include thinking content)
        // await this.say('text', block.content, true, 'assistant') // Removed this line as streaming already handled it

        // Then handle the tool call
        this.pendingToolCall = {
          name: block.name,
          params: block.params,
          toolCallId: block.toolCallId
        }
        const needsApproval = this.doesToolNeedApproval()
        if (needsApproval) {
          this.waitingForApproval = true
          useChatStore.getState().setIsWaitingForApproval(true)
          await this.ask(
            'call_sys_tool',
            JSON.stringify({
              tool: block.name,
              parameters: block.params,
              toolCallId: block.toolCallId,
              description: `Execute ${block.name} with parameters: ${JSON.stringify(block.params)}`
            }),
            true
          )
        } else {
          await this.executeTool(block.name, block.params, block.toolCallId)
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
          useChatStore.getState().setIsWaitingForApproval(true) // Set global state to true
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
      useChatStore.getState().setIsWaitingForApproval(false) // Reset global state to false
      return
    }

    const { name, params, toolCallId } = this.pendingToolCall
    this.waitingForApproval = false
    this.pendingToolCall = null
    useChatStore.getState().setIsWaitingForApproval(false) // Reset global state to false

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
    const actualToolCallId = toolCallId || this.generateToolCallId() // Should always have toolCallId from AI
    this.lastToolCallId = actualToolCallId

    // Pre-execution validation - handle errors before creating any UI messages
    try {
      if (!toolName) throw new Error('Tool name is required')

      console.log(`Task (${this.chatId}): Executing tool ${toolName} (ID: ${actualToolCallId})`)

      // Check if tool is available using the new tool utility system
      if (!hasToolAvailable(toolName)) {
        throw new Error(`Tool '${toolName}' is not registered in the tool system`)
      }

      // Validate tool parameters before execution
      const validation = validateTool(toolName, params)
      if (!validation.isValid) {
        const errorMessage = `Parameter validation failed for tool '${toolName}': ${validation.errors.join(', ')}`
        console.error(`Task (${this.chatId}): ${errorMessage}`)
        throw new Error(errorMessage)
      }
    } catch (preExecutionError) {
      // Handle pre-execution errors (validation, tool not found, etc.)
      // Send error directly to AI without creating intermediate API request messages
      console.error(`Task (${this.chatId}): Pre-execution error for tool ${toolName}:`, preExecutionError.message)

      const errorResult = {
        error: `Tool execution failed: ${preExecutionError.message}`,
        toolName,
        phase: 'validation'
      }
      const enhancedErrorContent = this.enhanceToolResultWithContext(errorResult, toolName)
      const toolErrorMessageForAI = {
        role: 'tool',
        tool_call_id: actualToolCallId,
        content: enhancedErrorContent
      }

      // Send error to AI with a single API request message
      await this.sendToolResultToAI(toolErrorMessageForAI, `Tool validation error for ${toolName}`, errorResult)
      return
    }

    // Tool execution phase - now we know the tool is valid and parameters are correct
    try {
      // Execute tool using the new tool utility system
      const toolResult = await callTool(toolName, params)
      const result = toolResult.data // Extract the actual data from the tool result wrapper

      console.log(`Task (${this.chatId}): Tool ${toolName} executed successfully in ${toolResult.executionTime}ms`)
      console.log(`Task (${this.chatId}): Tool ${toolName} result:`, result)

      // Tool execution completed successfully - no need to update message here
      // The API request message will be shown when sending tool result to AI

      // Prepare tool result message for AI with enhanced context
      const enhancedContent = this.enhanceToolResultWithContext(result, toolName)
      const toolResultMessageForAI = {
        role: 'tool',
        tool_call_id: actualToolCallId,
        content: enhancedContent
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

      // Send successful tool result to AI
      await this.sendToolResultToAI(toolResultMessageForAI, `Processing tool result for ${toolName}`, result)
    } catch (error) {
      // Handle execution errors (after validation passed)
      let errorMessage = error.message
      let errorDetails = {}

      if (error instanceof ToolError) {
        console.error(`Task (${this.chatId}): ToolError executing ${toolName}:`, {
          message: error.message,
          toolName: error.toolName,
          originalError: error.originalError?.message
        })
        errorDetails = {
          toolName: error.toolName,
          originalError: error.originalError?.message
        }
      } else {
        console.error(`Task (${this.chatId}): Error executing tool ${toolName}:`, error)
      }

      // Send execution error to AI
      const errorResult = {
        error: `Tool execution failed: ${errorMessage}`,
        toolName,
        details: errorDetails,
        phase: 'execution'
      }
      const enhancedErrorContent = this.enhanceToolResultWithContext(errorResult, toolName)
      const toolErrorMessageForAI = {
        role: 'tool',
        tool_call_id: actualToolCallId,
        content: enhancedErrorContent
      }

      await this.sendToolResultToAI(toolErrorMessageForAI, `Tool execution error for ${toolName}`, errorResult)
    }
  }

  // Helper method to send tool results to AI with consistent API request handling
  async sendToolResultToAI(toolMessage, requestDescription, resultData) {
    // Show loading state before making API request
    await this.say(
      'api_req_started',
      JSON.stringify({
        request: requestDescription,
        toolResult: resultData
      }),
      true,
      'assistant'
    )

    try {
      // Use streaming approach for tool result communication
      const streamingResponse = await this.attemptApiRequest(toolMessage)
      const assistantRawApiMessage = await this.handleStreamingResponse(streamingResponse)

      if (assistantRawApiMessage && assistantRawApiMessage.role) {
        // Update the API request message to show completion
        await this.updateClineMessage('api_req_started', {
          text: JSON.stringify({
            request: requestDescription,
            status: 'completed',
            toolResult: resultData
          })
        })

        // Add AI's response to local API history
        await this.addToApiConversationHistory(assistantRawApiMessage, false)

        // If the message from the AI is just content, streaming has already handled it.
        // If there are tool_calls, we need to process them.
        if (assistantRawApiMessage.tool_calls && assistantRawApiMessage.tool_calls.length > 0) {
          this.assistantMessageContent = parseAssistantMessage(assistantRawApiMessage)
          await this.presentAssistantMessage()
        }
      }
    } catch (apiError) {
      console.error(`Task (${this.chatId}): Error processing tool result:`, apiError)
      // Update the API request message to show error
      await this.updateClineMessage('api_req_started', {
        text: JSON.stringify({
          request: requestDescription,
          status: 'error',
          error: apiError.message,
          toolResult: resultData
        })
      })
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
    await this.addToClineMessages(clineMessage)
    if (saveToBackend) {
      await this.saveClineMessage(clineMessage)
    }
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
    await this.addToClineMessages(clineMessage)
    if (saveToBackend) {
      await this.saveClineMessage(clineMessage)
    }
  }

  async addToClineMessages(message) {
    // Ensure message has chatId if not already present
    if (!message.chatId && this.chatId) {
      message.chatId = this.chatId
    }

    this.clineMessages.push(message) // Add to local cache
    // Update Zustand store. This should append, not replace, unless it's an initial load.
    useChatStore.getState().addClineMessage(message)
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
        body: JSON.stringify({ message: messagePayloadToPost })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Task (${this.chatId}): API request failed (${response.status}):`, errorText)
        throw new Error(`API request failed: ${response.status} ${errorText}`)
      }

      return response // Return the response for streaming processing
    } catch (error) {
      console.error(`Task (${this.chatId}): Error in attemptApiRequest:`, error)
      throw error
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

  async handleStreamingResponse(response) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let accumulatedContent = ''
    let streamingMessageId = null
    let finalMessage = null
    let streamingMessageToSave = null

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6))

              switch (eventData.type) {
                case 'stream_start':
                  streamingMessageId = eventData.streamingId
                  // Add initial streaming message to UI
                  const streamingMessage = {
                    chatId: this.chatId,
                    ts: Date.now(),
                    type: 'say',
                    say: 'text',
                    text: '',
                    role: 'assistant',
                    isStreaming: true,
                    streamingId: streamingMessageId
                  }
                  streamingMessageToSave = streamingMessage
                  this.clineMessages.push(streamingMessage)
                  useChatStore.getState().addClineMessage(streamingMessage)
                  useChatStore.getState().setIsStreaming(true)
                  useChatStore.getState().setStreamingMessageId(streamingMessageId)
                  break

                case 'content_chunk':
                  accumulatedContent = eventData.accumulatedContent
                  // Update the streaming message in the store
                  useChatStore.getState().updateStreamingMessage(streamingMessageId, accumulatedContent)
                  break

                case 'tool_calls_chunk':
                  // Handle tool calls if needed
                  console.log('Received tool calls chunk:', eventData.tool_calls)
                  break

                case 'stream_complete':
                  finalMessage = eventData.finalMessage
                  // Finalize the streaming message
                  useChatStore.getState().finalizeStreamingMessage(
                    streamingMessageId,
                    finalMessage.content || accumulatedContent,
                    finalMessage.tool_calls
                  )
                  console.log(`Task (${this.chatId}): Streaming completed with final message:`, finalMessage)
                  break

                case 'stream_error':
                  console.error(`Task (${this.chatId}): Streaming error:`, eventData.error)
                  useChatStore.getState().setIsStreaming(false)
                  useChatStore.getState().setStreamingMessageId(null)
                  throw new Error(eventData.error)
              }
            } catch (parseError) {
              console.error('Error parsing streaming event:', parseError)
            }
          }
        }
      }

      if (finalMessage && streamingMessageToSave) {
        if (!finalMessage.tool_calls || finalMessage.tool_calls.length === 0) {
          const finalContent = finalMessage.content || accumulatedContent
          const messageToSave = { ...streamingMessageToSave, text: finalContent }
          delete messageToSave.isStreaming
          delete messageToSave.streamingId
          await this.saveClineMessage(messageToSave)
        }
      }

      return finalMessage
    } catch (error) {
      console.error(`Task (${this.chatId}): Error handling streaming response:`, error)
      useChatStore.getState().setIsStreaming(false)
      useChatStore.getState().setStreamingMessageId(null)
      throw error
    } finally {
      reader.releaseLock()
    }
  }

  // Add a new method to format the user input
  formatUserInput(userInput) {
    return this.environmentContextManager.enhanceUserInput(userInput, {
      chatId: this.chatId,
      taskStatus: this.isInitialized ? 'Active' : 'Initializing',
      waitingForApproval: this.waitingForApproval
    })
  }

  // Add a new method to save a single cline message to the backend
  async saveClineMessage(message) {
    if (this.chatId && message.chatId === this.chatId) {
      try {
        const payloadForBackend = {
          ts: Number(message.ts),
          type: message.type,
          subType: message.type === 'say' ? message.say : message.ask,
          text: message.text,
          role: message.role
        }

        const response = await fetch(`/api/chat/${this.chatId}/cline-messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadForBackend)
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
    } else if (!this.chatId) {
      console.warn(`Task: Cannot save cline message, chatId is missing.`)
    }
  }

  // Add a new method to enhance tool results with context
  enhanceToolResultWithContext(result, toolName) {
    return this.environmentContextManager.enhanceToolResult(result, toolName, {
      chatId: this.chatId,
      taskStatus: this.isInitialized ? 'Active' : 'Initializing',
      waitingForApproval: this.waitingForApproval
    })
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
      const updatedMessage = {
        ...clineMessages[index],
        ...updates
      }

      // Remove the old message and add the updated one
      clineMessages.splice(index, 1)

      // Update the store with the modified array
      store.setClineMessages(clineMessages)

      // Add the updated message back (this will trigger a re-render)
      store.addClineMessage(updatedMessage)

      console.log(`Task (${this.chatId}): Updated cline message successfully for sayType: ${sayType}`)
    } else {
      console.warn(`Task (${this.chatId}): No message found with sayType: ${sayType}`)
      console.log(`Task (${this.chatId}): Available messages:`, clineMessages.map(m => ({ type: m.type, say: m.say, ts: m.ts })))

      // Don't create a new message here - let the caller handle this case
      // This prevents duplicate messages when update fails
    }
  }

  // New utility methods for tool system integration

  /**
   * Get information about all available tools
   * @returns {Object} Tools information including count and metadata
   */
  getAvailableTools() {
    return getTools()
  }

  /**
   * Get list of available tool names
   * @returns {string[]} Array of tool names
   */
  listAvailableTools() {
    return listTools()
  }

  /**
   * Check if a specific tool is available before attempting execution
   * @param {string} toolName - Name of the tool to check
   * @returns {boolean} True if tool is available
   */
  isToolAvailable(toolName) {
    return hasToolAvailable(toolName)
  }

  /**
   * Validate tool parameters without executing the tool
   * @param {string} toolName - Name of the tool
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validateToolParams(toolName, params) {
    return validateTool(toolName, params)
  }
}

export default Task
