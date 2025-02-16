import { create } from 'zustand'

// Create chat store with currentChatId
const useChatStore = create((set) => ({
  currentChatId: null,
  view: 'chat',
  setCurrentChatId: (id) => set({ currentChatId: id }),
  setView: (view) => set({ view }),
  messageInput: '',
  setMessageInput: (text) => set({ messageInput: text }),
}))

export default useChatStore
