import { create } from 'zustand'

const useChatStore = create((set) => ({
  // Current chat state
  currentChatId: null,
  view: 'chat',
  isFullscreen: true,
  isLoading: false,
  scrollToBottom: null,

  // Message state
  copilotMessages: [], // Combined user and AI messages for UI display
  messageInput: '',

  // Basic setters
  setCurrentChatId: (id) => set({ currentChatId: id }),
  setView: (view) => set({ view }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setMessageInput: (text) => set({ messageInput: text }),

  // Message actions
  addCopilotMessage: (message) =>
    set((state) => ({
      copilotMessages: [...state.copilotMessages, message]
    })),

  clearMessages: () => set({ copilotMessages: [] })
}))

export default useChatStore
