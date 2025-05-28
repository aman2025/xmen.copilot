import useChatStore from './useChatStore'
import Controller from '../core/controller'

// Singleton instance of the Controller
let controller = null

/**
 * Initializes the Controller singleton if it hasn't been created yet
 * Only runs in browser environment to avoid SSR issues
 */
export const initController = () => {
  if (typeof window !== 'undefined' && !controller) {
    controller = new Controller()
    console.log('Controller initialized in chatActions.')
  }
  return controller // Return instance for convenience
}

/**
 * Handles sending a new message to the AI assistant
 * @param {string} content - The message content from the user
 */
export const sendMessage = async (content) => {
  if (!content.trim()) return

  const store = useChatStore.getState()
  store.setIsLoading(true)
  const activeController = initController() // Ensure controller is initialized

  try {
    if (store.currentChatId && activeController.getCurrentTask()) {
      // Send message to the existing, active task
      console.log('chatActions: Sending message to existing task:', store.currentChatId)
      // The controller's handleUserMessage will internally call task.handleUserProvidedInput
      await activeController.handleUserMessage(content)
    } else {
      // No active chat or task, so start a new one
      console.log('chatActions: Starting new task with user input:', content)
      // initOrLoadTask will create a new chat session via API, get a chatId,
      // then create a new Task instance which handles the first message.
      await activeController.initOrLoadTask(null, content)
      // The new task's constructor/startTask should add initial cline messages to the store.
    }
    store.setMessageInput('') // Clear input field after sending
  } catch (error) {
    console.error('chatActions: Error sending message:', error)
    store.addClineMessage({ // Use addClineMessage
      ts: Date.now(),
      type: 'say',
      say: 'error',
      text: `An error occurred: ${error.message}`
    })
  } finally {
    store.setIsLoading(false)
  }
}

/**
 * Handles user responses to AI questions or prompts
 * @param {string} response - The type of response (e.g., 'approve', 'reject')
 */
export const handleResponse = async (responseType) => { // e.g., 'approve', 'reject'
  console.log('chatActions: handleResponse called with:', responseType)
  const store = useChatStore.getState()
  store.setIsLoading(true)
  const activeController = initController()

  if (!activeController || !activeController.getCurrentTask()) {
    console.warn('chatActions: No active task to handle response.')
    store.addClineMessage({
        ts: Date.now(),
        type: 'say',
        say: 'error',
        text: 'No active task to process your response.'
    });
    store.setIsLoading(false)
    return
  }

  try {
    // Controller's handleUserResponse will call task.handleApprovalResponse
    // The Task itself is responsible for generating and persisting clineMessages related to this flow.
    console.log('chatActions: Calling controller.handleUserResponse with:', responseType)
    await activeController.handleUserResponse(responseType) // Pass 'approve' or 'reject'
  } catch (error) {
    console.error('chatActions: Error handling response:', error)
    store.addClineMessage({ // Use addClineMessage
      ts: Date.now(),
      type: 'say',
      say: 'error',
      text: `Error processing response: ${error.message}`
    })
  } finally {
    store.setIsLoading(false)
  }
}

// Action to load a chat session when selected from history
export const loadChatSession = async (chatId, chatTitle = 'Chat') => {
  console.log('chatActions: Attempting to load chat session:', chatId)
  const store = useChatStore.getState()
  store.setIsLoading(true)
  store.clearMessages() // Clear messages from any previous chat

  const activeController = initController()
  try {
    // initOrLoadTask will fetch data, create/resume Task, and Task will populate store.
    await activeController.initOrLoadTask(chatId, null)
    store.setCurrentChatId(chatId) // Ensure currentChatId is set in store
    store.setCurrentChatTitle(chatTitle)
    store.setView('chat') // Switch to chat view
  } catch (error) {
    console.error('chatActions: Error loading chat session:', error)
    store.addClineMessage({ // Use addClineMessage
      ts: Date.now(),
      type: 'say',
      say: 'error',
      text: `Failed to load chat: ${error.message}`
    })
    store.setCurrentChatId(null) // Reset chatId on failure
    store.setCurrentChatTitle(null)
  } finally {
    store.setIsLoading(false)
  }
}

// Action to start a new chat session explicitly
export const startNewChat = async () => {
  console.log('chatActions: Starting a new chat explicitly.')
  const store = useChatStore.getState()
  store.setIsLoading(true)
  store.clearMessages()
  store.setCurrentChatId(null)
  store.setCurrentChatTitle('New Conversation') // Or derive from first message later

  const activeController = initController();
  // We don't provide initial user input here. The user will type it.
  // The controller needs a way to set up a "clean slate" or the first `sendMessage` will handle it.
  // For now, let's assume controller.initOrLoadTask(null, null) clears any existing task.
  try {
    await activeController.initOrLoadTask(null, null); // This will clear the current task in controller
    store.setView('chat');
  } catch (error) {
      console.error("chatActions: Error preparing for new chat:", error);
      // Handle error appropriately
  } finally {
    store.setIsLoading(false);
  }
}
