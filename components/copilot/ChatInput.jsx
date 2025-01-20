import { Send } from 'lucide-react'
import useChatStore from '@/store/useChatStore'

const ChatInput = ({ input, setInput, isLoading, onSubmit }) => {
  // Get currentChatId and setter from Zustand store
  const { currentChatId, setCurrentChatId } = useChatStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    try {
      // Create a new chat if there's no currentChatId
      if (!currentChatId) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: input.slice(0, 100), // Use first message as title
          }),
        })
        const { chatId } = await response.json()
        setCurrentChatId(chatId) // Store chatId in global state

        // Wait for chat creation before submitting the message
        await onSubmit(e)
      } else {
        // If chatId exists, directly submit the message
        await onSubmit(e)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 rounded-md border p-2 text-gray-800 dark:bg-gray-700 dark:text-white"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isLoading ? 'Sending...' : <Send size={20} />}
      </button>
    </form>
  )
}

export default ChatInput
