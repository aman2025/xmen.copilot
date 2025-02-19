import { create } from 'zustand'

// Create chat store with currentChatId
const useChatStore = create((set) => ({
  currentChatId: null,
  view: 'chat',
  isFullscreen: false,
  setCurrentChatId: (id) => set({ currentChatId: id }),
  setView: (view) => set({ view }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  messageInput: '',
  setMessageInput: (text) => set({ messageInput: text })
}))

export default useChatStore
