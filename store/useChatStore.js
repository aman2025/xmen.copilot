import { create } from 'zustand'

const useChatStore = create((set) => ({
  // Current chat state
  currentChatId: null,
  view: 'chat',
  isFullscreen: true,
  isLoading: false,
  scrollToBottom: null,

  // Message state
  userMessages: [],
  copilotMessages: [],
  messageInput: '',

  // Basic setters
  setCurrentChatId: (id) => set({ currentChatId: id }),
  setView: (view) => set({ view }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setMessageInput: (text) => set({ messageInput: text }),

  // Message actions
  addUserMessage: (message) =>
    set((state) => ({
      userMessages: [...state.userMessages, message]
    })),

  addCopilotMessage: (message) =>
    set((state) => ({
      copilotMessages: [...state.copilotMessages, message]
    })),

  clearMessages: () => set({ userMessages: [], copilotMessages: [] })
}))

export default useChatStore
