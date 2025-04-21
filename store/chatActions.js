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
  }
}

/**
 * Handles sending a new message to the AI assistant
 * @param {string} content - The message content from the user
 */
export const sendMessage = async (content) => {
  if (!content.trim()) return

  // Get current state from Zustand store
  const store = useChatStore.getState()

  try {
    store.setIsLoading(true)
    initController()

    // Prepare conversation history by combining user and assistant messages
    const allMessages = [
      ...store.userMessages.map((m) => ({ role: 'user', content: m.content })),
      ...store.copilotMessages.map((m) => ({ role: 'assistant', content: m.content }))
    ]

    // Process message through the controller and get both user and AI responses
    const { userMessage, copilotMessage } = await controller.handleUserMessage(content, allMessages)

    // Update the store with new messages
    store.addUserMessage(userMessage)
    store.addCopilotMessage(copilotMessage)
    store.setMessageInput('') // Clear input field
  } catch (error) {
    console.error('Error sending message:', error)
    // Add error message to the chat
    store.addCopilotMessage({
      id: `error-${Date.now()}`,
      role: 'assistant',
      type: 'error',
      content: `An error occurred: ${error.message}`,
      createdAt: new Date().toISOString()
    })
  } finally {
    store.setIsLoading(false)
  }
}

/**
 * Handles user responses to AI questions or prompts
 * @param {string} response - The type of response (e.g., 'approve', 'reject')
 * @param {string} text - Optional text content of the response
 */
export const handleResponse = async (response, text) => {
  const store = useChatStore.getState()

  try {
    store.setIsLoading(true)

    // Prepare conversation history
    const allMessages = [
      ...store.userMessages.map((m) => ({ role: 'user', content: m.content })),
      ...store.copilotMessages.map((m) => ({ role: 'assistant', content: m.content }))
    ]

    // Process the user's response through the controller
    const result = await controller.handleUserResponse(response, text, allMessages)

    // Update store if there's a valid result
    if (result) {
      const { userMessage, copilotMessage } = result
      store.addUserMessage(userMessage)
      store.addCopilotMessage(copilotMessage)
      store.setMessageInput('')
    }
  } catch (error) {
    console.error('Error handling response:', error)
    // Add error message to the chat
    store.addCopilotMessage({
      id: `error-${Date.now()}`,
      role: 'assistant',
      type: 'error',
      content: `An error occurred: ${error.message}`,
      createdAt: new Date().toISOString()
    })
  } finally {
    store.setIsLoading(false)
  }
}
