import { create } from 'zustand'

const useChatStore = create((set) => ({
  // Current chat state
  currentChatId: null,
  view: 'chat',
  isFullscreen: true,
  isLoading: false,
  scrollToBottom: null,

  // Message state
  apiConversationHistory: [], // For AI API communication (user input and AI responses)
  copilotMessages: [], // For UI rendering only
  messageInput: '',

  // Basic setters
  setCurrentChatId: (id) => set({ currentChatId: id }),
  setView: (view) => set({ view }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setMessageInput: (text) => set({ messageInput: text }),

  // Message actions
  addApiMessage: (message) =>
    set((state) => {
      const newState = {
        apiConversationHistory: [...state.apiConversationHistory, message]
      }
      console.log('API Conversation History updated:', newState.apiConversationHistory)
      return newState
    }),

  addCopilotMessage: (message) =>
    set((state) => {
      const newState = {
        copilotMessages: [...state.copilotMessages, message]
      }
      console.log('Copilot Messages updated:', newState.copilotMessages)
      return newState
    }),

  clearMessages: () => {
    console.log('Clearing all messages')
    return set({ apiConversationHistory: [], copilotMessages: [] })
  }
}))

export default useChatStore
