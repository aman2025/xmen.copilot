import Task from '../task'
import useChatStore from '../../store/useChatStore' // To set currentChatId
import useGlobalStore from '../../store/useGlobalStore'

class Controller {
  constructor() {
    // Current active task instance
    this.task = null
    this.currentChatId = null // Keep track of the active chatId
    // Get environment details from useGlobalStore
    this.environmentDetails = {
      user: useGlobalStore.getState().user,
      system: useGlobalStore.getState().system
    }
  }

  // Initializes a new task or loads an existing one
  async initOrLoadTask(chatId = null, userInput = null) {
    console.log('Controller: initOrLoadTask called with chatId:', chatId, 'userInput:', userInput)
    useChatStore.getState().setIsLoading(true)
    useChatStore.getState().setIsWaitingForApproval(false) // Reset approval state on any task load

    if (chatId) {
      // Load existing task
      this.currentChatId = chatId
      try {
        const response = await fetch(`/api/chat/${chatId}/messages`)
        if (!response.ok) {
          throw new Error(`Failed to load chat session: ${response.statusText}`)
        }
        const chatSessionData = await response.json() // Expects { id, title, apiMessages, clineMessages, ... }

        const displayMessages = []

        // Find the first user API message to anchor our UI reconstruction
        const firstUserApiMessage = chatSessionData.apiMessages?.find(
          (msg) => msg.role === 'user'
        )
        let originalUserText = ''

        if (firstUserApiMessage) {
          const taskMatch = firstUserApiMessage.content.match(/<task>([\s\S]*?)<\/task>/)
          originalUserText = taskMatch ? taskMatch[1].trim() : firstUserApiMessage.content

          // Requirement 1: Add the user message first.
          displayMessages.push({
            ts: new Date(firstUserApiMessage.timestamp).getTime(),
            type: 'say',
            say: 'text',
            text: originalUserText,
            role: 'user'
          })

          // Requirement 2: Add the corresponding API Request message right after.
          displayMessages.push({
            ts: new Date(firstUserApiMessage.timestamp).getTime() + 1, // Ensure it's sorted after user message.
            type: 'say',
            say: 'api_req_started',
            text: JSON.stringify({ request: firstUserApiMessage.content }),
            role: 'assistant'
          })
        }

        // Process clineMessages from the database, filtering out what we've reconstructed or what's unwanted.
        if (chatSessionData.clineMessages) {
          chatSessionData.clineMessages.forEach((clineMsg) => {
            // Check if this is the initial API request we've already manually reconstructed.
            if (
              firstUserApiMessage &&
              clineMsg.type === 'say' &&
              clineMsg.subType === 'api_req_started'
            ) {
              try {
                const parsedText = JSON.parse(clineMsg.text || '{}')
                if (parsedText.request === originalUserText) {
                  return // Skip this message, we've already added our own version.
                }
              } catch (e) {
                /* ignore parse error */
              }
            }

            // Requirement 3: Filter out the verbose assistant message with environment details.
            if (
              clineMsg.type === 'say' &&
              clineMsg.subType === 'text' &&
              clineMsg.text.includes('<environment_details>')
            ) {
              return // Skip this message.
            }

            const normalizedMsg = {
              ...clineMsg,
              ts: Number(clineMsg.ts),
              role: 'assistant' // All other clineMessages from DB are assistant-generated
            }

            if (clineMsg.type === 'say') {
              normalizedMsg.say = clineMsg.subType
            } else if (clineMsg.type === 'ask') {
              normalizedMsg.ask = clineMsg.subType
            }
            delete normalizedMsg.subType

            displayMessages.push(normalizedMsg)
          })
        }

        // Sort all reconstructed and normalized messages chronologically
        displayMessages.sort((a, b) => a.ts - b.ts)

        // Update the store with the unified message list for rendering
        useChatStore.getState().setClineMessages(displayMessages)

        this.task = new Task(
          chatSessionData.id,
          null, // No initial user input, we are loading an existing task
          chatSessionData.apiMessages || [],
          displayMessages // Pass the unified messages to the task instance
        )

        useChatStore.getState().setCurrentChatId(chatSessionData.id)
        console.log('Controller: Loaded existing task', chatSessionData.id)
      } catch (error) {
        console.error('Controller: Error loading task:', error)
        useChatStore.getState().clearMessages() // Clear messages on error
        this.currentChatId = null
        this.task = null
        // Optionally, display an error to the user via a cline message
      }
    } else if (userInput) {
      // Initialize new task
      const userClineMessage = {
        ts: Date.now(),
        type: 'say',
        say: 'text',
        text: userInput,
        role: 'user'
      }
      useChatStore.getState().addClineMessage(userClineMessage)

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: userInput.substring(0, 30) }) // Use part of input as title
        })
        if (!response.ok) {
          throw new Error(`Failed to create new chat session: ${response.statusText}`)
        }
        const newChatSession = await response.json() // Expects { chatId, title, createdAt }
        this.currentChatId = newChatSession.chatId

        this.task = new Task(
          this.currentChatId,
          null, // Pass null as initialUserInput; we will start the task manually.
          [],
          [userClineMessage],
          this.environmentDetails
        )
        
        // Explicitly await the task's startup process. This includes the first API call.
        // This ensures isLoading=true remains set until the first response is handled.
        await this.task.startTask(userInput)

        useChatStore.getState().setCurrentChatId(this.currentChatId)
        console.log('Controller: Initialized new task', this.currentChatId)
      } catch (error) {
        console.error('Controller: Error initializing new task:', error)
        this.currentChatId = null
        this.task = null
        // Optionally, display an error
      }
    } else {
      console.warn('Controller: initOrLoadTask called without chatId or userInput.')
      this.task = null // Ensure task is cleared
      this.currentChatId = null
      useChatStore.getState().setCurrentChatId(null)
      useChatStore.getState().clearMessages()
    }
    useChatStore.getState().setIsLoading(false)
    return {} // Return empty as Task manages store updates mostly
  }

  async handleUserMessage(text) {
    // This is typically for starting a new chat or sending a message to an existing one.
    // If currentChatId is set, it implies sending to existing task.
    // If not, it's a new task.
    if (this.task && this.currentChatId) {
      useChatStore.getState().setIsLoading(true)
      // Sending message to existing, loaded task
      const userClineMessage = {
        ts: Date.now(),
        type: 'say',
        say: 'text',
        text: text,
        role: 'user'
      }
      useChatStore.getState().addClineMessage(userClineMessage)
      console.log('Controller: Sending message to existing task:', this.currentChatId)
      await this.task.handleUserProvidedInput(text)
      useChatStore.getState().setIsLoading(false)
    } else {
      // New task
      console.log('Controller: Initializing new task with user input:', text)
      return this.initOrLoadTask(null, text)
    }
    return {}
  }

  async handleUserResponse(response) {
    if (!this.task || !this.currentChatId) {
      console.warn('Controller: No active task to handle response')
      return null
    }

    if (!this.task.waitingForApproval) {
      console.warn('Controller: Task not waiting for approval')
      // Still, we might want to record this "action" as a cline message if needed
      // For now, return null or an empty object.
      return {}
    }

    // Don't display "User approved tool execution." message anymore
    // Only record rejection messages for debugging purposes
    if (response !== 'approve') {
      const userActionText = 'User rejected tool execution.'
      if (this.task) {
        await this.task.say('text', userActionText, true) // true to persist
      }
    }

    console.log('Controller: Processing approval/rejection:', response)
    await this.task.handleApprovalResponse(response === 'approve' ? 'approved' : 'rejected')
    console.log('Controller: Finished processing approval/rejection')

    // The task's handleApprovalResponse should generate further cline messages.
    // We've already added the user's explicit action message.
    return {
      // userMessage: userActionDisplayMessage // This was the old return, task.say handles it now
    }
  }

  // Method to switch or load a task when selected from history
  async setActiveTask(chatId) {
    if (this.currentChatId === chatId && this.task) {
      console.log('Controller: Task already active.', chatId)
      // Potentially ensure UI is updated if needed, though store should handle it
      useChatStore.getState().setIsLoading(false) // Ensure loading is false
      return
    }
    console.log('Controller: Setting active task to', chatId)
    useChatStore.getState().clearMessages() // Clear old messages before loading new ones
    await this.initOrLoadTask(chatId, null)
  }

  // Method to get the current task instance, if any
  getCurrentTask() {
    return this.task
  }
}

export default Controller

