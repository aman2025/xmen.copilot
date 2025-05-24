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

    // Process message through the controller.
    // The Task instance created within the controller will handle adding clineMessages to the store.
    await controller.handleUserMessage(content)

    // The Task instance now directly updates the store with all necessary clineMessages.
    // No need to save messages here.
    // const { userMessage, apiRequestStartedMessage, copilotMessage } = result;
    // store.saveClineMessages(userMessage);
    // store.saveClineMessages(apiRequestStartedMessage);
    // store.saveClineMessages(copilotMessage);

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
    initController() // Ensure controller is initialized

    // Process the user's response through the controller
    console.log('chatActions: Calling controller.handleUserResponse')
    const result = await controller.handleUserResponse(response)

    // Update store if there's a valid userMessage to display for the action.
    // Other messages (like api_req_started, or new assistant messages following the action)
    // will be added by the Task itself directly to the store.
    if (result && result.userMessage) {
      console.log('chatActions: Got userMessage from controller:', result.userMessage)
      store.saveClineMessages(result.userMessage) // Add user's explicit action message (e.g., "Approved tool execution.")
    } else if (result) {
      console.log(
        'chatActions: controller.handleUserResponse returned a result, but no specific userMessage to display for this action.',
        result
      )
    } else {
      console.log(
        'chatActions: No result from controller.handleUserResponse, or task was not waiting for approval.'
      )
    }

    // No need to handle apiRequestStartedMessage or copilotMessage here,
    // as the Task's handleApprovalResponse flow will add subsequent messages to the store.

    // Clearing message input might not be necessary here as approval/rejection doesn't usually involve the text input field.
    // store.setMessageInput('')
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
