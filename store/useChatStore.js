import { create } from 'zustand'
import Controller from '../core/controller'

// Create chat store with message management
const useChatStore = create((set, get) => ({
  // Current chat state
  currentChatId: null,
  view: 'chat',
  isFullscreen: true,
  isLoading: false,
  scrollToBottom: null,

  // Message state
  userMessages: [],
  copilotMessages: [],

  // Input state
  messageInput: '',

  // Controller instance
  controller: null,

  // Setters
  setCurrentChatId: (id) => set({ currentChatId: id }),
  setView: (view) => set({ view }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setMessageInput: (text) => set({ messageInput: text }),

  // Initialize controller (for server-side rendering compatibility)
  initController: () => {
    if (typeof window !== 'undefined' && !get().controller) {
      set({ controller: new Controller() })
    }
  },

  // Message actions
  addUserMessage: (message) => {
    set((state) => ({
      userMessages: [...state.userMessages, message]
    }))
  },

  addCopilotMessage: (message) => {
    set((state) => ({
      copilotMessages: [...state.copilotMessages, message]
    }))
  },

  // Clear all messages
  clearMessages: () => {
    const { controller } = get()
    if (controller) {
      controller.clearTask()
    }
    set({ userMessages: [], copilotMessages: [] })
  },

  // Send a new message
  sendMessage: async (content) => {
    if (!content.trim()) return

    try {
      // Set loading state
      set({ isLoading: true })

      // Initialize controller if needed
      get().initController()
      const { controller, userMessages, copilotMessages } = get()

      // Combine messages for context
      const allMessages = [
        ...userMessages.map((m) => ({ role: 'user', content: m.content })),
        ...copilotMessages.map((m) => ({ role: 'assistant', content: m.content }))
      ]

      // Handle user message
      const { userMessage, copilotMessage } = await controller.handleUserMessage(
        content,
        allMessages
      )

      // Add messages to state
      get().addUserMessage(userMessage)
      get().addCopilotMessage(copilotMessage)

      // Clear input
      set({ messageInput: '' })
    } catch (error) {
      console.error('Error sending message:', error)

      // Add error message
      get().addCopilotMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        type: 'error',
        content: `An error occurred: ${error.message}`,
        createdAt: new Date().toISOString()
      })
    } finally {
      // Clear loading state
      set({ isLoading: false })
    }
  },

  // Handle user response to a question (approve/reject)
  handleResponse: async (response, text) => {
    try {
      // Set loading state
      set({ isLoading: true })

      // Get controller and messages
      const { controller, userMessages, copilotMessages } = get()

      // Combine messages for context
      const allMessages = [
        ...userMessages.map((m) => ({ role: 'user', content: m.content })),
        ...copilotMessages.map((m) => ({ role: 'assistant', content: m.content }))
      ]

      // Handle user response
      const result = await controller.handleUserResponse(
        response,
        text || get().messageInput,
        allMessages
      )

      if (result) {
        const { userMessage, copilotMessage } = result

        // Add messages to state
        get().addUserMessage(userMessage)
        get().addCopilotMessage(copilotMessage)

        // Clear input
        set({ messageInput: '' })
      }
    } catch (error) {
      console.error('Error handling response:', error)

      // Add error message
      get().addCopilotMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        type: 'error',
        content: `An error occurred: ${error.message}`,
        createdAt: new Date().toISOString()
      })
    } finally {
      // Clear loading state
      set({ isLoading: false })
    }
  },

  // Start a new task
  startNewTask: () => {
    // Clear messages and reset controller
    get().clearMessages()
  }
}))

export default useChatStore
