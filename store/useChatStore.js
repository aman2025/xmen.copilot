import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  // Current chat state
  currentChatId: null, // ID of the currently active chat/task session
  currentChatTitle: null, // Title of the current chat
  view: 'chat', // Current view ('chat' or 'history')
  isFullscreen: true,
  isLoading: false,
  scrollToBottom: null, // Function to scroll chat to bottom

  // Message state for UI rendering
  // apiConversationHistory is now primarily managed within the active Task instance
  // and persisted/fetched via backend. Store might not need to hold it directly.
  // clineMessages is the source of truth for UI.
  clineMessages: [], 
  messageInput: '',

  // Basic setters
  setCurrentChatId: (id) => set({ currentChatId: id }),
  setCurrentChatTitle: (title) => set({ currentChatTitle: title }),
  setView: (view) => set({ view }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setMessageInput: (text) => set({ messageInput: text }),

  // ClineMessage actions for UI
  // Adds a single cline message to the list
  addClineMessage: (message) =>
    set((state) => {
      // Prevent duplicates based on timestamp and text (simple check)
      const exists = state.clineMessages.some(
        (m) => m.ts === message.ts && m.text === message.text && m.type === message.type && m.say === message.say
      );
      if (exists) {
        console.log('Prevented duplicate cline message addition to store:', message);
        return {}; // No change
      }
      const newState = {
        clineMessages: [...state.clineMessages, message]
      }
      console.log('Cline Messages updated (added one):', newState.clineMessages.length, message)
      return newState
    }),

  // Sets all cline messages, e.g., when loading a chat
  setClineMessages: (messages) =>
    set(() => {
      const newState = {
        clineMessages: Array.isArray(messages) ? [...messages] : []
      }
      console.log('Cline Messages set (replaced all):', newState.clineMessages.length)
      return newState
    }),
  
  // Clears messages, typically when starting a new chat or clearing UI
  clearMessages: () => {
    console.log('Clearing clineMessages from store')
    return set({ clineMessages: [], messageInput: '' }) // Also clear input
  }
}))

export default useChatStore
