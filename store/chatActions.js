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

    // Process message through the controller and get both user and AI responses
    // Note: API messages are added to the store directly in the controller
    const { userMessage, apiRequestStartedMessage, copilotMessage } =
      await controller.handleUserMessage(content)

    // Update the store with new UI messages
    store.saveClineMessages(userMessage) // Add user message to clineMessages for UI
    store.saveClineMessages(apiRequestStartedMessage) // Add API request started message
    store.saveClineMessages(copilotMessage) // Add AI response
    store.setMessageInput('') // Clear input field
  } catch (error) {
    // Silently handle error without console.error to avoid linting issues
    // Add error message to the chat
    store.saveClineMessages({
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
export const handleResponse = async (response) => {
  console.log('chatActions: handleResponse called with response:', response)
  const store = useChatStore.getState()

  try {
    store.setIsLoading(true)

    // Process the user's response through the controller
    // Note: API messages are added to the store directly in the controller
    console.log('chatActions: Calling controller.handleUserResponse')
    const result = await controller.handleUserResponse(response)

    // Update store if there's a valid result
    if (result) {
      console.log('chatActions: Got result from controller:', result)
      const { userMessage, apiRequestStartedMessage, copilotMessage } = result

      console.log('chatActions: Saving userMessage to store:', userMessage)
      store.saveClineMessages(userMessage) // Add user response to clineMessages for UI

      if (apiRequestStartedMessage) {
        console.log(
          'chatActions: Saving apiRequestStartedMessage to store:',
          apiRequestStartedMessage
        )
        store.saveClineMessages(apiRequestStartedMessage) // Add API request started message
      }

      if (copilotMessage) {
        console.log('chatActions: Saving copilotMessage to store:', copilotMessage)
        store.saveClineMessages(copilotMessage) // Add AI response
      }

      store.setMessageInput('')
    } else {
      console.log('chatActions: No result from controller')
    }
  } catch (error) {
    // Silently handle error without console.error to avoid linting issues
    // Add error message to the chat
    store.saveClineMessages({
      ts: Date.now(),
      type: 'say',
      say: 'error',
      text: `An error occurred: ${error.message}`
    })
  } finally {
    store.setIsLoading(false)
  }
}
