import { create } from 'zustand'

// Create chat store with currentChatId
const useChatStore = create((set) => ({
  currentChatId: null,
  setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
}))

export default useChatStore
