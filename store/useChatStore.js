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
  clineMessages: [], // For UI rendering only
  messageInput: '',

  // Basic setters
  setCurrentChatId: (id) => set({ currentChatId: id }),
  setView: (view) => set({ view }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setMessageInput: (text) => set({ messageInput: text }),

  // Message actions
  saveApiConversationHistory: (message) =>
    set((state) => {
      const newState = {
        apiConversationHistory: [...state.apiConversationHistory, message]
      }
      console.log('API Conversation History updated:', newState.apiConversationHistory)
      return newState
    }),

  saveClineMessages: (message) =>
    set((state) => {
      const newState = {
        clineMessages: [...state.clineMessages, message]
      }
      console.log('Cline Messages updated:', newState.clineMessages)
      return newState
    }),

  clearMessages: () => {
    console.log('Clearing all messages')
    return set({ apiConversationHistory: [], clineMessages: [] })
  }
}))

export default useChatStore
