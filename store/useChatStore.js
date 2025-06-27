import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  // Current chat state
  currentChatId: null, // ID of the currently active chat/task session
  currentChatTitle: null, // Title of the current chat
  view: 'chat', // Current view ('chat' or 'history')
  isFullscreen: true,
  isLoading: false, // To track loading states for async actions
  isWaitingForApproval: false, // Track active tool approval
  isStreaming: false, // Track if AI is currently streaming a response
  streamingMessageId: null, // ID of the message currently being streamed
  scrollToBottom: null, // Function to scroll chat to bottom

  // Message state for UI rendering
  // apiConversationHistory is now primarily managed within the active Task instance
  // and persisted/fetched via backend. Store might not need to hold it directly.
  // clineMessages is the source of truth for UI.
  clineMessages: [],
  messageInput: '',
  attachedFiles: [], // Array of attached JSON files with content

  // Basic setters
  setCurrentChatId: (id) => set({ currentChatId: id }),
  setCurrentChatTitle: (title) => set({ currentChatTitle: title }),
  setView: (view) => set({ view }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsWaitingForApproval: (waiting) => set({ isWaitingForApproval: waiting }),
  setMessageInput: (text) => set({ messageInput: text }),

  // File attachment actions
  addAttachedFile: (file) => {
    const state = useChatStore.getState()

    // Check for duplicates by comparing file name and content
    const isDuplicate = state.attachedFiles.some((existingFile) => {
      // Compare by name first (most common case)
      if (existingFile.name !== file.name) return false

      // If names match, compare content to handle renamed files with same content
      try {
        // Since content is now always raw string, direct comparison is sufficient
        return existingFile.content === file.content
      } catch (error) {
        // If content comparison fails, fall back to name comparison
        console.warn('Error comparing file content for duplicate detection:', error)
        return true
      }
    })

    if (isDuplicate) {
      console.log('Prevented duplicate file attachment:', file.name)
      return false // Return false to indicate file was not added
    }

    // Add the file and return true to indicate success
    set((state) => ({
      attachedFiles: [...state.attachedFiles, file]
    }))
    return true
  },
  removeAttachedFile: (fileId) =>
    set((state) => ({
      attachedFiles: state.attachedFiles.filter((file) => file.id !== fileId)
    })),
  clearAttachedFiles: () => set({ attachedFiles: [] }),

  // ClineMessage actions for UI
  // Adds a single cline message to the list
  addClineMessage: (message) =>
    set((state) => {
      // Enhanced duplicate prevention for user messages with file attachments
      const exists = state.clineMessages.some((m) => {
        // For user messages, check role and text content more carefully
        if (message.role === 'user' && m.role === 'user') {
          // Check if the text content is identical (handles JSON file attachments)
          return m.text === message.text && m.type === message.type
        }

        // For other messages, use the original logic with timestamp
        return (
          m.ts === message.ts &&
          m.text === message.text &&
          m.type === message.type &&
          m.say === message.say
        )
      })

      if (exists) {
        console.log('Prevented duplicate cline message addition to store:', {
          role: message.role,
          type: message.type,
          textLength: message.text?.length || 0,
          textPreview: message.text?.substring(0, 50) || ''
        })
        return {} // No change
      }

      const newState = {
        clineMessages: [...state.clineMessages, message]
      }
      console.log('Cline Messages updated (added one):', newState.clineMessages.length, {
        role: message.role,
        type: message.type,
        textLength: message.text?.length || 0
      })
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
    return set({
      clineMessages: [],
      messageInput: '',
      attachedFiles: [],
      isStreaming: false,
      streamingMessageId: null
    })
  },

  // Streaming-related actions
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setStreamingMessageId: (messageId) => set({ streamingMessageId: messageId }),

  // Updates a specific message by timestamp and type
  updateClineMessage: (ts, type, updates) =>
    set((state) => {
      const messageIndex = state.clineMessages.findIndex(
        (m) => m.ts === ts && m.type === type
      )

      if (messageIndex === -1) {
        console.warn('Message not found for update:', { ts, type })
        return {}
      }

      const updatedMessages = [...state.clineMessages]
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        ...updates
      }

      console.log('Updated cline message:', { ts, type, updates })
      return { clineMessages: updatedMessages }
    }),

  // Updates streaming message content
  updateStreamingMessage: (messageId, content) =>
    set((state) => {
      const messageIndex = state.clineMessages.findIndex(
        (m) => m.streamingId === messageId
      )

      if (messageIndex === -1) {
        console.warn('Streaming message not found for update:', messageId)
        return {}
      }

      const updatedMessages = [...state.clineMessages]
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        text: content,
        isStreaming: true
      }

      return { clineMessages: updatedMessages }
    }),

  // Finalizes a streaming message
  finalizeStreamingMessage: (messageId, finalContent, toolCalls = null) =>
    set((state) => {
      const messageIndex = state.clineMessages.findIndex(
        (m) => m.streamingId === messageId
      )

      if (messageIndex === -1) {
        console.warn('Streaming message not found for finalization:', messageId)
        return {}
      }

      const updatedMessages = [...state.clineMessages]
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        text: finalContent,
        tool_calls: toolCalls,
        isStreaming: false,
        streamingId: undefined
      }

      console.log('Finalized streaming message:', messageId)
      return {
        clineMessages: updatedMessages,
        isStreaming: false,
        streamingMessageId: null
      }
    })
}))

export default useChatStore
